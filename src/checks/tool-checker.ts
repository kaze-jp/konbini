import { execSync } from 'child_process';

export interface ToolCheckResult {
  name: string;
  available: boolean;
  version?: string;
}

export async function checkTool(name: string): Promise<ToolCheckResult> {
  try {
    const version = execSync(`${name} --version`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    return { name, available: true, version };
  } catch {
    return { name, available: false };
  }
}

export async function checkAllTools(): Promise<ToolCheckResult[]> {
  return Promise.all([checkTool('git'), checkTool('gh')]);
}
