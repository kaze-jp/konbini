import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getTemplatePath(relativePath: string): string {
  return path.resolve(__dirname, '..', '..', 'templates', relativePath);
}

export interface TargetPaths {
  root: string;
  aoConfig: string;
  agents: string;
  commands: string;
  memory: string;
  memoryReviewPatterns: string;
  memoryProjectContext: string;
  steering: string;
  rules: string;
  specTemplates: string;
}

export function getTargetPaths(projectRoot: string): TargetPaths {
  return {
    root: projectRoot,
    aoConfig: path.join(projectRoot, '.ao', 'ao.yaml'),
    agents: path.join(projectRoot, '.claude', 'agents'),
    commands: path.join(projectRoot, '.claude', 'commands', 'kiro'),
    memory: path.join(projectRoot, '.ao', 'memory'),
    memoryReviewPatterns: path.join(projectRoot, '.ao', 'memory', 'review-patterns'),
    memoryProjectContext: path.join(projectRoot, '.ao', 'memory', 'project-context'),
    steering: path.join(projectRoot, '.ao', 'steering'),
    rules: path.join(projectRoot, '.kiro', 'settings', 'rules'),
    specTemplates: path.join(projectRoot, '.kiro', 'settings', 'templates', 'specs'),
  };
}
