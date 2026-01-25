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
const coreRouterFile = path.join(projectRoot, 'app', 'router', 'manage', 'v1.js');
const pluginRouterRoot = path.join(projectRoot, 'lib', 'plugin');
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

const literalToArray = (literal, context = {}) => {
  if (!literal) return [];
  try {
    const value = vm.runInNewContext(literal, context);
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

  // 路由形如 /manage/v1/resource/action，需要跳过版本段
  const remainder = segments.slice(manageIdx + 1);
  const remainderWithoutVersion = remainder[0] && /^v\d+$/i.test(remainder[0]) ? remainder.slice(1) : remainder;

  const resourceSegment = remainderWithoutVersion[0] || 'common';
  const tailSegments = remainderWithoutVersion.slice(1);

  const nonParamSegments = tailSegments.filter(seg => seg && !seg.startsWith(':'));

  let actionSegment = nonParamSegments.length > 0 ? nonParamSegments[nonParamSegments.length - 1] : null;
  if (!actionSegment) {
    const hasParam = tailSegments.some(seg => seg && seg.startsWith(':'));
    if (hasParam && method === 'GET') {
      actionSegment = 'detail';
    } else if (method === 'GET') {
      actionSegment = 'list';
    } else {
      actionSegment = method.toLowerCase();
    }
  }

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

/**
 * 从源码中提取路由注释
 * 支持格式：
 * // @desc 中文描述
 * router.method(path, ...)
 * @param source
 */
const extractRouteComments = source => {
  const commentMap = new Map();
  const lines = source.split('\n');

  // 提取 prefix 变量
  const prefixMatch = source.match(/const\s+prefix\s*=\s*['"`]([^'"`]+)['"`]/);
  const prefix = prefixMatch ? prefixMatch[1] : '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 匹配 @desc 注释
    const descMatch = line.match(/^\/\/\s*@desc\s+(.+)$/);
    if (descMatch && i + 1 < lines.length) {
      const desc = descMatch[1].trim();
      const nextLine = lines[i + 1];

      // 提取下一行的路由定义，支持模板字符串
      const routeMatch = nextLine.match(/router\.(get|post|put|patch|delete)\s*\(\s*[`'"]([^`'"]+)[`'"]/);
      if (routeMatch) {
        const method = routeMatch[1].toUpperCase();
        let path = routeMatch[2];

        // 替换模板字符串中的 ${prefix}
        if (path.includes('${prefix}') && prefix) {
          path = path.replace('${prefix}', prefix);
        }

        const key = `${method} ${path}`;
        commentMap.set(key, desc);
      }
    }
  }

  return commentMap;
};

const extractRoutes = (source, context = {}) => {
  const routes = [];
  let match;
  while ((match = ROUTER_CALL_RE.exec(source))) {
    const method = match[1].toUpperCase();
    const argsChunk = match[2];
    const firstArgLiteral = extractFirstArgument(argsChunk);
    const literalValues = literalToArray(firstArgLiteral, context);
    literalValues
      .filter(value => typeof value === 'string' && value.startsWith('/manage/'))
      .forEach(value => {
        routes.push({ method, path: value });
      });
  }
  return routes;
};

const collectPluginRouterFiles = rootDir => {
  const results = [];
  if (!fs.existsSync(rootDir)) {
    return results;
  }
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectPluginRouterFiles(fullPath));
      return;
    }
    if (
      entry.isFile() &&
      fullPath.includes(`${path.sep}app${path.sep}router${path.sep}manage${path.sep}v1`) &&
      fullPath.endsWith('.js')
    ) {
      results.push(fullPath);
    }
  });
  return results;
};

const parseRouterFile = filePath => {
  const routerSource = fs.readFileSync(filePath, 'utf8');
  const prefixMatch = routerSource.match(/const\s+prefix\s*=\s*['"`]([^'"`]+)['"`]/);
  const context = {};
  if (prefixMatch && prefixMatch[1]) {
    context.prefix = prefixMatch[1];
  }
  const routes = extractRoutes(routerSource, context);
  const commentMap = extractRouteComments(routerSource);
  return { routes, commentMap };
};

const main = () => {
  const routerFiles = [coreRouterFile, ...collectPluginRouterFiles(pluginRouterRoot)];
  const allRoutes = [];
  const commentMap = new Map();

  routerFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    const { routes, commentMap: fileComments } = parseRouterFile(filePath);
    allRoutes.push(...routes);
    fileComments.forEach((value, key) => {
      if (!commentMap.has(key)) {
        commentMap.set(key, value);
      }
    });
  });

  if (allRoutes.length === 0) {
    console.error('No /manage routes found in core or plugins. Abort.');
    process.exit(1);
  }

  const existing = loadExistingDefinitions(definitionsFile);
  const existingByKey = new Map(existing.map(def => [`${def.method} ${def.path}`, def]));

  // 重新构建 definitions，保证唯一性
  const codeSet = new Set();
  const aliasSet = new Set();
  const rebuilt = [];

  allRoutes.forEach(route => {
    const key = `${route.method} ${route.path}`;
    const base = createDefinition(route);
    const existing = existingByKey.get(key);

    // 优先级：注释 > 已有定义 > 自动生成
    const commentDesc = commentMap.get(key);
    if (commentDesc) {
      base.desc = commentDesc;
    } else if (existing && existing.desc && !existing.desc.startsWith('[AUTO]')) {
      base.desc = existing.desc;
    }

    if (existing && existing.meta) {
      base.meta = existing.meta;
    }

    // 保证 code / alias 唯一：若冲突则附加 method 后缀
    let finalDef = base;
    const resource = base.code.split('.')[0] || 'resource';
    const action = base.code.split('.').slice(1).join('.') || base.method.toLowerCase();
    if (codeSet.has(base.code) || (base.aliases || []).some(alias => aliasSet.has(alias))) {
      const methodSuffix = base.method.toLowerCase();
      finalDef = {
        ...base,
        code: `${resource}.${normalizeToken(`${action}-${methodSuffix}`, action)}`,
        aliases: (base.aliases || []).map(alias => `${alias}-${methodSuffix}`),
      };
    }

    codeSet.add(finalDef.code);
    (finalDef.aliases || []).forEach(alias => aliasSet.add(alias));
    rebuilt.push(finalDef);
  });

  const output = serializeDefinitions(rebuilt);
  fs.writeFileSync(definitionsFile, output);

  console.log(`✅ Permission definitions rebuilt: ${rebuilt.length} records.`);
  console.log(`   Found ${commentMap.size} route descriptions from comments.`);
  console.log(`   Updated file: ${path.relative(projectRoot, definitionsFile)}`);
};

main();
