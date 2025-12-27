# 变更日志：排除 modules.config.js

## 变更日期
2024-12-27

## 变更类型
优化 - 模板构建

## 变更内容

### 问题
用户发现 CLI 生成的 `modules.config.js` 会覆盖模板中的同名文件，询问这是否是预期行为。

### 分析
1. **执行流程**：
   - 步骤 2: `copyServerCode()` 复制模板（包括 modules.config.js）
   - 步骤 5: `generateModulesConfig()` 重新生成 modules.config.js（覆盖）

2. **覆盖原因**：
   - CLI 需要根据用户选择的模块生成配置
   - 模板中的默认配置（所有模块启用）不符合用户选择
   - 覆盖是正确的设计行为

3. **问题点**：
   - 模板中的文件实际上不会被使用（总是被覆盖）
   - 可能造成混淆（开发者可能认为模板文件会被保留）
   - 存在冗余操作（复制后立即覆盖）

### 解决方案

从模板中排除 `modules.config.js`，让 CLI 完全负责生成该文件。

### 实施步骤

1. **修改构建脚本** (`scripts/build-templates.js`)：

```javascript
const EXCLUDE_PATTERNS = {
  // ... 其他规则
  
  // CLI 生成的配置文件（会被 CLI 重新生成，不需要在模板中）
  generated: [
    'modules.config.js',  // 总是由 CLI 根据用户选择的模块动态生成
  ],
};
```

2. **重新构建模板**：

```bash
cd packages/cli
pnpm run build:templates
```

3. **验证结果**：

```bash
$ ls templates/server/config/modules.config.js
ls: templates/server/config/modules.config.js: No such file or directory
```

✅ 文件已成功排除

### 影响

#### 构建统计变化

**之前**：
- 总文件数: 1239
- 跳过文件: 70
- 总大小: 27.57 MB

**之后**：
- 总文件数: 1232 (-7)
- 跳过文件: 77 (+7)
- 总大小: 27.56 MB (-0.01 MB)

#### 执行流程变化

**之前**：
```
1. copyServerCode()
   ↓ 复制 modules.config.js（默认配置）
2. ...
3. generateModulesConfig()
   ↓ 覆盖 modules.config.js（用户配置）
```

**之后**：
```
1. copyServerCode()
   ↓ 不复制 modules.config.js（已排除）
2. ...
3. generateModulesConfig()
   ↓ 生成 modules.config.js（用户配置）
```

### 优势

1. ✅ **更清晰的意图**：配置文件完全由 CLI 生成，没有歧义
2. ✅ **避免混淆**：开发者不会误以为模板文件会被保留
3. ✅ **更高效**：减少了"复制后覆盖"的冗余操作
4. ✅ **更易维护**：不需要同步模板和 CLI 的配置定义
5. ✅ **减小包体积**：虽然只有 3KB，但也是优化

### 相关文档

- `MODULES_CONFIG_HANDLING.md` - 详细说明覆盖行为和解决方案
- `TEMPLATE_EXCLUSIONS.md` - 更新了排除规则说明（新增第 10 类）
- `IMPLEMENTATION_SUMMARY.md` - 更新了构建统计数据

### 测试验证

可以使用以下脚本验证行为：

```bash
# 运行测试脚本
./scripts/test-modules-config-override.sh

# 或手动测试
node bin/doracms.js create test-project --skip-install --skip-git
# 在交互中只选择部分模块
cat test-project/server/config/modules.config.js
# 验证只有选择的模块是 enabled: true
```

### 向后兼容性

✅ **完全兼容** - 此变更不影响 CLI 的功能和用户体验：

- CLI 行为保持不变（仍然生成 modules.config.js）
- 生成的项目结构保持不变
- 用户体验保持不变
- 只是优化了内部实现

### 结论

成功将 `modules.config.js` 从模板中排除，优化了构建流程，提高了代码清晰度。

---

**变更人**: Kiro AI Assistant  
**审核人**: xiaoshen  
**状态**: ✅ 已完成
