const { tool, jsonSchema } = require('ai');
console.log(tool({ description: "x", parameters: jsonSchema({ type: "object" }), execute: async () => {} }));
