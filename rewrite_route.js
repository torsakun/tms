const fs = require('fs');
let file = fs.readFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', 'utf8');

file = file.replace('import { generateText, tool } from "ai";', 'import { generateObject } from "ai";');

const oldLogicStart = file.indexOf('const systemPrompt = `You are an Autonomous Testing Agent.');
const oldLogicEnd = file.indexOf('    generatedScriptLines.push(`});\\n`);');

if (oldLogicStart === -1 || oldLogicEnd === -1) {
  console.error('Could not find old logic block');
  process.exit(1);
}

const newLogic = `    if (startUrl) {
      await page.goto(startUrl, { waitUntil: 'networkidle' }).catch(() => {});
      generatedScriptLines.push(\`  await page.goto('\${startUrl}');\`);
    }

    for (let i = 0; i < testCase.steps.length; i++) {
      const step = testCase.steps[i];
      console.log(\`[AI Explorer] Processing Step \${i + 1}: \${step.action}\`);
      generatedScriptLines.push(\`  // Step \${i + 1}: \${step.action}\`);

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
          if (e.id) props.push(\`id=\${e.id}\`);
          if (e.getAttribute('type')) props.push(\`type=\${e.getAttribute('type')}\`);
          if (e.getAttribute('name')) props.push(\`name=\${e.getAttribute('name')}\`);
          if (e.getAttribute('placeholder')) props.push(\`placeholder="\${e.getAttribute('placeholder')}"\`);
          if (e.getAttribute('aria-label')) props.push(\`aria="\${e.getAttribute('aria-label')}"\`);
          
          const text = (e.innerText || e.getAttribute('value') || '').trim().substring(0, 30).replace(/\\n/g, ' ');
          return \`[\${tag}] \${text} {\${props.join(',')}}\`;
        }).join('\\n');
      });
      
      const simplifiedDom = dom.substring(0, 8000) || "No visible interactive elements.";

      // 2. Query AI
      const prompt = \`You are a QA Expert building a Playwright script.
Here is the highly compressed HTML/DOM of the current page (visible interactive elements only):
\${simplifiedDom}

Additional Context / Credentials provided by user:
\${additionalContext || 'None'}

The user wants to perform this test step: "\${step.action}"
Identify the EXACT action type and locator needed.
- If the step requires clicking a button/link, use 'click_css' or 'click_text'.
- If the step requires filling a text field, use 'fill_css' or 'fill_placeholder' and provide the 'value'.
- If the step requires pressing a keyboard key, use 'press_key'.
- If the step requires navigating, use 'goto'.

Respond strictly in JSON.\`;

      try {
        const result = await generateObject({
          model: aiModel,
          schema: z.object({
            action: z.enum(['click_css', 'click_text', 'fill_css', 'fill_placeholder', 'press_key', 'goto', 'none']),
            selector_or_text: z.string().optional().describe("CSS selector, exact text, placeholder, or URL depending on action"),
            value: z.string().optional().describe("Value to fill if action is fill_css or fill_placeholder"),
            reason: z.string().describe("Brief explanation of why this locator was chosen")
          }),
          prompt
        });

        const { action, selector_or_text, value, reason } = result.object;
        console.log(\`[AI Explorer] AI Decision for Step \${i + 1}:\`, result.object);

        // 3. Execute
        if (action === 'click_css' && selector_or_text) {
          await page.locator(selector_or_text).first().click({ timeout: 5000 });
          await page.waitForLoadState('networkidle').catch(() => {});
          generatedScriptLines.push(\`  await page.locator('\${selector_or_text.replace(/'/g, "\\\\'")}').first().click();\`);
        } else if (action === 'click_text' && selector_or_text) {
          await page.getByText(selector_or_text).first().click({ timeout: 5000 });
          await page.waitForLoadState('networkidle').catch(() => {});
          generatedScriptLines.push(\`  await page.getByText('\${selector_or_text.replace(/'/g, "\\\\'")}').first().click();\`);
        } else if (action === 'fill_css' && selector_or_text && value !== undefined) {
          await page.locator(selector_or_text).first().fill(value, { timeout: 5000 });
          generatedScriptLines.push(\`  await page.locator('\${selector_or_text.replace(/'/g, "\\\\'")}').first().fill('\${value.replace(/'/g, "\\\\'")}');\`);
        } else if (action === 'fill_placeholder' && selector_or_text && value !== undefined) {
          await page.getByPlaceholder(selector_or_text).first().fill(value, { timeout: 5000 });
          generatedScriptLines.push(\`  await page.getByPlaceholder('\${selector_or_text.replace(/'/g, "\\\\'")}').first().fill('\${value.replace(/'/g, "\\\\'")}');\`);
        } else if (action === 'press_key' && selector_or_text) {
          await page.keyboard.press(selector_or_text);
          generatedScriptLines.push(\`  await page.keyboard.press('\${selector_or_text}');\`);
        } else if (action === 'goto' && selector_or_text) {
          await page.goto(selector_or_text, { waitUntil: 'networkidle' }).catch(() => {});
          generatedScriptLines.push(\`  await page.goto('\${selector_or_text}');\`);
        } else {
          generatedScriptLines.push(\`  // AI could not determine action: \${reason}\`);
        }
      } catch (e: any) {
        console.error(\`[AI Explorer] Failed to execute step \${i + 1}:\`, e.message);
        generatedScriptLines.push(\`  // FAILED to execute: \${e.message}\`);
      }
    }

`;

file = file.substring(0, oldLogicStart) + newLogic + file.substring(oldLogicEnd);
fs.writeFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', file);
