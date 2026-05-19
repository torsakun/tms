const { generateText, tool } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');
const { z } = require('zod');

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  return new Response(JSON.stringify({ 
    id: "123",
    created: 123,
    model: "gpt-4o",
    object: "chat.completion",
    choices: [{ index: 0, message: { role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name: "my_tool", arguments: "{}" } }] }, finish_reason: "tool_calls" }] 
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

const openai = createOpenAI({ apiKey: 'dummy' });

async function run() {
  const result = await generateText({
    model: openai('gpt-4o'),
    messages: [{ role: 'user', content: 'hi' }],
    tools: {
      my_tool: tool({
        description: 'Test',
        inputSchema: z.object({}),
        execute: async () => 'Tool executed'
      })
    }
  });
  console.log(JSON.stringify(result.response.messages, null, 2));
}
run().catch(console.error);
