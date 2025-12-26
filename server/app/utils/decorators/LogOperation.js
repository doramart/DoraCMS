/**
 * @Author: AI Assistant
 * @Date: 2025-11-08
 * @Description: LogOperation 装饰器 - 自动记录Service方法的操作日志
 *
 * 使用方法：
 * ```javascript
 * const LogOperation = require('../utils/decorators/LogOperation');
 *
 * class UserService extends Service {
 *   @LogOperation({
 *     operation: 'createUser',
 *     description: '创建用户',
 *     module: 'user',
 *   })
 *   async create(data) {
 *     return await this.repository.create(data);
 *   }
 * }
 * ```
 *
 * 注意：由于JavaScript原生不支持装饰器，这里提供了两种使用方式：
 * 1. 使用Babel插件 @babel/plugin-proposal-decorators
 * 2. 使用工厂函数手动包装
 */

'use strict';

/**
 * LogOperation 装饰器工厂
 * @param {Object} options 配置选项
 * @param {String} options.operation 操作名称
 * @param {String} options.description 操作描述
 * @param {String} options.module 业务模块
 * @param {String} options.severity 严重程度
 * @param {Boolean} options.captureResult 是否捕获返回结果
 * @param {Boolean} options.captureArgs 是否捕获参数
 * @param {Array} options.tags 自定义标签
 * @return {Function} 装饰器函数
 */
function LogOperation(options = {}) {
  const {
    operation,
    description,
    module,
    severity = 'medium',
    captureResult = false,
    captureArgs = false,
    tags = [],
  } = options;

  // 返回装饰器函数
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const ctx = this.ctx;
      const startTime = Date.now();

      try {
        // 执行原始方法
        const result = await originalMethod.apply(this, args);

        // 成功：异步记录操作日志
        setImmediate(() => {
          if (ctx.service?.systemOptionLog) {
            const logOptions = {
              severity,
              module: module || this.constructor.name.replace('Service', '').toLowerCase(),
              action: operation || propertyKey,
              responseTime: Date.now() - startTime,
              tags: ['operation', operation || propertyKey, ...tags],
            };

            // 如果捕获结果
            if (captureResult && result) {
              logOptions.resourceId = result.id || result._id;
              logOptions.extraData = { hasResult: true };
            }

            // 如果捕获参数
            if (captureArgs && args.length > 0) {
              logOptions.extraData = logOptions.extraData || {};
              logOptions.extraData.argsCount = args.length;
            }

            ctx.service.systemOptionLog
              .logOperation(operation || propertyKey, description || `执行 ${propertyKey}`, logOptions)
              .catch(err => {
                console.error('[LogOperation] Failed to log:', err.message);
              });
          }
        });

        return result;
      } catch (error) {
        // 失败：记录错误日志
        setImmediate(() => {
          if (ctx.service?.systemOptionLog) {
            ctx.service.systemOptionLog
              .logException(error, {
                severity: 'high',
                extraData: {
                  operation: operation || propertyKey,
                  module: module || this.constructor.name.replace('Service', '').toLowerCase(),
                  methodName: propertyKey,
                  executionTime: Date.now() - startTime,
                },
              })
              .catch(err => {
                console.error('[LogOperation] Failed to log exception:', err.message);
              });
          }
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 工厂函数方式包装（不使用装饰器语法）
 * @param {Function} method 原始方法
 * @param {Object} options 配置选项
 * @return {Function} 包装后的方法
 */
LogOperation.wrap = function (method, options = {}) {
  const { operation, description, module, severity = 'medium', captureResult = false, tags = [] } = options;

  return async function wrappedMethod(...args) {
    const ctx = this.ctx;
    const startTime = Date.now();

    try {
      const result = await method.apply(this, args);

      setImmediate(() => {
        if (ctx.service?.systemOptionLog) {
          const logOptions = {
            severity,
            module: module || this.constructor.name.replace('Service', '').toLowerCase(),
            action: operation || method.name,
            responseTime: Date.now() - startTime,
            tags: ['operation', operation || method.name, ...tags],
          };

          if (captureResult && result) {
            logOptions.resourceId = result.id || result._id;
          }

          ctx.service.systemOptionLog
            .logOperation(operation || method.name, description || `执行 ${method.name}`, logOptions)
            .catch(err => {
              console.error('[LogOperation] Failed to log:', err.message);
            });
        }
      });

      return result;
    } catch (error) {
      setImmediate(() => {
        if (ctx.service?.systemOptionLog) {
          ctx.service.systemOptionLog
            .logException(error, {
              severity: 'high',
              extraData: {
                operation: operation || method.name,
                module: module || this.constructor.name.replace('Service', '').toLowerCase(),
                executionTime: Date.now() - startTime,
              },
            })
            .catch(err => {
              console.error('[LogOperation] Failed to log exception:', err.message);
            });
        }
      });

      throw error;
    }
  };
};

module.exports = LogOperation;
