const { generateText, tool } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { z } = require('zod');

const google = createGoogleGenerativeAI({ apiKey: 'dummy' });

generateText({
  model: google('gemini-1.5-pro'),
  prompt: 'hi',
  tools: {
    goto: tool({
      description: 'test',
      parameters: z.object({ url: z.string() }),
      execute: async () => {}
    })
  }
}).catch(e => console.error(e.message));
