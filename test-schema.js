const { tool } = require('ai');
const { z } = require('zod');

const t = tool({
  description: 'Navigate',
  parameters: z.object({ url: z.string() }),
  execute: async () => {}
});

console.log(JSON.stringify(t, null, 2));
