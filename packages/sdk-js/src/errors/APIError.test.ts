import { describe, it, expect } from 'vitest';
import { APIError } from './APIError';
import type { APIErrorResponse } from '../types';

describe('APIError', () => {
  it('should create an APIError instance', () => {
    const error = new APIError(
      'Test error',
      'TEST_ERROR',
      400,
      'req-123',
      '2024-01-01T00:00:00Z'
    );

    expect(error).toBeInstanceOf(APIError);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.requestId).toBe('req-123');
    expect(error.timestamp).toBe('2024-01-01T00:00:00Z');
  });

  it('should create APIError from response', () => {
    const response: APIErrorResponse = {
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Resource not found',
      requestId: 'req-456',
      timestamp: '2024-01-01T00:00:00Z',
    };

    const error = APIError.fromResponse(response, 404);

    expect(error.message).toBe('Resource not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.requestId).toBe('req-456');
  });

  it('should convert to JSON', () => {
    const error = new APIError(
      'Test error',
      'TEST_ERROR',
      400,
      'req-123',
      '2024-01-01T00:00:00Z',
      { field: 'username' }
    );

    const json = error.toJSON();

    expect(json).toEqual({
      name: 'APIError',
      message: 'Test error',
      code: 'TEST_ERROR',
      statusCode: 400,
      requestId: 'req-123',
      timestamp: '2024-01-01T00:00:00Z',
      details: { field: 'username' },
    });
  });
});
