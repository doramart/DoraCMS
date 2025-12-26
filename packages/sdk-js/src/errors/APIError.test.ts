import { describe, it, expect } from 'vitest';
import { APIError, ErrorType } from './APIError';
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
    expect(error.type).toBe(ErrorType.VALIDATION); // 400 is now VALIDATION
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
    expect(error.type).toBe(ErrorType.CLIENT);
  });

  it('should create network error', () => {
    const error = APIError.networkError('Connection failed');

    expect(error.message).toBe('Connection failed');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.statusCode).toBe(0);
    expect(error.type).toBe(ErrorType.NETWORK);
    expect(error.isNetworkError()).toBe(true);
  });

  it('should create timeout error', () => {
    const error = APIError.timeoutError();

    expect(error.message).toBe('Request timeout');
    expect(error.code).toBe('TIMEOUT_ERROR');
    expect(error.statusCode).toBe(0);
    expect(error.isRetryable()).toBe(true);
  });

  it('should correctly identify error types', () => {
    const authError = new APIError('Unauthorized', 'AUTH_ERROR', 401, 'req-1', new Date().toISOString());
    expect(authError.isAuthError()).toBe(true);
    expect(authError.type).toBe(ErrorType.AUTH);

    const serverError = new APIError('Server error', 'SERVER_ERROR', 500, 'req-2', new Date().toISOString());
    expect(serverError.isServerError()).toBe(true);
    expect(serverError.type).toBe(ErrorType.SERVER);

    const validationError = new APIError('Bad request', 'BAD_REQUEST', 400, 'req-3', new Date().toISOString());
    expect(validationError.isValidationError()).toBe(true);
    expect(validationError.type).toBe(ErrorType.VALIDATION);

    const clientError = new APIError('Not found', 'NOT_FOUND', 404, 'req-4', new Date().toISOString());
    expect(clientError.isClientError()).toBe(true);
    expect(clientError.type).toBe(ErrorType.CLIENT);
  });

  it('should correctly identify retryable errors', () => {
    const networkError = APIError.networkError();
    expect(networkError.isRetryable()).toBe(true);

    const timeoutError = APIError.timeoutError();
    expect(timeoutError.isRetryable()).toBe(true);

    const serverError = new APIError('Server error', 'SERVER_ERROR', 500, 'req-1', new Date().toISOString());
    expect(serverError.isRetryable()).toBe(true);

    const rateLimitError = new APIError('Rate limit', 'RATE_LIMIT', 429, 'req-2', new Date().toISOString());
    expect(rateLimitError.isRetryable()).toBe(true);

    const clientError = new APIError('Bad request', 'BAD_REQUEST', 400, 'req-3', new Date().toISOString());
    expect(clientError.isRetryable()).toBe(false);

    const authError = new APIError('Unauthorized', 'AUTH_ERROR', 401, 'req-4', new Date().toISOString());
    expect(authError.isRetryable()).toBe(false);
  });

  it('should convert to JSON with type', () => {
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
      type: ErrorType.VALIDATION, // 400 is now VALIDATION
      severity: 'MEDIUM',
      details: { field: 'username' },
      retryAfter: undefined,
    });
  });
});
