const { jsonSchema } = require('ai');
console.log(jsonSchema({ type: 'object', properties: { url: { type: 'string' } } }));
