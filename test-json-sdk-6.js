const { jsonSchema } = require('ai');
const s = jsonSchema({ type: 'object', properties: { url: { type: 'string' } }, required: ['url'], additionalProperties: false });
console.log(s.jsonSchema);
