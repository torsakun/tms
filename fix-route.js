const fs = require('fs');
let file = fs.readFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', 'utf8');

// Undo jsonSchema and replace parameters with inputSchema
file = file.replace('import { generateText, tool, jsonSchema } from "ai";', 'import { generateText, tool } from "ai";');

file = file.replace(
  `parameters: jsonSchema({ type: 'object', properties: { url: { type: 'string' } }, required: ['url'], additionalProperties: false }),`,
  `inputSchema: z.object({ url: z.string() }),`
);

file = file.replace(
  `parameters: jsonSchema({ type: 'object', properties: { dummy: { type: 'string' } }, additionalProperties: false }),`,
  `inputSchema: z.object({}),`
);

file = file.replace(
  `parameters: jsonSchema({ type: 'object', properties: { locatorStr: { type: 'string' }, description: { type: 'string', description: "A comment describing this step" } }, required: ['locatorStr', 'description'], additionalProperties: false }),`,
  `inputSchema: z.object({ \n            locatorStr: z.string(),\n            description: z.string().describe("A comment describing this step")\n          }),`
);

file = file.replace(
  `parameters: jsonSchema({ type: 'object', properties: { selector: { type: 'string' }, description: { type: 'string' } }, required: ['selector', 'description'], additionalProperties: false }),`,
  `inputSchema: z.object({ selector: z.string(), description: z.string() }),`
);

file = file.replace(
  `parameters: jsonSchema({ type: 'object', properties: { text: { type: 'string' }, exact: { type: 'boolean' }, description: { type: 'string' } }, required: ['text', 'description'], additionalProperties: false }),`,
  `inputSchema: z.object({ text: z.string(), exact: z.boolean().optional(), description: z.string() }),`
);

file = file.replace(
  `parameters: jsonSchema({ type: 'object', properties: { role: { type: 'string' }, name: { type: 'string' }, exact: { type: 'boolean' }, description: { type: 'string' } }, required: ['role', 'name', 'description'], additionalProperties: false }),`,
  `inputSchema: z.object({ role: z.string(), name: z.string(), exact: z.boolean().optional(), description: z.string() }),`
);

file = file.replace(
  `parameters: jsonSchema({ type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' }, description: { type: 'string' } }, required: ['selector', 'value', 'description'], additionalProperties: false }),`,
  `inputSchema: z.object({ selector: z.string(), value: z.string(), description: z.string() }),`
);

file = file.replace(
  `parameters: jsonSchema({ type: 'object', properties: { placeholder: { type: 'string' }, value: { type: 'string' }, description: { type: 'string' } }, required: ['placeholder', 'value', 'description'], additionalProperties: false }),`,
  `inputSchema: z.object({ placeholder: z.string(), value: z.string(), description: z.string() }),`
);

file = file.replace(
  `parameters: jsonSchema({ type: 'object', properties: { key: { type: 'string' }, description: { type: 'string' } }, required: ['key', 'description'], additionalProperties: false }),`,
  `inputSchema: z.object({ key: z.string(), description: z.string() }),`
);

file = file.replace(
  `parameters: jsonSchema({ type: 'object', properties: { ms: { type: 'number' } }, required: ['ms'], additionalProperties: false }),`,
  `inputSchema: z.object({ ms: z.number() }),`
);

fs.writeFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', file);
