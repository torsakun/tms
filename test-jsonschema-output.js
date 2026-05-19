const { tool, jsonSchema } = require('ai');
const t = tool({
  description: 'Navigate',
  parameters: jsonSchema({ type: 'object', properties: { url: { type: 'string' } }, required: ['url'], additionalProperties: false }),
  execute: async () => {}
});
console.log(JSON.stringify(t, null, 2));
