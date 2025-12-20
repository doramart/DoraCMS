'use strict';

/**
 * 自动补全权限 definitions 的脚本
 * - 解析 server/app/router/manage.js 中的 router.<method> 声明
 * - 生成缺失的权限定义并写回 server/app/permission/definitions/manage.js
 *
 * 使用方式：pnpm exec node scripts/generate-permissions.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const routerFile = path.join(projectRoot, 'app', 'router', 'manage.js');
const definitionsFile = path.join(projectRoot, 'app', 'permission', 'definitions', 'manage.js');

const ROUTER_CALL_RE = /router\.(get|post|put|patch|delete)\s*\(([\s\S]*?);/g;

const loadExistingDefinitions = filePath => {
  delete require.cache[require.resolve(filePath)];
  const definitions = require(filePath);
  if (!Array.isArray(definitions)) {
    throw new Error(`Permission definition file must export an array: ${filePath}`);
  }
  return definitions.map(item => ({ ...item, aliases: Array.isArray(item.aliases) ? item.aliases : [] }));
};

const extractFirstArgument = argsSource => {
  let index = 0;
  const len = argsSource.length;

  const skipWhitespace = () => {
    while (index < len && /\s/.test(argsSource[index])) {
      index++;
    }
  };

  skipWhitespace();
  if (index >= len) return null;

  const start = index;
  const firstChar = argsSource[index];

  const readString = quote => {
    index++;
    while (index < len) {
      const ch = argsSource[index];
      if (ch === '\\') {
        index += 2;
        continue;
      }
      if (ch === quote) {
        return argsSource.slice(start, index + 1);
      }
      index++;
    }
    return null;
  };

  const readArray = () => {
    let depth = 0;
    let inString = false;
    let stringQuote = null;
    while (index < len) {
      const ch = argsSource[index];
      if (inString) {
        if (ch === '\\') {
          index += 2;
          continue;
        }
        if (ch === stringQuote) {
          inString = false;
        }
        index++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = true;
        stringQuote = ch;
        index++;
        continue;
      }
      if (ch === '[') {
        depth++;
      } else if (ch === ']') {
        depth--;
        if (depth === 0) {
          return argsSource.slice(start, index + 1);
        }
      }
      index++;
    }
    return null;
  };

  const readUntilComma = () => {
    let depth = 0;
    while (index < len) {
      const ch = argsSource[index];
      if (ch === '(') depth++;
      if (ch === ')') {
        if (depth === 0) {
          return argsSource.slice(start, index).trim();
        }
        depth--;
      }
      if (ch === ',' && depth === 0) {
        return argsSource.slice(start, index).trim();
      }
      index++;
    }
    return argsSource.slice(start).trim();
  };

  if (firstChar === '[') {
    index++;
    return readArray();
  }
  if (firstChar === "'" || firstChar === '"' || firstChar === '`') {
    return readString(firstChar);
  }
  return readUntilComma();
};

const literalToArray = literal => {
  if (!literal) return [];
  try {
    const value = vm.runInNewContext(literal);
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  } catch (error) {
    console.warn('[permissions] Failed to evaluate literal:', literal, error.message);
    return [];
  }
};

const normalizeToken = (token, fallback) => {
  if (!token || typeof token !== 'string') {
    return fallback;
  }
  const cleaned = token
    .replace(/^:/, '')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim();
  if (!cleaned) {
    return fallback;
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    const single = parts[0];
    return single.charAt(0).toLowerCase() + single.slice(1);
  }
  return parts
    .map((part, idx) => {
      const lower = part.toLowerCase();
      if (idx === 0) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
};

const deriveCode = (method, routePath) => {
  const segments = routePath.split('/').filter(Boolean);
  const manageIdx = segments.indexOf('manage');
  const resourceSegment = segments[manageIdx + 1] || 'common';
  const actionSegment =
    segments.slice(manageIdx + 2).find(seg => seg && !seg.startsWith(':')) ||
    (method === 'GET' ? 'list' : method.toLowerCase());

  const resource = normalizeToken(resourceSegment, 'resource');
  const action = normalizeToken(actionSegment, method.toLowerCase());

  return {
    code: `${resource}.${action}`,
    group: resource,
    alias: `${resourceSegment}/${actionSegment}`.replace(/[:].*$/, ''),
  };
};

const createDefinition = ({ method, path: routePath }) => {
  const { code, group, alias } = deriveCode(method, routePath);
  return {
    code,
    method,
    path: routePath,
    desc: `[AUTO] ${method} ${routePath}`,
    group,
    aliases: alias && alias !== 'manage/' ? [alias] : [],
  };
};

const serializeDefinitions = definitions => {
  const lines = [
    "'use strict';",
    '',
    '/**',
    ' * ⚠️ 此文件由 scripts/generate-permissions.js 自动生成',
    ` * 更新时间: ${new Date().toISOString()}`,
    ' */',
    '',
    'module.exports = [',
  ];

  definitions.forEach(def => {
    lines.push('  {');
    lines.push(`    code: '${def.code}',`);
    lines.push(`    method: '${def.method}',`);
    lines.push(`    path: '${def.path}',`);
    lines.push(`    desc: '${(def.desc || '').replace(/'/g, "\\'")}',`);
    lines.push(`    group: '${def.group || 'common'}',`);
    lines.push(`    aliases: ${JSON.stringify(def.aliases || [])},`);
    if (def.meta) {
      lines.push(`    meta: ${JSON.stringify(def.meta)},`);
    }
    lines.push('  },');
  });

  lines.push('];');
  lines.push('');
  return lines.join('\n');
};

const extractRoutes = source => {
  const routes = [];
  let match;
  while ((match = ROUTER_CALL_RE.exec(source))) {
    const method = match[1].toUpperCase();
    const argsChunk = match[2];
    const firstArgLiteral = extractFirstArgument(argsChunk);
    const literalValues = literalToArray(firstArgLiteral);
    literalValues
      .filter(value => typeof value === 'string' && value.startsWith('/manage/'))
      .forEach(value => {
        routes.push({ method, path: value });
      });
  }
  return routes;
};

const main = () => {
  const routerSource = fs.readFileSync(routerFile, 'utf8');
  const routes = extractRoutes(routerSource);
  if (routes.length === 0) {
    console.error('No /manage routes found. Abort.');
    process.exit(1);
  }

  const existing = loadExistingDefinitions(definitionsFile);
  const existingKeySet = new Set(existing.map(def => `${def.method} ${def.path}`));

  const newDefinitions = [];
  routes.forEach(route => {
    const key = `${route.method} ${route.path}`;
    if (existingKeySet.has(key)) {
      return;
    }
    const definition = createDefinition(route);
    newDefinitions.push(definition);
    existingKeySet.add(key);
  });

  if (newDefinitions.length === 0) {
    console.log('✅ No new permissions to add. Definitions file stays untouched.');
    return;
  }

  const merged = existing.concat(newDefinitions);
  const output = serializeDefinitions(merged);
  fs.writeFileSync(definitionsFile, output);

  console.log(`✅ Added ${newDefinitions.length} permission definitions.`);
  console.log(`   Updated file: ${path.relative(projectRoot, definitionsFile)}`);
};

main();
