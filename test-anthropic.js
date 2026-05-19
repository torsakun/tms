const { generateText, tool } = require('ai');
const { z } = require('zod');
const { createAnthropic } = require('@ai-sdk/anthropic');

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  console.log(options.body);
  return new Response(JSON.stringify({ content: [{ text: "ok" }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

const anthropic = createAnthropic({ apiKey: 'dummy' });

generateText({
  model: anthropic('claude-3-haiku-20240307'),
  prompt: 'hi',
  tools: {
    goto: tool({
      description: 'Navigate',
      parameters: z.object({ url: z.string() }),
      execute: async () => {}
    })
  }
}).catch(e => {});
