const { tool } = require('ai');
const { z } = require('zod');
console.log(tool({ description: "x", parameters: z.object({ url: z.string() }), execute: async () => {} }));
console.log(tool({ description: "x", inputSchema: z.object({ url: z.string() }), execute: async () => {} }));
