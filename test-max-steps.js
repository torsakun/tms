const { generateText, tool } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');
const { z } = require('zod');

const originalFetch = globalThis.fetch;
let callCount = 0;
globalThis.fetch = async (url, options) => {
  callCount++;
  if (callCount === 1) {
    return new Response(JSON.stringify({ 
      choices: [{ message: { content: "", tool_calls: [{ id: "1", type: "function", function: { name: "my_tool", arguments: "{}" } }] } }] 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } else {
    return new Response(JSON.stringify({ 
      choices: [{ message: { content: "Done" } }] 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};

const openai = createOpenAI({ apiKey: 'dummy' });

generateText({
  model: openai('gpt-4o'),
  prompt: 'hi',
  maxSteps: 5,
  tools: {
    my_tool: {
      description: 'Test tool',
      inputSchema: z.object({}),
      execute: async () => "Tool executed"
    }
  }
}).then(r => console.log('Steps:', r.steps?.length, 'Calls:', callCount)).catch(e => console.error(e));
