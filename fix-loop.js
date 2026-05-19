const fs = require('fs');
let file = fs.readFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', 'utf8');

const oldCall = `    const result = await generateText({
      model: aiModel,
      system: systemPrompt,
      prompt: startUrl ? \`I have already navigated to \${startUrl}. Please begin execution by examining the DOM.\` : \`Please begin execution.\`,
      toolChoice: "required",
      // @ts-ignore
      maxSteps: 15,
      tools: {`;

const newCall = `    let messages: any[] = [
      { role: "user", content: startUrl ? \`I have already navigated to \${startUrl}. Please begin execution by examining the DOM.\` : \`Please begin execution.\` }
    ];

    let isFinished = false;
    let stepCount = 0;
    const MAX_STEPS = 15;

    while (!isFinished && stepCount < MAX_STEPS) {
      stepCount++;
      const result = await generateText({
        model: aiModel,
        system: systemPrompt,
        messages,
        toolChoice: "required",
        tools: {`;

file = file.replace(oldCall, newCall);

const oldEnd = `        finish: tool({
          description: 'Call this when you have successfully executed all test steps.',
          inputSchema: z.object({}),
          execute: async () => "Finished generating script"
        })
      }
    });

    generatedScriptLines.push(\`});\\n\`);`;

const newEnd = `        finish: tool({
          description: 'Call this when you have successfully executed all test steps.',
          inputSchema: z.object({}),
          execute: async () => "Finished generating script"
        })
      }
    });

      messages.push({
        role: "assistant",
        content: result.text || "",
        toolCalls: result.toolCalls
      });

      if (result.toolResults && result.toolResults.length > 0) {
        messages.push({
          role: "tool",
          content: result.toolResults.map((tr: any) => ({
            type: "tool-result",
            toolCallId: tr.toolCallId,
            toolName: tr.toolName,
            result: tr.result
          }))
        });

        if (result.toolCalls.some((tc: any) => tc.toolName === 'finish')) {
          isFinished = true;
        }
      } else {
        isFinished = true;
      }
    }

    generatedScriptLines.push(\`});\\n\`);`;

file = file.replace(oldEnd, newEnd);
fs.writeFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', file);
