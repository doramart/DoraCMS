# CLI 发布前检查清单

## ✅ 已完成的准备工作

### 1. 安全检查
- [x] 排除了包含真实密码的 `backup-to-init-data.sh` 脚本
- [x] 验证模板中没有密码泄露
- [x] 验证模板中没有敏感的内网 IP（Docker 初始化数据保留，因为是示例数据）

### 2. 构建配置
- [x] `package.json` 配置正确
  - [x] `files` 字段包含 `dist`, `bin`, `templates`
  - [x] `scripts` 包含 `build:cli` 和 `build:templates`
  - [x] `prepublishOnly` 钩子配置正确
- [x] `.npmignore` 配置正确
  - [x] 排除源代码和测试文件
  - [x] 保留必要的文档
- [x] `build-templates.js` 脚本完善
  - [x] 排除敏感文件
  - [x] 排除开发文件
  - [x] 生成元数据

### 3. 模板构建
- [x] CLI 编译成功
- [x] 模板构建成功
- [x] 模板大小合理（24.95 MB）
- [x] 测试项目已清理

### 4. 代码质量
- [x] 路由配置优化完成
- [x] AI 助手 status 字段修复完成
- [x] logger.debug 错误修复完成

## 📋 发布前最终检查

### 1. 本地测试（必须）

```bash
cd packages/cli

# 1. 打包
npm pack

# 2. 全局安装
npm install -g doracms-cli-0.1.0.tgz

# 3. 测试创建项目
cd /tmp
doracms create test-backend --template backend-only --skip-install --skip-git
doracms create test-fullstack --template fullstack --skip-install --skip-git

# 4. 验证项目结构
ls -la test-backend/
ls -la test-fullstack/

# 5. 检查路由配置
cat test-backend/server/app/router.js
cat test-fullstack/server/app/router.js

# 6. 清理
npm uninstall -g doracms-cli
rm -rf test-*
rm doracms-cli-0.1.0.tgz
```

### 2. 安全检查（必须）

```bash
# 检查打包内容
npm pack --dry-run | grep -E "(\.env|password|secret)"

# 应该只看到 .env.example 和 .env.development，不应该有 .env 或 .env.production
```

### 3. 版本检查

```bash
# 确认版本号
cat package.json | grep version

# 当前版本: 0.1.0
```

## 🚀 发布步骤

### 1. 确认 npm 登录

```bash
npm whoami
# 如果未登录: npm login
```

### 2. 发布到 npm

```bash
cd packages/cli

# 发布（首次发布使用 --access public）
npm publish --access public
```

### 3. 验证发布

```bash
# 等待几分钟后
npm view doracms-cli

# 全局安装测试
npm install -g doracms-cli
doracms --version
doracms --help
```

### 4. 创建 Git 标签

```bash
cd ../../  # 回到项目根目录
git tag -a cli-v0.1.0 -m "CLI 工具首次发布"
git push origin cli-v0.1.0
```

## 📝 发布后任务

### 1. 更新文档

- [ ] 在主 README.md 中添加 CLI 安装说明
- [ ] 更新 CHANGELOG.md

### 2. 通知用户

- [ ] 在 GitHub 创建 Release
- [ ] 在社区发布公告

## ⚠️ 注意事项

1. **首次发布后无法撤销**
   - npm 包发布后 24 小时内可以 unpublish
   - 24 小时后只能发布新版本

2. **版本号规则**
   - 遵循语义化版本 (Semver)
   - 0.1.0 表示初始版本
   - 下次更新: 0.1.1 (bug 修复) 或 0.2.0 (新功能)

3. **安全提醒**
   - 发布前务必检查没有敏感信息
   - 发布后立即验证包内容

## 🎯 当前状态

**准备就绪！** 所有检查项已完成，可以进行本地测试和发布。

建议先执行"本地测试"部分，确认一切正常后再发布到 npm。
