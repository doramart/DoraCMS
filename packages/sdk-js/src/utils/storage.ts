/**
 * Token 存储接口
 */
export interface TokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
}

/**
 * 内存存储实现
 */
class MemoryStorage implements TokenStorage {
  private token: string | null = null;

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  removeToken(): void {
    this.token = null;
  }
}

/**
 * LocalStorage 存储实现
 */
class LocalStorageImpl implements TokenStorage {
  private readonly key = 'doracms_token';

  getToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(this.key);
  }

  setToken(token: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(this.key, token);
  }

  removeToken(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(this.key);
  }
}

/**
 * SessionStorage 存储实现
 */
class SessionStorageImpl implements TokenStorage {
  private readonly key = 'doracms_token';

  getToken(): string | null {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }
    return window.sessionStorage.getItem(this.key);
  }

  setToken(token: string): void {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }
    window.sessionStorage.setItem(this.key, token);
  }

  removeToken(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }
    window.sessionStorage.removeItem(this.key);
  }
}

/**
 * 创建 Token 存储实例
 */
export function createTokenStorage(
  type: 'localStorage' | 'sessionStorage' | 'memory' = 'memory'
): TokenStorage {
  switch (type) {
    case 'localStorage':
      return new LocalStorageImpl();
    case 'sessionStorage':
      return new SessionStorageImpl();
    case 'memory':
    default:
      return new MemoryStorage();
  }
}
