# 模板文件排除规则

本文档说明在构建 CLI 模板时哪些文件会被排除，以及为什么要排除它们。

## 📋 排除的文件类型

### 1. 依赖和构建产物 ❌

**排除**:
- `node_modules/` - npm 依赖包
- `dist/` - 构建输出
- `build/` - 构建输出
- `.nuxt/` - Nuxt 构建缓存
- `.next/` - Next.js 构建缓存
- `coverage/` - 测试覆盖率报告
- `.nyc_output/` - 测试覆盖率数据

**原因**: 
- 这些文件会在用户安装依赖时重新生成
- 占用大量空间（node_modules 可能有几百 MB）
- 不同环境可能需要不同的构建产物

**节省空间**: ~200-500MB

---

### 2. 日志和运行时文件 ❌

**排除**:
- `logs/` - 应用日志目录
- `run/` - 运行时配置和状态
- `*.log` - 所有日志文件
- `*.log.*` - 日志归档文件

**原因**:
- 这些是开发过程中产生的临时文件
- 包含本地环境的特定信息
- 用户会生成自己的日志

**节省空间**: ~10-50MB

---

### 3. 版本控制 ❌

**排除**:
- `.git/` - Git 仓库
- `.github/` - GitHub 配置
- `.gitlab/` - GitLab 配置
- `.svn/` - SVN 仓库
- `.hg/` - Mercurial 仓库

**原因**:
- 用户会初始化自己的 Git 仓库
- Git 历史记录占用大量空间
- 不需要保留开发历史

**节省空间**: ~50-200MB

---

### 4. IDE 和编辑器配置 ❌

**排除**:
- `.vscode/` - VS Code 配置
- `.idea/` - IntelliJ IDEA 配置
- `.DS_Store` - macOS 文件系统元数据
- `*.swp`, `*.swo` - Vim 临时文件
- `*~` - 编辑器备份文件
- `.history/` - 本地历史记录
- `.cursor/` - Cursor 编辑器配置
- `.claude/` - Claude 配置

**原因**:
- 这些是个人开发环境的配置
- 不同开发者使用不同的工具
- 可能包含本地路径等敏感信息

**节省空间**: ~1-10MB

---

### 5. 测试文件 ❌

**排除**:
- `test/` - 测试目录
- `__tests__/` - Jest 测试目录
- `*.test.js`, `*.test.ts` - 测试文件
- `*.spec.js`, `*.spec.ts` - 规范测试文件
- `jest.config.js` - Jest 配置
- `vitest.config.js` - Vitest 配置

**原因**:
- 测试文件主要用于开发和 CI/CD
- 用户可以根据需要添加自己的测试
- 减少模板复杂度

**节省空间**: ~5-20MB

**注意**: 如果你的项目需要包含测试示例，可以在 `build-templates.js` 中移除这些排除规则。

---

### 6. 文档文件 ⚠️ 部分排除

**排除**:
- `docs/` - 文档目录
- 大部分 `*.md` 文件

**保留**:
- ✅ `README.md` - 项目说明
- ✅ `README.en.md` - 英文说明
- ✅ `LICENSE` - 许可证
- ✅ `CHANGELOG.md` - 更新日志

**原因**:
- 开发文档对用户项目不必要
- 保留核心文档以便用户了解项目

**节省空间**: ~5-10MB

---

### 7. 环境配置 ⚠️ 部分排除（安全关键）

**排除**:
- `.env` - 本地环境变量（可能包含敏感信息）
- `.env.local` - 本地环境变量
- `.env.*.local` - 本地环境变量
- **`.env.production`** - ⚠️ **生产环境配置（包含真实密码）**
- **`.env.prod`** - ⚠️ **生产环境配置（包含真实密码）**

**保留**:
- ✅ `.env.example` - 环境变量示例
- ✅ `env.example` - 环境变量示例
- ✅ `.env.development` - 开发环境配置（仅作参考）
- ✅ `.env.test` - 测试环境配置
- ✅ `docker.env.example` - Docker 环境变量示例
- ✅ `docker.env.mariadb.example` - MariaDB 环境变量示例

**原因**:
- 本地环境变量可能包含密钥等敏感信息
- **生产环境配置包含真实的数据库密码、API 密钥等**
- 保留示例文件供用户参考

**⚠️ 安全警告**:
- `.env.production` 文件包含真实的生产环境密码
- 如果被复制到模板中，会导致严重的安全问题
- 已在构建脚本中强制排除

**节省空间**: ~1KB

---

### 8. 临时文件 ❌

**排除**:
- `tmp/` - 临时目录
- `temp/` - 临时目录
- `.cache/` - 缓存目录
- `.temp/` - 临时目录

**原因**:
- 这些是临时文件，不应该被提交
- 用户会生成自己的临时文件

**节省空间**: ~1-50MB

---

### 9. 其他 ❌

**排除**:
- `.husky/` - Git hooks 配置
- `.kiro/` - Kiro 配置
- `package-lock.json` - npm 锁文件（保留 pnpm-lock.yaml）

**原因**:
- 这些是开发工具的配置
- 用户会根据需要配置自己的工具

**节省空间**: ~1-5MB

---

### 10. CLI 生成的配置文件 ❌

**排除**:
- `modules.config.js` - 模块配置文件

**原因**:
- 这个文件总是由 CLI 根据用户选择的模块动态生成
- 模板中的默认配置会被 CLI 生成的配置覆盖
- 排除可以避免混淆，明确配置来源

**执行流程**:
```
用户运行: doracms create my-project
  ↓
用户选择模块: content, webhook
  ↓
CLI 生成 modules.config.js（只启用选择的模块）
  ↓
生成的配置反映用户选择
```

**节省空间**: ~3KB

**相关文档**: 参见 `MODULES_CONFIG_HANDLING.md` 了解详细说明

---

## 📊 预期效果

### 原始项目大小
- Server: ~150-200MB（包含 node_modules）
- Client: ~200-300MB（包含 node_modules）
- 其他: ~50-100MB
- **总计**: ~400-600MB

### 优化后模板大小
- Server: ~15-20MB
- Client: ~10-15MB
- 其他: ~1-2MB
- **总计**: ~25-35MB

### 压缩比
- **减少**: ~90-95%
- **从**: ~400-600MB
- **到**: ~25-35MB

---

## 🔧 自定义排除规则

如果你需要修改排除规则，编辑 `packages/cli/scripts/build-templates.js` 文件中的 `EXCLUDE_PATTERNS` 对象。

### 添加排除规则

```javascript
const EXCLUDE_PATTERNS = {
  // ... 现有规则
  
  // 添加新的排除类别
  myCustom: [
    'my-folder',
    '*.custom',
  ],
};
```

### 保留特定文件

```javascript
// 在 KEEP_DOCS 数组中添加
const KEEP_DOCS = [
  'README.md',
  'MY_IMPORTANT_DOC.md',  // 添加这个
];

// 或在 KEEP_ENV_EXAMPLES 数组中添加
const KEEP_ENV_EXAMPLES = [
  '.env.example',
  '.my-custom.env',  // 添加这个
];
```

---

## ✅ 验证排除规则

构建模板后，检查输出：

```bash
cd packages/cli
npm run build:templates

# 查看构建统计
# 输出会显示：
# - 复制的文件数
# - 跳过的文件数
# - 总大小
```

### 检查模板内容

```bash
# 查看模板目录
ls -la packages/cli/templates/

# 检查是否有不应该存在的文件
find packages/cli/templates/ -name "node_modules" -o -name ".git" -o -name "*.log"

# 检查模板大小
du -sh packages/cli/templates/
```

---

## 🚨 注意事项

### 1. 不要排除必需的文件

确保不要排除以下文件：
- ✅ 源代码文件（`.js`, `.ts`, `.vue` 等）
- ✅ 配置文件（`package.json`, `tsconfig.json` 等）
- ✅ 静态资源（图片、字体等）
- ✅ 环境配置示例（`.env.example` 等）

### 2. 测试生成的项目

构建模板后，测试生成的项目是否能正常工作：

```bash
# 使用本地 CLI 创建测试项目
node packages/cli/bin/doracms.js create test-project --skip-install --skip-git

# 检查项目结构
cd test-project
ls -la

# 安装依赖并启动
pnpm install
pnpm run dev:server
```

### 3. 定期审查排除规则

随着项目发展，可能需要调整排除规则：
- 新增的文件类型
- 新的构建工具
- 新的开发工具配置

---

## 📝 更新日志

### v0.1.0 (2024-12-27)
- 初始版本
- 定义了 9 大类排除规则
- 预期减少 90-95% 的模板大小

---

## 🔗 相关文档

- [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md) - 发布指南
- [CLI_BEST_PRACTICES_COMPARISON.md](./CLI_BEST_PRACTICES_COMPARISON.md) - 最佳实践对比
- [build-templates.js](./scripts/build-templates.js) - 构建脚本

---

**需要帮助？** 查看 [GitHub Issues](https://github.com/doramart/doracms/issues) 或联系开发团队。
