import fs from 'fs';
import path from 'path';
import { getTemplatePath, getTargetPaths } from '../utils/paths.js';
import type { InitConfig } from './preset-resolver.js';
import { log } from '../utils/logger.js';

interface CopyOptions {
  overwrite?: boolean;
}

function copyFileIfNotExists(src: string, dest: string, overwrite: boolean): boolean {
  if (!overwrite && fs.existsSync(dest)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

function copyDir(srcDir: string, destDir: string, overwrite: boolean) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath, overwrite);
    } else {
      copyFileIfNotExists(srcPath, destPath, overwrite);
    }
  }
}

export async function copyTemplates(
  projectRoot: string,
  config: InitConfig,
  options: CopyOptions = {}
) {
  const { overwrite = true } = options;
  const paths = getTargetPaths(projectRoot);

  // Agents
  copyDir(getTemplatePath('agents'), paths.agents, overwrite);

  // Commands
  copyDir(getTemplatePath('commands'), paths.commands, overwrite);

  // Rules
  copyDir(getTemplatePath('rules'), paths.rules, overwrite);

  // Spec templates
  copyDir(getTemplatePath('spec-templates'), paths.specTemplates, overwrite);

  // Steering templates
  for (const file of ['product.md.template', 'tech.md.template', 'structure.md.template']) {
    const src = getTemplatePath(`steering/${file}`);
    const dest = path.join(paths.steering, file.replace('.template', ''));
    if (fs.existsSync(src)) {
      copyFileIfNotExists(src, dest, false); // steering は上書きしない
    }
  }

  // Memory structure
  fs.mkdirSync(paths.memoryReviewPatterns, { recursive: true });
  fs.mkdirSync(paths.memoryProjectContext, { recursive: true });
  const memoryIndex = getTemplatePath('memory/index.md.template');
  if (fs.existsSync(memoryIndex)) {
    copyFileIfNotExists(memoryIndex, path.join(paths.memory, 'index.md'), false);
  }

  // ao.yaml (テンプレートからプリセット値を適用して生成。claude_md プレースホルダは init.ts で置換)
  const aoTemplate = fs.readFileSync(getTemplatePath('config/ao.yaml.template'), 'utf-8');
  const aoContent = aoTemplate
    .replace('{{PRESET}}', config.preset)
    .replace('{{DOWNSTREAM}}', config.downstream)
    .replace('{{R8_ACTOR}}', config.R8Actor)
    .replace('{{AUTO_MERGE}}', String(config.autoMerge))
    .replace('{{BASE_BRANCH}}', config.baseBranch)
    .replace('{{GIT_STRATEGY}}', config.gitStrategy);

  const aoPath = paths.aoConfig;
  if (overwrite || !fs.existsSync(aoPath)) {
    fs.mkdirSync(path.dirname(aoPath), { recursive: true });
    fs.writeFileSync(aoPath, aoContent);
  }

  log.success('Templates generated');
}
