const { generateText } = require('ai');
const { z } = require('zod');
const { createOpenAI } = require('@ai-sdk/openai');

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  console.log(options.body);
  return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

const openai = createOpenAI({ apiKey: 'dummy' });

generateText({
  model: openai('gpt-4o'),
  prompt: 'hi',
  tools: {
    goto: {
      description: 'Navigate',
      parameters: z.object({ url: z.string() }),
      execute: async () => {}
    }
  }
}).catch(e => {});
