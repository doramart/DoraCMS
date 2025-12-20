/**
 * Token 计数工具
 * 用于估算文本的 Token 数量（适用于不同的 AI 模型）
 */
'use strict';

class TokenCounter {
  /**
   * 估算文本的 Token 数量（通用方法）
   * @param {String} text - 文本内容
   * @param {String} model - 模型名称
   * @return {Number} Token 数量
   */
  static estimate(text, model = 'gpt-3.5-turbo') {
    if (!text) return 0;

    // 根据不同模型使用不同的估算方法
    if (model.includes('gpt-4') || model.includes('gpt-3.5')) {
      return this.estimateGPT(text);
    } else if (model.includes('claude')) {
      return this.estimateClaude(text);
    } else if (model.includes('deepseek')) {
      return this.estimateDeepSeek(text);
    }

    // 默认使用 GPT 估算方法
    return this.estimateGPT(text);
  }

  /**
   * GPT 系列模型的 Token 估算
   * @param {String} text - 文本内容
   * @return {Number} Token 数量
   */
  static estimateGPT(text) {
    // GPT 模型的经验公式：
    // 英文: ~4 字符 = 1 token
    // 中文: ~1.5 字符 = 1 token
    // 标点和空格: ~3 字符 = 1 token

    const englishChars = (text.match(/[a-zA-Z0-9]/g) || []).length;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const spaces = (text.match(/\s/g) || []).length;
    const punctuation = (text.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length;

    const tokens =
      Math.ceil(englishChars / 4) + Math.ceil(chineseChars / 1.5) + Math.ceil(spaces / 4) + Math.ceil(punctuation / 3);

    return tokens;
  }

  /**
   * Claude 系列模型的 Token 估算
   * @param {String} text - 文本内容
   * @return {Number} Token 数量
   */
  static estimateClaude(text) {
    // Claude 的估算方式与 GPT 类似
    return this.estimateGPT(text);
  }

  /**
   * DeepSeek 系列模型的 Token 估算
   * @param {String} text - 文本内容
   * @return {Number} Token 数量
   */
  static estimateDeepSeek(text) {
    // DeepSeek 对中文更友好
    const englishChars = (text.match(/[a-zA-Z0-9]/g) || []).length;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - englishChars - chineseChars;

    const tokens = Math.ceil(englishChars / 4) + Math.ceil(chineseChars / 1.3) + Math.ceil(otherChars / 3);

    return tokens;
  }

  /**
   * 估算消息数组的总 Token 数
   * @param {Array} messages - 消息数组
   * @param {String} model - 模型名称
   * @return {Number} Token 数量
   */
  static estimateMessages(messages, model = 'gpt-3.5-turbo') {
    if (!Array.isArray(messages)) return 0;

    let totalTokens = 0;

    // 每条消息的固定开销（约 4 tokens）
    totalTokens += messages.length * 4;

    // 累加每条消息的内容 token
    for (const msg of messages) {
      if (msg.role) {
        totalTokens += 1; // role 字段的 token
      }
      if (msg.content) {
        totalTokens += this.estimate(msg.content, model);
      }
      if (msg.name) {
        totalTokens += 1; // name 字段的 token
      }
    }

    // 对话格式的固定开销
    totalTokens += 3;

    return totalTokens;
  }

  /**
   * 计算剩余可用 Token 数
   * @param {Number} maxTokens - 最大 Token 数
   * @param {Number} usedTokens - 已使用 Token 数
   * @return {Number} 剩余 Token 数
   */
  static getRemainingTokens(maxTokens, usedTokens) {
    return Math.max(0, maxTokens - usedTokens);
  }

  /**
   * 截断文本到指定 Token 数
   * @param {String} text - 文本内容
   * @param {Number} maxTokens - 最大 Token 数
   * @param {String} model - 模型名称
   * @return {String} 截断后的文本
   */
  static truncateToTokens(text, maxTokens, model = 'gpt-3.5-turbo') {
    const currentTokens = this.estimate(text, model);

    if (currentTokens <= maxTokens) {
      return text;
    }

    // 估算需要保留的字符比例
    const ratio = maxTokens / currentTokens;
    const targetLength = Math.floor(text.length * ratio * 0.95); // 留 5% 缓冲

    return text.substring(0, targetLength) + '...';
  }
}

module.exports = TokenCounter;
