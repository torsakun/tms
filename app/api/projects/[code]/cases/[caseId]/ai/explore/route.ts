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

      let maxAttempts = 2;
      let attempt = 0;
      let success = false;

      while (attempt < maxAttempts && !success) {
        attempt++;
        
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
        let prompt = `You are a QA Expert building a Playwright script.
Here is the highly compressed HTML/DOM of the current page (visible interactive elements only):
${simplifiedDom}

Additional Context / Credentials provided by user:
${additionalContext || 'None'}

The user wants to perform this test step: "${step.action}"
Identify the EXACT action type and locator needed.
- If the step requires clicking a button/link, use 'click_css' or 'click_text'.
- If the step requires filling a text field, use 'fill_css' or 'fill_placeholder' and provide the 'value'. ONLY use a placeholder if it exactly matches the text inside {placeholder="..."} in the provided HTML/DOM. Do not hallucinate placeholders.
- If the step requires pressing a keyboard key, use 'press_key'.
- NEVER use 'goto' unless the step explicitly contains a full HTTP URL to navigate to.

Respond strictly in JSON.`;

          if (lastError) {
            prompt += `\n\nWARNING: Your previous attempt failed with error: ${lastError}. Do NOT repeat the exact same action. Try a different selector (e.g. use fill_css instead of fill_placeholder, or use a more specific css selector).`;
          }

        try {
          const result = await generateObject({
            model: aiModel,
            schema: z.object({
              actions: z.array(z.object({
                type: z.enum(['click_css', 'click_text', 'fill_css', 'fill_placeholder', 'press_key', 'none']),
                selector_or_text: z.string().describe("CSS selector, exact text, placeholder, or URL depending on action. Use empty string if not needed."),
                value: z.string().describe("Value to fill if action is fill_css or fill_placeholder. Use empty string if not needed.")
              })).describe("A list of sequential Playwright actions needed to fully accomplish this test step."),
              reason: z.string().describe("Brief explanation of why these actions were chosen")
            }),
            prompt
          });

          const { actions, reason } = result.object;
          console.log(`[AI Explorer] AI Decision for Step ${i + 1} (Attempt ${attempt}):`, result.object);

          if (actions.length === 0 || actions.every(a => a.type === 'none')) {
            if (attempt < maxAttempts) {
              console.log(`[AI Explorer] AI returned 'none'. Waiting 3s to let SPA load, then retrying...`);
              await page.waitForTimeout(3000);
              continue;
            } else {
              generatedScriptLines.push(`  // AI could not determine action: ${reason}`);
              break;
            }
          }

          // 3. Execute Actions Sequentially
          for (const act of actions) {
            const { type: action, selector_or_text, value } = act;
            if (action === 'none') continue;
            
            if (action === 'click_css' && selector_or_text) {
              await page.locator(selector_or_text).first().click({ timeout: 5000 });
              await page.waitForTimeout(1000);
              await page.waitForLoadState('networkidle').catch(() => {});
              generatedScriptLines.push(`  await page.locator('${selector_or_text.replace(/'/g, "\\'")}').first().click();`);
            } else if (action === 'click_text' && selector_or_text) {
              await page.getByText(selector_or_text).first().click({ timeout: 5000 });
              await page.waitForTimeout(1000);
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
          success = true;
        } catch (e: any) {
          console.error(`[AI Explorer] Failed to execute step ${i + 1} (Attempt ${attempt}):`, e.message);
          lastError = e.message;
          if (attempt < maxAttempts) {
            await page.waitForTimeout(3000);
          } else {
            const safeErrorMessage = e.message.replace(/\n/g, '\n  // ');
            generatedScriptLines.push(`  // FAILED to execute step: ${safeErrorMessage}`);
            break; // Break the attempt loop
          }
        }
      }
      
      // If we failed to execute this step after all attempts, abort the rest of the test case
      if (!success) {
        generatedScriptLines.push(`  // ABORTING test generation because step ${i + 1} failed.`);
        break;
      }

      
      // Add explicit delay in generated script to mimic Explorer's wait behavior for SPA transitions
      if (success) {
        generatedScriptLines.push(`  try { await page.waitForLoadState('networkidle', { timeout: 3000 }); } catch(e) {}`);
        generatedScriptLines.push(`  await page.waitForTimeout(1000);`);
      }

      // --- PHASE 2: Assertion Generation ---
      if (success && step.expectedResult) {
        console.log(`[AI Explorer] Processing Phase 2 (Assertions) for Step ${i + 1}: ${step.expectedResult}`);
        generatedScriptLines.push(`  // Verify Expected: ${step.expectedResult}`);
        
        let assertionAttempt = 0;
        let assertionSuccess = false;

        while (assertionAttempt < maxAttempts && !assertionSuccess) {
          assertionAttempt++;
          
          // 1. Capture NEW DOM
          const newDom = await page.evaluate(() => {
            const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [role="textbox"], [role="menuitem"], h1, h2, h3, h4, p, span, div');
            const visibleElements = Array.from(elements).filter((el) => {
              const e = el as HTMLElement;
              // Ignore very large wrapper divs to save tokens, focus on content
              if (e.tagName.toLowerCase() === 'div' && e.children.length > 3) return false;
              return e.offsetWidth > 0 && e.offsetHeight > 0 && window.getComputedStyle(e).visibility !== 'hidden' && window.getComputedStyle(e).display !== 'none';
            });
            
            return visibleElements.map(el => {
              const e = el as HTMLElement;
              const tag = e.tagName.toLowerCase();
              const text = (e.innerText || e.getAttribute('value') || '').trim().substring(0, 50).replace(/\n/g, ' ');
              if (!text) return null; // Skip empty elements for assertions
              
              const props = [];
              if (e.id) props.push(`id=${e.id}`);
              if (e.className && typeof e.className === 'string') props.push(`class=${e.className.split(' ')[0]}`); // Only take first class to save space
              if (e.getAttribute('placeholder')) props.push(`placeholder="${e.getAttribute('placeholder')}"`);
              
              return `[${tag}] ${text} {${props.join(',')}}`;
            }).filter(Boolean).join('\n');
          });
          
          const simplifiedNewDom = newDom.substring(0, 8000) || "No visible text elements.";

          // 2. Query AI for Assertions
          let assertionPrompt = `You are a QA Expert. The previous action was executed.
Here is the NEW HTML/DOM of the current page (visible elements):
${simplifiedNewDom}

The user's EXPECTED RESULT for this step is: "${step.expectedResult}"
Generate Playwright assertions to verify this expected result is met on the current page.
- Use 'assert_text' if you expect certain text to appear. The selector_or_text MUST be the exact text.
- Use 'assert_css' if you expect a specific CSS selector to be visible.
- Use 'assert_placeholder' if you expect an input with a specific placeholder.

Respond strictly in JSON.`;

          if (lastAssertionError) {
            assertionPrompt += `\n\nWARNING: Your previous attempt failed with error: ${lastAssertionError}. Do NOT repeat the exact same assertion.`;
          }

          try {
            const assertionResult = await generateObject({
              model: aiModel,
              schema: z.object({
                assertions: z.array(z.object({
                  type: z.enum(['assert_text', 'assert_css', 'assert_placeholder', 'none']),
                  selector_or_text: z.string().describe("CSS selector, exact text, or placeholder to assert. Use empty string if not needed.")
                })).describe("A list of Playwright assertions to verify the expected result."),
                reason: z.string().describe("Brief explanation")
              }),
              prompt: assertionPrompt
            });

            const { assertions, reason } = assertionResult.object;
            console.log(`[AI Explorer] AI Assertion Decision for Step ${i + 1} (Attempt ${assertionAttempt}):`, assertionResult.object);

            if (assertions.length === 0 || assertions.every(a => a.type === 'none')) {
              if (assertionAttempt < maxAttempts) {
                console.log(`[AI Explorer] AI returned 'none' for assertions. Waiting 3s...`);
                await page.waitForTimeout(3000);
                continue;
              } else {
                generatedScriptLines.push(`  // AI could not determine assertion: ${reason}`);
                break;
              }
            }

            for (const ast of assertions) {
              if (ast.type === 'none') continue;
              
              if (ast.type === 'assert_text' && ast.selector_or_text) {
                generatedScriptLines.push(`  await expect(page.getByText('${ast.selector_or_text.replace(/'/g, "\\'")}').first()).toBeVisible();`);
              } else if (ast.type === 'assert_css' && ast.selector_or_text) {
                generatedScriptLines.push(`  await expect(page.locator('${ast.selector_or_text.replace(/'/g, "\\'")}').first()).toBeVisible();`);
              } else if (ast.type === 'assert_placeholder' && ast.selector_or_text) {
                generatedScriptLines.push(`  await expect(page.getByPlaceholder('${ast.selector_or_text.replace(/'/g, "\\'")}').first()).toBeVisible();`);
              }
            }
            assertionSuccess = true;
          } catch (e: any) {
            console.error(`[AI Explorer] Failed to generate assertion for step ${i + 1}:`, e.message);
            lastAssertionError = e.message;
            if (assertionAttempt < maxAttempts) {
              await page.waitForTimeout(3000);
            } else {
              const safeErrorMessage = e.message.replace(/\n/g, '\n  // ');
              generatedScriptLines.push(`  // FAILED to generate assertion: ${safeErrorMessage}`);
              break;
            }
          }
        }
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
