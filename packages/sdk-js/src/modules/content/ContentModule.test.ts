import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentModule } from './ContentModule';
import type { HTTPClient } from '../../http';
import type { Content } from './types';

describe('ContentModule', () => {
  let contentModule: ContentModule;
  let mockHttpClient: HTTPClient;

  beforeEach(() => {
    // Mock HTTPClient
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    } as any;

    contentModule = new ContentModule(mockHttpClient);
  });

  describe('list', () => {
    it('should fetch content list with default params', async () => {
      const mockResponse = {
        status: 'success' as const,
        data: {
          items: [
            {
              id: 'content-1',
              title: 'Test Content 1',
              discription: 'Description 1',
            },
            {
              id: 'content-2',
              title: 'Test Content 2',
              discription: 'Description 2',
            },
          ],
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await contentModule.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/content', {
        params: {
          current: 1,
          pageSize: 20,
        },
      });

      expect(result).toEqual(mockResponse.data);
      expect(result.items).toHaveLength(2);
    });

    it('should fetch content list with custom params', async () => {
      const mockResponse = {
        status: 'success' as const,
        data: {
          items: [],
          total: 0,
          page: 2,
          pageSize: 10,
          totalPages: 0,
        },
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await contentModule.list({
        page: 2,
        pageSize: 10,
        categoryId: 'cat-123',
        state: '2',
        keyword: 'test',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/content', {
        params: {
          current: 2,
          pageSize: 10,
          categoryId: 'cat-123',
          state: '2',
          searchkey: 'test',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });
    });

    it('should throw error if fetch fails', async () => {
      const mockResponse = {
        status: 'error' as const,
        message: 'Failed to fetch',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await expect(contentModule.list()).rejects.toThrow('Failed to fetch');
    });
  });

  describe('get', () => {
    it('should fetch single content', async () => {
      const mockContent: Content = {
        id: 'content-123',
        title: 'Test Content',
        discription: 'Test Description',
        comments: 'Test content body',
        sImg: 'https://example.com/image.jpg',
        state: '2',
      };

      const mockResponse = {
        status: 'success' as const,
        data: mockContent,
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await contentModule.get('content-123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/content/content-123');

      expect(result).toEqual(mockContent);
    });

    it('should throw error if content not found', async () => {
      const mockResponse = {
        status: 'error' as const,
        message: 'Content not found',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await expect(contentModule.get('invalid-id')).rejects.toThrow('Content not found');
    });
  });

  describe('create', () => {
    it('should create content', async () => {
      const createData = {
        title: 'New Content',
        discription: 'New Description',
        comments: 'New content body',
        sImg: 'https://example.com/image.jpg',
        categories: ['cat-1', 'cat-2'],
        tags: ['tag-1', 'tag-2'],
        state: '2',
      };

      const mockContent: Content = {
        id: 'content-new',
        ...createData,
      };

      const mockResponse = {
        status: 'success' as const,
        data: mockContent,
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      const result = await contentModule.create(createData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/content', createData);
      expect(result).toEqual(mockContent);
    });

    it('should throw error if create fails', async () => {
      const mockResponse = {
        status: 'error' as const,
        message: 'Validation failed',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      await expect(
        contentModule.create({
          title: 'Test',
          discription: 'Test',
          comments: 'Test',
          sImg: 'test.jpg',
          categories: [],
          tags: [],
        })
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('update', () => {
    it('should update content', async () => {
      const updateData = {
        title: 'Updated Title',
        discription: 'Updated Description',
      };

      const mockContent: Content = {
        id: 'content-123',
        title: 'Updated Title',
        discription: 'Updated Description',
        comments: 'Original content',
        sImg: 'image.jpg',
      };

      const mockResponse = {
        status: 'success' as const,
        data: mockContent,
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.put).mockResolvedValue(mockResponse);

      const result = await contentModule.update('content-123', updateData);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/content/content-123', updateData);

      expect(result).toEqual(mockContent);
    });

    it('should throw error if update fails', async () => {
      const mockResponse = {
        status: 'error' as const,
        message: 'Update failed',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.put).mockResolvedValue(mockResponse);

      await expect(contentModule.update('content-123', { title: 'New Title' })).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('delete', () => {
    it('should delete content', async () => {
      const mockResponse = {
        status: 'success' as const,
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.delete).mockResolvedValue(mockResponse);

      await contentModule.delete('content-123');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/content/content-123');
    });

    it('should throw error if delete fails', async () => {
      const mockResponse = {
        status: 'error' as const,
        message: 'Delete failed',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.delete).mockResolvedValue(mockResponse);

      await expect(contentModule.delete('content-123')).rejects.toThrow('Delete failed');
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple contents', async () => {
      const mockResponse = {
        status: 'success' as const,
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.delete).mockResolvedValue(mockResponse);

      await contentModule.deleteMany(['content-1', 'content-2', 'content-3']);

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/content', {
        data: { ids: ['content-1', 'content-2', 'content-3'] },
      });
    });
  });
});
