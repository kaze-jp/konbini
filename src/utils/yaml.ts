// ao.yaml は構造が固定なのでテンプレート置換方式で生成する。
// parseYaml はトップレベルキーの読み取り専用（schema_version等）。
// 完全なYAMLパースが必要になった場合は yaml パッケージを追加する。
// 注意: ネストされたキーは読み取れない。フルパースが必要なら要リファクタ。

export function parseNestedYamlValue(content: string, keyPath: string): string | undefined {
  const [parentKey, childKey] = keyPath.split('.');
  if (!parentKey || !childKey) return undefined;

  const lines = content.split('\n');
  let inParent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Top-level key (no indentation)
    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      const match = trimmed.match(/^(\w+):/);
      if (match) {
        inParent = match[1] === parentKey;
      }
      continue;
    }

    // Indented line — only process if inside the target parent
    if (inParent) {
      const match = trimmed.match(/^(\w+):\s*(.+)$/);
      if (match && match[1] === childKey) {
        return match[2];
      }
    }
  }

  return undefined;
}

export function parseTopLevelYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    // トップレベルのみ（インデントなし）
    if (line.startsWith(' ') || line.startsWith('\t')) continue;
    const match = trimmed.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      if (value === 'true') result[key] = true;
      else if (value === 'false') result[key] = false;
      else if (/^\d+$/.test(value)) result[key] = parseInt(value, 10);
      else result[key] = value;
    }
  }
  return result;
}
