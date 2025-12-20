/**
 * 请求处理辅助函数
 * 用于统一处理表单提交请求的成功和失败状态
 */

/**
 * 执行请求并处理结果
 * @param requestFn 请求函数
 * @returns 返回 true 表示请求成功，false 表示请求失败
 */
export async function executeRequest<T = any>(requestFn: () => Promise<{ data: T; error: any }>): Promise<boolean> {
  try {
    const result = await requestFn();
    
    // 如果有错误，说明请求失败
    if (result.error) {
      return false;
    }
    
    // 请求成功
    return true;
  } catch (error) {
    // 捕获任何未预期的错误
    console.error('Request execution failed:', error);
    return false;
  }
}

/**
 * 执行请求并处理结果（兼容非 flat request）
 * @param requestFn 请求函数
 * @returns 返回 true 表示请求成功，false 表示请求失败
 */
export async function executeRequestCompat<T = any>(requestFn: () => Promise<T>): Promise<boolean> {
  try {
    const result = await requestFn();
    
    // 检查是否是 flat request 的返回格式
    if (result && typeof result === 'object' && 'error' in result) {
      // 是 flat request 格式
      return !(result as any).error;
    }
    
    // 不是 flat request 格式，认为请求成功
    return true;
  } catch (error) {
    // 捕获异常，说明请求失败
    return false;
  }
}
