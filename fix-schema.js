const fs = require('fs');

let file = fs.readFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', 'utf8');

// Add jsonSchema import
file = file.replace('import { generateText, tool } from "ai";', 'import { generateText, tool, jsonSchema } from "ai";');

// Replace goto
file = file.replace(
  'parameters: z.object({ url: z.string() }),',
  `parameters: jsonSchema({ type: 'object', properties: { url: { type: 'string' } }, required: ['url'], additionalProperties: false }),`
);

// Replace get_dom
file = file.replace(
  `parameters: z.object({}),`,
  `parameters: jsonSchema({ type: 'object', properties: { dummy: { type: 'string' } }, additionalProperties: false }),`
);

// Replace click
file = file.replace(
  `parameters: z.object({ \n            locatorStr: z.string(),\n            description: z.string().describe("A comment describing this step")\n          }),`,
  `parameters: jsonSchema({ type: 'object', properties: { locatorStr: { type: 'string' }, description: { type: 'string', description: "A comment describing this step" } }, required: ['locatorStr', 'description'], additionalProperties: false }),`
);

// Replace click_css
file = file.replace(
  `parameters: z.object({ selector: z.string(), description: z.string() }),`,
  `parameters: jsonSchema({ type: 'object', properties: { selector: { type: 'string' }, description: { type: 'string' } }, required: ['selector', 'description'], additionalProperties: false }),`
);

// Replace click_text
file = file.replace(
  `parameters: z.object({ text: z.string(), exact: z.boolean().optional(), description: z.string() }),`,
  `parameters: jsonSchema({ type: 'object', properties: { text: { type: 'string' }, exact: { type: 'boolean' }, description: { type: 'string' } }, required: ['text', 'description'], additionalProperties: false }),`
);

// Replace click_role
file = file.replace(
  `parameters: z.object({ role: z.string(), name: z.string(), exact: z.boolean().optional(), description: z.string() }),`,
  `parameters: jsonSchema({ type: 'object', properties: { role: { type: 'string' }, name: { type: 'string' }, exact: { type: 'boolean' }, description: { type: 'string' } }, required: ['role', 'name', 'description'], additionalProperties: false }),`
);

// Replace fill_css
file = file.replace(
  `parameters: z.object({ selector: z.string(), value: z.string(), description: z.string() }),`,
  `parameters: jsonSchema({ type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' }, description: { type: 'string' } }, required: ['selector', 'value', 'description'], additionalProperties: false }),`
);

// Replace fill_placeholder
file = file.replace(
  `parameters: z.object({ placeholder: z.string(), value: z.string(), description: z.string() }),`,
  `parameters: jsonSchema({ type: 'object', properties: { placeholder: { type: 'string' }, value: { type: 'string' }, description: { type: 'string' } }, required: ['placeholder', 'value', 'description'], additionalProperties: false }),`
);

// Replace press_key
file = file.replace(
  `parameters: z.object({ key: z.string(), description: z.string() }),`,
  `parameters: jsonSchema({ type: 'object', properties: { key: { type: 'string' }, description: { type: 'string' } }, required: ['key', 'description'], additionalProperties: false }),`
);

// Replace wait_for_timeout
file = file.replace(
  `parameters: z.object({ ms: z.number() }),`,
  `parameters: jsonSchema({ type: 'object', properties: { ms: { type: 'number' } }, required: ['ms'], additionalProperties: false }),`
);

// Replace finish
file = file.replace(
  `parameters: z.object({}),`,
  `parameters: jsonSchema({ type: 'object', properties: { dummy: { type: 'string' } }, additionalProperties: false }),`
);

fs.writeFileSync('app/api/projects/[code]/cases/[caseId]/ai/explore/route.ts', file);
