const { generateText, tool } = require('ai');
const { createAnthropic } = require('@ai-sdk/anthropic');
const { z } = require('zod');

const anthropic = createAnthropic({ apiKey: 'sk-ant-api03-test-token-1234' });

generateText({
  model: anthropic('claude-3-haiku-20240307'),
  prompt: 'hi',
  tools: {
    goto: tool({
      description: 'test',
      parameters: z.object({ url: z.string() }),
      execute: async () => {}
    })
  }
}).catch(e => console.error(e.message));
