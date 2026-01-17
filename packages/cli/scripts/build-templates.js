#!/usr/bin/env node

/**
 * 模板构建脚本
 * 严格控制打包文件，排除不必要的内容以减小包体积
 */

const fs = require('fs-extra');
const path = require('path');

// 简单的颜色输出函数（不依赖 chalk）
const chalk = {
  cyan: text => `\x1b[36m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  red: text => `\x1b[31m${text}\x1b[0m`,
  blue: text => `\x1b[34m${text}\x1b[0m`,
  gray: text => `\x1b[90m${text}\x1b[0m`,
  white: text => `\x1b[37m${text}\x1b[0m`,
};

// 添加 bold 方法
chalk.cyan.bold = text => `\x1b[1m\x1b[36m${text}\x1b[0m`;
chalk.green.bold = text => `\x1b[1m\x1b[32m${text}\x1b[0m`;

// 配置
const rootDir = path.resolve(__dirname, '../../..');
const templatesDir = path.resolve(__dirname, '../templates');

/**
 * 针对模板的定制化覆盖
 */
async function applyTemplateOverrides() {
  // 模板默认开启 modulePrune（源码默认关闭，防止影响本地开发）
  const tplConfigPath = path.join(templatesDir, 'server/config/config.default.js');
  if (await fs.pathExists(tplConfigPath)) {
    const content = await fs.readFile(tplConfigPath, 'utf8');
    if (content.includes("MODULE_PRUNE_ENABLED', false")) {
      const replaced = content.replace("MODULE_PRUNE_ENABLED', false", "MODULE_PRUNE_ENABLED', true");
      await fs.writeFile(tplConfigPath, replaced, 'utf8');
      console.log(chalk.green('  ✓ 模板开关调整：modulePrune 默认开启'));
    }
  }
}

// 严格的排除规则
const EXCLUDE_PATTERNS = {
  // 依赖和构建产物
  directories: ['node_modules', 'dist', 'build', '.nuxt', '.next', 'coverage', '.nyc_output'],

  // 日志和运行时文件（注意：不要排除 *_logger.js 中间件文件）
  runtime: ['logs', 'run'],
  
  // 日志文件（单独处理，避免误匹配中间件文件）
  logFiles: [],  // 将在 shouldExclude 中特殊处理

  // 版本控制
  vcs: ['.git', '.github', '.gitlab', '.svn', '.hg'],

  // IDE 和编辑器
  ide: ['.vscode', '.idea', '.DS_Store', '*.swp', '*.swo', '*~', '.history', '.cursor', '.claude'],

  // 测试文件
  test: ['test', '__tests__', '*.test.js', '*.test.ts', '*.spec.js', '*.spec.ts', 'jest.config.js', 'vitest.config.js'],

  // 文档（保留必要的 README）
  docs: [
    'docs',
    '*.md', // 会在后面单独处理保留的文档
  ],

  // 环境和配置（保留示例文件）
  env: [
    '.env',
    '.env.local',
    '.env.*.local',
    '.env.production', // 排除生产环境配置
    '.env.prod', // 排除生产环境配置
  ],

  // 临时文件
  temp: ['tmp', 'temp', '.cache', '.temp'],

  // 其他
  misc: [
    '.husky',
    '.kiro',
    'package-lock.json', // 保留 pnpm-lock.yaml
  ],

  // CLI 生成的配置文件（会被 CLI 重新生成，不需要在模板中）
  generated: [
    'modules.config.js', // 总是由 CLI 根据用户选择的模块动态生成
  ],

  // 包含敏感信息的脚本（用户需要自行配置）
  sensitive: [
    'backup-to-init-data.sh', // 包含真实的数据库密码，不应该被打包
  ],
};

// 需要保留的文档
const KEEP_DOCS = ['README.md', 'README.en.md', 'LICENSE', 'CHANGELOG.md'];

// 需要保留的配置文件示例
const KEEP_ENV_EXAMPLES = [
  '.env.example',
  'env.example',
  '.env.development', // 开发环境配置可以保留（作为参考）
  '.env.test', // 测试环境配置可以保留
  'docker.env.example',
  'docker.env.mariadb.example',
];

/**
 * 检查路径是否应该被排除
 */
function shouldExclude(relativePath, basePath) {
  const fileName = path.basename(relativePath);
  const fullPath = path.join(basePath, relativePath);

  // 检查是否是需要保留的文档
  if (KEEP_DOCS.includes(fileName)) {
    return false;
  }

  // 检查是否是需要保留的环境配置示例
  if (KEEP_ENV_EXAMPLES.some(pattern => fileName === pattern || fileName.includes(pattern))) {
    return false;
  }

  // 特殊处理：排除 .log 文件，但保留 *_logger.js 中间件文件
  if (/\.log(\.\d+)?$/.test(fileName)) {
    return true;
  }

  // 检查所有排除规则
  for (const category in EXCLUDE_PATTERNS) {
    const patterns = EXCLUDE_PATTERNS[category];
    for (const pattern of patterns) {
      // 精确匹配目录名
      if (relativePath.split(path.sep).includes(pattern)) {
        return true;
      }

      // 通配符匹配
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(fileName)) {
          return true;
        }
      }

      // 精确匹配文件名
      if (fileName === pattern) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 复制目录并应用过滤规则
 */
async function copyWithFilter(source, dest, label) {
  console.log(chalk.blue(`📦 复制 ${label}...`));

  let copiedFiles = 0;
  let skippedFiles = 0;
  let totalSize = 0;

  await fs.copy(source, dest, {
    filter: src => {
      const relativePath = path.relative(source, src);

      // 根目录始终允许
      if (relativePath === '') {
        return true;
      }

      const shouldSkip = shouldExclude(relativePath, source);

      if (shouldSkip) {
        skippedFiles++;
        return false;
      }

      // 统计文件
      try {
        const stats = fs.statSync(src);
        if (stats.isFile()) {
          copiedFiles++;
          totalSize += stats.size;
        }
      } catch (e) {
        // 忽略错误
      }

      return true;
    },
  });

  console.log(chalk.green(`  ✓ 复制了 ${copiedFiles} 个文件`));
  console.log(chalk.gray(`  ✓ 跳过了 ${skippedFiles} 个文件/目录`));
  console.log(chalk.gray(`  ✓ 总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`));

  return { copiedFiles, skippedFiles, totalSize };
}

/**
 * 主构建函数
 */
async function buildTemplates() {
  console.log(chalk.cyan.bold('\n🚀 开始构建模板...\n'));

  const startTime = Date.now();
  let totalStats = {
    copiedFiles: 0,
    skippedFiles: 0,
    totalSize: 0,
  };

  try {
    // 1. 清理旧的模板
    console.log(chalk.yellow('🧹 清理旧模板...'));
    await fs.remove(templatesDir);
    await fs.ensureDir(templatesDir);
    console.log(chalk.green('  ✓ 清理完成\n'));

    // 2. 复制 server
    const serverStats = await copyWithFilter(path.join(rootDir, 'server'), path.join(templatesDir, 'server'), 'server');
    totalStats.copiedFiles += serverStats.copiedFiles;
    totalStats.skippedFiles += serverStats.skippedFiles;
    totalStats.totalSize += serverStats.totalSize;
    console.log();

    // 3. 复制 client
    const clientStats = await copyWithFilter(path.join(rootDir, 'client'), path.join(templatesDir, 'client'), 'client');
    totalStats.copiedFiles += clientStats.copiedFiles;
    totalStats.skippedFiles += clientStats.skippedFiles;
    totalStats.totalSize += clientStats.totalSize;
    console.log();

    // 4. 复制配置文件
    console.log(chalk.blue('📦 复制配置文件...'));
    const configFiles = [
      '.gitignore',
      '.prettierrc',
      '.prettierignore',
      '.npmrc',
      'pnpm-workspace.yaml',
      'tsconfig.base.json',
      'README.md',
      'README.en.md',
      'LICENSE',
    ];

    let configCount = 0;
    for (const file of configFiles) {
      const source = path.join(rootDir, file);
      if (await fs.pathExists(source)) {
        await fs.copy(source, path.join(templatesDir, file));
        configCount++;
        const stats = await fs.stat(source);
        totalStats.totalSize += stats.size;
      }
    }
    console.log(chalk.green(`  ✓ 复制了 ${configCount} 个配置文件\n`));

    // 5. 复制 scripts 目录（排除 node_modules）
    const scriptsSource = path.join(rootDir, 'scripts');
    if (await fs.pathExists(scriptsSource)) {
      const scriptsStats = await copyWithFilter(scriptsSource, path.join(templatesDir, 'scripts'), 'scripts');
      totalStats.copiedFiles += scriptsStats.copiedFiles;
      totalStats.skippedFiles += scriptsStats.skippedFiles;
      totalStats.totalSize += scriptsStats.totalSize;
      console.log();
    }

    // 6. 复制 docker 目录
    const dockerSource = path.join(rootDir, 'docker');
    if (await fs.pathExists(dockerSource)) {
      const dockerStats = await copyWithFilter(dockerSource, path.join(templatesDir, 'docker'), 'docker');
      totalStats.copiedFiles += dockerStats.copiedFiles;
      totalStats.skippedFiles += dockerStats.skippedFiles;
      totalStats.totalSize += dockerStats.totalSize;
      console.log();
    }

    // 7. 复制 Docker 相关文件
    console.log(chalk.blue('📦 复制 Docker 文件...'));
    const dockerFiles = [
      'Dockerfile',
      'docker-compose.yml',
      'docker-quickstart.sh',
      '.dockerignore',
      'docker.env.example',
      'docker.env.mariadb.example',
    ];

    let dockerFileCount = 0;
    for (const file of dockerFiles) {
      const source = path.join(rootDir, file);
      if (await fs.pathExists(source)) {
        await fs.copy(source, path.join(templatesDir, file));
        dockerFileCount++;
        const stats = await fs.stat(source);
        totalStats.totalSize += stats.size;
      }
    }
    console.log(chalk.green(`  ✓ 复制了 ${dockerFileCount} 个 Docker 文件\n`));

    // 8. 模板定制化覆盖（必须在文件复制完成后）
    await applyTemplateOverrides();

    // 9. 生成模板元数据
    console.log(chalk.blue('📝 生成模板元数据...'));
    const metadata = {
      version: require('../package.json').version,
      buildTime: new Date().toISOString(),
      stats: {
        totalFiles: totalStats.copiedFiles,
        totalSize: totalStats.totalSize,
        totalSizeMB: (totalStats.totalSize / 1024 / 1024).toFixed(2),
      },
    };

    await fs.writeJSON(path.join(templatesDir, '.template-metadata.json'), metadata, { spaces: 2 });
    console.log(chalk.green('  ✓ 元数据生成完成\n'));

    // 9. 显示总结
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(chalk.cyan.bold('📊 构建总结:\n'));
    console.log(chalk.white(`  总文件数: ${chalk.green(totalStats.copiedFiles)}`));
    console.log(chalk.white(`  跳过文件: ${chalk.yellow(totalStats.skippedFiles)}`));
    console.log(chalk.white(`  总大小: ${chalk.green((totalStats.totalSize / 1024 / 1024).toFixed(2))} MB`));
    console.log(chalk.white(`  耗时: ${chalk.green(duration)} 秒`));
    console.log(chalk.white(`  输出目录: ${chalk.gray(templatesDir)}\n`));

    // 10. 大小警告
    const sizeMB = totalStats.totalSize / 1024 / 1024;
    if (sizeMB > 50) {
      console.log(chalk.yellow('⚠️  警告: 模板大小超过 50MB，建议进一步优化\n'));
    } else if (sizeMB > 30) {
      console.log(chalk.yellow('⚠️  提示: 模板大小较大，考虑是否可以进一步优化\n'));
    }

    console.log(chalk.green.bold('✅ 模板构建完成！\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ 构建失败:'), error);
    process.exit(1);
  }
}

// 执行构建
buildTemplates().catch(console.error);
