const fs = require('fs');
let file = fs.readFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', 'utf8');

const oldEnd = `      messages.push({
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
      }`;

const newEnd = `      // Append assistant's response to history
      if (result.response && result.response.messages) {
        messages = messages.concat(result.response.messages);
      } else {
        // Fallback if response.messages is not available
        let content: any[] = [];
        if (result.text) content.push({ type: 'text', text: result.text });
        if (result.toolCalls && result.toolCalls.length > 0) {
          content.push(...result.toolCalls.map((tc: any) => ({
            type: 'tool-call',
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args
          })));
        }
        
        messages.push({
          role: "assistant",
          content: content.length > 0 ? content : ""
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
        }
      }

      if (result.toolCalls && result.toolCalls.some((tc: any) => tc.toolName === 'finish')) {
        isFinished = true;
      } else if (!result.toolCalls || result.toolCalls.length === 0) {
        isFinished = true;
      }`;

file = file.replace(oldEnd, newEnd);
fs.writeFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', file);
