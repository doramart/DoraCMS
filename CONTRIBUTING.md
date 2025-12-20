# 贡献指南

感谢您对 DoraCMS 项目的关注！我们欢迎所有形式的贡献。

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请：

1. 检查 [Issues](https://github.com/doramart/DoraCMS/issues) 中是否已有相关报告
2. 如果没有，请创建一个新的 Issue，使用 Bug 报告模板
3. 提供详细的复现步骤、环境信息和错误日志

### 提出功能建议

如果您有功能建议：

1. 检查 [Issues](https://github.com/doramart/DoraCMS/issues) 中是否已有相关建议
2. 如果没有，请创建一个新的 Issue，使用功能请求模板
3. 详细描述功能的使用场景和预期效果

### 提交代码

1. **Fork 项目**

   ```bash
   git clone https://github.com/doramart/DoraCMS.git
   cd DoraCMS
   ```

2. **创建分支**

   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **开发代码**

   - 遵循项目代码规范
   - 添加必要的测试
   - 更新相关文档

4. **提交代码**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **推送并创建 Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   然后在 GitHub 上创建 Pull Request

## 代码规范

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：

```
feat: add user authentication
fix: resolve database connection issue
docs: update deployment guide
```

### 代码风格

- 使用 ESLint 和 Prettier 进行代码格式化
- 运行 `pnpm lint` 检查代码
- 运行 `pnpm format` 格式化代码

### 测试

- 新功能需要添加相应的测试
- Bug 修复需要添加回归测试
- 确保所有测试通过：`pnpm test`

## Pull Request 流程

1. 确保您的 PR 描述清晰，说明变更内容和原因
2. 确保代码通过 lint 检查
3. 确保所有测试通过
4. 等待代码审查
5. 根据审查意见进行修改

## 行为准则

请遵守我们的 [行为准则](CODE_OF_CONDUCT.md)，保持友好和尊重的交流环境。

## 问题反馈

如果您有任何问题，可以通过以下方式联系：

- 创建 [Issue](https://github.com/doramart/DoraCMS/issues)
- 查看 [文档](https://www.doracms.net)

感谢您的贡献！🎉
