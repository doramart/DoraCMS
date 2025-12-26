import crypto from 'crypto';

/**
 * 生成 API Key 签名
 * @param apiKey API Key
 * @param apiSecret API Secret
 * @param timestamp 时间戳
 * @param method HTTP 方法
 * @param path 请求路径
 * @param body 请求体（可选）
 */
export function generateSignature(
  apiKey: string,
  apiSecret: string,
  timestamp: string,
  method: string,
  path: string,
  body?: any
): string {
  // 构建签名字符串
  const bodyStr = body ? JSON.stringify(body) : '';
  const signString = `${apiKey}${timestamp}${method.toUpperCase()}${path}${bodyStr}`;

  // 使用 HMAC-SHA256 生成签名
  const hmac = crypto.createHmac('sha256', apiSecret);
  hmac.update(signString);
  return hmac.digest('hex');
}

/**
 * 生成随机字符串
 * @param length 长度
 */
export function generateNonce(length: number = 16): string {
  return crypto.randomBytes(length).toString('hex');
}
