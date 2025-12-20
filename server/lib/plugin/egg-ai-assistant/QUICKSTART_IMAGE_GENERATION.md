# 豆包文生图 - 快速开始指南

## 🚀 5分钟快速上手

本指南将帮助您在 5 分钟内开始使用豆包文生图功能。

---

## 步骤 1: 获取 API Key (1分钟)

访问 [火山引擎控制台](https://console.volcengine.com/)：

1. 注册/登录火山引擎账号
2. 开通豆包文生图服务
3. 创建 API Key
4. 复制 API Key 备用

---

## 步骤 2: 配置环境变量 (1分钟)

在项目根目录创建或编辑 `.env` 文件：

```bash
# 豆包 API Key
ARK_API_KEY=your_api_key_here
```

或者在服务器环境中设置：

```bash
export ARK_API_KEY="your_api_key_here"
```

---

## 步骤 3: 启动服务 (1分钟)

```bash
# 安装依赖（如果还没安装）
cd server
npm install

# 启动服务
npm start
```

服务启动后会自动：

- ✅ 创建数据库表（如果使用 MariaDB）
- ✅ 初始化豆包模型配置
- ✅ 准备好图片生成接口

---

## 步骤 4: 配置模型 (1分钟)

### 方法 A: 通过 API 配置（推荐）

```bash
curl -X POST http://localhost:7001/manage/ai/models \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "doubao",
    "modelName": "doubao-seedream-4-0-250828",
    "displayName": "豆包 SeeDream 4.0",
    "description": "豆包文生图模型",
    "config": {
      "apiKey": "'"$ARK_API_KEY"'",
      "apiEndpoint": "https://ark.cn-beijing.volces.com/api/v3",
      "size": "2K",
      "watermark": true,
      "timeout": 90000
    },
    "supportedTasks": ["image_generation", "text_to_image"],
    "isEnabled": true,
    "priority": 15
  }'
```

### 方法 B: 通过管理后台配置

1. 访问管理后台
2. 进入 AI 模型管理
3. 添加豆包模型
4. 填写配置信息
5. 保存并启用

---

## 步骤 5: 开始生成图片 (1分钟)

### 方法 A: 使用演示页面（最简单）

访问演示页面：

```
http://localhost:7001/ai-image-generation/
```

在文本框中输入描述，点击"生成图片"即可！

### 方法 B: 使用 API

```bash
curl -X POST http://localhost:7001/api/ai/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的橘猫在阳光下打盹，专业摄影，高清画质",
    "size": "1024x1024",
    "responseFormat": "url"
  }'
```

### 方法 C: 使用 JavaScript

```javascript
// 浏览器端
fetch('/api/ai/image/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: '一只可爱的橘猫在阳光下打盹，专业摄影，高清画质',
    size: '1024x1024',
    responseFormat: 'url',
  }),
})
  .then(res => res.json())
  .then(data => {
    console.log('生成的图片:', data.data.images[0]);
  });
```

### 方法 D: 在服务端代码中使用

```javascript
// 在控制器或服务中
async generateMyImage() {
  const { ctx } = this;

  const result = await ctx.service.imageGenerationService.generateImage({
    prompt: '一只可爱的橘猫在阳光下打盹，专业摄影，高清画质',
    size: '1024x1024'
  });

  if (result.success) {
    console.log('生成成功！图片URL:', result.data.images[0]);
  }
}
```

---

## 🎨 提示词技巧

### ❌ 不好的提示词

```
一只猫
```

### ✅ 好的提示词

```
一只优雅的橘色短毛猫，蜷缩在温暖的阳光下，柔和的自然光从窗户洒在它的毛发上，
产生金色的光晕，背景是简约的现代家居环境，景深效果突出主体，专业摄影，高清画质
```

### 💡 提示词要素

一个好的提示词应该包含：

1. **主体** - 要生成什么（猫、建筑、人物等）
2. **细节** - 具体特征（颜色、大小、状态等）
3. **场景** - 环境背景
4. **风格** - 艺术风格、摄影风格
5. **光影** - 光线效果
6. **质量** - 画质要求（高清、8K等）

---

## 📋 常用尺寸

| 尺寸      | 适用场景               | 模型      |
| --------- | ---------------------- | --------- |
| 1024x1024 | 头像、图标、正方形展示 | 3.0 / 4.0 |
| 2K        | 高清海报、桌面壁纸     | 4.0       |
| 4K        | 超高清大屏展示         | 4.0       |
| 1280x720  | 横向封面、Banner       | 3.0 / 4.0 |
| 720x1280  | 竖向海报、手机壁纸     | 3.0 / 4.0 |

---

## 🔍 验证安装

运行以下命令验证安装是否成功：

```bash
# 1. 检查模型列表
curl http://localhost:7001/api/ai/image/models

# 2. 检查能力说明
curl http://localhost:7001/api/ai/image/capabilities

# 3. 获取示例
curl http://localhost:7001/api/ai/image/examples
```

---

## 💰 成本预估

| 模型         | 价格     | 适用场景             |
| ------------ | -------- | -------------------- |
| SeeDream 3.0 | ¥0.02/张 | 日常使用、快速预览   |
| SeeDream 4.0 | ¥0.03/张 | 高质量需求、正式发布 |

**示例**：每天生成 100 张图片

- 使用 SeeDream 3.0: ¥2/天 × 30 = ¥60/月
- 使用 SeeDream 4.0: ¥3/天 × 30 = ¥90/月

---

## ❓ 常见问题

### Q1: 生成失败怎么办？

**检查清单**：

1. ✅ API Key 是否正确配置？
2. ✅ 模型是否已启用（`isEnabled: true`）？
3. ✅ 网络是否能访问火山引擎 API？
4. ✅ 查看错误日志获取详细信息

### Q2: 如何提高生成质量？

1. **使用详细的提示词**（参考上面的技巧）
2. **选择 SeeDream 4.0 模型**（质量更高）
3. **使用更大的尺寸**（2K/4K）
4. **参考示例提示词**（演示页面中有）

### Q3: 如何批量生成？

```javascript
const result = await ctx.service.imageGenerationService.batchGenerateImages([
  { prompt: '描述1', size: '1024x1024' },
  { prompt: '描述2', size: '2K' },
  { prompt: '描述3', size: '1280x720' },
]);
```

### Q4: 如何保存生成的图片？

```javascript
// 方式 1: 直接使用返回的 URL
const imageUrl = result.data.images[0];

// 方式 2: 下载到本地
const response = await fetch(imageUrl);
const blob = await response.blob();
// 保存 blob 到文件系统

// 方式 3: 使用 base64 格式
const result = await generateImage({
  prompt: '...',
  responseFormat: 'b64_json',
});
const base64Data = result.data.imageData[0];
```

### Q5: 如何控制成本？

1. **合理选择模型**（3.0 vs 4.0）
2. **设置使用配额**（在代码中限制）
3. **缓存结果**（相同提示词复用）
4. **监控使用情况**（查看统计数据）

---

## 📚 下一步

恭喜！您已经成功开始使用豆包文生图功能。

继续学习：

- 📖 [完整使用指南](./docs/DOUBAO_IMAGE_GENERATION.md)
- 📖 [API 文档](./docs/DOUBAO_IMAGE_GENERATION.md#api-使用)
- 📖 [最佳实践](./docs/DOUBAO_IMAGE_GENERATION.md#提示词优化建议)
- 📖 [前端集成](./docs/DOUBAO_IMAGE_GENERATION.md#前端集成示例)

---

## 🆘 需要帮助？

- 查看 [完整文档](./docs/DOUBAO_IMAGE_GENERATION.md)
- 查看 [实现报告](../../DOUBAO_IMAGE_GENERATION_IMPLEMENTATION.md)
- 查看 [更新日志](./CHANGELOG.md)
- 访问 [火山引擎文档](https://www.volcengine.com/docs/82379/1541523)

---

**Happy Image Generation! 🎨✨**
