import fs from 'fs';
import path from 'path';
import { log } from '../utils/logger.js';

export async function runConfigShow(_args: string[]) {
  const configPath = path.join(process.cwd(), '.ao', 'ao.yaml');
  if (!fs.existsSync(configPath)) {
    log.error('ao.yaml が見つかりません。npx konbini init を実行してください。');
    process.exit(1);
  }
  log.header('konbini config');
  console.log(fs.readFileSync(configPath, 'utf-8'));
}
