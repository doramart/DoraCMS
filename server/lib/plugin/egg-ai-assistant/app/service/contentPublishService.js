/**
 * Content Publish Service - AI 辅助发布服务（插件版本）
 *
 * 提供三种发布模式：
 * 1. manual - 传统手动发布（默认）
 * 2. ai_smart - AI 智能辅助发布（AI 增强元数据，用户提供基础内容）
 * 3. ai_full - AI 完全发布（AI 自动生成所有元数据和优化）
 *
 * @author DoraCMS Team
 * @since 2025-01-11
 */

'use strict';

const Service = require('egg').Service;
const _ = require('lodash');
const shortid = require('shortid');
const CategoryHelper = require('../utils/categoryHelper');

class ContentPublishService extends Service {
  /**
   * 统一的内容发布接口
   *
   * @param {Object} contentData - 内容数据
   * @param {String} publishMode - 发布模式：manual | ai_smart | ai_full
   * @param {Object} options - 可选配置
   * @param {Boolean} options.regenerateTitle - 是否重新生成标题
   * @param {Boolean} options.regenerateSummary - 是否重新生成摘要
   * @param {Boolean} options.regenerateTags - 是否重新生成标签
   * @param {Boolean} options.autoCategory - 是否自动匹配分类
   * @param {Boolean} options.seoOptimize - 是否进行 SEO 优化
   * @param {Boolean} options.qualityCheck - 是否进行质量检查
   * @return {Promise<Object>} 发布结果
   */
  async publishContent(contentData, publishMode = 'manual', options = {}) {
    const { ctx } = this;

    ctx.logger.info(`[ContentPublishService] Publishing content in ${publishMode} mode`);

    // 根据发布模式选择处理流程
    switch (publishMode) {
      case 'ai_smart':
        return await this.publishWithAISmartMode(contentData, options);

      case 'ai_full':
        return await this.publishWithAIFullMode(contentData, options);

      case 'manual':
      default:
        return await this.publishManually(contentData, options);
    }
  }

  /**
   * 传统手动发布模式
   * 保持原有的发布逻辑不变，向后兼容
   *
   * @param {Object} contentData - 内容数据
   * @param {Object} options - 可选配置
   * @return {Promise<Object>} 发布结果
   */
  async publishManually(contentData) {
    const { ctx } = this;

    ctx.logger.info('[ContentPublishService] Manual publish mode');

    try {
      // 直接返回原始内容，不做任何 AI 增强处理
      const result = {
        success: true,
        mode: 'manual',
        content: contentData,
        aiEnhancements: {
          used: false,
        },
      };

      return result;
    } catch (error) {
      ctx.logger.error('[ContentPublishService] Manual publish failed:', error);
      throw error;
    }
  }

  /**
   * AI 智能辅助发布模式
   * 用户提供基础内容，AI 增强元数据
   *
   * @param {Object} contentData - 内容数据
   * @param {Object} options - 可选配置
   * @return {Promise<Object>} 发布结果
   */
  async publishWithAISmartMode(contentData, options = {}) {
    const { ctx } = this;

    ctx.logger.info('[ContentPublishService] AI Smart mode - AI-assisted publishing');

    const enhancedData = { ...contentData };
    const aiEnhancements = {
      used: true,
      titleGenerated: false,
      summaryGenerated: false,
      tagsGenerated: false,
      categoryMatched: false,
      coverImageGenerated: false,
      seoOptimized: false,
      qualityChecked: false,
    };

    try {
      // 检查 AI 服务是否可用
      const aiAvailable = await this._isAIServiceAvailable();

      if (!aiAvailable) {
        ctx.logger.warn('[ContentPublishService] AI service not available, falling back to manual mode');
        return await this.publishManually(contentData, options);
      }

      // 1. 生成标题（如果需要）
      if ((!enhancedData.title || options.regenerateTitle) && enhancedData.comments) {
        ctx.logger.info('[ContentPublishService] Generating title with AI...');

        try {
          const titleResult = await this.service.aiContentService.generateTitle(enhancedData.comments, options);
          if (titleResult && titleResult.success) {
            enhancedData.title = titleResult.title;
            enhancedData.stitle = titleResult.title;
            aiEnhancements.titleGenerated = true;
            aiEnhancements.titleMetadata = titleResult.metadata;

            ctx.logger.info('[ContentPublishService] Title generated successfully:', titleResult.title);
          }
        } catch (error) {
          ctx.logger.error('[ContentPublishService] Title generation failed:', error.message);
          // 失败不影响发布，继续流程
        }
      }

      // 2. 生成摘要（如果需要）
      if ((!enhancedData.discription || options.regenerateSummary) && enhancedData.comments) {
        ctx.logger.info('[ContentPublishService] Generating summary with AI...');

        try {
          const summaryResult = await this.service.aiContentService.generateSummary(enhancedData.comments, options);
          if (summaryResult && summaryResult.success) {
            enhancedData.discription = summaryResult.summary;
            aiEnhancements.summaryGenerated = true;
            aiEnhancements.summaryMetadata = summaryResult.metadata;

            ctx.logger.info('[ContentPublishService] Summary generated successfully');
          }
        } catch (error) {
          ctx.logger.error('[ContentPublishService] Summary generation failed:', error.message);
        }
      }

      // 2.5. 生成封面图（如果需要）🔥 新增
      if ((!enhancedData.sImg || options.generateCoverImage) && (enhancedData.discription || enhancedData.title)) {
        ctx.logger.info('[ContentPublishService] Generating cover image with AI...');

        try {
          const coverImageResult = await this._generateCoverImage(enhancedData);
          if (coverImageResult && coverImageResult.success) {
            enhancedData.sImg = coverImageResult.imageUrl;
            aiEnhancements.coverImageGenerated = true;
            aiEnhancements.coverImageMetadata = coverImageResult.metadata;

            ctx.logger.info('[ContentPublishService] Cover image generated successfully:', coverImageResult.imageUrl);
          }
        } catch (error) {
          ctx.logger.error('[ContentPublishService] Cover image generation failed:', error.message);
          // 失败不影响发布，继续流程
        }
      }

      // 3. 提取标签（如果需要）
      if ((!enhancedData.tags || enhancedData.tags.length === 0 || options.regenerateTags) && enhancedData.comments) {
        ctx.logger.info('[ContentPublishService] Extracting tags with AI...');

        try {
          const tagsResult = await this.service.aiContentService.extractTags(
            enhancedData.simpleComments || enhancedData.comments,
            options
          );
          if (tagsResult && tagsResult.success) {
            // 处理标签，创建不存在的标签
            const tagIds = await this._processAITags(tagsResult.tags);
            enhancedData.tags = tagIds;
            enhancedData.aiGeneratedTags = tagsResult.tags; // 保存原始标签名用于显示
            aiEnhancements.tagsGenerated = true;
            aiEnhancements.tagsMetadata = tagsResult.metadata;

            ctx.logger.info('[ContentPublishService] Tags extracted successfully:', tagsResult.tags);
          }
        } catch (error) {
          ctx.logger.error('[ContentPublishService] Tag extraction failed:', error.message);
        }
      }

      // 4. 智能分类匹配（如果需要）
      if ((!enhancedData.categories || options.autoCategory) && enhancedData.comments) {
        ctx.logger.info('[ContentPublishService] Matching category with AI...');

        try {
          const categoryResult = await this._matchCategory(
            enhancedData.simpleComments || enhancedData.comments,
            enhancedData.title || '',
            enhancedData.aiGeneratedTags || []
          );
          if (categoryResult && categoryResult.success) {
            // 🔥 使用父子ID数组而不是单个ID
            enhancedData.categories = categoryResult.categoryPath || [categoryResult.categoryId];
            aiEnhancements.categoryMatched = true;
            aiEnhancements.categoryMetadata = categoryResult.metadata;

            ctx.logger.info(
              `[ContentPublishService] Category matched successfully: ${categoryResult.categoryName}, path: [${enhancedData.categories.join(', ')}]`
            );
          }
        } catch (error) {
          ctx.logger.error('[ContentPublishService] Category matching failed:', error.message);
        }
      }

      // 5. SEO 优化（如果需要）
      if (options.seoOptimize && enhancedData.comments) {
        ctx.logger.info('[ContentPublishService] Optimizing SEO with AI...');

        try {
          const seoResult = await this._optimizeSEO(enhancedData);
          if (seoResult && seoResult.success) {
            // 更新 SEO 相关字段
            if (seoResult.keywords) {
              enhancedData.keywords = seoResult.keywords;
            }
            if (seoResult.optimizedTitle) {
              enhancedData.title = seoResult.optimizedTitle;
            }
            if (seoResult.optimizedDescription) {
              enhancedData.discription = seoResult.optimizedDescription;
            }

            aiEnhancements.seoOptimized = true;
            aiEnhancements.seoMetadata = seoResult.metadata;

            ctx.logger.info('[ContentPublishService] SEO optimized successfully');
          }
        } catch (error) {
          ctx.logger.error('[ContentPublishService] SEO optimization failed:', error.message);
        }
      }

      // 6. 内容质量检查（如果需要）
      if (options.qualityCheck && enhancedData.comments) {
        ctx.logger.info('[ContentPublishService] Checking content quality with AI...');

        try {
          const qualityResult = await this._checkContentQuality(enhancedData);
          if (qualityResult && qualityResult.success) {
            aiEnhancements.qualityChecked = true;
            aiEnhancements.qualityScore = qualityResult.score;
            aiEnhancements.qualitySuggestions = qualityResult.suggestions;
            aiEnhancements.qualityMetadata = qualityResult.metadata;

            ctx.logger.info('[ContentPublishService] Quality check completed, score:', qualityResult.score);
          }
        } catch (error) {
          ctx.logger.error('[ContentPublishService] Quality check failed:', error.message);
        }
      }

      // 返回增强后的内容和 AI 元数据
      return {
        success: true,
        mode: 'ai_smart',
        content: enhancedData,
        aiEnhancements,
      };
    } catch (error) {
      ctx.logger.error('[ContentPublishService] AI Smart mode failed, falling back to manual:', error);
      // AI 增强失败，降级到手动模式
      return await this.publishManually(contentData, options);
    }
  }

  /**
   * AI 完全发布模式
   * AI 自动生成所有元数据和优化
   *
   * @param {Object} contentData - 内容数据
   * @param {Object} options - 可选配置
   * @return {Promise<Object>} 发布结果
   */
  async publishWithAIFullMode(contentData, options = {}) {
    const { ctx } = this;

    ctx.logger.info('[ContentPublishService] AI Full mode - Fully automated publishing');

    // AI 完全模式强制启用所有 AI 功能
    const fullOptions = {
      ...options,
      regenerateTitle: true,
      regenerateSummary: true,
      regenerateTags: true,
      autoCategory: true,
      generateCoverImage: true, // 🔥 新增：自动生成封面图
      seoOptimize: true,
      qualityCheck: true,
    };

    // 调用 AI Smart 模式，但强制生成所有字段
    return await this.publishWithAISmartMode(contentData, fullOptions);
  }

  /**
   * 批量 AI 增强发布
   *
   * @param {Array} contentList - 内容列表
   * @param {String} publishMode - 发布模式
   * @param {Object} options - 可选配置
   * @return {Promise<Object>} 批量发布结果
   */
  async batchPublish(contentList, publishMode = 'ai_smart', options = {}) {
    const { ctx } = this;

    ctx.logger.info(`[ContentPublishService] Batch publishing ${contentList.length} items in ${publishMode} mode`);

    const results = {
      success: true,
      total: contentList.length,
      succeeded: 0,
      failed: 0,
      items: [],
    };

    try {
      // 并行处理（限制并发数）
      const batchSize = options.batchSize || 3; // 每次处理 3 个

      for (let i = 0; i < contentList.length; i += batchSize) {
        const batch = contentList.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map(content => this.publishContent(content, publishMode, options))
        );

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            results.succeeded++;
            results.items.push({
              index: i + index,
              success: true,
              content: result.value.content,
              aiEnhancements: result.value.aiEnhancements,
            });
          } else {
            results.failed++;
            results.items.push({
              index: i + index,
              success: false,
              error: result.reason || result.value.error,
            });
          }
        });

        // 添加延迟，避免 API 限流
        if (i + batchSize < contentList.length) {
          await this._sleep(1000); // 1 秒延迟
        }
      }

      ctx.logger.info(
        `[ContentPublishService] Batch publish completed: ${results.succeeded}/${results.total} succeeded`
      );

      return results;
    } catch (error) {
      ctx.logger.error('[ContentPublishService] Batch publish failed:', error);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 检查 AI 服务是否可用
   * @return {Promise<Boolean>}
   * @private
   */
  async _isAIServiceAvailable() {
    const { ctx } = this;

    try {
      // 检查 AI 助手插件服务是否已加载
      if (!this.service.aiContentService) {
        ctx.logger.warn('[ContentPublishService] AIContentService not found');
        return false;
      }

      // 检查是否有可用的 AI 模型
      const availableModels = await this.service.aiModelManager.getAvailableModels();
      if (!availableModels || availableModels.length === 0) {
        ctx.logger.warn('[ContentPublishService] No available AI models');
        return false;
      }

      return true;
    } catch (error) {
      ctx.logger.error('[ContentPublishService] Failed to check AI service availability:', error);
      return false;
    }
  }

  /**
   * 处理 AI 生成的标签，创建不存在的标签
   * @param {Array<String>} tagNames - 标签名称列表
   * @return {Promise<Array<String>>} 标签 ID 列表
   * @private
   */
  async _processAITags(tagNames) {
    const { ctx } = this;

    const tagIds = [];

    for (const tagName of tagNames) {
      if (!tagName) continue;

      try {
        // 检查标签是否已存在
        let tagObj = await ctx.service.contentTag.findOne({
          name: { $eq: tagName.trim() },
        });

        // 如果不存在，创建新标签
        if (_.isEmpty(tagObj)) {
          tagObj = await ctx.service.contentTag.create({
            name: tagName.trim(),
            comments: `AI 生成的标签：${tagName}`,
            alias: shortid.generate(),
          });
          ctx.logger.info('[ContentPublishService] Created new tag:', tagName);
        }

        tagIds.push(tagObj.id);
      } catch (error) {
        ctx.logger.error('[ContentPublishService] Process tag error:', tagName, error);
        // 单个标签失败不影响其他标签
      }
    }

    return tagIds;
  }

  /**
   * 🔥 辅助方法：从分类列表中提取所有叶子节点（最底层分类）
   * @param {Array} categoryList - 分类列表（可能是树形结构或扁平结构）
   * @return {Object} { allCategories, leafCategories }
   * @private
   */
  _extractLeafCategories(categoryList) {
    return CategoryHelper.extractLeafCategories(categoryList);
  }

  /**
   * 🔥 辅助方法：构建分类的父子路径（从父到子的ID数组）
   * @param {Object} matchedCategory - 匹配的分类
   * @param {Array} allCategories - 所有分类的扁平数组
   * @return {Array} 父子ID数组，如 [4, 14]
   * @private
   */
  _buildCategoryPath(matchedCategory, allCategories) {
    return CategoryHelper.buildCategoryPath(matchedCategory, allCategories, this.ctx.logger);
  }

  /**
   * 使用 AI 匹配分类
   * @param {String} content - 内容
   * @param {String} title - 标题
   * @param {Array} tags - 标签
   * @return {Promise<Object>}
   * @private
   */
  async _matchCategory(content, title, tags) {
    const { ctx } = this;

    try {
      // 1. 获取所有可用的分类列表（包含 parentId 以便构建树形结构）
      const categoryList = await ctx.service.contentCategory.find(
        { isPaging: '0' }, // 获取所有分类
        {
          filters: {
            enable: { $eq: true }, // 只获取启用的分类
          },
          fields: ['id', '_id', 'name', 'enName', 'description', 'parentId'],
        }
      );

      if (!categoryList || categoryList.length === 0) {
        ctx.logger.warn('[ContentPublishService] No available categories found');
        return {
          success: false,
          error: 'No available categories',
        };
      }

      // 2. 提取所有分类和叶子节点
      const { allCategories, leafCategories } = this._extractLeafCategories(categoryList);

      ctx.logger.info(
        `[ContentPublishService] 原始分类数: ${categoryList.length}, 展开后总数: ${allCategories.length}, 叶子分类数: ${leafCategories.length}`
      );

      // 3. 格式化叶子分类列表传给AI（只传叶子节点）
      const formattedCategories = CategoryHelper.formatCategoriesForAI(leafCategories);

      // 4. 调用 AI 进行分类匹配
      const aiResult = await this.service.aiContentService.matchCategory(content, formattedCategories, {
        title,
        tags,
        language: 'zh-CN',
      });

      if (!aiResult.success || !aiResult.categories || aiResult.categories.length === 0) {
        ctx.logger.warn('[ContentPublishService] AI category matching failed or no match found');
        return {
          success: false,
          error: 'AI matching failed',
        };
      }

      // 5. 根据 AI 返回的分类名称，在叶子分类中找到对应的分类
      const matchedCategoryName = aiResult.categories[0]; // 取第一个匹配的分类
      const matchedCategory = CategoryHelper.findMatchedCategory(matchedCategoryName, allCategories);

      if (!matchedCategory) {
        ctx.logger.warn('[ContentPublishService] Matched category name not found in system:', matchedCategoryName);
        return {
          success: false,
          error: 'Matched category not found in system',
        };
      }

      // 6. 构建分类路径（父子ID数组，如 [4, 14]）
      const categoryPath = this._buildCategoryPath(matchedCategory, allCategories);

      ctx.logger.info(
        `[ContentPublishService] Category matched: ${matchedCategory.name}, path: [${categoryPath.join(', ')}]`
      );

      // 7. 返回匹配结果
      return {
        success: true,
        categoryId: matchedCategory.id, // 保留单个ID用于兼容
        categoryPath, // 🔥 新增：父子ID数组 [4, 14]
        categoryName: matchedCategory.name,
        confidence: aiResult.metadata?.confidence || 0.8,
        metadata: aiResult.metadata,
      };
    } catch (error) {
      ctx.logger.error('[ContentPublishService] Match category error:', error);
      throw error;
    }
  }

  /**
   * 使用 AI 优化 SEO
   * @param {Object} contentData - 内容数据
   * @return {Promise<Object>}
   * @private
   */
  async _optimizeSEO(contentData) {
    const { ctx } = this;

    try {
      const result = await this.service.aiContentService.optimizeSEO(
        contentData.title || '未命名文章',
        contentData.simpleComments || contentData.comments,
        {
          keywords: contentData.keywords,
          language: 'zh-CN',
        }
      );

      if (!result.success) {
        return result;
      }

      // 解析 SEO 建议（已规范化）
      const suggestions = result.suggestions || {};

      // 处理关键词（可能是数组或字符串）
      let keywords = suggestions.keywords || contentData.keywords;
      if (Array.isArray(keywords)) {
        keywords = keywords.join(',');
      }

      return {
        success: true,
        keywords,
        optimizedTitle: suggestions.optimizedTitle || contentData.title,
        optimizedDescription: suggestions.optimizedDescription || contentData.discription,
        score: suggestions.score,
        analysis: suggestions.analysis,
        metadata: result.metadata,
      };
    } catch (error) {
      ctx.logger.error('[ContentPublishService] Optimize SEO error:', error);
      throw error;
    }
  }

  /**
   * 使用 AI 检查内容质量
   * @param {Object} contentData - 内容数据
   * @return {Promise<Object>}
   * @private
   */
  async _checkContentQuality(contentData) {
    const { ctx } = this;

    try {
      const result = await this.service.aiContentService.checkQuality(
        contentData.title || '未命名文章',
        contentData.comments,
        {
          language: 'zh-CN',
        }
      );

      if (!result.success) {
        return result;
      }

      // 解析质量评估结果
      const assessment = result.assessment || {};

      return {
        success: true,
        score: assessment.score || 0,
        suggestions: assessment.suggestions || [],
        issues: assessment.issues || [],
        strengths: assessment.strengths || [],
        metadata: result.metadata,
      };
    } catch (error) {
      ctx.logger.error('[ContentPublishService] Check content quality error:', error);
      throw error;
    }
  }

  /**
   * 🔥 使用 AI 生成封面图
   * @param {Object} contentData - 内容数据
   * @return {Promise<Object>}
   * @private
   */
  async _generateCoverImage(contentData) {
    const { ctx } = this;

    try {
      // 1. 构建图片生成提示词（优先使用摘要，其次标题）
      let prompt = '';
      if (contentData.discription) {
        // 使用摘要作为提示词
        prompt = contentData.discription;
      } else if (contentData.title) {
        // 使用标题作为提示词
        prompt = contentData.title;
      } else {
        ctx.logger.warn('[ContentPublishService] No suitable prompt for cover image generation');
        return {
          success: false,
          error: 'No suitable prompt (title or description) available',
        };
      }

      // 限制提示词长度（最多150字符）
      if (prompt.length > 150) {
        prompt = prompt.substring(0, 150);
      }

      ctx.logger.info('[ContentPublishService] Cover image prompt:', prompt);

      // 2. 调用图片生成服务
      const result = await this.service.imageGenerationService.generateImage({
        prompt,
        size: '1024x1024', // 默认尺寸
        n: 1, // 生成1张
        optimizePrompt: true, // 启用提示词优化
        language: 'zh-CN',
      });

      if (!result.success) {
        ctx.logger.error('[ContentPublishService] Cover image generation failed:', result.error);
        return {
          success: false,
          error: result.error || 'Image generation failed',
        };
      }

      // 3. 提取图片 URL
      let imageUrl = '';
      const imageData = result.data;

      if (imageData.url) {
        imageUrl = imageData.url;
      } else if (imageData.images && imageData.images.length > 0) {
        imageUrl = imageData.images[0];
      } else if (imageData.data && imageData.data.length > 0) {
        imageUrl = imageData.data[0].url || imageData.data[0].b64_json;
      }

      if (!imageUrl) {
        ctx.logger.error('[ContentPublishService] No image URL in generation result');
        return {
          success: false,
          error: 'No image URL in generation result',
        };
      }

      ctx.logger.info('[ContentPublishService] Cover image URL:', imageUrl);

      // 4. 返回结果
      return {
        success: true,
        imageUrl,
        metadata: {
          prompt,
          optimizedPrompt: imageData.optimizedPrompt,
          model: imageData.model,
          size: '1024x1024',
          provider: result.data?.model?.provider,
          usage: result.usage,
          cost: result.cost,
        },
      };
    } catch (error) {
      ctx.logger.error('[ContentPublishService] Generate cover image error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 延迟函数
   * @param {Number} ms - 毫秒数
   * @return {Promise<void>}
   * @private
   */
  async _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ContentPublishService;
