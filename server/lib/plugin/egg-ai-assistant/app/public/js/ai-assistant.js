/**
 * AI Assistant Plugin JavaScript
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

(function (window) {
  'use strict';

  /**
   * AI Assistant 前端工具类
   */
  class AIAssistant {
    constructor(options = {}) {
      this.options = {
        apiBase: '/manage/ai',
        timeout: 30000,
        ...options,
      };

      this.init();
    }

    /**
     * 初始化
     */
    init() {
      console.log('[AI Assistant] Plugin initialized');
      this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
      // 绑定 AI 内容生成按钮
      document.addEventListener('click', e => {
        if (e.target.matches('.ai-generate-btn')) {
          this.handleGenerateContent(e);
        }
      });

      // 绑定模型测试按钮
      document.addEventListener('click', e => {
        if (e.target.matches('.ai-test-model-btn')) {
          this.handleTestModel(e);
        }
      });
    }

    /**
     * 处理内容生成
     * @param event
     */
    async handleGenerateContent(event) {
      const button = event.target;
      const type = button.dataset.type;
      const content = button.dataset.content;

      if (!type || !content) {
        this.showMessage('缺少必要参数', 'error');
        return;
      }

      try {
        this.setButtonLoading(button, true);

        const result = await this.generateContent(type, content);

        if (result.success) {
          this.showMessage('内容生成成功', 'success');
          this.handleGenerateResult(type, result.data);
        } else {
          this.showMessage(result.message || '生成失败', 'error');
        }
      } catch (error) {
        console.error('[AI Assistant] Generate content error:', error);
        this.showMessage('生成过程中发生错误', 'error');
      } finally {
        this.setButtonLoading(button, false);
      }
    }

    /**
     * 处理模型测试
     * @param event
     */
    async handleTestModel(event) {
      const button = event.target;
      const modelId = button.dataset.modelId;

      if (!modelId) {
        this.showMessage('缺少模型ID', 'error');
        return;
      }

      try {
        this.setButtonLoading(button, true);

        const result = await this.testModel(modelId);

        if (result.success) {
          this.showMessage('模型测试成功', 'success');
        } else {
          this.showMessage(result.message || '测试失败', 'error');
        }
      } catch (error) {
        console.error('[AI Assistant] Test model error:', error);
        this.showMessage('测试过程中发生错误', 'error');
      } finally {
        this.setButtonLoading(button, false);
      }
    }

    /**
     * 生成内容
     * @param type
     * @param content
     */
    async generateContent(type, content) {
      const response = await fetch(`${this.options.apiBase}/content/generate-${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      return await response.json();
    }

    /**
     * 测试模型
     * @param modelId
     */
    async testModel(modelId) {
      const response = await fetch(`${this.options.apiBase}/test-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId }),
      });

      return await response.json();
    }

    /**
     * 处理生成结果
     * @param type
     * @param data
     */
    handleGenerateResult(type, data) {
      const event = new CustomEvent('ai-content-generated', {
        detail: { type, data },
      });
      document.dispatchEvent(event);
    }

    /**
     * 设置按钮加载状态
     * @param button
     * @param loading
     */
    setButtonLoading(button, loading) {
      if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = '生成中...';
        button.classList.add('loading');
      } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
        button.classList.remove('loading');
      }
    }

    /**
     * 显示消息
     * @param message
     * @param type
     */
    showMessage(message, type = 'info') {
      // 这里可以集成具体的消息提示组件
      console.log(`[AI Assistant] ${type.toUpperCase()}: ${message}`);

      // 简单的消息提示实现
      const messageEl = document.createElement('div');
      messageEl.className = `ai-message ai-message-${type}`;
      messageEl.textContent = message;
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        z-index: 9999;
        background: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#1890ff'};
      `;

      document.body.appendChild(messageEl);

      setTimeout(() => {
        messageEl.remove();
      }, 3000);
    }
  }

  // 全局暴露
  window.AIAssistant = AIAssistant;

  // 自动初始化
  document.addEventListener('DOMContentLoaded', () => {
    if (window.aiAssistantConfig) {
      new AIAssistant(window.aiAssistantConfig);
    } else {
      new AIAssistant();
    }
  });
})(window);
