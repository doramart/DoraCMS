/**
 * 图片生成服务
 * 负责调用 AI 模型生成图片
 * 支持豆包等文生图模型
 *
 * @author DoraCMS Team
 * @date 2025-01-21
 */

'use strict';

const Service = require('egg').Service;
const _ = require('lodash');

class ImageGenerationService extends Service {
  /**
   * 生成图片
   * @param {Object} params - 生成参数
   * @param {String} params.prompt - 图片描述提示词
   * @param {String} params.modelId - 模型ID（可选，不指定则根据优先级自动选择最优可用模型）
   * @param {String} params.size - 图片尺寸（可选）
   * @param {Number} params.n - 生成图片数量（可选，默认1）
   * @param {String} params.responseFormat - 响应格式：url 或 b64_json（可选）
   * @param {Boolean} params.optimizePrompt - 是否优化提示词（可选，默认false）
   * @param {String} params.language - 提示词语言（可选，默认 zh-CN）
   * @param {Object} params.extraParams - 其他额外参数（可选）
   * @return {Promise<Object>} 生成结果
   */
  async generateImage(params) {
    const { ctx } = this;

    try {
      // 验证参数
      this._validateParams(params);

      let { prompt, modelId, size, n, responseFormat, optimizePrompt, language, extraParams = {} } = params;

      // 如果需要优化提示词
      let originalPrompt = null;
      if (optimizePrompt) {
        originalPrompt = prompt;
        const optimizeResult = await this.optimizeImagePrompt(prompt, { language });
        if (optimizeResult.success) {
          prompt = optimizeResult.optimizedPrompt;
          ctx.logger.info(`[ImageGeneration] Prompt optimized: "${originalPrompt}" -> "${prompt}"`);
        } else {
          ctx.logger.warn('[ImageGeneration] Prompt optimization failed, using original prompt');
        }
      }

      // 🔥 优化：使用 modelSelector.selectWithFallback 选择最优模型
      let model, adapter;

      if (modelId) {
        // 使用指定的模型
        model = await ctx.service.aiModelManager.getModelConfig(modelId);
        if (!model) {
          throw new Error(`Model not found: ${modelId}`);
        }

        // 检查模型是否支持图片生成
        if (!this._supportsImageGeneration(model)) {
          throw new Error(`Model ${model.displayName} does not support image generation`);
        }

        // 创建适配器
        adapter = await ctx.service.aiModelManager.createAdapter(model);
      } else {
        // 🔥 自动选择最优模型，支持降级和健康检查
        const result = await ctx.service.modelSelector.selectWithFallback({
          taskType: 'image_generation',
          strategy: 'priority', // 使用优先级策略
          maxFallbackAttempts: 3,
        });

        model = result.model;
        adapter = result.adapter;
      }

      // 构建生成选项
      const options = {
        model: model.modelName,
        size: size || model.config?.size,
        n: n || 1,
        responseFormat: responseFormat || 'url',
        ...extraParams,
      };

      // 调用适配器生成图片
      const startTime = Date.now();
      const result = await adapter.generateImage(prompt, options);
      const duration = Date.now() - startTime;

      // 🔥 优化：处理豆包图片链接，提供代理访问
      let processedImages = result.content;
      if (model.provider === 'doubao' && Array.isArray(result.content)) {
        processedImages = await this._processDoubaoImages(result.content);
      }

      // 记录使用日志
      await this._logUsage({
        modelId: model._id || model.id,
        taskType: 'image_generation',
        inputData: { prompt, options },
        outputData: {
          imageCount: result.usage?.imageCount || 0,
          imageUrls: processedImages,
          originalUrls: result.content, // 保留原始链接用于调试
        },
        usage: result.usage,
        cost: result.cost,
        duration,
        success: result.success !== false,
        error: result.error,
      });

      // 更新模型统计
      await this._updateModelStatistics(model, result, duration);

      return {
        success: true,
        data: {
          images: processedImages, // 🔥 使用处理后的图片链接
          imageData: result.imageData,
          count: processedImages?.length || 0,
          model: {
            id: model._id || model.id,
            name: model.displayName,
            provider: model.provider,
          },
          metadata: result.metadata,
          ...(originalPrompt && { originalPrompt, optimizedPrompt: prompt }),
        },
        usage: result.usage,
        cost: result.cost,
      };
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] generateImage failed:', error);
      throw error;
    }
  }

  /**
   * 批量生成图片
   * @param {Array<Object>} prompts - 提示词数组，每个元素是 { prompt, size?, n? }
   * @param {String} modelId - 模型ID（可选，不指定则根据优先级自动选择最优可用模型）
   * @return {Promise<Object>} 批量生成结果
   */
  async batchGenerateImages(prompts, modelId) {
    const { ctx } = this;

    try {
      if (!Array.isArray(prompts) || prompts.length === 0) {
        throw new Error('Prompts array is required and cannot be empty');
      }

      const results = [];
      let totalCost = 0;
      let successCount = 0;
      let failCount = 0;

      for (const item of prompts) {
        try {
          const result = await this.generateImage({
            prompt: item.prompt,
            modelId,
            size: item.size,
            n: item.n,
            responseFormat: item.responseFormat,
            extraParams: item.extraParams,
          });

          results.push({
            prompt: item.prompt,
            success: true,
            data: result.data,
          });

          totalCost += result.cost || 0;
          successCount++;
        } catch (error) {
          ctx.logger.error(`[ImageGenerationService] Failed to generate image for prompt: ${item.prompt}`, error);
          results.push({
            prompt: item.prompt,
            success: false,
            error: error.message,
          });
          failCount++;
        }
      }

      return {
        success: true,
        data: {
          results,
          summary: {
            total: prompts.length,
            success: successCount,
            failed: failCount,
            totalCost,
          },
        },
      };
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] batchGenerateImages failed:', error);
      throw error;
    }
  }

  /**
   * 优化图片生成提示词
   * 将用户的简单描述转换为详细的图片生成提示词
   * @param {String} userInput - 用户输入的简单描述
   * @param {Object} options - 选项
   * @param {String} options.language - 语言（zh-CN 或 en-US，默认 zh-CN）
   * @return {Promise<Object>} 优化结果
   */
  async optimizeImagePrompt(userInput, options = {}) {
    const { ctx } = this;
    const { language = 'zh-CN' } = options;

    try {
      // 1. 渲染提示词模板
      const prompt = await ctx.service.promptManager.renderPrompt(
        'image_prompt_optimization',
        { userInput },
        { language }
      );

      // 2. 调用 AI 生成优化后的提示词
      const aiResult = await this._callTextAI(prompt, {
        taskType: 'image_prompt_optimization',
        maxTokens: 500,
        temperature: 0.7,
      });

      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI call failed');
      }

      // 3. 验证并清理返回内容（移除多余的说明文字）
      if (typeof aiResult.content !== 'string') {
        ctx.logger.error(
          '[ImageGenerationService] Invalid AI result content type:',
          typeof aiResult.content,
          aiResult.content
        );
        throw new Error(`Invalid AI result: content is ${typeof aiResult.content}, expected string`);
      }

      const optimizedPrompt = aiResult.content.trim();

      return {
        success: true,
        originalPrompt: userInput,
        optimizedPrompt,
        metadata: {
          provider: aiResult.metadata?.provider,
          model: aiResult.metadata?.model,
          cost: aiResult.cost,
          responseTime: aiResult.metadata?.responseTime,
          language,
        },
      };
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] optimizeImagePrompt failed:', error);
      return {
        success: false,
        error: error.message,
        originalPrompt: userInput,
      };
    }
  }

  /**
   * 获取支持图片生成的模型列表
   * @return {Promise<Array>} 模型列表
   */
  async getImageGenerationModels() {
    const { ctx } = this;

    try {
      const result = await ctx.service.aiModelManager.getModelList({
        page: 1,
        pageSize: 100,
        filters: {
          isEnabled: { $eq: true },
          supportedTasks: { $in: ['image_generation'] },
        },
      });

      return result?.docs || [];
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] getImageGenerationModels failed:', error);
      throw error;
    }
  }

  /**
   * 获取模型支持的图片尺寸
   * @param {String} modelId - 模型ID
   * @return {Promise<Array>} 支持的尺寸列表
   */
  async getSupportedSizes(modelId) {
    const { ctx } = this;

    try {
      const model = await ctx.service.aiModelManager.getModelConfig(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      // 从模型元数据中获取支持的尺寸
      const supportedSizes = model.metadata?.supportedSizes || [];

      // 如果没有配置，返回默认尺寸
      if (supportedSizes.length === 0) {
        return ['1024x1024'];
      }

      return supportedSizes;
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] getSupportedSizes failed:', error);
      throw error;
    }
  }

  /**
   * 验证参数
   * @param {Object} params - 参数
   * @private
   */
  _validateParams(params) {
    if (!params.prompt || typeof params.prompt !== 'string') {
      throw new Error('Valid prompt is required');
    }

    if (params.prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    if (params.n && (params.n < 1 || params.n > 10)) {
      throw new Error('Number of images (n) must be between 1 and 10');
    }

    if (params.responseFormat && !['url', 'b64_json'].includes(params.responseFormat)) {
      throw new Error('Response format must be either "url" or "b64_json"');
    }
  }

  /**
   * 检查模型是否支持图片生成
   * @param {Object} model - 模型配置
   * @return {Boolean} 是否支持
   * @private
   */
  _supportsImageGeneration(model) {
    if (!model.supportedTasks || !Array.isArray(model.supportedTasks)) {
      return false;
    }

    return model.supportedTasks.includes('image_generation') || model.supportedTasks.includes('text_to_image');
  }

  /**
   * 处理豆包图片链接，下载并上传到主应用存储系统
   * @param {Array} imageUrls - 原始图片链接数组
   * @return {Promise<Array>} 处理后的图片链接数组
   * @private
   */
  async _processDoubaoImages(imageUrls) {
    const { ctx } = this;

    try {
      const processedUrls = [];

      for (let i = 0; i < imageUrls.length; i++) {
        const originalUrl = imageUrls[i];
        ctx.logger.info(
          `[ImageGenerationService] Processing Doubao image ${i + 1}/${imageUrls.length}: ${originalUrl}`
        );

        try {
          // 下载并上传图片
          const uploadedUrl = await this._downloadAndUploadImage(originalUrl);
          processedUrls.push(uploadedUrl);

          ctx.logger.info(`[ImageGenerationService] Successfully uploaded image ${i + 1}: ${uploadedUrl}`);
        } catch (error) {
          ctx.logger.error(`[ImageGenerationService] Failed to process image ${i + 1}:`, error);
          // 如果单个图片处理失败，使用原始链接作为备用
          processedUrls.push(originalUrl);
        }
      }

      ctx.logger.info(`[ImageGenerationService] Processed ${processedUrls.length}/${imageUrls.length} Doubao images`);
      return processedUrls;
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] Failed to process Doubao images:', error);
      // 如果整体处理失败，返回原始链接
      return imageUrls;
    }
  }

  /**
   * 下载豆包图片并上传到主应用存储系统
   * @param {String} imageUrl - 豆包图片链接
   * @return {Promise<String>} 上传后的图片链接
   * @private
   */
  async _downloadAndUploadImage(imageUrl) {
    const { ctx } = this;
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    try {
      // 1. 下载图片到临时文件
      ctx.logger.info(`[ImageGenerationService] Downloading image: ${imageUrl}`);

      const response = await ctx.curl(imageUrl, {
        method: 'GET',
        timeout: 30000,
        followRedirect: true,
      });

      if (response.status !== 200) {
        throw new Error(`Failed to download image: HTTP ${response.status}`);
      }

      // 2. 生成临时文件名
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const extension = this._getImageExtension(contentType);
      const tempFileName = `doubao_${timestamp}_${randomSuffix}${extension}`;
      const tempFilePath = path.join(os.tmpdir(), tempFileName);

      // 3. 保存到临时文件
      fs.writeFileSync(tempFilePath, response.data);
      ctx.logger.info(`[ImageGenerationService] Saved to temp file: ${tempFilePath}`);

      try {
        // 4. 调用主应用的上传接口
        const uploadResult = await this._uploadImageFile(tempFilePath, tempFileName);

        // 5. 清理临时文件
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        return uploadResult;
      } catch (uploadError) {
        // 确保清理临时文件
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw uploadError;
      }
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] Download and upload failed:', error);
      throw error;
    }
  }

  /**
   * 根据 Content-Type 获取图片扩展名
   * @param {String} contentType - MIME 类型
   * @return {String} 文件扩展名
   * @private
   */
  _getImageExtension(contentType) {
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
    };

    return mimeToExt[contentType.toLowerCase()] || '.jpg';
  }

  /**
   * 上传图片文件到主应用存储系统
   * @param {String} filePath - 本地文件路径
   * @param {String} fileName - 文件名
   * @return {Promise<String>} 上传后的图片链接
   * @private
   */
  async _uploadImageFile(filePath, fileName) {
    const { ctx } = this;
    const fs = require('fs');
    const path = require('path');

    try {
      // 🔥 直接调用上传服务，避免 HTTP 调用的认证和格式问题
      ctx.logger.info(`[ImageGenerationService] Uploading file via uploadFile service: ${fileName}`);

      // 获取上传配置
      const uploadConfigInfo = await this._getUploadInfoByType(ctx);

      let returnPath;

      if (uploadConfigInfo.type === 'local') {
        // 本地存储
        const options = ctx.app.config.doraUploadFile?.uploadFileFormat || {};
        const publicDir = options.upload_path || process.cwd() + '/app/public';
        const uploadForder = 'upload/ai-generated';
        const uploadPath = `${publicDir}/${uploadForder}`;

        // 确保目录存在
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        // 复制文件到目标位置
        const targetPath = path.join(uploadPath, fileName);
        fs.copyFileSync(filePath, targetPath);

        returnPath = `${ctx.app.config.static.prefix}/${uploadForder}/${fileName}`;
      } else if (uploadConfigInfo.type === 'qn') {
        // 七牛云存储
        const options = ctx.app.config.doraUploadFile?.uploadFileFormat || {};
        const currentUploadForder = options.static_root_path
          ? `${options.static_root_path}/upload/ai-generated`
          : 'upload/ai-generated';
        const targetKey = path.join(currentUploadForder, fileName);

        returnPath = await this._uploadByQiniu('realPath', filePath, targetKey, uploadConfigInfo);
      } else if (uploadConfigInfo.type === 'oss') {
        // 阿里云 OSS 存储
        const options = ctx.app.config.doraUploadFile?.uploadFileFormat || {};
        const currentUploadForder = options.static_root_path
          ? `${options.static_root_path}/upload/ai-generated`
          : 'upload/ai-generated';
        const targetKey = path.join(currentUploadForder, fileName);

        returnPath = await this._uploadByAliOss('realPath', filePath, targetKey, uploadConfigInfo);
      }

      if (!returnPath) {
        throw new Error('Upload failed: No return path');
      }

      ctx.logger.info(`[ImageGenerationService] Successfully uploaded: ${returnPath}`);

      // 如果是相对路径，转换为完整URL
      if (returnPath.startsWith('/') || returnPath.startsWith('./')) {
        return `${ctx.protocol}://${ctx.host}${returnPath}`;
      }

      return returnPath;
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] Upload file failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * 获取上传配置信息
   * @param {Object} ctx - 上下文对象
   * @return {Promise<Object>} 上传配置信息
   * @private
   */
  async _getUploadInfoByType(ctx) {
    try {
      const uploadConfig = await ctx.service.uploadFile.find({ isPaging: '0' }, { filters: {} });

      let uploadInfo = {};
      if (!_.isEmpty(uploadConfig)) {
        uploadInfo = uploadConfig[0];
      } else {
        // 如果没有，则创建一个本地配置
        uploadInfo = await ctx.service.uploadFile.create({
          type: 'local',
          uploadPath: process.cwd() + '/app/public',
        });
      }
      return uploadInfo;
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] Failed to get upload config:', error);
      // 返回默认本地配置
      return {
        type: 'local',
        uploadPath: process.cwd() + '/app/public',
      };
    }
  }

  /**
   * 上传到七牛云
   * @param {String} dataType - 数据类型
   * @param {String} filePath - 文件路径
   * @param {String} targetKey - 目标键
   * @param {Object} uploadConfigInfo - 上传配置
   * @return {Promise<String>} 上传后的URL
   * @private
   */
  async _uploadByQiniu(dataType, filePath, targetKey, uploadConfigInfo) {
    const qiniu = require('qiniu');

    return new Promise((resolve, reject) => {
      const config = new qiniu.conf.Config();
      const { qn_bucket, qn_accessKey, qn_secretKey, qn_zone, qn_endPoint } = uploadConfigInfo;

      // 空间对应的机房
      config.zone = qiniu.zone[qn_zone];
      config.useHttpsDomain = true;

      const bucket = qn_bucket;
      const accessKey = qn_accessKey;
      const secretKey = qn_secretKey;
      const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
      const options = { scope: bucket + ':' + targetKey };
      const putPolicy = new qiniu.rs.PutPolicy(options);
      const uploadToken = putPolicy.uploadToken(mac);

      const formUploader = new qiniu.form_up.FormUploader(config);
      const putExtra = new qiniu.form_up.PutExtra();

      formUploader.putFile(uploadToken, targetKey, filePath, putExtra, function (respErr, respBody, respInfo) {
        if (respErr) {
          reject(respErr);
        } else if (respInfo.statusCode === 200) {
          if (!_.isEmpty(respBody) && qn_endPoint) {
            // 删除本地临时文件
            const fs = require('fs');
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            resolve(`${qn_endPoint}/${respBody.key}`);
          } else {
            reject(new Error('Upload qiniu failed'));
          }
        } else {
          reject(new Error(respBody));
        }
      });
    });
  }

  /**
   * 上传到阿里云OSS
   * @param {String} dataType - 数据类型
   * @param {String} filePath - 文件路径
   * @param {String} targetKey - 目标键
   * @param {Object} uploadConfigInfo - 上传配置
   * @return {Promise<String>} 上传后的URL
   * @private
   */
  async _uploadByAliOss(dataType, filePath, targetKey, uploadConfigInfo) {
    const OSS = require('ali-oss');
    const fs = require('fs');

    try {
      const { oss_bucket, oss_accessKey, oss_secretKey, oss_region } = uploadConfigInfo;
      const clientOss = new OSS({
        region: oss_region,
        bucket: oss_bucket,
        accessKeyId: oss_accessKey,
        accessKeySecret: oss_secretKey,
      });

      const result = await clientOss.put(targetKey, filePath);

      // 删除本地临时文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      let targetUrl = result.url;
      if (targetUrl.indexOf('http://') >= 0) {
        targetUrl = targetUrl.replace('http://', 'https://');
      }
      return targetUrl;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * 记录使用日志
   * @param {Object} logData - 日志数据
   * @private
   */
  async _logUsage(logData) {
    const { ctx } = this;

    try {
      const aiUsageLogRepo = ctx.app.repositoryFactory.createRepository('AIUsageLog', ctx);

      // 🔥 修复：提供必填字段和正确的字段映射
      await aiUsageLogRepo.create({
        // 必填字段
        userId: ctx.state.user?.id || ctx.state.admin?.id || 0, // 获取当前用户ID
        input: logData.inputData, // 修正字段名：inputData -> input

        // 基本信息
        modelId: logData.modelId,
        taskType: logData.taskType,

        // 输出信息
        output: logData.outputData, // 修正字段名：outputData -> output

        // 执行状态 - 使用正确的枚举值
        status: logData.success ? 'success' : 'failure',
        errorMessage: logData.error,

        // Token 和成本信息
        inputTokens: 0, // 图片生成不使用 input tokens
        outputTokens: 0, // 图片生成不使用 output tokens
        totalTokens: 0, // 图片生成不使用 tokens
        cost: logData.cost || 0,

        // 性能指标
        responseTime: logData.duration || 0,
        retryCount: 0,
        isFallback: false,

        // 时间信息
        startTime: logData.startTime || new Date(),
        endTime: logData.endTime || new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] Failed to log usage:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 调用文本生成 AI（用于提示词优化等）
   * @param {String} prompt - 提示词
   * @param {Object} options - 选项
   * @return {Promise<Object>} AI 调用结果
   * @private
   */
  async _callTextAI(prompt, options = {}) {
    const { ctx } = this;
    const { taskType, maxTokens = 500, temperature = 0.7 } = options;

    try {
      // 选择最优的文本生成模型（使用 balanced 策略）
      const { model, adapter } = await ctx.service.modelSelector.selectWithFallback({
        taskType: taskType || 'text_generation',
        strategy: 'balanced',
        maxFallbackAttempts: 3,
      });

      // 验证选择的不是纯图片生成模型
      const supportedTasks = model.supportedTasks || [];
      const isImageGenerationModel =
        supportedTasks.includes('image_generation') || supportedTasks.includes('text_to_image');
      const isTextGenerationModel =
        supportedTasks.includes('text_generation') ||
        supportedTasks.some(task => task.includes('generation') && !task.includes('image'));

      if (isImageGenerationModel && !isTextGenerationModel) {
        throw new Error(
          `Selected model ${model.provider}/${model.modelName} is for image generation, not text generation`
        );
      }

      // 调用 AI
      const result = await adapter.generateWithRetry(prompt, {
        model: model.modelName,
        maxTokens,
        temperature,
      });

      // 验证返回结果的内容是字符串类型
      if (result.success && typeof result.content !== 'string') {
        ctx.logger.error(
          '[ImageGenerationService] Invalid response type from text AI, content is not string:',
          typeof result.content
        );
        throw new Error('Text AI returned non-string content');
      }

      // 记录统计
      if (result.success) {
        await ctx.service.aiModelManager.recordModelUsage(model.id || model._id, {
          tokens: result.usage?.totalTokens || 0,
          cost: result.cost,
          responseTime: result.metadata?.responseTime,
          success: true,
        });
      }

      return result;
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] _callTextAI failed:', error);
      throw error;
    }
  }

  /**
   * 更新模型统计信息
   * @param {Object} model - 模型配置
   * @param {Object} result - 生成结果
   * @param {Number} duration - 耗时（毫秒）
   * @private
   */
  async _updateModelStatistics(model, result, duration) {
    const { ctx } = this;

    try {
      const aiModelRepo = ctx.app.repositoryFactory.createRepository('AIModel', ctx);

      const statistics = model.statistics || {};
      const totalCalls = (statistics.totalCalls || 0) + 1;
      const successCalls = result.success !== false ? (statistics.successCalls || 0) + 1 : statistics.successCalls || 0;
      const totalCost = (statistics.totalCost || 0) + (result.cost || 0);
      const totalResponseTime = (statistics.averageResponseTime || 0) * (statistics.totalCalls || 0) + duration;

      const updatedStatistics = {
        ...statistics,
        totalCalls,
        successCalls,
        totalCost,
        averageResponseTime: Math.round(totalResponseTime / totalCalls),
        successRate: totalCalls > 0 ? successCalls / totalCalls : 1.0,
        lastUsedAt: new Date(),
      };

      await aiModelRepo.update(model._id || model.id, {
        statistics: updatedStatistics,
      });
    } catch (error) {
      ctx.logger.error('[ImageGenerationService] Failed to update model statistics:', error);
      // 不抛出错误，避免影响主流程
    }
  }
}

module.exports = ImageGenerationService;
