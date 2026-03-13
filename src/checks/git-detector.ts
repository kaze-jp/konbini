import { execSync } from 'child_process';

export function detectBaseBranch(): string {
  try {
    const ref = execSync('git symbolic-ref refs/remotes/origin/HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    const parts = ref.split('/');
    return parts[parts.length - 1];
  } catch {
    return 'main';
  }
}
