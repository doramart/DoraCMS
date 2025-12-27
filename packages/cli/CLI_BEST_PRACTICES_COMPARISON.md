# CLI 工具业内最佳实践对比

## 📊 主流 CLI 工具的模板存储方案

### 1. Create React App (CRA)

**方案**: 独立的模板包 + 从 npm 下载

```bash
# 使用默认模板
npx create-react-app my-app

# 使用自定义模板
npx create-react-app my-app --template typescript
npx create-react-app my-app --template cra-template-pwa
```

**实现方式**:
- 模板作为**独立的 npm 包**发布（如 `cra-template`, `cra-template-typescript`）
- CLI 工具在运行时从 npm 下载模板包
- 模板包结构：
  ```
  cra-template/
  ├── template/          # 实际的项目文件
  │   ├── public/
  │   ├── src/
  │   └── package.json
  ├── template.json      # 模板配置
  └── package.json
  ```

**优点**:
- ✅ CLI 包体积极小（< 1MB）
- ✅ 模板可以独立更新和发布
- ✅ 社区可以创建自定义模板
- ✅ 用户可以选择不同的模板

**缺点**:
- ❌ 需要网络连接
- ❌ 首次使用需要下载模板

**包大小**:
- `create-react-app`: ~70KB
- `cra-template`: ~10KB
- `cra-template-typescript`: ~15KB

---

### 2. Vite (create-vite)

**方案**: 模板打包在 CLI 包中

```bash
npm create vite@latest my-app -- --template react
npm create vite@latest my-app -- --template vue
```

**实现方式**:
- 所有模板**打包在 CLI 包内**
- 包结构：
  ```
  create-vite/
  ├── dist/              # CLI 代码
  ├── template-react/    # React 模板
  ├── template-vue/      # Vue 模板
  ├── template-vanilla/  # Vanilla 模板
  └── package.json
  ```

**优点**:
- ✅ 离线可用
- ✅ 速度快，无需下载
- ✅ 版本稳定

**缺点**:
- ❌ CLI 包体积较大
- ❌ 更新模板需要发布新版本

**包大小**:
- `create-vite`: ~150KB（包含多个轻量级模板）

---

### 3. Next.js (create-next-app)

**方案**: 混合方案 - 内置模板 + 从 GitHub 下载示例

```bash
# 使用内置模板
npx create-next-app@latest my-app

# 从 GitHub 下载示例
npx create-next-app --example with-typescript my-app
npx create-next-app --example https://github.com/vercel/next.js/tree/canary/examples/blog
```

**实现方式**:
- 基础模板**打包在 CLI 包中**
- 示例项目从 **GitHub 仓库下载**
- 使用 `download-git-repo` 或类似工具

**优点**:
- ✅ 基础功能离线可用
- ✅ 丰富的示例可选
- ✅ 灵活性高

**缺点**:
- ❌ 示例需要网络连接
- ❌ 包体积中等

**包大小**:
- `create-next-app`: ~2MB

---

### 4. Vue CLI (@vue/cli)

**方案**: 插件系统 + 从 npm 下载

```bash
vue create my-app
# 交互式选择插件和配置
```

**实现方式**:
- CLI 本身不包含模板
- 使用**插件系统**，每个功能是独立的 npm 包
- 运行时从 npm 下载所需插件
- 插件包：`@vue/cli-plugin-babel`, `@vue/cli-plugin-router` 等

**优点**:
- ✅ 高度模块化
- ✅ 插件可以独立更新
- ✅ 灵活的配置组合

**缺点**:
- ❌ 需要网络连接
- ❌ 首次创建较慢

**包大小**:
- `@vue/cli`: ~5MB（包含核心功能）

---

### 5. Svelte (degit)

**方案**: 从 GitHub 下载模板

```bash
npx degit sveltejs/template my-app
npx degit user/repo my-app
```

**实现方式**:
- 使用 `degit` 工具从 **GitHub 下载模板**
- 只下载最新提交，不包含 git 历史
- 非常轻量

**优点**:
- ✅ CLI 包极小
- ✅ 模板始终最新
- ✅ 可以使用任何 GitHub 仓库

**缺点**:
- ❌ 必须有网络连接
- ❌ 依赖 GitHub 可用性
- ❌ 速度较慢

**包大小**:
- `degit`: ~50KB

---

## 📈 方案对比总结

| 方案 | 代表工具 | CLI 包大小 | 离线可用 | 速度 | 灵活性 | 维护成本 |
|------|---------|-----------|---------|------|--------|---------|
| **独立模板包** | CRA | 极小 (~70KB) | ❌ | 中 | ⭐⭐⭐⭐⭐ | 低 |
| **打包模板** | Vite | 小 (~150KB) | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 中 |
| **混合方案** | Next.js | 中 (~2MB) | ⚠️ 部分 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 中 |
| **插件系统** | Vue CLI | 大 (~5MB) | ❌ | ⭐⭐ | ⭐⭐⭐⭐⭐ | 高 |
| **Git 下载** | degit | 极小 (~50KB) | ❌ | ⭐⭐ | ⭐⭐⭐⭐⭐ | 低 |

---

## 🎯 针对 DoraCMS CLI 的建议

### 项目特点分析

DoraCMS 的特点：
- ✅ 完整的全栈项目（server + client）
- ✅ 项目体积较大（~20-30MB 源代码）
- ✅ 多种项目类型（fullstack, backend-only, user-separated）
- ✅ 模块化系统（可选的业务模块）
- ⚠️ 不像 React/Vue 那样有大量社区模板需求

### 推荐方案排序

#### 🥇 方案 1: 打包模板（推荐）⭐⭐⭐⭐⭐

**类似**: Vite

**理由**:
1. **离线可用** - 企业内部使用场景重要
2. **速度快** - 用户体验好
3. **版本稳定** - 避免模板不兼容问题
4. **实现简单** - 维护成本低
5. **符合项目特点** - DoraCMS 不需要大量社区模板

**实施**:
```
@doracms/cli/
├── dist/
├── templates/
│   ├── server/
│   ├── client/
│   ├── scripts/
│   └── docker/
└── package.json
```

**预计包大小**: 25-35MB

**适用场景**:
- ✅ 生产环境
- ✅ 企业内部使用
- ✅ 需要稳定版本
- ✅ 离线环境

---

#### 🥈 方案 2: 独立模板包 ⭐⭐⭐⭐

**类似**: Create React App

**理由**:
1. **CLI 包小** - 只有几百 KB
2. **模板独立更新** - 不需要发布新版本 CLI
3. **灵活性高** - 可以有多个模板包

**实施**:
```bash
# 发布多个包
@doracms/cli                    # CLI 工具
@doracms/template-fullstack     # 完整全栈模板
@doracms/template-backend       # 纯后端模板
@doracms/template-user          # 用户端模板
```

**使用**:
```bash
npx @doracms/cli create my-app --template fullstack
npx @doracms/cli create my-app --template backend
```

**预计包大小**:
- CLI: ~500KB
- 每个模板: ~10-15MB

**适用场景**:
- ✅ 需要频繁更新模板
- ✅ 有多个独立维护的模板
- ✅ 网络条件良好

**缺点**:
- ❌ 需要维护多个 npm 包
- ❌ 首次使用需要下载
- ❌ 对于 DoraCMS 来说可能过度设计

---

#### 🥉 方案 3: 混合方案 ⭐⭐⭐⭐

**类似**: Next.js

**理由**:
1. **兼顾两者优势**
2. **默认离线可用**
3. **可选从 GitHub 获取最新**

**实施**:
```bash
# 使用打包的模板（默认）
doracms create my-app

# 从 GitHub 获取最新
doracms create my-app --from-git

# 从指定分支
doracms create my-app --from-git --branch develop
```

**实现**:
```typescript
if (options.fromGit) {
  // 从 GitHub 下载
  await downloadFromGit('https://github.com/doramart/doracms.git');
} else {
  // 使用打包的模板
  await copyFromTemplates();
}
```

**适用场景**:
- ✅ 需要最大灵活性
- ✅ 开发和生产环境都要支持
- ✅ 有时需要最新代码

**缺点**:
- ❌ 实现复杂度高
- ❌ 需要维护两套逻辑

---

#### 方案 4: Git 下载 ⭐⭐

**类似**: degit

**理由**:
1. **CLI 包极小**
2. **始终最新**

**实施**:
```bash
doracms create my-app
# 内部执行: git clone --depth 1 https://github.com/doramart/doracms.git
```

**适用场景**:
- ⚠️ 仅开发环境
- ⚠️ 网络条件好

**缺点**:
- ❌ 必须有网络
- ❌ 速度慢
- ❌ 不适合生产环境
- ❌ 可能获取不稳定代码

---

## 💡 最终建议

### 对于 DoraCMS CLI，强烈推荐：方案 1（打包模板）

**原因**:

1. **符合项目特点**
   - DoraCMS 是完整的 CMS 系统，不是框架
   - 不需要像 React/Vue 那样有大量社区模板
   - 用户主要需要稳定的起始模板

2. **用户体验最佳**
   - 离线可用
   - 速度快（几秒内完成）
   - 版本稳定可控

3. **维护成本低**
   - 只需维护一个 npm 包
   - 发布流程简单
   - 不需要额外的基础设施

4. **业内验证**
   - Vite 使用此方案，用户体验极佳
   - 包大小可接受（25-35MB）
   - 现代网络环境下载速度快

### 实施优先级

**第一阶段**（推荐立即实施）:
- ✅ 实施方案 1：打包模板
- ✅ 优化包大小（排除不必要文件）
- ✅ 完善测试

**第二阶段**（可选，根据用户反馈）:
- ⚠️ 如果用户强烈需要最新代码，添加 `--from-git` 选项
- ⚠️ 如果包大小成为问题，考虑独立模板包

---

## 📦 包大小优化建议

即使选择打包模板，也可以优化包大小：

### 1. 排除不必要的文件

```javascript
// build-templates.js
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
  '*.spec.js',
  '.git',
  '.github',
  'docs',
  '*.md',  // 除了 README.md
];
```

### 2. 压缩模板（可选）

```javascript
// 使用 tar.gz 压缩模板
const tar = require('tar');
await tar.create(
  { gzip: true, file: 'templates.tar.gz' },
  ['templates/']
);

// 使用时解压
await tar.extract({ file: 'templates.tar.gz' });
```

**效果**: 可以减少 50-70% 的大小

### 3. 按需下载（高级）

```bash
# 默认只包含最小模板
doracms create my-app

# 下载完整模板
doracms create my-app --full
```

---

## 🔍 参考资料

### 开源项目源码

1. **Vite**: https://github.com/vitejs/vite/tree/main/packages/create-vite
   - 查看模板如何打包

2. **Create React App**: https://github.com/facebook/create-react-app
   - 查看模板包结构

3. **Next.js**: https://github.com/vercel/next.js/tree/canary/packages/create-next-app
   - 查看混合方案实现

4. **degit**: https://github.com/Rich-Harris/degit
   - 查看 Git 下载实现

### 相关文章

- [How to create a CLI tool](https://www.twilio.com/blog/how-to-build-a-cli-with-node-js)
- [Building a CLI with Node.js](https://blog.logrocket.com/building-a-cli-with-node-js/)

---

## 📊 决策矩阵

| 考虑因素 | 打包模板 | 独立模板包 | 混合方案 | Git 下载 |
|---------|---------|-----------|---------|---------|
| 离线可用 | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ | ❌ |
| 速度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| CLI 包大小 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 维护成本 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| 灵活性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 版本稳定 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| 实现复杂度 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **总分** | **29** | **25** | **26** | **22** |

---

## ✅ 结论

**对于 DoraCMS CLI，强烈推荐使用方案 1（打包模板）**

这是业内验证的最佳实践，特别适合：
- 完整的 CMS 系统
- 企业级应用
- 需要稳定版本的场景

**下一步行动**:
1. 实施模板打包方案
2. 优化包大小
3. 完善测试
4. 发布到 npm

如果未来有特殊需求（如需要最新代码），可以考虑添加 `--from-git` 选项作为补充。
