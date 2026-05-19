const { generateText, tool } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');
const { z } = require('zod');

const originalFetch = globalThis.fetch;
let callCount = 0;
globalThis.fetch = async (url, options) => {
  callCount++;
  console.log("Fetch call", callCount);
  console.log("Body:", options.body);
  if (callCount === 1) {
    return new Response(JSON.stringify({ 
      id: "123",
      created: 123,
      model: "gpt-4o",
      object: "chat.completion",
      choices: [{ index: 0, message: { role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name: "my_tool", arguments: "{}" } }] }, finish_reason: "tool_calls" }] 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } else {
    return new Response(JSON.stringify({ 
      id: "123",
      created: 123,
      model: "gpt-4o",
      object: "chat.completion",
      choices: [{ index: 0, message: { role: "assistant", content: "Done", tool_calls: [] }, finish_reason: "stop" }] 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};

const openai = createOpenAI({ apiKey: 'dummy' });

generateText({
  model: openai('gpt-4o'),
  prompt: 'hi',
  toolChoice: "required",
  maxSteps: 3,
  tools: {
    my_tool: tool({
      description: 'Test tool',
      inputSchema: z.object({}),
      execute: async () => "Tool executed"
    })
  }
}).then(r => console.log('Steps:', r.steps?.length, 'Calls:', callCount)).catch(e => console.error(e));
