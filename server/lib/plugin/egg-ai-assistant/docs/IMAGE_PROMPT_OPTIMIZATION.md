# 图片生成提示词优化功能

## 📋 概述

图片生成提示词优化功能可以将用户的简单描述转换为详细、专业的图片生成提示词，从而获得更好的图片生成效果。

**功能特点**:

- 支持中文和英文提示词优化
- 自动添加场景、风格、光影、色彩等要素
- 使用专业的摄影或艺术术语
- 支持独立调用或集成到图片生成流程

---

## 🔧 功能实现

### 1. 提示词模板

**中文模板**: `image_prompt_optimization.zh-CN.json`

```json
{
  "name": "图片生成提示词优化",
  "taskType": "image_prompt_optimization",
  "language": "zh-CN",
  "description": "将用户的简单描述转换为详细的图片生成提示词",
  "template": "你是一位专业的AI图片生成提示词专家。请根据用户提供的简单描述，生成一个详细、具体的图片生成提示词。\n\n要求：\n1. 包含主体、场景、风格、光影、色彩等要素\n2. 使用专业的摄影或艺术术语\n3. 描述要具体、形象，避免抽象和模糊\n4. 长度控制在50-200字之间\n5. 只返回优化后的提示词，不要其他说明文字\n\n用户描述：{{userInput}}\n\n优化后的提示词："
}
```

**英文模板**: `image_prompt_optimization.en-US.json`

```json
{
  "name": "Image Generation Prompt Optimization",
  "taskType": "image_prompt_optimization",
  "language": "en-US",
  "description": "Convert user's simple description into detailed image generation prompt",
  "template": "You are a professional AI image generation prompt expert. Please convert the user's simple description into a detailed and specific image generation prompt.\n\nRequirements:\n1. Include elements such as subject, scene, style, lighting, and color\n2. Use professional photography or art terminology\n3. Be specific and vivid, avoid abstract and vague descriptions\n4. Keep the length between 50-200 words\n5. Return only the optimized prompt without additional explanations\n\nUser description: {{userInput}}\n\nOptimized prompt:"
}
```

### 2. Service 层实现

**文件**: `app/service/imageGenerationService.js`

#### 核心方法

##### `optimizeImagePrompt(userInput, options)`

将用户的简单描述转换为详细的图片生成提示词。

**参数**:

- `userInput` (String): 用户输入的简单描述
- `options` (Object): 选项
  - `language` (String): 语言，支持 `zh-CN` 或 `en-US`，默认 `zh-CN`

**返回**:

```javascript
{
  success: true,
  originalPrompt: "一只猫",
  optimizedPrompt: "一只优雅的橘色短毛猫，蜷缩在温暖的阳光下...",
  metadata: {
    provider: "deepseek",
    model: "deepseek-chat",
    cost: 0.0001,
    responseTime: 1234,
    language: "zh-CN"
  }
}
```

##### `generateImage(params)` - 增强版

现在支持自动提示词优化功能。

**新增参数**:

- `optimizePrompt` (Boolean): 是否优化提示词，默认 `false`
- `language` (String): 提示词语言，默认 `zh-CN`

**工作流程**:

1. 如果 `optimizePrompt` 为 `true`，先调用 `optimizeImagePrompt` 优化提示词
2. 使用优化后的提示词生成图片
3. 在返回结果中包含原始提示词和优化后的提示词

**示例代码**:

```javascript
// Service 层
const result = await ctx.service.imageGenerationService.generateImage({
  prompt: '一只猫',
  optimizePrompt: true,
  language: 'zh-CN',
  modelId: '豆包模型ID',
  size: '1024x1024',
  n: 1,
});

console.log(result.data.originalPrompt); // "一只猫"
console.log(result.data.optimizedPrompt); // "一只优雅的橘色短毛猫..."
console.log(result.data.images); // [{ url: "...", index: 0 }]
```

##### `_callTextAI(prompt, options)` - 私有方法

调用文本生成 AI（用于提示词优化等）。

**参数**:

- `prompt` (String): 提示词
- `options` (Object):
  - `taskType` (String): 任务类型
  - `maxTokens` (Number): 最大 tokens，默认 500
  - `temperature` (Number): 温度，默认 0.7

**说明**:

- 使用 `modelSelector` 自动选择最优的文本生成模型
- 支持自动重试
- 记录使用统计

### 3. Controller 层实现

**文件**: `app/controller/imageGeneration.js`

#### `optimizePrompt()` - 新增接口

独立的提示词优化接口。

**请求示例**:

```bash
POST /api/ai/image/optimize-prompt
Content-Type: application/json

{
  "prompt": "一只猫",
  "language": "zh-CN"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "originalPrompt": "一只猫",
    "optimizedPrompt": "一只优雅的橘色短毛猫，蜷缩在温暖的阳光下，柔和的自然光从窗户洒在它的毛发上，产生金色的光晕，背景是简约的现代家居环境，景深效果突出主体，专业摄影，高清画质。",
    "metadata": {
      "provider": "deepseek",
      "model": "deepseek-chat",
      "cost": 0.0001,
      "responseTime": 1234,
      "language": "zh-CN"
    }
  }
}
```

#### `generateImage()` - 增强版

现在支持自动提示词优化。

**新增参数验证**:

```javascript
ctx.validate(
  {
    prompt: { type: 'string', required: true },
    modelId: { type: 'string', required: false },
    size: { type: 'string', required: false },
    n: { type: 'number', required: false },
    responseFormat: { type: 'string', required: false },
    optimizePrompt: { type: 'boolean', required: false }, // 新增
    language: { type: 'string', required: false }, // 新增
  },
  params
);
```

### 4. 路由配置

**管理端路由** (`app/router/manage/ai.js`):

```javascript
// 优化提示词
router.post(`${prefix}/ai/image/optimize-prompt`, imageGeneration.optimizePrompt);

// 生成图片（支持 optimizePrompt 参数）
router.post(`${prefix}/ai/image/generate`, imageGeneration.generateImage);
```

**公开 API 路由** (`app/router/api/ai.js`):

```javascript
// 优化提示词（可选 API Token 认证）
if (authApiToken) {
  router.post(`${prefix}/ai/image/optimize-prompt`, authApiToken, imageGeneration.optimizePrompt);
} else {
  router.post(`${prefix}/ai/image/optimize-prompt`, imageGeneration.optimizePrompt);
}

// 生成图片（支持 optimizePrompt 参数）
if (authApiToken) {
  router.post(`${prefix}/ai/image/generate`, authApiToken, imageGeneration.generateImage);
} else {
  router.post(`${prefix}/ai/image/generate`, imageGeneration.generateImage);
}
```

---

## 🚀 使用方式

### 方式一：独立调用提示词优化

**适用场景**: 用户想先查看优化后的提示词，再决定是否生成图片。

```bash
# 1. 优化提示词
curl -X POST http://localhost:7001/api/ai/image/optimize-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只猫",
    "language": "zh-CN"
  }'

# 响应
{
  "success": true,
  "data": {
    "originalPrompt": "一只猫",
    "optimizedPrompt": "一只优雅的橘色短毛猫，蜷缩在温暖的阳光下...",
    "metadata": {...}
  }
}

# 2. 使用优化后的提示词生成图片
curl -X POST http://localhost:7001/api/ai/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只优雅的橘色短毛猫，蜷缩在温暖的阳光下...",
    "modelId": "豆包模型ID",
    "size": "1024x1024"
  }'
```

### 方式二：自动优化并生成

**适用场景**: 用户希望系统自动优化提示词并生成图片，一步到位。

```bash
curl -X POST http://localhost:7001/api/ai/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只猫",
    "optimizePrompt": true,
    "language": "zh-CN",
    "modelId": "豆包模型ID",
    "size": "1024x1024"
  }'
```

**响应**:

```json
{
  "success": true,
  "data": {
    "images": [
      { "url": "https://...", "index": 0 }
    ],
    "count": 1,
    "model": {
      "id": "...",
      "name": "豆包 SeeDream 4.0",
      "provider": "doubao"
    },
    "originalPrompt": "一只猫",
    "optimizedPrompt": "一只优雅的橘色短毛猫，蜷缩在温暖的阳光下...",
    "metadata": {...}
  },
  "usage": { "imageCount": 1 },
  "cost": 0.03
}
```

---

## 📊 优化示例

### 中文优化

| 原始输入 | 优化后提示词                                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 一只猫   | 一只优雅的橘色短毛猫，蜷缩在温暖的阳光下，柔和的自然光从窗户洒在它的毛发上，产生金色的光晕，背景是简约的现代家居环境，景深效果突出主体，专业摄影，高清画质。                       |
| 未来城市 | 赛博朋克风格的未来都市夜景，高耸入云的摩天大楼上布满霓虹灯广告牌，飞行器在空中穿梭，地面潮湿的街道反射着五彩斑斓的光芒，浓重的科技感与工业风格，电影级构图，超现实主义，8K分辨率。 |
| 森林小屋 | 童话风格的森林深处小木屋，周围环绕着参天古树和缠绕的藤蔓，温暖的灯光从窗户透出，门前铺着青石小路，远处朦胧的雾气增添神秘感，魔幻现实主义，细节丰富，奇幻插画风格。                 |

### 英文优化

| 原始输入        | 优化后提示词                                                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a cat           | An elegant orange short-haired cat, curled up in warm sunlight, soft natural light streaming through the window creating a golden halo on its fur, simple modern home interior background, shallow depth of field highlighting the subject, professional photography, high-definition quality. |
| futuristic city | Cyberpunk-style futuristic city night scene, towering skyscrapers covered with neon advertising boards, flying vehicles shuttling through the air, wet streets reflecting colorful lights, heavy tech and industrial style, cinematic composition, surrealism, 8K resolution.                  |
| forest cabin    | Fairy-tale style wooden cabin deep in the forest, surrounded by towering ancient trees and tangled vines, warm light glowing from windows, cobblestone path in front, distant misty atmosphere adding mystery, magical realism, rich in details, fantasy illustration style.                   |

---

## 💡 最佳实践

### 1. 何时使用提示词优化？

**建议使用**:

- 用户输入简单、模糊的描述
- 希望获得更专业、艺术化的图片效果
- 用户不熟悉图片生成提示词的编写

**不建议使用**:

- 用户已经提供了详细、专业的提示词
- 对生成结果有非常明确的要求
- 需要保持用户原始意图的精确性

### 2. 语言选择

- **中文 (`zh-CN`)**: 适合中文用户，优化后的提示词更符合中文表达习惯
- **英文 (`en-US`)**: 适合英文用户，且某些图片生成模型对英文提示词效果更好

### 3. 成本考虑

每次提示词优化需要调用文本生成 AI，会产生额外成本：

- **预估成本**: ¥0.0001 - ¥0.001（取决于使用的文本生成模型）
- **建议**: 对于批量生成，可以先优化一次提示词，然后多次使用

### 4. 缓存优化

考虑对常用的简单描述建立缓存：

```javascript
const cacheKey = `prompt_opt:${language}:${userInput}`;
const cached = await app.cache.get(cacheKey);
if (cached) {
  return cached;
}
// ... 调用优化
await app.cache.set(cacheKey, result, 86400); // 缓存1天
```

---

## 🔍 技术细节

### 工作流程

```
用户输入简单描述
    ↓
调用 optimizeImagePrompt()
    ↓
使用 promptManager 渲染模板
(将 userInput 填充到 image_prompt_optimization 模板)
    ↓
调用 _callTextAI()
(使用 modelSelector 选择文本生成模型)
    ↓
文本生成模型返回优化后的提示词
    ↓
清理和格式化输出
    ↓
返回优化结果
```

### AI 模型选择

提示词优化使用文本生成模型，通过 `modelSelector.selectWithFallback()` 自动选择：

**优先级**（基于 `balanced` 策略）:

1. DeepSeek Chat（性价比高）
2. OpenAI GPT-3.5/4.0
3. 其他支持 `text_generation` 的模型

**配置参数**:

- `maxTokens`: 500（足够生成详细的提示词）
- `temperature`: 0.7（平衡创造性和稳定性）
- `strategy`: 'balanced'（平衡成本和质量）

### 错误处理

提示词优化失败时的处理：

```javascript
if (optimizePrompt) {
  const optimizeResult = await this.optimizeImagePrompt(prompt, { language });
  if (optimizeResult.success) {
    prompt = optimizeResult.optimizedPrompt;
    ctx.logger.info(`[ImageGeneration] Prompt optimized`);
  } else {
    // 失败时使用原始提示词，不中断流程
    ctx.logger.warn('[ImageGeneration] Prompt optimization failed, using original prompt');
  }
}
```

---

## 📝 数据库配置

提示词模板已添加到数据库：

**MongoDB**:

- ID: `Nc4GDNpgx` (zh-CN)
- ID: `JjKOEq7f3g` (en-US)

**MariaDB**:

- 自增 ID（根据插入顺序）

**导入脚本**:

- MongoDB: `/server/scripts/add-image-prompt-templates-mongodb.js`
- MariaDB: `/server/scripts/add-image-prompt-templates-mariadb.js`

---

## 🎯 总结

提示词优化功能完整实现了：

✅ **数据层**: 提示词模板已添加到 MongoDB 和 MariaDB  
✅ **Service 层**: `optimizeImagePrompt()` 和 `_callTextAI()` 方法  
✅ **Controller 层**: `optimizePrompt()` 接口和 `generateImage()` 增强  
✅ **路由层**: 管理端和公开 API 路由配置  
✅ **集成**: 支持独立调用和自动优化两种方式

用户现在可以：

1. 独立调用提示词优化接口
2. 在图片生成时自动优化提示词
3. 选择中文或英文优化
4. 在返回结果中查看原始和优化后的提示词

---

**文档版本**: 1.0  
**最后更新**: 2025-01-21  
**作者**: DoraCMS Team
