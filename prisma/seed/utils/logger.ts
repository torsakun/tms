const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
};

export const log = {
  section(title: string) {
    console.log(`\n${c.bold}${c.cyan}${title}${c.reset}`);
  },
  success(msg: string) {
    console.log(`  ✅ ${msg}`);
  },
  skip(msg: string) {
    console.log(`  ⏭️  ${msg}`);
  },
  error(msg: string, err?: unknown) {
    console.error(`  ❌ ${msg}`, err ?? '');
  },
  summary(msg: string) {
    console.log(`  ${c.dim}→ ${msg}${c.reset}`);
  },
};
