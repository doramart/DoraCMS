# GitHub 开源项目发布准备清单

## ✅ 必须完成（高优先级）

### 1. 添加 LICENSE 文件 ⚠️

**状态**: ❌ 缺失根目录 LICENSE 文件

**操作**:

```bash
# 创建 LICENSE 文件（建议使用 MIT License）
# 可以从其他开源项目复制模板，或使用 GitHub 的许可证选择器
```

**建议**: 使用 MIT License（与 README.md 中声明的许可证一致）

---

### 2. 清理敏感信息 ⚠️

**状态**: ⚠️ 发现敏感信息需要清理

**需要清理的文件**:

1. **scripts/backup-to-init-data.sh**

   - 包含硬编码的数据库密码和 IP 地址
   - 需要改为使用环境变量或示例值

2. **scripts/backfill-menu-permissions.js**

   - 包含硬编码的数据库连接信息
   - 需要改为使用环境变量

3. **scripts/backfill-menu-permissions-mariadb.js**

   - 包含硬编码的数据库连接信息
   - 需要改为使用环境变量

4. **docker/mariadb/init/00-readme.txt**
   - 包含示例 IP 地址（192.168.31.69）
   - 需要改为示例值

**操作**:

- 将所有硬编码的密码、密钥、IP 地址替换为环境变量或示例值
- 确保 `.env.example` 文件包含所有必要的配置项

---

### 3. 修改 package.json ⚠️

**状态**: ⚠️ `private: true` 需要改为 `false`

**文件**: `package.json`

**操作**:

```json
{
  "name": "egg-cms",
  "version": "3.0.0",
  "description": "EggJS CMS with Vue frontend",
  "private": false,  // 改为 false
  ...
}
```

---

### 4. 添加 CONTRIBUTING.md ⚠️

**状态**: ❌ 缺失

**内容建议**:

- 如何贡献代码
- 代码规范
- 提交流程
- PR 模板说明
- 测试要求

---

### 5. 添加 CODE_OF_CONDUCT.md ⚠️

**状态**: ❌ 缺失

**建议**: 使用 Contributor Covenant Code of Conduct（GitHub 标准）

---

### 6. 添加 SECURITY.md ⚠️

**状态**: ❌ 缺失

**内容建议**:

- 如何报告安全问题
- 安全策略
- 支持的版本
- 安全更新流程

---

## 📝 建议完成（中优先级）

### 7. 完善 .github 目录

**当前状态**: 只有 PR 模板

**建议添加**:

1. **ISSUE_TEMPLATE/**

   - `bug_report.md` - Bug 报告模板
   - `feature_request.md` - 功能请求模板
   - `question.md` - 问题模板

2. **workflows/**

   - CI/CD 工作流（可选）
   - 代码检查工作流（可选）

3. **FUNDING.yml**（可选）
   - 如果接受赞助

---

### 8. 检查 README.md

**当前状态**: ✅ 基本完善

**建议补充**:

- [ ] 添加项目徽章（build status, license, version 等）
- [ ] 添加截图或演示链接
- [ ] 添加快速开始示例
- [ ] 添加常见问题 FAQ
- [ ] 添加社区链接（Discord, 微信群等，如果有）

---

### 9. 添加 CHANGELOG.md

**状态**: ❌ 缺失根目录 CHANGELOG

**建议**:

- 记录版本更新历史
- 使用 Keep a Changelog 格式

---

### 10. 检查依赖许可证

**操作**:

```bash
# 检查所有依赖的许可证
pnpm licenses list
```

**注意**: 确保所有依赖的许可证与项目许可证兼容

---

### 11. 清理不必要的文件

**建议删除**:

- [ ] `ARCHITECTURE_ANALYSIS.md` - 重构过程产生的临时文档
- [ ] `ARCHITECTURE_ANALYSIS_REPORT.md` - 重构过程产生的临时文档
- [ ] `DOCKER_DEPLOYMENT_ANALYSIS.md` - 重构过程产生的临时文档
- [ ] `DOCKER_FIX_PLAN.md` - 修复计划（已完成）
- [ ] `DOCKER_FIX_SUMMARY.md` - 修复总结（已完成）
- [ ] `database/migrations/` - 如果不需要（字段会通过 Schema 自动创建）

---

### 12. 添加 .github/ISSUE_TEMPLATE

**建议创建**:

1. **bug_report.md**

```markdown
---
name: Bug Report
about: 报告一个 Bug
title: '[BUG] '
labels: bug
assignees: ''
---

**描述 Bug**
清晰简洁地描述 Bug

**复现步骤**

1. 执行 '...'
2. 点击 '...'
3. 看到错误

**预期行为**
清晰简洁地描述你期望发生什么

**环境信息**

- OS: [e.g. macOS 12.0]
- Node.js 版本: [e.g. 18.0.0]
- 数据库: [e.g. MongoDB 6.0]
- 版本: [e.g. 3.0.0]

**附加信息**
添加其他关于问题的上下文
```

2. **feature_request.md**

```markdown
---
name: Feature Request
about: 建议新功能
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**功能描述**
清晰简洁地描述你想要的功能

**使用场景**
描述这个功能的使用场景

**可能的实现**
如果有想法，描述可能的实现方式

**附加信息**
添加其他关于功能请求的上下文
```

---

## 🎨 可选优化（低优先级）

### 13. 添加项目徽章

在 README.md 顶部添加徽章：

```markdown
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange.svg)
```

---

### 14. 添加 GitHub Actions

**可选工作流**:

- 代码检查（lint）
- 自动测试
- 自动发布

---

### 15. 添加项目截图

在 README.md 中添加项目截图或演示 GIF

---

## 📋 执行顺序

### 第一阶段：必须完成（发布前）

1. ✅ 清理敏感信息
2. ✅ 修改 package.json (private: false)
3. ✅ 添加 LICENSE 文件
4. ✅ 添加 CONTRIBUTING.md
5. ✅ 添加 CODE_OF_CONDUCT.md
6. ✅ 添加 SECURITY.md

### 第二阶段：建议完成（发布时）

7. ✅ 完善 .github/ISSUE_TEMPLATE
8. ✅ 清理不必要的文件
9. ✅ 检查 README.md
10. ✅ 添加 CHANGELOG.md

### 第三阶段：可选优化（发布后）

11. ✅ 添加项目徽章
12. ✅ 添加 GitHub Actions
13. ✅ 添加项目截图

---

## 🔍 发布前最终检查

- [ ] 所有敏感信息已清理
- [ ] LICENSE 文件已添加
- [ ] package.json 中 `private: false`
- [ ] README.md 完整且准确
- [ ] .gitignore 包含所有敏感文件
- [ ] 所有文档链接有效
- [ ] 代码已通过 lint 检查
- [ ] 测试通过（如果有）
- [ ] 依赖许可证兼容
- [ ] 提交信息规范

---

## 🚀 发布步骤

1. **创建 GitHub 仓库**

   ```bash
   # 在 GitHub 上创建新仓库
   ```

2. **添加远程仓库**

   ```bash
   git remote add origin https://github.com/doramart/DoraCMS.git
   ```

3. **提交所有更改**

   ```bash
   git add .
   git commit -m "chore: prepare for open source release"
   ```

4. **推送到 GitHub**

   ```bash
   git push -u origin main
   ```

5. **创建 Release**

   - 在 GitHub 上创建第一个 Release
   - 使用语义化版本号（如 v3.0.0）
   - 添加 Release Notes

6. **添加 Topics**
   - 在 GitHub 仓库设置中添加相关 topics
   - 例如: `cms`, `eggjs`, `vue3`, `mongodb`, `mariadb`, `docker`

---

## 📝 注意事项

1. **不要提交敏感信息**: 确保 `.env` 文件在 `.gitignore` 中
2. **检查历史提交**: 使用 `git log` 检查是否有敏感信息泄露
3. **许可证兼容性**: 确保所有依赖的许可证与项目许可证兼容
4. **文档完整性**: 确保所有文档链接有效
5. **代码质量**: 确保代码符合项目规范

---

## 🎯 快速执行命令

```bash
# 1. 检查敏感信息
grep -r "password\|secret\|key\|token" --include="*.js" --include="*.sh" scripts/ docker/

# 2. 检查 .gitignore
cat .gitignore

# 3. 检查 package.json
grep "private" package.json

# 4. 检查 LICENSE
ls -la LICENSE

# 5. 检查文档
ls -la *.md
```
