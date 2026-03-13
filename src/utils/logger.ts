export const log = {
  info: (msg: string) => console.log(`  ${msg}`),
  success: (msg: string) => console.log(`  ✓ ${msg}`),
  warn: (msg: string) => console.log(`  ⚠ ${msg}`),
  error: (msg: string) => console.error(`  ✗ ${msg}`),
  header: (msg: string) => console.log(`\n  ${msg}\n${'  ' + '─'.repeat(40)}`),
};
