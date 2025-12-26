/**
 * TypeScript 类型定义使用示例
 */

import {
  DoraCMSClient,
  // 业务模型类型
  Content,
  ContentState,
  ContentCategory,
  ContentTag,
  User,
  UserRole,
  APIKey,
  APIKeyStatus,
  Webhook,
  WebhookEventType,
  // API 请求/响应类型
  LoginRequest,
  LoginResponse,
  ContentListParams,
  ContentCreateRequest,
  ContentUpdateRequest,
  APIKeyCreateRequest,
  WebhookCreateRequest,
  // 通用类型
  PaginatedResponse,
  APIResponse,
  // 错误类型
  APIError,
  ErrorType,
  ErrorSeverity,
} from '@doracms/sdk';

// ============================================
// 1. 使用业务模型类型
// ============================================

// 内容类型
const content: Content = {
  id: '123',
  title: '示例文章',
  stitle: '这是一篇示例文章',
  keywords: ['TypeScript', 'SDK'],
  author: '张三',
  content: '文章内容...',
  state: ContentState.PUBLISHED,
  categories: [],
  tags: [],
  clickNum: 100,
  likeNum: 10,
  isTop: false,
  isRecommend: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

// 用户类型
const user: User = {
  id: '456',
  userName: 'zhangsan',
  email: 'zhangsan@example.com',
  name: '张三',
  group: UserRole.USER,
  enable: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

// API Key 类型
const apiKey: APIKey = {
  id: '789',
  name: 'Production API Key',
  key: 'ak_1234567890',
  status: APIKeyStatus.ACTIVE,
  permissions: ['read', 'write'],
  ipWhitelist: ['192.168.1.1'],
  rateLimit: 1000,
  expiresAt: '2025-12-31T23:59:59.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
};

// ============================================
// 2. 使用 API 请求/响应类型
// ============================================

async function exampleApiCalls() {
  const client = new DoraCMSClient({
    apiUrl: 'http://localhost:8080',
  });

  // 登录请求
  const loginRequest: LoginRequest = {
    userName: 'zhangsan',
    password: 'password123',
  };

  const loginResponse: APIResponse<LoginResponse> = await client.auth.login(
    loginRequest.userName,
    loginRequest.password
  );

  console.log('登录成功:', loginResponse.data?.user);

  // 内容列表查询
  const listParams: ContentListParams = {
    page: 1,
    pageSize: 10,
    state: ContentState.PUBLISHED,
    isRecommend: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  const contentList: APIResponse<PaginatedResponse<Content>> = await client.content.list(listParams);

  console.log('内容列表:', contentList.data?.items);
  console.log('总数:', contentList.data?.total);

  // 创建内容
  const createRequest: ContentCreateRequest = {
    title: '新文章',
    stitle: '这是一篇新文章',
    keywords: ['TypeScript', 'SDK'],
    content: '文章内容...',
    state: ContentState.DRAFT,
    categories: ['cat-123'],
    tags: ['tag-456'],
  };

  const newContent: APIResponse<Content> = await client.content.create(createRequest);

  console.log('创建成功:', newContent.data?.id);

  // 更新内容
  const updateRequest: ContentUpdateRequest = {
    id: newContent.data!.id,
    title: '更新后的标题',
    state: ContentState.PUBLISHED,
  };

  await client.content.update(updateRequest.id, updateRequest);

  // 创建 API Key
  const apiKeyRequest: APIKeyCreateRequest = {
    name: 'Test API Key',
    permissions: ['read'],
    ipWhitelist: ['192.168.1.1'],
    rateLimit: 100,
  };

  // 创建 Webhook
  const webhookRequest: WebhookCreateRequest = {
    name: 'Content Webhook',
    url: 'https://example.com/webhook',
    events: [WebhookEventType.CONTENT_CREATED, WebhookEventType.CONTENT_UPDATED],
  };
}

// ============================================
// 3. 使用错误类型
// ============================================

async function exampleErrorHandling() {
  const client = new DoraCMSClient({
    apiUrl: 'http://localhost:8080',
  });

  try {
    await client.content.get('invalid-id');
  } catch (error) {
    if (error instanceof APIError) {
      // 类型安全的错误处理
      console.log('错误类型:', error.type);
      console.log('错误严重程度:', error.severity);
      console.log('错误码:', error.code);
      console.log('错误消息:', error.message);
      console.log('请求 ID:', error.requestId);

      // 根据错误类型处理
      switch (error.type) {
        case ErrorType.NETWORK:
          console.log('网络错误，请检查网络连接');
          break;
        case ErrorType.AUTH:
          console.log('认证失败，请重新登录');
          break;
        case ErrorType.VALIDATION:
          console.log('参数验证失败:', error.details);
          break;
        case ErrorType.RATE_LIMIT:
          const delay = error.getRetryDelay();
          console.log(`请求过于频繁，请在 ${delay}ms 后重试`);
          break;
        default:
          console.log('未知错误:', error.getUserMessage());
      }

      // 根据严重程度处理
      if (error.severity === ErrorSeverity.CRITICAL) {
        console.error('严重错误，需要立即处理');
      }

      // 判断是否可重试
      if (error.isRetryable()) {
        console.log('该错误可以重试');
      }

      // 判断是否需要重新认证
      if (error.needsReauth()) {
        console.log('需要重新登录');
      }
    }
  }
}

// ============================================
// 4. 类型推断示例
// ============================================

async function exampleTypeInference() {
  const client = new DoraCMSClient({
    apiUrl: 'http://localhost:8080',
  });

  // TypeScript 会自动推断返回类型
  const response = await client.content.list({ page: 1 });

  // response.data 的类型是 PaginatedResponse<Content> | undefined
  if (response.data) {
    // items 的类型是 Content[]
    response.data.items.forEach((item) => {
      // item 的类型是 Content
      console.log(item.title); // ✅ 类型安全
      console.log(item.author); // ✅ 类型安全
      // console.log(item.nonExistent); // ❌ 编译错误
    });
  }
}

// ============================================
// 5. 泛型使用示例
// ============================================

// 自定义内容类型
interface CustomContent extends Content {
  customField: string;
  customData: {
    views: number;
    shares: number;
  };
}

async function exampleGenerics() {
  const client = new DoraCMSClient({
    apiUrl: 'http://localhost:8080',
  });

  // 使用泛型指定返回类型
  const response = await client.content.get<CustomContent>('123');

  if (response.data) {
    // data 的类型是 CustomContent
    console.log(response.data.title); // 标准字段
    console.log(response.data.customField); // 自定义字段
    console.log(response.data.customData.views); // 嵌套自定义字段
  }
}

// ============================================
// 6. 类型守卫示例
// ============================================

function isPublishedContent(content: Content): boolean {
  return content.state === ContentState.PUBLISHED;
}

function isAdminUser(user: User): boolean {
  return user.group === UserRole.ADMIN || user.group === UserRole.SUPER_ADMIN;
}

function isActiveAPIKey(apiKey: APIKey): boolean {
  return apiKey.status === APIKeyStatus.ACTIVE;
}

// ============================================
// 7. 类型组合示例
// ============================================

// 扩展内容创建请求
interface ExtendedContentCreateRequest extends ContentCreateRequest {
  // 添加自定义字段
  customMetadata?: Record<string, any>;
  scheduledPublishAt?: string;
}

// 部分更新类型
type PartialContentUpdate = Partial<Content> & { id: string };

// 只读内容类型
type ReadonlyContent = Readonly<Content>;

// ============================================
// 8. 实用类型示例
// ============================================

// 提取特定字段
type ContentSummary = Pick<Content, 'id' | 'title' | 'author' | 'createdAt'>;

// 排除特定字段
type ContentWithoutContent = Omit<Content, 'content'>;

// 必需字段
type RequiredContent = Required<Pick<Content, 'title' | 'content'>>;

// 记录类型
type ContentMap = Record<string, Content>;

// ============================================
// 9. 导出类型供其他模块使用
// ============================================

export type {
  Content,
  User,
  APIKey,
  ContentListParams,
  ContentCreateRequest,
  LoginRequest,
  LoginResponse,
};

// ============================================
// 10. 类型文档注释
// ============================================

/**
 * 创建内容的辅助函数
 * 
 * @param client - DoraCMS 客户端实例
 * @param data - 内容创建请求数据
 * @returns 创建的内容
 * @throws {APIError} 当创建失败时抛出
 * 
 * @example
 * ```typescript
 * const content = await createContent(client, {
 *   title: '新文章',
 *   content: '文章内容...',
 * });
 * ```
 */
async function createContent(
  client: DoraCMSClient,
  data: ContentCreateRequest
): Promise<Content> {
  const response = await client.content.create(data);
  if (!response.data) {
    throw new Error('创建内容失败');
  }
  return response.data;
}

console.log('TypeScript 类型定义使用示例');
