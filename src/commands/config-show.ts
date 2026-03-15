import fs from 'fs';
import path from 'path';
import { log } from '../utils/logger.js';

export async function runConfigShow(_args: string[]) {
  const configPath = path.join(process.cwd(), '.ao', 'ao.yaml');
  if (!fs.existsSync(configPath)) {
    log.error('ao.yaml not found. Run: npx @kaze-jp/konbini init');
    process.exit(1);
  }
  log.header('konbini config');
  console.log(fs.readFileSync(configPath, 'utf-8'));
}
