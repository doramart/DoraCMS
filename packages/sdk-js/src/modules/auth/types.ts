/**
 * 登录凭证
 */
export interface LoginCredentials {
  /** 用户名、手机号或邮箱 */
  username: string;
  /** 密码 */
  password: string;
  /** 图形验证码（可选） */
  imageCode?: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** 用户ID */
  id: string;
  /** 用户名 */
  userName: string;
  /** 姓名 */
  name?: string;
  /** 邮箱 */
  email?: string;
  /** 头像 */
  logo?: string;
  /** 用户组 */
  group?: string;
  /** JWT Token */
  token: string;
  /** 是否启用 */
  enable?: boolean;
}

/**
 * 刷新 Token 响应
 */
export interface RefreshTokenResponse {
  /** 新的 JWT Token */
  token: string;
  /** 新的刷新 Token（可选） */
  refreshToken?: string;
}

/**
 * 当前用户信息
 */
export interface CurrentUser {
  /** 用户ID */
  id: string;
  /** 用户名 */
  userName: string;
  /** 姓名 */
  name?: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phoneNum?: string;
  /** 头像 */
  logo?: string;
  /** 用户组 */
  group?: string;
  /** 是否启用 */
  enable?: boolean;
  /** 创建时间 */
  createdAt?: string;
}
