# 豆包文生图功能使用指南

## 概述

egg-ai-assistant 插件现已支持豆包（Doubao）文生图模型，可以通过简单的文字描述生成高质量的图片。

### 支持的模型

1. **豆包 SeeDream 3.0** (`doubao-seedream-3-0-t2i-250415`)

   - 支持多种标准尺寸（1024x1024, 1024x768, 768x1024, 1280x720, 720x1280）
   - 性能稳定，适合常规图片生成

2. **豆包 SeeDream 4.0** (`doubao-seedream-4-0-250828`)
   - 支持高分辨率（2K, 4K）
   - 更高的生成质量
   - 支持流式生成

## 配置步骤

### 1. 获取 API Key

从火山引擎（volcengine.com）获取豆包文生图的 API Key。

### 2. 配置模型

通过管理后台或 API 配置豆包模型：

```bash
POST /manage/ai/models
```

请求体示例：

```json
{
  "provider": "doubao",
  "modelName": "doubao-seedream-4-0-250828",
  "displayName": "豆包 SeeDream 4.0",
  "description": "豆包 SeeDream 4.0 文生图模型",
  "config": {
    "apiKey": "YOUR_ARK_API_KEY",
    "apiEndpoint": "https://ark.cn-beijing.volces.com/api/v3",
    "size": "2K",
    "watermark": true,
    "timeout": 90000
  },
  "supportedTasks": ["image_generation", "text_to_image"],
  "isEnabled": true,
  "priority": 15
}
```

### 3. 启用模型

确保模型状态为启用（`isEnabled: true`）。

## API 使用

### 生成单张图片

```bash
POST /api/ai/image/generate
```

请求体：

```json
{
  "prompt": "一只可爱的橘猫在阳光下打盹，专业摄影，高清画质",
  "modelId": "模型ID（可选，不指定则自动选择）",
  "size": "1024x1024",
  "n": 1,
  "responseFormat": "url"
}
```

响应示例：

```json
{
  "success": true,
  "data": {
    "images": ["https://example.com/generated-image-1.jpg"],
    "count": 1,
    "model": {
      "id": "xxx",
      "name": "豆包 SeeDream 4.0",
      "provider": "doubao"
    },
    "metadata": {
      "size": "1024x1024",
      "responseFormat": "url",
      "responseTime": 3500
    }
  },
  "usage": {
    "imageCount": 1,
    "model": "doubao-seedream-4-0-250828"
  },
  "cost": 0.03
}
```

### 批量生成图片

```bash
POST /api/ai/image/batch-generate
```

请求体：

```json
{
  "prompts": [
    {
      "prompt": "星际穿越，黑洞，电影大片",
      "size": "2K"
    },
    {
      "prompt": "现代简约风格别墅，落地窗",
      "size": "1280x720"
    }
  ],
  "modelId": "模型ID（可选）"
}
```

### 获取支持的模型列表

```bash
GET /api/ai/image/models
```

### 获取模型支持的尺寸

```bash
GET /api/ai/image/sizes/:modelId
```

### 获取能力说明

```bash
GET /api/ai/image/capabilities
```

### 获取示例

```bash
GET /api/ai/image/examples
```

## 参数说明

### 生成参数

| 参数           | 类型   | 必填 | 说明                                      |
| -------------- | ------ | ---- | ----------------------------------------- |
| prompt         | string | 是   | 图片描述提示词，建议详细具体              |
| modelId        | string | 否   | 模型ID，不指定则自动选择最优模型          |
| size           | string | 否   | 图片尺寸，如 "1024x1024", "2K", "4K"      |
| n              | number | 否   | 生成图片数量，默认1，最大10               |
| responseFormat | string | 否   | 响应格式，"url" 或 "b64_json"，默认 "url" |
| extraParams    | object | 否   | 额外参数，如 guidanceScale, watermark 等  |

### SeeDream 3.0 特有参数

```json
{
  "guidanceScale": 3, // 指导比例，1-20
  "watermark": true // 是否添加水印
}
```

### SeeDream 4.0 特有参数

```json
{
  "sequentialImageGeneration": "disabled", // 顺序生成模式
  "watermark": true, // 是否添加水印
  "stream": false // 是否使用流式生成
}
```

## 提示词优化建议

### 好的提示词应该包含：

1. **主体描述**：明确要生成什么
2. **场景设定**：环境、背景
3. **风格要求**：艺术风格、摄影风格
4. **光影效果**：自然光、人造光、光线方向
5. **色彩倾向**：主色调、配色
6. **技术参数**：高清、8K、电影级等

### 示例

❌ **不好的提示词**：

```
一只猫
```

✅ **好的提示词**：

```
一只优雅的橘色短毛猫，蜷缩在温暖的阳光下，柔和的自然光从窗户洒在它的毛发上，
产生金色的光晕，背景是简约的现代家居环境，景深效果突出主体，专业摄影，高清画质
```

### 使用提示词优化服务

插件提供了提示词优化功能，可以将简单描述转换为详细的提示词：

```javascript
// 1. 先用文本生成模型优化提示词
const optimizedPrompt = await ctx.service.aiContentService.generateContent({
  taskType: 'image_prompt_optimization',
  input: { userInput: '一只猫' },
});

// 2. 使用优化后的提示词生成图片
const result = await ctx.service.imageGenerationService.generateImage({
  prompt: optimizedPrompt.content,
});
```

## 错误处理

### 常见错误

1. **API Key 无效**

   ```json
   {
     "success": false,
     "message": "Doubao API error: 401"
   }
   ```

   解决：检查 API Key 是否正确配置

2. **提示词过长**

   ```json
   {
     "success": false,
     "message": "Prompt exceeds maximum length"
   }
   ```

   解决：简化提示词，控制在合理范围内

3. **尺寸不支持**

   ```json
   {
     "success": false,
     "message": "Unsupported image size"
   }
   ```

   解决：使用模型支持的尺寸，可通过 `/api/ai/image/sizes/:modelId` 查询

4. **模型不可用**
   ```json
   {
     "success": false,
     "message": "No available image generation model found"
   }
   ```
   解决：确保至少有一个图片生成模型被启用

## 成本管理

- SeeDream 3.0：约 ¥0.02/张
- SeeDream 4.0：约 ¥0.03/张

实际成本请参考火山引擎官方定价。

所有图片生成都会记录在使用日志中，可通过管理后台查看详细的成本统计。

## 前端集成示例

### Vue 3 示例

```vue
<template>
  <div class="image-generator">
    <el-input v-model="prompt" type="textarea" placeholder="请输入图片描述..." :rows="4" />

    <el-select v-model="size" placeholder="选择尺寸">
      <el-option label="1024x1024" value="1024x1024" />
      <el-option label="2K" value="2K" />
      <el-option label="4K" value="4K" />
    </el-select>

    <el-button @click="generateImage" :loading="loading"> 生成图片 </el-button>

    <div v-if="imageUrl" class="result">
      <img :src="imageUrl" alt="Generated Image" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const prompt = ref('');
const size = ref('1024x1024');
const loading = ref(false);
const imageUrl = ref('');

const generateImage = async () => {
  loading.value = true;
  try {
    const response = await axios.post('/api/ai/image/generate', {
      prompt: prompt.value,
      size: size.value,
      responseFormat: 'url',
    });

    if (response.data.success) {
      imageUrl.value = response.data.data.images[0];
    }
  } catch (error) {
    console.error('生成失败:', error);
  } finally {
    loading.value = false;
  }
};
</script>
```

## 数据库支持

豆包文生图功能完全支持 MongoDB 和 MariaDB 双数据库模式，会自动根据配置选择对应的数据库。

## 扩展开发

### 自定义图片处理

可以在生成后对图片进行后处理：

```javascript
class CustomImageGenerationService extends ImageGenerationService {
  async generateImage(params) {
    // 调用父类生成图片
    const result = await super.generateImage(params);

    // 自定义后处理
    if (result.success && result.data.images) {
      result.data.images = await this.postProcessImages(result.data.images);
    }

    return result;
  }

  async postProcessImages(imageUrls) {
    // 实现自定义的图片处理逻辑
    // 例如：添加水印、压缩、格式转换等
    return imageUrls;
  }
}
```

## 参考链接

- [火山引擎豆包 API 文档](https://www.volcengine.com/docs/82379/1541523)
- [egg-ai-assistant 插件文档](../README.md)
- [AI 适配器使用指南](./AI_ADAPTER_USAGE.md)

## 更新日志

### v1.0.0 (2025-01-21)

- ✨ 新增豆包 SeeDream 3.0 模型支持
- ✨ 新增豆包 SeeDream 4.0 模型支持
- ✨ 新增图片生成服务和控制器
- ✨ 新增图片生成相关路由
- ✨ 新增提示词优化模板
- 📝 新增完整的 API 文档和使用示例
