import type { HTTPClient } from '../../http';
import type {
  Content,
  CreateContentData,
  UpdateContentData,
  ContentQueryParams,
  ContentListResponse,
} from './types';

/**
 * 内容管理模块
 * 提供内容的 CRUD 操作
 */
export class ContentModule {
  private httpClient: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.httpClient = httpClient;
  }

  /**
   * 获取内容列表
   * @param params 查询参数
   * @returns 内容列表（分页）
   */
  async list(params?: ContentQueryParams): Promise<ContentListResponse> {
    const queryParams: Record<string, any> = {
      current: params?.page || 1,
      pageSize: params?.pageSize || 20,
    };

    // 添加可选参数
    if (params?.categoryId) {
      queryParams.categoryId = params.categoryId;
    }
    if (params?.tagId) {
      queryParams.tagId = params.tagId;
    }
    if (params?.state) {
      queryParams.state = params.state;
    }
    if (params?.keyword) {
      queryParams.searchkey = params.keyword;
    }
    if (params?.authorId) {
      queryParams.authorId = params.authorId;
    }
    if (params?.sortBy) {
      queryParams.sortBy = params.sortBy;
    }
    if (params?.sortOrder) {
      queryParams.sortOrder = params.sortOrder;
    }

    const response = await this.httpClient.get<ContentListResponse>('/content', {
      params: queryParams,
    });

    if (response.status === 'success' && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch content list');
  }

  /**
   * 获取单个内容详情
   * @param id 内容ID
   * @returns 内容详情
   */
  async get(id: string): Promise<Content> {
    const response = await this.httpClient.get<Content>(`/content/${id}`);

    if (response.status === 'success' && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch content');
  }

  /**
   * 创建内容
   * @param data 内容数据
   * @returns 创建的内容
   */
  async create(data: CreateContentData): Promise<Content> {
    const response = await this.httpClient.post<Content>('/content', data);

    if (response.status === 'success' && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to create content');
  }

  /**
   * 更新内容
   * @param id 内容ID
   * @param data 更新数据
   * @returns 更新后的内容
   */
  async update(id: string, data: UpdateContentData): Promise<Content> {
    const response = await this.httpClient.put<Content>(`/content/${id}`, data);

    if (response.status === 'success' && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update content');
  }

  /**
   * 删除内容
   * @param id 内容ID
   */
  async delete(id: string): Promise<void> {
    const response = await this.httpClient.delete<void>(`/content/${id}`);

    if (response.status === 'success') {
      return;
    }

    throw new Error(response.message || 'Failed to delete content');
  }

  /**
   * 批量删除内容
   * @param ids 内容ID数组
   */
  async deleteMany(ids: string[]): Promise<void> {
    const response = await this.httpClient.delete<void>('/content', {
      data: { ids },
    });

    if (response.status === 'success') {
      return;
    }

    throw new Error(response.message || 'Failed to delete contents');
  }
}
