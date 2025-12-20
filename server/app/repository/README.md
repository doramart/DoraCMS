# Repository/Adapter 模式实现指南

## 项目概述

本项目实现了基于 Repository/Adapter 模式的多数据库适配系统，支持 MongoDB 和 MariaDB，提供统一的业务接口。参考了 Strapi、KeystoneJS 等主流 CMS 的设计理念，实现了标准化的参数接口和数据转换机制。

## 架构设计

```
┌─────────────────────┐
│   业务层 (Service)   │
├─────────────────────┤
│ 统一接口 (IRepository)│  ← 标准化参数接口
├─────────────────────┤
│ 基础类 (BaseRepository)│  ← 通用逻辑处理
├─────────────────────┤
│   适配器层 (Adapters) │
├─────────────────────┤
│ MongoDB │ MariaDB   │  ← 数据库特定实现
│ Adapter │ Adapter   │
└─────────────────────┘
```

## 核心特性

### ✅ 已实现功能

1. **统一参数接口**

   - 标准化的 `filters`、`populate`、`sort`、`pagination` 参数
   - 兼容 Strapi 风格的查询语法
   - 自动参数验证和转换

2. **增强的数据转换器**

   - 支持 MongoDB ↔ MariaDB 参数转换
   - 智能主键映射 (`_id` ↔ `id`)
   - 统一的数据格式输出

3. **基础 Repository 类**

   - 通用的 CRUD 操作
   - 统一的错误处理和日志记录
   - 可扩展的钩子函数

4. **一致性测试框架**
   - 自动化的适配器行为一致性测试
   - 性能对比测试
   - 详细的测试报告

### 🚧 待完成功能

1. **MongoDB 适配器重构** (优先级: 高)
2. **MariaDB 适配器完善** (优先级: 高)
3. **性能优化和缓存** (优先级: 中)

## 文件结构

```
server/app/repository/
├── interfaces/              # 接口定义
│   ├── IBaseRepository.js   # 基础 Repository 接口
│   └── IStandardParams.js   # 标准参数接口和验证器
├── base/                    # 基础类
│   └── BaseStandardRepository.js  # 标准化基础 Repository
├── utils/                   # 工具类
│   ├── DataTransformer.js   # 原数据转换器
│   └── EnhancedDataTransformer.js  # 增强数据转换器
├── adapters/                # 适配器实现
│   ├── mongodb/             # MongoDB 适配器
│   │   ├── StandardContentMongoRepository.js  # 示例实现
│   │   └── ...
│   └── mariadb/             # MariaDB 适配器
│       ├── StandardContentMariaRepository.js  # 示例实现
│       └── ...
├── testing/                 # 测试框架
│   └── AdapterConsistencyTest.js  # 一致性测试
├── examples/                # 示例和文档
│   ├── MigrationGuide.md    # 迁移指南
│   ├── UsageExample.js      # 使用示例
│   └── README.md           # 本文档
└── connections/             # 数据库连接
    └── MariaDBConnection.js # MariaDB 连接管理
```

## 快速开始

### 1. 配置数据库类型

```javascript
// config/config.default.js
config.repository = {
  databaseType: 'mongodb', // 或 'mariadb'
  enabled: true,
};
```

### 2. 创建标准化 Repository

```javascript
const BaseStandardRepository = require('../base/BaseStandardRepository');

class ContentRepository extends BaseStandardRepository {
  constructor(ctx) {
    super(ctx, 'Content');

    // 注册模型和关联关系
    this.registerModel({
      relations: {
        author: { path: 'author', select: ['userName', 'nickName'] },
        category: { path: 'category', select: ['cateName'] },
      },
    });
  }
}
```

### 3. 使用统一接口

```javascript
// 统一的查询参数格式
const result = await contentRepo.find(
  { current: 1, pageSize: 10 }, // 分页参数
  {
    filters: { state: { $eq: '1' } }, // 过滤条件
    populate: [{ path: 'author', select: ['userName'] }], // 关联查询
    sort: [{ field: 'updateDate', order: 'desc' }], // 排序
  }
);
```

## 详细实施计划

### 阶段一：MongoDB 适配器重构 (1-2天)

**目标**: 将现有 MongoDB Repository 迁移到新的标准接口

**任务清单**:

- [ ] 重构 `ContentMongoRepository`
- [ ] 重构 `UserMongoRepository`
- [ ] 重构 `AdminMongoRepository`
- [ ] 重构其他核心 Repository
- [ ] 更新相关 Service 层调用
- [ ] 运行回归测试

**关键文件**:

```
server/app/repository/adapters/mongodb/
├── ContentMongoRepository.js      # 需重构
├── UserMongoRepository.js         # 需重构
├── AdminMongoRepository.js        # 需重构
└── ...                           # 其他 Repository
```

### 阶段二：MariaDB 适配器完善 (2-3天)

**目标**: 实现完整的 MariaDB 适配器，特别是 populate 功能

**任务清单**:

- [ ] 完善 `ContentMariaRepository` 的 populate 实现
- [ ] 修复主键转换问题
- [ ] 实现 JSON 数组字段的关联查询
- [ ] 统一分页信息格式
- [ ] 优化查询性能

**关键问题解决**:

1. **populate 功能不完整**

   ```javascript
   // 需要实现统一的 include 转换
   _transformPopulateForMariaDB(populate, entityName) {
     return populate.map(config => ({
       model: this.modelRegistry.get(config.path),
       as: config.path,
       attributes: config.select,
       required: false
     }));
   }
   ```

2. **JSON 数组关联处理**
   ```javascript
   // 处理如 tags 字段的 JSON 数组关联
   async _populateJsonArrayRelation(modelName, ids, select) {
     const model = this.modelRegistry.get(modelName);
     return await model.findAll({
       where: { id: { [Op.in]: ids } },
       attributes: select
     });
   }
   ```

### 阶段三：性能优化 (1-2天)

**目标**: 优化查询性能，实现缓存机制

**任务清单**:

- [ ] 实现 Repository 实例缓存
- [ ] 优化查询条件构建
- [ ] 添加查询结果缓存
- [ ] 性能监控和日志
- [ ] 数据库连接池优化

## 使用示例

### 基本查询

```javascript
// 统一的查询接口
const result = await contentRepo.find(
  { current: 1, pageSize: 10, searchkey: 'javascript' },
  {
    filters: {
      state: { $eq: '1' },
      category: { $in: ['tech', 'tutorial'] },
    },
    populate: [
      { path: 'author', select: ['userName', 'avatar'] },
      { path: 'category', select: ['name', 'slug'] },
    ],
    sort: [{ field: 'publishDate', order: 'desc' }],
    fields: ['title', 'summary', 'publishDate'],
  }
);
```

### 复杂查询

```javascript
// 支持复杂的逻辑查询
const result = await contentRepo.find(
  {},
  {
    filters: {
      $and: [
        { state: { $eq: '1' } },
        {
          $or: [{ category: { $in: ['tech', 'business'] } }, { tags: { $regex: 'javascript' } }],
        },
        { publishDate: { $gte: new Date('2023-01-01') } },
      ],
    },
  }
);
```

### CRUD 操作

```javascript
// 创建
const created = await contentRepo.create({
  title: '新文章',
  content: '文章内容',
  state: '1',
});

// 更新
const updated = await contentRepo.update(created._id, {
  title: '更新后的标题',
});

// 删除
await contentRepo.remove(created._id);
```

## 测试和验证

### 运行一致性测试

```bash
# 进入项目目录
cd server

# 运行示例测试
node app/repository/examples/UsageExample.js

# 或在测试环境中
npm test -- --grep "Repository Consistency"
```

### 测试覆盖的功能

- ✅ 基本查询功能
- ✅ populate 关联查询
- ✅ 排序和分页
- ✅ 搜索功能
- ✅ 过滤条件
- ✅ CRUD 操作
- ✅ 批量操作
- ✅ 性能对比

## 最佳实践

### 1. 参数标准化

```javascript
// ✅ 推荐：使用标准参数格式
const options = {
  filters: { status: { $eq: 'active' } },
  populate: [{ path: 'author', select: ['name'] }],
  sort: [{ field: 'createdAt', order: 'desc' }],
};

// ❌ 避免：使用旧的参数格式
const options = {
  query: { status: 'active' },
  populate: [{ path: 'author', select: 'name' }],
  sort: { createdAt: -1 },
};
```

### 2. 错误处理

```javascript
class CustomRepository extends BaseStandardRepository {
  async find(payload, options) {
    try {
      return await super.find(payload, options);
    } catch (error) {
      // 自定义错误处理
      this._handleError(error, 'find', { payload, options });
    }
  }
}
```

### 3. 性能优化

```javascript
// 使用字段选择减少数据传输
const options = {
  fields: ['title', 'summary', 'publishDate'], // 只选择需要的字段
  populate: [
    { path: 'author', select: ['userName'] }, // 关联查询也只选择需要的字段
  ],
};
```

## 故障排除

### 常见问题

1. **populate 不工作**

   - 检查关联关系是否正确注册
   - 确认模型映射是否正确
   - 查看错误日志中的详细信息

2. **主键转换问题**

   - 确保使用了 `EnhancedDataTransformer`
   - 检查 `_postprocessData` 方法是否正确调用

3. **查询性能问题**
   - 检查数据库索引
   - 使用字段选择减少数据量
   - 考虑启用查询缓存

### 调试技巧

1. **启用详细日志**

   ```javascript
   // config/config.default.js
   config.repository = {
     logging: true, // 启用操作日志
   };
   ```

2. **使用测试框架验证**
   ```javascript
   const consistencyTest = new AdapterConsistencyTest(app);
   const report = await consistencyTest.runAllTests('Content', mongoRepo, mariaRepo);
   ```

## 下一步计划

### 短期目标 (1-2周)

1. 完成 MongoDB 适配器重构
2. 修复 MariaDB 适配器的 populate 问题
3. 实现完整的测试覆盖

### 中期目标 (1个月)

1. 性能优化和缓存实现
2. 支持更多数据库类型 (PostgreSQL, SQLite)
3. 完善文档和示例

### 长期目标 (3个月)

1. 实现数据库迁移工具
2. 支持分布式数据库
3. 集成到 CI/CD 流程

## 贡献指南

1. **代码规范**: 遵循项目的 ESLint 配置
2. **测试要求**: 新功能必须包含单元测试和一致性测试
3. **文档更新**: 重要变更需要更新相关文档
4. **向后兼容**: 保持 API 的向后兼容性

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issue: [GitHub Issues]
- 技术讨论: [项目讨论区]
- 邮件联系: [开发团队邮箱]

---

**最后更新**: 2024年1月
**版本**: v1.0.0
**状态**: 开发中
