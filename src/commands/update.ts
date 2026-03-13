import fs from 'fs';
import path from 'path';
import { getTemplatePath, getTargetPaths } from '../utils/paths.js';
import { parseTopLevelYaml } from '../utils/yaml.js';
import { log } from '../utils/logger.js';

function hasCustomizations(srcDir: string, destDir: string): string[] {
  const modified: string[] = [];
  if (!fs.existsSync(srcDir) || !fs.existsSync(destDir)) return modified;
  for (const file of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    if (fs.statSync(srcPath).isFile() && fs.existsSync(destPath)) {
      const srcContent = fs.readFileSync(srcPath, 'utf-8');
      const destContent = fs.readFileSync(destPath, 'utf-8');
      if (srcContent !== destContent) modified.push(file);
    }
  }
  return modified;
}

function copyDir(srcDir: string, destDir: string) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export async function updateProject(projectRoot: string) {
  log.header('konbini update');

  const paths = getTargetPaths(projectRoot);

  // schema_version チェック
  const aoConfigPath = paths.aoConfig;
  if (fs.existsSync(aoConfigPath)) {
    const content = fs.readFileSync(aoConfigPath, 'utf-8');
    const config = parseTopLevelYaml(content);
    if (config.schema_version && (config.schema_version as number) < 1) {
      log.warn('ao.yaml の schema_version が古いです。マイグレーションが必要かもしれません。');
    }
  }

  // カスタマイズ検出（agents）
  const customized = hasCustomizations(getTemplatePath('agents'), paths.agents);
  if (customized.length > 0) {
    log.warn(`以下のファイルがカスタマイズされています: ${customized.join(', ')}`);
    log.info('上書きすると変更が失われます。バックアップを推奨します。');
  }

  // テンプレートファイルのみ上書き
  copyDir(getTemplatePath('agents'), paths.agents);
  log.success('agents updated');

  copyDir(getTemplatePath('commands'), paths.commands);
  log.success('commands updated');

  copyDir(getTemplatePath('rules'), paths.rules);
  log.success('rules updated');

  copyDir(getTemplatePath('spec-templates'), paths.specTemplates);
  log.success('spec templates updated');

  log.info('ao.yaml, memory, steering は保持しました');
  log.success('update complete');
}

export async function runUpdate(_args: string[]) {
  await updateProject(process.cwd());
}
