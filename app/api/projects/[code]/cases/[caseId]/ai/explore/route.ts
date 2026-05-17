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
    // Use the PLAYWRIGHT_BROWSERS_PATH if available
    const launchOptions: any = { headless: true };
    if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
      launchOptions.executablePath = '/ms-playwright/chromium-1117/chrome-linux/chrome'; // A generic fallback might be needed or just let playwright resolve it
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
2. START by using the 'goto' tool to navigate to the starting URL. (If one was provided, use it. Otherwise, figure it out or ask for one).
3. To find out what to click or fill, use the 'get_dom' tool. It will return a simplified list of interactive elements on the screen.
4. When you know what to do, use 'click', 'fill', or 'press'.
5. Every time you use a tool successfully, the corresponding Playwright code is automatically saved to the final script.
6. When all test steps have been executed successfully, call the 'finish' tool. Do NOT return markdown code blocks, just use the tools!`;

    if (startUrl) {
      await page.goto(startUrl);
      generatedScriptLines.push(`  await page.goto('${startUrl}');`);
    }

    const result = await generateText({
      model: aiModel,
      prompt: systemPrompt,
      maxSteps: 15,
      tools: {
        goto: tool({
          description: 'Navigate to a URL',
          parameters: z.object({ url: z.string() }),
          execute: async ({ url }) => {
            await page.goto(url);
            generatedScriptLines.push(`  await page.goto('${url}');`);
            return \`Navigated to \${url}\`;
          }
        }),
        get_dom: tool({
          description: 'Get a simplified version of the current page DOM to find locators. Returns a list of interactive elements (buttons, inputs, links).',
          parameters: z.object({}),
          execute: async () => {
            const dom = await page.evaluate(() => {
              const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [role="textbox"], [role="menuitem"]');
              return Array.from(elements).map(el => {
                const e = el as HTMLElement;
                const tagName = e.tagName.toLowerCase();
                const id = e.id ? \` id="\${e.id}"\` : '';
                const cls = e.className && typeof e.className === 'string' ? \` class="\${e.className.split(' ').slice(0,3).join(' ')}"\` : '';
                const type = e.getAttribute('type') ? \` type="\${e.getAttribute('type')}"\` : '';
                const name = e.getAttribute('name') ? \` name="\${e.getAttribute('name')}"\` : '';
                const placeholder = e.getAttribute('placeholder') ? \` placeholder="\${e.getAttribute('placeholder')}"\` : '';
                const aria = e.getAttribute('aria-label') ? \` aria-label="\${e.getAttribute('aria-label')}"\` : '';
                const text = (e.innerText || e.getAttribute('value') || '').trim().substring(0, 50).replace(/\\n/g, ' ');
                
                return \`<\${tagName}\${id}\${cls}\${type}\${name}\${placeholder}\${aria}>\${text}</\${tagName}>\`;
              }).join('\\n');
            });
            return dom || "No interactive elements found.";
          }
        }),
        click: tool({
          description: 'Click an element using a Playwright locator string (e.g. "page.getByRole(\'button\', { name: \'Login\' })" or "page.locator(\'input[name=email]\')")',
          parameters: z.object({ 
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
              return \`Failed: \${e.message}\`;
            }
          }
        }),
        click_css: tool({
           description: 'Click an element by CSS selector (e.g. "button.login-btn")',
           parameters: z.object({ selector: z.string(), description: z.string() }),
           execute: async ({ selector, description }) => {
             try {
               await page.locator(selector).first().click({ timeout: 5000 });
               generatedScriptLines.push(\`  // \${description}\`);
               generatedScriptLines.push(\`  await page.locator('\${selector}').first().click();\`);
               return \`Successfully clicked \${selector}\`;
             } catch (e: any) {
               return \`Failed to click: \${e.message}\`;
             }
           }
        }),
        click_text: tool({
           description: 'Click an element by its exact or partial text (e.g. "Sign in")',
           parameters: z.object({ text: z.string(), exact: z.boolean().optional(), description: z.string() }),
           execute: async ({ text, exact = false, description }) => {
             try {
               await page.getByText(text, { exact }).first().click({ timeout: 5000 });
               generatedScriptLines.push(\`  // \${description}\`);
               generatedScriptLines.push(\`  await page.getByText('\${text}', { exact: \${exact} }).first().click();\`);
               return \`Successfully clicked text "\${text}"\`;
             } catch (e: any) {
               return \`Failed to click text: \${e.message}\`;
             }
           }
        }),
        click_role: tool({
           description: 'Click an element by its Aria Role and Name (e.g. role "button", name "Login")',
           parameters: z.object({ role: z.string(), name: z.string(), exact: z.boolean().optional(), description: z.string() }),
           execute: async ({ role, name, exact = false, description }) => {
             try {
               await page.getByRole(role as any, { name, exact }).first().click({ timeout: 5000 });
               generatedScriptLines.push(\`  // \${description}\`);
               generatedScriptLines.push(\`  await page.getByRole('\${role}', { name: '\${name}', exact: \${exact} }).first().click();\`);
               return \`Successfully clicked role \${role} "\${name}"\`;
             } catch (e: any) {
               return \`Failed to click role: \${e.message}\`;
             }
           }
        }),
        fill_css: tool({
          description: 'Fill an input field identified by a CSS selector',
          parameters: z.object({ selector: z.string(), value: z.string(), description: z.string() }),
          execute: async ({ selector, value, description }) => {
            try {
              await page.locator(selector).first().fill(value, { timeout: 5000 });
              generatedScriptLines.push(\`  // \${description}\`);
              generatedScriptLines.push(\`  await page.locator('\${selector}').first().fill('\${value}');\`);
              return \`Successfully filled \${selector}\`;
            } catch (e: any) {
               return \`Failed to fill: \${e.message}\`;
            }
          }
        }),
        fill_placeholder: tool({
          description: 'Fill an input field identified by its placeholder text',
          parameters: z.object({ placeholder: z.string(), value: z.string(), description: z.string() }),
          execute: async ({ placeholder, value, description }) => {
            try {
              await page.getByPlaceholder(placeholder).first().fill(value, { timeout: 5000 });
              generatedScriptLines.push(\`  // \${description}\`);
              generatedScriptLines.push(\`  await page.getByPlaceholder('\${placeholder}').first().fill('\${value}');\`);
              return \`Successfully filled placeholder \${placeholder}\`;
            } catch (e: any) {
               return \`Failed to fill placeholder: \${e.message}\`;
            }
          }
        }),
        press_key: tool({
          description: 'Press a keyboard key (e.g. "Enter", "Tab")',
          parameters: z.object({ key: z.string(), description: z.string() }),
          execute: async ({ key, description }) => {
            try {
              await page.keyboard.press(key);
              generatedScriptLines.push(\`  // \${description}\`);
              generatedScriptLines.push(\`  await page.keyboard.press('\${key}');\`);
              return \`Successfully pressed \${key}\`;
            } catch (e: any) {
              return \`Failed to press \${key}: \${e.message}\`;
            }
          }
        }),
        wait_for_timeout: tool({
          description: 'Wait for a specified amount of time (in milliseconds) for the page to load or stabilize',
          parameters: z.object({ ms: z.number() }),
          execute: async ({ ms }) => {
            await page.waitForTimeout(ms);
            generatedScriptLines.push(\`  await page.waitForTimeout(\${ms});\`);
            return \`Waited for \${ms}ms\`;
          }
        }),
        finish: tool({
          description: 'Call this when you have successfully executed all test steps.',
          parameters: z.object({}),
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
