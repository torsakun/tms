const { tool } = require('ai');
const { z } = require('zod');
console.log(tool({
  description: 'Navigate',
  parameters: z.object({ url: z.string() }),
  execute: async () => {}
}));
