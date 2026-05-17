// @ts-nocheck
import { NextResponse } from "next/server";
import { generateText, tool } from "ai";
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
    const { startUrl, modelProvider = "openai" } = body;

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

    const systemPrompt = `You are an Autonomous Testing Agent. 
Your goal is to write a Playwright script that executes the following manual test steps:

${stepsText}

Instructions:
1. You have a real browser attached. Use your tools to navigate to the target app and perform the actions.
2. If you are already at the starting URL, DO NOT use 'goto' again. START by using the 'get_dom' tool to find out what to click or fill.
3. When you know what to do, use 'click_css', 'click_text', 'fill_css', etc.
4. Every time you use a tool successfully, the corresponding Playwright code is automatically saved to the final script.
5. You MUST act using tools. DO NOT just output text.
6. When ALL test steps have been executed successfully, call the 'finish' tool.`;

    if (startUrl) {
      await page.goto(startUrl, { waitUntil: 'networkidle' }).catch(() => {});
      generatedScriptLines.push(`  await page.goto('${startUrl}');`);
    }

    const result = await generateText({
      model: aiModel,
      system: systemPrompt,
      prompt: startUrl ? `I have already navigated to ${startUrl}. Please begin execution by examining the DOM.` : `Please begin execution.`,
      toolChoice: "required",
      // @ts-ignore
      maxSteps: 15,
      tools: {
        goto: tool({
          description: 'Navigate to a URL',
          inputSchema: z.object({ url: z.string() }),
          execute: async ({ url }) => {
            await page.goto(url);
            generatedScriptLines.push(`  await page.goto('${url}');`);
            return `Navigated to ${url}`;
          }
        }),
        get_dom: tool({
          description: 'Get a simplified, highly compressed list of VISIBLE interactive elements on the screen to find locators. Use this sparingly to save tokens.',
          inputSchema: z.object({}),
          execute: async () => {
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
                
                const text = (e.innerText || e.getAttribute('value') || '').trim().substring(0, 30).replace(/\\n/g, ' ');
                return `[${tag}] ${text} {${props.join(',')}}`;
              }).join('\\n');
            });
            // Truncate to avoid massive token usage
            return dom.substring(0, 4000) || "No visible interactive elements.";
          }
        }),
        click: tool({
          description: 'Click an element using a Playwright locator string (e.g. "page.getByRole(\'button\', { name: \'Login\' })" or "page.locator(\'input[name=email]\')")',
          inputSchema: z.object({ 
            locatorStr: z.string(),
            description: z.string().describe("A comment describing this step")
          }),
          execute: async ({ locatorStr, description }) => {
            try {
              // We evaluate the locator in the browser context via playwright's evaluate Handle or just using page.locator directly if it's a standard selector.
              // Since the AI provides Playwright code like "page.getByRole('button')", we need to translate that.
              // To make it safe and easy, let's ask the AI to provide standard CSS or Text selectors, OR we just eval it.
              // A better approach: ask AI to provide CSS selector or text to click.
              return "Error: Please use click_css or click_text instead of this tool.";
            } catch (e: any) {
              return `Failed: ${e.message}`;
            }
          }
        }),
        click_css: tool({
           description: 'Click an element by CSS selector (e.g. "button.login-btn")',
           inputSchema: z.object({ selector: z.string(), description: z.string() }),
           execute: async ({ selector, description }) => {
             try {
               await page.locator(selector).first().click({ timeout: 5000 });
               generatedScriptLines.push(`  // ${description}`);
               generatedScriptLines.push(`  await page.locator('${selector}').first().click();`);
               return `Successfully clicked ${selector}`;
             } catch (e: any) {
               return `Failed to click: ${e.message}`;
             }
           }
        }),
        click_text: tool({
           description: 'Click an element by its exact or partial text (e.g. "Sign in")',
           inputSchema: z.object({ text: z.string(), exact: z.boolean().optional(), description: z.string() }),
           execute: async ({ text, exact = false, description }) => {
             try {
               await page.getByText(text, { exact }).first().click({ timeout: 5000 });
               generatedScriptLines.push(`  // ${description}`);
               generatedScriptLines.push(`  await page.getByText('${text}', { exact: ${exact} }).first().click();`);
               return `Successfully clicked text "${text}"`;
             } catch (e: any) {
               return `Failed to click text: ${e.message}`;
             }
           }
        }),
        click_role: tool({
           description: 'Click an element by its Aria Role and Name (e.g. role "button", name "Login")',
           inputSchema: z.object({ role: z.string(), name: z.string(), exact: z.boolean().optional(), description: z.string() }),
           execute: async ({ role, name, exact = false, description }) => {
             try {
               await page.getByRole(role as any, { name, exact }).first().click({ timeout: 5000 });
               generatedScriptLines.push(`  // ${description}`);
               generatedScriptLines.push(`  await page.getByRole('${role}', { name: '${name}', exact: ${exact} }).first().click();`);
               return `Successfully clicked role ${role} "${name}"`;
             } catch (e: any) {
               return `Failed to click role: ${e.message}`;
             }
           }
        }),
        fill_css: tool({
          description: 'Fill an input field identified by a CSS selector',
          inputSchema: z.object({ selector: z.string(), value: z.string(), description: z.string() }),
          execute: async ({ selector, value, description }) => {
            try {
              await page.locator(selector).first().fill(value, { timeout: 5000 });
              generatedScriptLines.push(`  // ${description}`);
              generatedScriptLines.push(`  await page.locator('${selector}').first().fill('${value}');`);
              return `Successfully filled ${selector}`;
            } catch (e: any) {
               return `Failed to fill: ${e.message}`;
            }
          }
        }),
        fill_placeholder: tool({
          description: 'Fill an input field identified by its placeholder text',
          inputSchema: z.object({ placeholder: z.string(), value: z.string(), description: z.string() }),
          execute: async ({ placeholder, value, description }) => {
            try {
              await page.getByPlaceholder(placeholder).first().fill(value, { timeout: 5000 });
              generatedScriptLines.push(`  // ${description}`);
              generatedScriptLines.push(`  await page.getByPlaceholder('${placeholder}').first().fill('${value}');`);
              return `Successfully filled placeholder ${placeholder}`;
            } catch (e: any) {
               return `Failed to fill placeholder: ${e.message}`;
            }
          }
        }),
        press_key: tool({
          description: 'Press a keyboard key (e.g. "Enter", "Tab")',
          inputSchema: z.object({ key: z.string(), description: z.string() }),
          execute: async ({ key, description }) => {
            try {
              await page.keyboard.press(key);
              generatedScriptLines.push(`  // ${description}`);
              generatedScriptLines.push(`  await page.keyboard.press('${key}');`);
              return `Successfully pressed ${key}`;
            } catch (e: any) {
              return `Failed to press ${key}: ${e.message}`;
            }
          }
        }),
        wait_for_timeout: tool({
          description: 'Wait for a specified amount of time (in milliseconds) for the page to load or stabilize',
          inputSchema: z.object({ ms: z.number() }),
          execute: async ({ ms }) => {
            await page.waitForTimeout(ms);
            generatedScriptLines.push(`  await page.waitForTimeout(${ms});`);
            return `Waited for ${ms}ms`;
          }
        }),
        finish: tool({
          description: 'Call this when you have successfully executed all test steps.',
          inputSchema: z.object({}),
          execute: async () => "Finished generating script"
        })
      }
    });

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
