import type { PaginationParams, PaginatedResponse } from '../../types';

/**
 * 内容对象
 */
export interface Content {
  /** 内容ID */
  id: string;
  /** 标题 */
  title: string;
  /** 短标题 */
  stitle?: string;
  /** 描述 */
  discription?: string;
  /** 内容 */
  comments?: string;
  /** 缩略图 */
  sImg?: string;
  /** 状态 (0:草稿 1:待审核 2:已发布) */
  state?: string;
  /** 分类ID列表 */
  categories?: string[];
  /** 标签ID列表 */
  tags?: string[];
  /** 作者ID */
  uAuthor?: string | Author;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
  /** 浏览次数 */
  clickNum?: number;
  /** 点赞数 */
  likeNum?: number;
  /** 评论数 */
  commentNum?: number;
}

/**
 * 作者信息
 */
export interface Author {
  /** 用户ID */
  id: string;
  /** 用户名 */
  userName: string;
  /** 姓名 */
  name?: string;
  /** 头像 */
  logo?: string;
}

/**
 * 创建内容数据
 */
export interface CreateContentData {
  /** 标题 */
  title: string;
  /** 短标题（可选） */
  stitle?: string;
  /** 描述 */
  discription: string;
  /** 内容 */
  comments: string;
  /** 缩略图 */
  sImg: string;
  /** 分类ID列表 */
  categories: string[];
  /** 标签ID列表 */
  tags: string[];
  /** 状态 (0:草稿 1:待审核 2:已发布) */
  state?: string;
}

/**
 * 更新内容数据
 */
export interface UpdateContentData {
  /** 标题 */
  title?: string;
  /** 短标题 */
  stitle?: string;
  /** 描述 */
  discription?: string;
  /** 内容 */
  comments?: string;
  /** 缩略图 */
  sImg?: string;
  /** 分类ID列表 */
  categories?: string[];
  /** 标签ID列表 */
  tags?: string[];
  /** 状态 */
  state?: string;
}

/**
 * 内容查询参数
 */
export interface ContentQueryParams extends PaginationParams {
  /** 分类ID */
  categoryId?: string;
  /** 标签ID */
  tagId?: string;
  /** 状态 */
  state?: string;
  /** 搜索关键词 */
  keyword?: string;
  /** 作者ID */
  authorId?: string;
}

/**
 * 内容列表响应
 */
export type ContentListResponse = PaginatedResponse<Content>;
