# CLI 工具发布指南

## 📦 当前实现分析

### 代码复制机制

CLI 工具目前使用**本地文件复制**的方式创建项目：

```typescript
// packages/cli/src/generators/project-generator.ts
const sourceRoot = path.resolve(__dirname, '../../../..');
const serverSource = path.join(sourceRoot, 'server');
const clientSource = path.join(sourceRoot, 'client');

await fs.copy(serverSource, serverDest);
await fs.copy(clientSource, clientDest);
```

**这意味着**：
- ✅ CLI 工具从**当前 monorepo** 的 `server/` 和 `client/` 目录复制代码
- ❌ 发布到 npm 后，这些目录**不会包含在 npm 包中**
- ❌ 用户安装后无法正常使用

## 🎯 发布方案对比

### 方案 1: 打包模板到 CLI 包中 ⭐ 推荐

**实现方式**：
1. 在发布前将 `server/` 和 `client/` 打包到 CLI 包中
2. 修改代码从 CLI 包内部复制模板

**优点**：
- ✅ 离线可用，不依赖网络
- ✅ 速度快，直接复制本地文件
- ✅ 版本稳定，用户获得的是固定版本的模板
- ✅ 符合 npm 包的标准做法

**缺点**：
- ❌ CLI 包体积较大（预计 20-50MB）
- ❌ 更新模板需要发布新版本的 CLI

**适用场景**：
- 生产环境发布
- 企业内部使用
- 需要稳定版本的场景

---

### 方案 2: 从 GitHub 拉取代码

**实现方式**：
```typescript
// 从 GitHub 克隆仓库
const REPO_URL = 'https://github.com/doramart/doracms.git';
await execaCommand(`git clone --depth 1 --branch main ${REPO_URL} temp`);
// 复制需要的文件
await fs.copy('temp/server', projectPath + '/server');
await fs.copy('temp/client', projectPath + '/client');
// 清理临时文件
await fs.remove('temp');
```

**优点**：
- ✅ CLI 包体积小（< 1MB）
- ✅ 始终获取最新代码
- ✅ 可以指定分支或标签

**缺点**：
- ❌ 需要网络连接
- ❌ 速度慢（需要下载整个仓库）
- ❌ 依赖 GitHub 可用性
- ❌ 可能获取到不稳定的代码

**适用场景**：
- 开发环境
- 需要最新代码的场景
- 网络条件良好的环境

---

### 方案 3: 混合方案（最佳实践）

**实现方式**：
- 默认使用打包的模板（方案 1）
- 提供 `--from-git` 选项从 GitHub 拉取（方案 2）

```bash
# 使用打包的模板（默认）
doracms create my-project

# 从 GitHub 拉取最新代码
doracms create my-project --from-git

# 从指定分支拉取
doracms create my-project --from-git --branch develop
```

**优点**：
- ✅ 兼顾稳定性和灵活性
- ✅ 满足不同场景需求
- ✅ 用户可以选择

**缺点**：
- ❌ 实现复杂度较高
- ❌ 需要维护两套逻辑

---

## 🚀 推荐实施方案：方案 1（打包模板）

### 实施步骤

#### 1. 修改 package.json 配置

```json
{
  "name": "doracms-cli",
  "version": "0.1.0",
  "files": [
    "dist",
    "bin",
    "templates",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "npm run build:cli && npm run build:templates",
    "build:cli": "tsup src/index.ts --format cjs,esm --dts",
    "build:templates": "node scripts/build-templates.js",
    "prepublishOnly": "npm run build"
  }
}
```

#### 2. 创建模板构建脚本

创建 `packages/cli/scripts/build-templates.js`：

```javascript
#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function buildTemplates() {
  console.log('📦 开始构建模板...');

  const rootDir = path.resolve(__dirname, '../../..');
  const templatesDir = path.resolve(__dirname, '../templates');

  // 清理旧的模板
  await fs.remove(templatesDir);
  await fs.ensureDir(templatesDir);

  // 复制 server
  console.log('复制 server...');
  await fs.copy(
    path.join(rootDir, 'server'),
    path.join(templatesDir, 'server'),
    {
      filter: (src) => {
        const relativePath = path.relative(path.join(rootDir, 'server'), src);
        const excludes = ['node_modules', 'logs', 'run', 'coverage', '.nyc_output', 'dist'];
        return !excludes.some(exclude => relativePath.startsWith(exclude));
      }
    }
  );

  // 复制 client
  console.log('复制 client...');
  await fs.copy(
    path.join(rootDir, 'client'),
    path.join(templatesDir, 'client'),
    {
      filter: (src) => {
        const relativePath = path.relative(path.join(rootDir, 'client'), src);
        const excludes = ['node_modules', 'dist', '.nuxt', 'coverage'];
        return !excludes.some(exclude => relativePath.startsWith(exclude));
      }
    }
  );

  // 复制配置文件
  console.log('复制配置文件...');
  const configFiles = [
    '.gitignore',
    '.prettierrc',
    '.prettierignore',
    'pnpm-workspace.yaml',
    'tsconfig.base.json'
  ];

  for (const file of configFiles) {
    const source = path.join(rootDir, file);
    if (await fs.pathExists(source)) {
      await fs.copy(source, path.join(templatesDir, file));
    }
  }

  // 复制 scripts 目录
  if (await fs.pathExists(path.join(rootDir, 'scripts'))) {
    await fs.copy(
      path.join(rootDir, 'scripts'),
      path.join(templatesDir, 'scripts')
    );
  }

  // 复制 docker 目录
  if (await fs.pathExists(path.join(rootDir, 'docker'))) {
    await fs.copy(
      path.join(rootDir, 'docker'),
      path.join(templatesDir, 'docker')
    );
  }

  console.log('✅ 模板构建完成！');
  console.log(`📁 模板位置: ${templatesDir}`);
}

buildTemplates().catch(console.error);
```

#### 3. 修改项目生成器代码

修改 `packages/cli/src/generators/project-generator.ts`：

```typescript
/**
 * 复制后端代码
 */
async function copyServerCode(projectPath: string): Promise<void> {
  // 修改前：从 monorepo 根目录复制
  // const sourceRoot = path.resolve(__dirname, '../../../..');
  
  // 修改后：从 CLI 包的 templates 目录复制
  const templatesRoot = path.resolve(__dirname, '../../templates');
  const serverSource = path.join(templatesRoot, 'server');
  const serverDest = path.join(projectPath, 'server');

  await fs.copy(serverSource, serverDest, {
    filter: src => {
      const relativePath = path.relative(serverSource, src);
      const excludes = ['node_modules', 'logs', 'run', 'coverage', '.nyc_output', 'dist'];
      return !excludes.some(exclude => relativePath.startsWith(exclude));
    },
  });
}

/**
 * 复制前端代码
 */
async function copyClientCode(projectPath: string, projectType: string): Promise<void> {
  // 修改前：从 monorepo 根目录复制
  // const sourceRoot = path.resolve(__dirname, '../../../..');
  
  // 修改后：从 CLI 包的 templates 目录复制
  const templatesRoot = path.resolve(__dirname, '../../templates');
  const clientSource = path.join(templatesRoot, 'client');
  const clientDest = path.join(projectPath, 'client');

  await fs.ensureDir(clientDest);

  if (projectType === 'fullstack') {
    await fs.copy(clientSource, clientDest, {
      filter: src => {
        const relativePath = path.relative(clientSource, src);
        const excludes = ['node_modules', 'dist', '.nuxt', 'coverage'];
        return !excludes.some(exclude => relativePath.startsWith(exclude));
      },
    });
  } else if (projectType === 'user-separated') {
    const userCenterSource = path.join(clientSource, 'user-center');
    const userCenterDest = path.join(clientDest, 'user-center');
    await fs.copy(userCenterSource, userCenterDest, {
      filter: src => {
        const relativePath = path.relative(userCenterSource, src);
        const excludes = ['node_modules', 'dist', 'coverage'];
        return !excludes.some(exclude => relativePath.startsWith(exclude));
      },
    });
  }
  // ... 其他项目类型
}

/**
 * 复制配置文件
 */
async function copyConfigFiles(projectPath: string): Promise<void> {
  // 修改后：从 CLI 包的 templates 目录复制
  const templatesRoot = path.resolve(__dirname, '../../templates');

  const configFiles = [
    '.gitignore',
    '.prettierrc',
    '.prettierignore',
    'pnpm-workspace.yaml',
    'tsconfig.base.json'
  ];

  for (const file of configFiles) {
    const source = path.join(templatesRoot, file);
    const dest = path.join(projectPath, file);
    if (await fs.pathExists(source)) {
      await fs.copy(source, dest);
    }
  }

  // 复制 scripts 目录
  const scriptsSource = path.join(templatesRoot, 'scripts');
  const scriptsDest = path.join(projectPath, 'scripts');
  if (await fs.pathExists(scriptsSource)) {
    await fs.copy(scriptsSource, scriptsDest);
  }

  // 复制 docker 目录
  const dockerSource = path.join(templatesRoot, 'docker');
  const dockerDest = path.join(projectPath, 'docker');
  if (await fs.pathExists(dockerSource)) {
    await fs.copy(dockerSource, dockerDest);
  }
}
```

#### 4. 添加 .npmignore

创建 `packages/cli/.npmignore`：

```
# 源代码
src/
scripts/build-templates.js

# 测试
test/
*.test.ts
*.spec.ts
coverage/

# 开发配置
tsconfig.json
.eslintrc
.prettierrc

# 文档（保留 README.md）
docs/
*.md
!README.md
!LICENSE

# 其他
.DS_Store
*.log
```

#### 5. 发布前检查清单

```bash
# 1. 构建 CLI 和模板
cd packages/cli
pnpm run build

# 2. 检查 templates 目录
ls -la templates/
# 应该看到: server/, client/, scripts/, docker/, 配置文件等

# 3. 检查包大小
npm pack --dry-run
# 查看会包含哪些文件和总大小

# 4. 本地测试
npm pack
npm install -g doracms-cli-0.1.0.tgz
doracms create test-project

# 5. 发布到 npm
npm publish --access public
```

---

## 📊 包大小优化

### 预估大小

- **CLI 代码**: ~500KB
- **Server 模板**: ~15-20MB
- **Client 模板**: ~10-15MB
- **配置文件**: ~100KB
- **总计**: ~25-35MB

### 优化建议

1. **排除不必要的文件**
   ```javascript
   // 在 build-templates.js 中添加更多排除规则
   const excludes = [
     'node_modules',
     'logs',
     'run',
     'coverage',
     '.nyc_output',
     'dist',
     '*.log',
     '*.map',
     '.DS_Store',
     'test',
     '__tests__',
     '*.test.js',
     '*.spec.js'
   ];
   ```

2. **压缩模板文件**
   - 考虑使用 tar.gz 压缩模板
   - 在使用时解压

3. **按需下载**
   - 实现方案 3（混合方案）
   - 默认使用轻量级模板
   - 提供 `--full` 选项下载完整模板

---

## 🔄 版本管理策略

### 语义化版本

```
主版本.次版本.修订版本
例如: 1.2.3
```

- **主版本**: 不兼容的 API 变更
- **次版本**: 向下兼容的功能新增
- **修订版本**: 向下兼容的问题修正

### 发布流程

```bash
# 1. 更新版本号
npm version patch  # 修订版本 0.1.0 -> 0.1.1
npm version minor  # 次版本 0.1.0 -> 0.2.0
npm version major  # 主版本 0.1.0 -> 1.0.0

# 2. 构建
pnpm run build

# 3. 测试
pnpm test

# 4. 发布
npm publish --access public

# 5. 推送标签
git push --tags
```

---

## 🧪 发布前测试

### 本地测试流程

```bash
# 1. 打包
cd packages/cli
npm pack

# 2. 全局安装
npm install -g doracms-cli-0.1.0.tgz

# 3. 测试创建项目
cd /tmp
doracms create test-fullstack --template fullstack --skip-install --skip-git
doracms create test-backend --template backend-only --skip-install --skip-git

# 4. 验证项目结构
ls -la test-fullstack/
ls -la test-backend/

# 5. 清理
npm uninstall -g doracms-cli
rm -rf test-*
```

### 测试检查清单

- [ ] CLI 命令可用（doracms --version, --help）
- [ ] 可以创建完整全栈项目
- [ ] 可以创建纯后端项目
- [ ] 可以创建前后端分离项目
- [ ] 生成的项目结构正确
- [ ] 配置文件生成正确
- [ ] 模块配置正确
- [ ] 依赖安装正常（如果不跳过）
- [ ] 生成的项目可以正常启动

---

## 📝 发布后维护

### 更新模板

当 DoraCMS 主项目更新时：

1. 更新 CLI 的版本号
2. 重新构建模板
3. 发布新版本

```bash
# 更新流程
cd packages/cli
npm version patch
pnpm run build
npm publish
```

### 用户更新

用户可以通过以下方式更新：

```bash
# 更新到最新版本
npm update -g doracms-cli

# 或重新安装
npm install -g doracms-cli@latest
```

---

## 🎯 总结

### 推荐方案：方案 1（打包模板）

**原因**：
1. ✅ 符合 npm 包的标准做法
2. ✅ 用户体验好（离线可用、速度快）
3. ✅ 版本稳定可控
4. ✅ 实现相对简单

**需要做的工作**：
1. 创建模板构建脚本
2. 修改项目生成器代码
3. 更新 package.json 配置
4. 添加 .npmignore
5. 测试和发布

**预计工作量**：2-3 小时

### 下一步行动

1. [ ] 创建 `scripts/build-templates.js`
2. [ ] 修改 `project-generator.ts`
3. [ ] 更新 `package.json`
4. [ ] 添加 `.npmignore`
5. [ ] 本地测试
6. [ ] 发布到 npm

---

**需要帮助实施这些修改吗？** 我可以帮你创建这些文件和修改代码。
