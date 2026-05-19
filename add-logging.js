const fs = require('fs');
let file = fs.readFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', 'utf8');

const target = `    while (!isFinished && stepCount < MAX_STEPS) {
      stepCount++;
      const result = await generateText({`;

const replacement = `    while (!isFinished && stepCount < MAX_STEPS) {
      stepCount++;
      console.log(\`[AI Explorer] Step \${stepCount} starting...\`);
      const result = await generateText({`;

file = file.replace(target, replacement);

const target2 = `      // Append assistant's response to history
      if (result.response && result.response.messages) {`;

const replacement2 = `      console.log(\`[AI Explorer] Step \${stepCount} result:\`, { text: result.text, toolCalls: result.toolCalls?.map((tc: any) => tc.toolName) });
      
      // Append assistant's response to history
      if (result.response && result.response.messages) {`;

file = file.replace(target2, replacement2);

fs.writeFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', file);
