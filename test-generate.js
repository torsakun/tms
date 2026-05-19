const { generateText, tool } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');
const { z } = require('zod');
require('dotenv').config();

async function run() {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [{ role: 'user', content: 'Use the test tool and then finish tool.' }],
    tools: {
      test: tool({
        description: 'A test tool',
        inputSchema: z.object({}),
        execute: async () => 'Test done'
      }),
      finish: tool({
        description: 'Finish',
        inputSchema: z.object({}),
        execute: async () => 'Finished'
      })
    }
  });
  console.log("Keys:", Object.keys(result));
  if (result.toolCalls) console.log("toolCalls:", result.toolCalls.length);
  if (result.toolResults) console.log("toolResults:", result.toolResults.length);
}
run().catch(console.error);
