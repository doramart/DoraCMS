/**
 * DoraCMS JavaScript/TypeScript SDK
 * 
 * @packageDocumentation
 */

// 导出主客户端类
export { DoraCMSClient } from './client';

// 导出 HTTP 客户端（高级用法）
export { HTTPClient } from './http';

// 导出功能模块
export { AuthModule } from './modules/auth';
export type * from './modules/auth';

export { ContentModule } from './modules/content';
export type * from './modules/content';

// 导出所有类型定义
export type * from './types';

// 导出错误类和类型
export { APIError, ErrorType, ErrorSeverity } from './errors';
export { ErrorHandler } from './errors';
export { RetryStrategy } from './errors';
export type { ErrorHandlerConfig, RetryContext, RetryDecision } from './errors';

// 导出工具函数
export { generateSignature, generateNonce, createTokenStorage } from './utils';
export type { TokenStorage } from './utils';
