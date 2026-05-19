const { jsonSchema } = require('ai');
console.log(jsonSchema({ schema: { type: 'object', properties: { url: { type: 'string' } } } }).jsonSchema);
