# API Key 管理设计方案

## 📋 问题背景

当插件发布为 npm 包后，用户通过管理界面安装插件，需要一个友好的方式来配置 API Key，而不是直接修改环境变量或配置文件。

## 🎯 设计目标

1. **用户友好**: 通过 Web 界面配置 API Key
2. **安全存储**: API Key 加密存储在数据库中
3. **灵活配置**: 支持多个 AI 模型的不同配置
4. **权限控制**: 只有管理员可以查看和修改
5. **配置优先级**: 数据库 > 环境变量 > 默认值

## 🏗️ 架构设计

### 1. 配置优先级

```javascript
/**
 * 配置加载优先级（从高到低）
 * 1. 数据库中的 AIModel 配置（用户通过界面配置）
 * 2. 环境变量配置（部署时配置）
 * 3. config.default.js 中的默认配置
 */
```

### 2. 数据存储

**AIModel Schema** (已实现):

```javascript
{
  provider: 'openai',
  modelName: 'gpt-4',
  config: {
    apiKey: 'sk-xxxxx',        // 🔒 加密存储
    apiEndpoint: 'https://...',
    maxTokens: 4096,
    temperature: 0.7,
  }
}
```

### 3. 加密方案

#### 方案 A: 简单对称加密（推荐）

```javascript
// lib/plugin/egg-ai-assistant/lib/utils/encryption.js
const crypto = require('crypto');

class Encryption {
  constructor(app) {
    this.app = app;
    // 从环境变量或配置文件读取加密密钥
    this.secretKey = process.env.ENCRYPTION_SECRET_KEY || app.config.keys;
    this.algorithm = 'aes-256-cbc';
  }

  /**
   * 加密 API Key
   * @param {String} text - 明文
   * @return {String} 密文
   */
  encrypt(text) {
    if (!text) return '';

    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.secretKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 返回 iv:encrypted 格式
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密 API Key
   * @param {String} text - 密文
   * @return {String} 明文
   */
  decrypt(text) {
    if (!text) return '';

    const parts = text.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(this.secretKey, 'salt', 32);
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 掩码显示（用于界面展示）
   * @param {String} apiKey - API Key
   * @return {String} 掩码后的 Key
   */
  mask(apiKey) {
    if (!apiKey || apiKey.length < 8) {
      return '********';
    }
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    return `${start}****${end}`;
  }
}

module.exports = Encryption;
```

#### 方案 B: 非对称加密（可选，更安全）

适用于需要更高安全级别的场景，使用 RSA 公私钥。

### 4. Service 层改造

#### 4.1 扩展 AIModelManagerService

```javascript
// lib/plugin/egg-ai-assistant/app/service/aiModelManager.js

class AIModelManagerService extends Service {
  constructor(ctx) {
    super(ctx);
    this.encryption = new Encryption(this.app);
  }

  /**
   * 创建或更新 AI 模型配置
   * @param {Object} modelData - 模型数据
   * @return {Promise<Object>}
   */
  async saveModelConfig(modelData) {
    const { id, provider, modelName, config, ...rest } = modelData;

    // 加密 API Key
    if (config && config.apiKey) {
      config.apiKey = this.encryption.encrypt(config.apiKey);
    }

    if (id) {
      // 更新
      return await this.aiModelRepo.update(id, {
        provider,
        modelName,
        config,
        ...rest,
      });
    } else {
      // 创建
      return await this.aiModelRepo.create({
        provider,
        modelName,
        config,
        ...rest,
      });
    }
  }

  /**
   * 获取模型配置（用于显示）
   * @param {String} id - 模型 ID
   * @param {Boolean} maskApiKey - 是否掩码 API Key
   * @return {Promise<Object>}
   */
  async getModelConfig(id, maskApiKey = true) {
    const model = await this.aiModelRepo.findById(id);

    if (!model) {
      throw new Error(`Model not found: ${id}`);
    }

    // 掩码 API Key
    if (maskApiKey && model.config && model.config.apiKey) {
      model.config.apiKey = this.encryption.mask(this.encryption.decrypt(model.config.apiKey));
    }

    return model;
  }

  /**
   * 获取实际的 API 配置（用于调用 AI）
   * @param {String} provider - 提供商
   * @param {String} modelName - 模型名称
   * @return {Promise<Object>}
   */
  async getActualConfig(provider, modelName) {
    // 1. 先查数据库
    const model = await this.aiModelRepo.findByProviderAndModel(provider, modelName);

    if (model && model.config && model.config.apiKey) {
      // 解密 API Key
      const config = { ...model.config };
      config.apiKey = this.encryption.decrypt(config.apiKey);
      return config;
    }

    // 2. 降级到环境变量
    const envConfig = this._getEnvConfig(provider);
    if (envConfig.apiKey) {
      this.logger.info(`[AIModelManager] Using env config for ${provider}`);
      return envConfig;
    }

    // 3. 使用默认配置
    const defaultConfig = this.app.config.aiAssistant[provider] || {};
    this.logger.warn(`[AIModelManager] Using default config for ${provider}, API key may be missing`);
    return defaultConfig;
  }

  /**
   * 从环境变量获取配置
   * @param {String} provider - 提供商
   * @return {Object}
   * @private
   */
  _getEnvConfig(provider) {
    const config = { ...this.app.config.aiAssistant[provider] };

    switch (provider) {
      case 'openai':
        config.apiKey = process.env.OPENAI_API_KEY || config.apiKey;
        break;
      case 'deepseek':
        config.apiKey = process.env.DEEPSEEK_API_KEY || config.apiKey;
        break;
      case 'anthropic':
        config.apiKey = process.env.ANTHROPIC_API_KEY || config.apiKey;
        break;
      // 添加其他提供商
    }

    return config;
  }

  /**
   * 测试 API Key 是否有效
   * @param {String} provider - 提供商
   * @param {String} apiKey - API Key
   * @return {Promise<Boolean>}
   */
  async testApiKey(provider, apiKey) {
    try {
      // 根据不同的提供商，调用简单的测试接口
      const adapter = this._getAdapter(provider);
      const result = await adapter.checkHealth({ apiKey });
      return result.healthy;
    } catch (error) {
      this.logger.error(`[AIModelManager] testApiKey failed:`, error);
      return false;
    }
  }
}
```

#### 4.2 BaseAIAdapter 改造

```javascript
// lib/plugin/egg-ai-assistant/lib/adapters/base/BaseAIAdapter.js

class BaseAIAdapter {
  constructor(app, config = {}) {
    this.app = app;
    // 配置优先级：传入的 config > 数据库 > 环境变量 > 默认配置
    this.config = config;
  }

  /**
   * 获取实际的 API 配置
   * @return {Promise<Object>}
   */
  async getConfig() {
    // 如果构造时已传入完整配置，直接使用
    if (this.config.apiKey) {
      return this.config;
    }

    // 否则从 AIModelManager 获取
    const ctx = this.app.createAnonymousContext();
    const aiModelManager = ctx.service.aiModelManager;
    return await aiModelManager.getActualConfig(this.provider, this.modelName);
  }

  // 其他方法在调用前先 await this.getConfig()
}
```

### 5. Controller 层

```javascript
// lib/plugin/egg-ai-assistant/app/controller/aiConfig.js

class AIConfigController extends Controller {
  /**
   * 获取 AI 模型配置列表
   * GET /admin/ai/models
   */
  async getModels() {
    const { ctx } = this;
    const { page = 1, pageSize = 20 } = ctx.query;

    const result = await ctx.service.aiModelManager.getModelList({
      page,
      pageSize,
      maskApiKey: true, // 列表中掩码显示
    });

    ctx.success(result);
  }

  /**
   * 获取单个模型配置
   * GET /admin/ai/models/:id
   */
  async getModel() {
    const { ctx } = this;
    const { id } = ctx.params;

    const model = await ctx.service.aiModelManager.getModelConfig(id, true);
    ctx.success(model);
  }

  /**
   * 创建或更新模型配置
   * POST /admin/ai/models
   * PUT /admin/ai/models/:id
   */
  async saveModel() {
    const { ctx } = this;
    const data = ctx.request.body;

    // 验证必填字段
    ctx.validate(
      {
        provider: { type: 'string', required: true },
        modelName: { type: 'string', required: true },
        'config.apiKey': { type: 'string', required: true, min: 10 },
      },
      data
    );

    // 测试 API Key 是否有效（可选）
    if (ctx.app.config.aiAssistant.testApiKeyOnSave) {
      const isValid = await ctx.service.aiModelManager.testApiKey(data.provider, data.config.apiKey);

      if (!isValid) {
        ctx.error(400, 'Invalid API Key');
        return;
      }
    }

    const result = await ctx.service.aiModelManager.saveModelConfig(data);
    ctx.success(result);
  }

  /**
   * 删除模型配置
   * DELETE /admin/ai/models/:id
   */
  async deleteModel() {
    const { ctx } = this;
    const { id } = ctx.params;

    await ctx.service.aiModelManager.deleteModel(id);
    ctx.success();
  }

  /**
   * 测试 API Key
   * POST /admin/ai/test-api-key
   */
  async testApiKey() {
    const { ctx } = this;
    const { provider, apiKey } = ctx.request.body;

    ctx.validate({
      provider: { type: 'string', required: true },
      apiKey: { type: 'string', required: true },
    });

    const isValid = await ctx.service.aiModelManager.testApiKey(provider, apiKey);

    ctx.success({
      valid: isValid,
      message: isValid ? 'API Key is valid' : 'API Key is invalid or has no permission',
    });
  }

  /**
   * 获取可用的提供商列表
   * GET /admin/ai/providers
   */
  async getProviders() {
    const { ctx } = this;

    const providers = [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4, GPT-3.5-turbo',
        website: 'https://platform.openai.com',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        description: 'DeepSeek Chat',
        website: 'https://www.deepseek.com',
        apiKeyUrl: 'https://platform.deepseek.com/api-keys',
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude-3',
        website: 'https://www.anthropic.com',
        apiKeyUrl: 'https://console.anthropic.com/settings/keys',
      },
      {
        id: 'ollama',
        name: 'Ollama',
        description: '本地部署的开源模型',
        website: 'https://ollama.ai',
        apiKeyUrl: null, // 本地部署不需要 API Key
      },
    ];

    ctx.success(providers);
  }
}

module.exports = AIConfigController;
```

### 6. 前端界面设计

#### 6.1 模型配置列表页面

```vue
<!-- client/admin-center/src/views/ai/ModelList.vue -->
<template>
  <div class="ai-model-list">
    <el-card>
      <div slot="header" class="clearfix">
        <span>AI 模型配置</span>
        <el-button style="float: right" type="primary" icon="el-icon-plus" @click="handleAdd"> 添加模型 </el-button>
      </div>

      <el-table :data="models" v-loading="loading">
        <el-table-column prop="provider" label="提供商" width="120">
          <template slot-scope="scope">
            <el-tag :type="getProviderType(scope.row.provider)">
              {{ getProviderName(scope.row.provider) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="displayName" label="模型名称" />

        <el-table-column label="API Key" width="200">
          <template slot-scope="scope">
            <span class="api-key-mask">
              {{ scope.row.config.apiKey || '未配置' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.isEnabled" @change="handleToggleStatus(scope.row)" />
          </template>
        </el-table-column>

        <el-table-column label="优先级" width="100">
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.priority }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200">
          <template slot-scope="scope">
            <el-button size="mini" @click="handleEdit(scope.row)"> 编辑 </el-button>
            <el-button size="mini" type="danger" @click="handleDelete(scope.row)"> 删除 </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <ModelEditDialog :visible.sync="dialogVisible" :model-data="currentModel" @saved="handleSaved" />
  </div>
</template>

<script>
export default {
  name: 'AIModelList',
  data() {
    return {
      models: [],
      loading: false,
      dialogVisible: false,
      currentModel: null,
    };
  },
  mounted() {
    this.loadModels();
  },
  methods: {
    async loadModels() {
      this.loading = true;
      try {
        const result = await this.$api.ai.getModels();
        this.models = result.data;
      } catch (error) {
        this.$message.error('加载失败：' + error.message);
      } finally {
        this.loading = false;
      }
    },
    handleAdd() {
      this.currentModel = null;
      this.dialogVisible = true;
    },
    handleEdit(model) {
      this.currentModel = model;
      this.dialogVisible = true;
    },
    async handleDelete(model) {
      await this.$confirm('确定删除此模型配置？', '提示', {
        type: 'warning',
      });

      try {
        await this.$api.ai.deleteModel(model.id);
        this.$message.success('删除成功');
        this.loadModels();
      } catch (error) {
        this.$message.error('删除失败：' + error.message);
      }
    },
    handleSaved() {
      this.dialogVisible = false;
      this.loadModels();
    },
    getProviderName(provider) {
      const names = {
        openai: 'OpenAI',
        deepseek: 'DeepSeek',
        anthropic: 'Anthropic',
        ollama: 'Ollama',
      };
      return names[provider] || provider;
    },
    getProviderType(provider) {
      const types = {
        openai: 'success',
        deepseek: 'primary',
        anthropic: 'warning',
        ollama: 'info',
      };
      return types[provider] || '';
    },
  },
};
</script>
```

#### 6.2 模型配置编辑对话框

```vue
<!-- client/admin-center/src/views/ai/ModelEditDialog.vue -->
<template>
  <el-dialog :title="isEdit ? '编辑模型' : '添加模型'" :visible.sync="dialogVisible" width="600px" @close="handleClose">
    <el-form ref="form" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="AI 提供商" prop="provider">
        <el-select v-model="form.provider" placeholder="选择 AI 提供商" @change="handleProviderChange">
          <el-option v-for="provider in providers" :key="provider.id" :label="provider.name" :value="provider.id">
            <span>{{ provider.name }}</span>
            <span style="color: #8492a6; font-size: 12px">
              {{ provider.description }}
            </span>
          </el-option>
        </el-select>
        <div v-if="currentProvider" class="provider-info">
          <a :href="currentProvider.apiKeyUrl" target="_blank">
            <i class="el-icon-link"></i>
            获取 API Key
          </a>
        </div>
      </el-form-item>

      <el-form-item label="模型名称" prop="modelName">
        <el-input v-model="form.modelName" placeholder="如: gpt-4, gpt-3.5-turbo" />
      </el-form-item>

      <el-form-item label="显示名称" prop="displayName">
        <el-input v-model="form.displayName" placeholder="用户看到的名称" />
      </el-form-item>

      <el-form-item label="API Key" prop="config.apiKey">
        <el-input v-model="form.config.apiKey" type="password" placeholder="输入 API Key" show-password />
        <el-button size="mini" type="text" icon="el-icon-check" :loading="testing" @click="handleTestApiKey">
          测试 API Key
        </el-button>
      </el-form-item>

      <el-form-item label="API 端点">
        <el-input v-model="form.config.apiEndpoint" placeholder="留空使用默认值" />
      </el-form-item>

      <el-form-item label="优先级">
        <el-input-number v-model="form.priority" :min="1" :max="100" />
        <span class="form-tip">数字越大优先级越高</span>
      </el-form-item>

      <el-form-item label="支持的任务">
        <el-checkbox-group v-model="form.supportedTasks">
          <el-checkbox label="title_generation">标题生成</el-checkbox>
          <el-checkbox label="tag_extraction">标签提取</el-checkbox>
          <el-checkbox label="summary_generation">摘要生成</el-checkbox>
          <el-checkbox label="category_matching">分类匹配</el-checkbox>
          <el-checkbox label="seo_optimization">SEO优化</el-checkbox>
          <el-checkbox label="content_quality_check">质量检查</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="启用状态">
        <el-switch v-model="form.isEnabled" />
      </el-form-item>
    </el-form>

    <div slot="footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave"> 保存 </el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'ModelEditDialog',
  props: {
    visible: Boolean,
    modelData: Object,
  },
  data() {
    return {
      dialogVisible: false,
      providers: [],
      form: this.getDefaultForm(),
      rules: {
        provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
        modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
        displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
        'config.apiKey': [
          { required: true, message: '请输入 API Key', trigger: 'blur' },
          { min: 10, message: 'API Key 长度至少10个字符', trigger: 'blur' },
        ],
      },
      saving: false,
      testing: false,
    };
  },
  computed: {
    isEdit() {
      return !!this.modelData;
    },
    currentProvider() {
      return this.providers.find(p => p.id === this.form.provider);
    },
  },
  watch: {
    visible(val) {
      this.dialogVisible = val;
      if (val) {
        this.loadData();
      }
    },
    dialogVisible(val) {
      this.$emit('update:visible', val);
    },
  },
  methods: {
    async loadData() {
      // 加载提供商列表
      const result = await this.$api.ai.getProviders();
      this.providers = result.data;

      // 如果是编辑，加载模型数据
      if (this.modelData) {
        this.form = { ...this.form, ...this.modelData };
      } else {
        this.form = this.getDefaultForm();
      }
    },
    getDefaultForm() {
      return {
        provider: '',
        modelName: '',
        displayName: '',
        config: {
          apiKey: '',
          apiEndpoint: '',
          maxTokens: 4096,
          temperature: 0.7,
        },
        priority: 10,
        supportedTasks: [],
        isEnabled: true,
      };
    },
    async handleTestApiKey() {
      if (!this.form.config.apiKey) {
        this.$message.warning('请先输入 API Key');
        return;
      }

      this.testing = true;
      try {
        const result = await this.$api.ai.testApiKey({
          provider: this.form.provider,
          apiKey: this.form.config.apiKey,
        });

        if (result.data.valid) {
          this.$message.success('API Key 有效');
        } else {
          this.$message.error('API Key 无效或无权限');
        }
      } catch (error) {
        this.$message.error('测试失败：' + error.message);
      } finally {
        this.testing = false;
      }
    },
    async handleSave() {
      this.$refs.form.validate(async valid => {
        if (!valid) return;

        this.saving = true;
        try {
          await this.$api.ai.saveModel(this.form);
          this.$message.success('保存成功');
          this.$emit('saved');
        } catch (error) {
          this.$message.error('保存失败：' + error.message);
        } finally {
          this.saving = false;
        }
      });
    },
    handleProviderChange() {
      // 提供商改变时，自动设置默认值
      // 例如 OpenAI 的默认端点等
    },
    handleClose() {
      this.$refs.form.resetFields();
    },
  },
};
</script>
```

### 7. 路由配置

```javascript
// lib/plugin/egg-ai-assistant/app/router.js

module.exports = app => {
  const { router, controller } = app;
  const adminAuth = app.middleware.adminAuth();

  // AI 配置管理
  router.get('/admin/ai/models', adminAuth, controller.aiConfig.getModels);
  router.get('/admin/ai/models/:id', adminAuth, controller.aiConfig.getModel);
  router.post('/admin/ai/models', adminAuth, controller.aiConfig.saveModel);
  router.put('/admin/ai/models/:id', adminAuth, controller.aiConfig.saveModel);
  router.delete('/admin/ai/models/:id', adminAuth, controller.aiConfig.deleteModel);
  router.post('/admin/ai/test-api-key', adminAuth, controller.aiConfig.testApiKey);
  router.get('/admin/ai/providers', adminAuth, controller.aiConfig.getProviders);
};
```

## 🔐 安全考虑

### 1. 加密密钥管理

```bash
# .env
ENCRYPTION_SECRET_KEY=your-very-strong-secret-key-here-at-least-32-chars
```

**建议**:

- 每个部署环境使用不同的加密密钥
- 密钥至少 32 位
- 定期轮换密钥（需要重新加密所有 API Key）

### 2. 权限控制

```javascript
// 只有超级管理员可以访问
router.get('/admin/ai/models', adminAuth(), checkPermission('ai:config:read'), controller.aiConfig.getModels);
```

### 3. API Key 传输安全

- 使用 HTTPS
- 前端不缓存明文 API Key
- 日志中不输出 API Key

### 4. 审计日志

```javascript
// 记录所有 API Key 的修改操作
await ctx.service.systemLog.create({
  action: 'ai_model_config_update',
  userId: ctx.user.id,
  detail: {
    modelId: model.id,
    provider: model.provider,
    // 不记录实际的 API Key
  },
});
```

## 📱 用户使用流程

### 1. 安装插件

```bash
npm install @doracms/egg-ai-assistant
```

### 2. 启用插件

在 `config/plugin.js` 中:

```javascript
exports.aiAssistant = {
  enable: true,
  package: '@doracms/egg-ai-assistant',
};
```

### 3. 配置 API Key（三种方式）

#### 方式 A: 管理界面（推荐）

1. 登录管理后台
2. 进入「AI 配置」→「模型管理」
3. 点击「添加模型」
4. 选择提供商（如 OpenAI）
5. 输入 API Key
6. 点击「测试」验证
7. 保存配置

#### 方式 B: 环境变量

```bash
# .env
OPENAI_API_KEY=sk-xxxxx
DEEPSEEK_API_KEY=sk-xxxxx
```

#### 方式 C: 配置文件

```javascript
// config/config.default.js
config.aiAssistant = {
  openai: {
    apiKey: 'sk-xxxxx',
  },
};
```

### 4. 使用 AI 功能

配置完成后，在发布文章时就可以使用 AI 功能了。

## 🎯 配置优先级示例

```javascript
// 假设数据库、环境变量、配置文件都有配置

// 数据库配置
AIModel {
  provider: 'openai',
  config: {
    apiKey: 'sk-database-key'  // 🔒 加密存储
  }
}

// 环境变量
OPENAI_API_KEY=sk-env-key

// 配置文件
config.aiAssistant.openai.apiKey = 'sk-config-key'

// 实际使用: sk-database-key （数据库优先级最高）
```

## 📝 最佳实践

### 1. 开发环境

- 使用环境变量配置
- 团队共享测试 API Key

### 2. 生产环境

- 通过管理界面配置
- 使用独立的生产 API Key
- 定期检查使用量和成本

### 3. 多租户场景

如果支持多租户，每个租户可以配置自己的 API Key:

```javascript
{
  provider: 'openai',
  modelName: 'gpt-4',
  tenantId: 'tenant-123',  // 租户 ID
  config: {
    apiKey: 'tenant-specific-key'
  }
}
```

## 🚀 下一步实施

1. **Week 8-9**: 实现核心功能

   - ✅ Encryption 工具类
   - ✅ AIModelManager 改造
   - ✅ Controller 实现

2. **Week 9-10**: 前端开发

   - ✅ 模型列表页面
   - ✅ 配置编辑对话框
   - ✅ API Key 测试功能

3. **Week 10**: 测试和文档
   - 安全测试
   - 用户文档
   - 部署指南

---

**设计版本**: v1.0  
**最后更新**: 2025-10-10  
**状态**: 设计完成，待实施
