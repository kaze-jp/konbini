import fs from 'fs';
import path from 'path';

const GITIGNORE_ENTRIES = ['.claude/worktrees/'];

export function ensureGitignoreEntries(projectRoot: string): void {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  let content = '';

  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }

  const lines = content.split('\n');
  const missing = GITIGNORE_ENTRIES.filter(
    (entry) => !lines.some((line) => line.trim() === entry)
  );

  if (missing.length === 0) return;

  const additions = missing.join('\n');
  const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  const section = `${separator}\n# konbini worktrees\n${additions}\n`;

  fs.writeFileSync(gitignorePath, content + section);
}
