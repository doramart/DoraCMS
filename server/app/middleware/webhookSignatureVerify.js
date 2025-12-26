/**
 * Webhook 签名验证中间件
 * 用于验证接收到的 Webhook 请求的签名
 */
'use strict';

const WebhookSignature = require('../utils/webhookSignature');

module.exports = options => {
  return async function webhookSignatureVerify(ctx, next) {
    // 获取配置
    const {
      secretGetter, // 获取 secret 的函数
      verifyTimestamp = true, // 是否验证时间戳
      toleranceSeconds = 300, // 时间戳容忍时间（秒）
      onError, // 错误处理函数
    } = options;

    try {
      // 获取请求体
      const payload = ctx.request.body;

      if (!payload) {
        ctx.status = 400;
        ctx.body = {
          status: 'error',
          message: 'Missing request body',
        };
        return;
      }

      // 获取 secret
      let secret;
      if (typeof secretGetter === 'function') {
        secret = await secretGetter(ctx);
      } else if (typeof secretGetter === 'string') {
        secret = secretGetter;
      } else {
        ctx.logger.error('[WebhookSignatureVerify] Invalid secretGetter configuration');
        ctx.status = 500;
        ctx.body = {
          status: 'error',
          message: 'Internal server error',
        };
        return;
      }

      if (!secret) {
        ctx.status = 401;
        ctx.body = {
          status: 'error',
          message: 'Unauthorized: Missing secret',
        };
        return;
      }

      // 验证签名
      const result = WebhookSignature.verifyWebhookRequest(payload, ctx.headers, secret, {
        verifyTimestamp,
        toleranceSeconds,
      });

      if (!result.valid) {
        ctx.logger.warn(`[WebhookSignatureVerify] Signature verification failed: ${result.reason}`);

        // 调用错误处理函数（如果提供）
        if (typeof onError === 'function') {
          await onError(ctx, result.reason);
          return;
        }

        // 默认错误响应
        ctx.status = 401;
        ctx.body = {
          status: 'error',
          message: `Unauthorized: ${result.reason}`,
        };
        return;
      }

      // 签名验证成功，继续处理
      ctx.logger.debug('[WebhookSignatureVerify] Signature verified successfully');
      await next();
    } catch (error) {
      ctx.logger.error('[WebhookSignatureVerify] Error during signature verification:', error);

      // 调用错误处理函数（如果提供）
      if (typeof onError === 'function') {
        await onError(ctx, error.message);
        return;
      }

      // 默认错误响应
      ctx.status = 500;
      ctx.body = {
        status: 'error',
        message: 'Internal server error',
      };
    }
  };
};
