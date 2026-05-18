// @ts-nocheck
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { prisma } from "@/lib/prisma";
import { chromium } from "playwright";
import { z } from "zod";

export const maxDuration = 120; // Allow more time for exploration

export async function POST(req: Request, { params }: { params: Promise<{ code: string, caseId: string }> }) {
  const { code, caseId } = await params;
  let browser = null;

  try {
    const body = await req.json();
    const { startUrl, additionalContext, modelProvider = "openai" } = body;

    // Fetch API keys from DB
    const settings = await prisma.workspaceSetting.findMany({
      where: {
        key: { in: ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'CLAUDE_API_KEY'] }
      }
    });
    
    const getSetting = (k: string) => settings.find(s => s.key === k)?.value;

    let aiModel;
    switch (modelProvider) {
      case "gemini":
        const geminiKey = getSetting('GEMINI_API_KEY');
        if (!geminiKey) throw new Error("Gemini API Key is not configured.");
        const googleProvider = createGoogleGenerativeAI({ apiKey: geminiKey });
        aiModel = googleProvider('gemini-1.5-pro');
        break;
      case "claude":
        const claudeKey = getSetting('CLAUDE_API_KEY');
        if (!claudeKey) throw new Error("Claude API Key is not configured.");
        const anthropicProvider = createAnthropic({ apiKey: claudeKey });
        aiModel = anthropicProvider('claude-3-5-sonnet-20241022');
        break;
      case "openai":
      default:
        const openaiKey = getSetting('OPENAI_API_KEY');
        if (!openaiKey) throw new Error("OpenAI API Key is not configured.");
        const openaiProvider = createOpenAI({ apiKey: openaiKey });
        aiModel = openaiProvider('gpt-4o');
        break;
    }

    // Fetch Test Case Steps
    const testCase = await prisma.testCase.findUnique({
      where: { id: caseId },
      include: { steps: { orderBy: { position: 'asc' } } }
    });

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 });
    }

    const stepsText = testCase.steps.map((s, i) => `Step ${i + 1}: ${s.action} (Expected: ${s.expectedResult || "N/A"})`).join("\n");

    // Launch Playwright
    const launchOptions: any = { headless: true };
    // Playwright automatically uses PLAYWRIGHT_BROWSERS_PATH if it is set in the environment.
    // If we are in the VPS Docker container, we can optionally specify args to avoid sandbox issues.
    if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
      launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
    }
    
    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext();
    const page = await context.newPage();

    const generatedScriptLines: string[] = [];
    
    // Add imports and test skeleton
    generatedScriptLines.push(`import { test, expect } from '@playwright/test';`);
    generatedScriptLines.push(``);
    generatedScriptLines.push(`test('${testCase.title.replace(/'/g, "\\'")}', async ({ page }) => {`);

        if (startUrl) {
      await page.goto(startUrl, { waitUntil: 'networkidle' }).catch(() => {});
      generatedScriptLines.push(`  await page.goto('${startUrl}');`);
    }

    for (let i = 0; i < testCase.steps.length; i++) {
      const step = testCase.steps[i];
      console.log(`[AI Explorer] Processing Step ${i + 1}: ${step.action}`);
      generatedScriptLines.push(`  // Step ${i + 1}: ${step.action}`);

      // 1. Capture DOM
      const dom = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [role="textbox"], [role="menuitem"]');
        const visibleElements = Array.from(elements).filter((el) => {
          const e = el as HTMLElement;
          return e.offsetWidth > 0 && e.offsetHeight > 0 && window.getComputedStyle(e).visibility !== 'hidden' && window.getComputedStyle(e).display !== 'none';
        });
        
        return visibleElements.map(el => {
          const e = el as HTMLElement;
          const tag = e.tagName.toLowerCase();
          const props = [];
          if (e.id) props.push(`id=${e.id}`);
          if (e.getAttribute('type')) props.push(`type=${e.getAttribute('type')}`);
          if (e.getAttribute('name')) props.push(`name=${e.getAttribute('name')}`);
          if (e.getAttribute('placeholder')) props.push(`placeholder="${e.getAttribute('placeholder')}"`);
          if (e.getAttribute('aria-label')) props.push(`aria="${e.getAttribute('aria-label')}"`);
          
          const text = (e.innerText || e.getAttribute('value') || '').trim().substring(0, 30).replace(/\n/g, ' ');
          return `[${tag}] ${text} {${props.join(',')}}`;
        }).join('\n');
      });
      
      const simplifiedDom = dom.substring(0, 8000) || "No visible interactive elements.";

      // 2. Query AI
      const prompt = `You are a QA Expert building a Playwright script.
Here is the highly compressed HTML/DOM of the current page (visible interactive elements only):
${simplifiedDom}

Additional Context / Credentials provided by user:
${additionalContext || 'None'}

The user wants to perform this test step: "${step.action}"
Identify the EXACT action type and locator needed.
- If the step requires clicking a button/link, use 'click_css' or 'click_text'.
- If the step requires filling a text field, use 'fill_css' or 'fill_placeholder' and provide the 'value'.
- If the step requires pressing a keyboard key, use 'press_key'.
- If the step requires navigating, use 'goto'.

Respond strictly in JSON.`;

      try {
        const result = await generateObject({
          model: aiModel,
          schema: z.object({
            actions: z.array(z.object({
              type: z.enum(['click_css', 'click_text', 'fill_css', 'fill_placeholder', 'press_key', 'goto', 'none']),
              selector_or_text: z.string().describe("CSS selector, exact text, placeholder, or URL depending on action. Use empty string if not needed."),
              value: z.string().describe("Value to fill if action is fill_css or fill_placeholder. Use empty string if not needed.")
            })).describe("A list of sequential Playwright actions needed to fully accomplish this test step."),
            reason: z.string().describe("Brief explanation of why these actions were chosen")
          }),
          prompt
        });

        const { actions, reason } = result.object;
        console.log(`[AI Explorer] AI Decision for Step ${i + 1}:`, result.object);

        // 3. Execute Actions Sequentially
        for (const act of actions) {
          const { type: action, selector_or_text, value } = act;
          if (action === 'none') continue;
          
          if (action === 'click_css' && selector_or_text) {
            await page.locator(selector_or_text).first().click({ timeout: 5000 });
            await page.waitForLoadState('networkidle').catch(() => {});
            generatedScriptLines.push(`  await page.locator('${selector_or_text.replace(/'/g, "\\'")}').first().click();`);
          } else if (action === 'click_text' && selector_or_text) {
            await page.getByText(selector_or_text).first().click({ timeout: 5000 });
            await page.waitForLoadState('networkidle').catch(() => {});
            generatedScriptLines.push(`  await page.getByText('${selector_or_text.replace(/'/g, "\\'")}').first().click();`);
          } else if (action === 'fill_css' && selector_or_text && value !== undefined) {
            await page.locator(selector_or_text).first().fill(value, { timeout: 5000 });
            generatedScriptLines.push(`  await page.locator('${selector_or_text.replace(/'/g, "\\'")}').first().fill('${value.replace(/'/g, "\\'")}');`);
          } else if (action === 'fill_placeholder' && selector_or_text && value !== undefined) {
            await page.getByPlaceholder(selector_or_text).first().fill(value, { timeout: 5000 });
            generatedScriptLines.push(`  await page.getByPlaceholder('${selector_or_text.replace(/'/g, "\\'")}').first().fill('${value.replace(/'/g, "\\'")}');`);
          } else if (action === 'press_key' && selector_or_text) {
            await page.keyboard.press(selector_or_text);
            generatedScriptLines.push(`  await page.keyboard.press('${selector_or_text}');`);
          } else if (action === 'goto' && selector_or_text) {
            await page.goto(selector_or_text, { waitUntil: 'networkidle' }).catch(() => {});
            generatedScriptLines.push(`  await page.goto('${selector_or_text}');`);
          }
        }
      } catch (e: any) {
        console.error(`[AI Explorer] Failed to execute step ${i + 1}:`, e.message);
        generatedScriptLines.push(`  // FAILED to execute: ${e.message}`);
      }
    }

    generatedScriptLines.push(`});\n`);

    const finalScript = generatedScriptLines.join("\n");

    return NextResponse.json({ script: finalScript });

  } catch (error: any) {
    console.error("Agentic Explore failed:", error);
    return NextResponse.json({ error: error.message || "Failed to explore and generate script" }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
