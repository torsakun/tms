const { generateText, tool, jsonSchema } = require('ai');
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
    goto: tool({
      description: 'Navigate',
      parameters: jsonSchema({ schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'], additionalProperties: false } }),
      execute: async () => {}
    })
  }
}).catch(e => {});
