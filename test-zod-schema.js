const { z } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema'); // AI SDK might use this

try {
  const schema = z.object({ url: z.string() });
  console.log(JSON.stringify(zodToJsonSchema(schema), null, 2));
} catch (e) {
  console.error("Failed:", e.message);
}
