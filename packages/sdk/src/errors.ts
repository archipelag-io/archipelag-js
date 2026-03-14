/**
 * Archipelag.io SDK Errors
 */

/**
 * Base error class for all Archipelag.io SDK errors
 */
export class ArchipelagError extends Error {
  statusCode?: number;
  responseBody?: unknown;

  constructor(message: string, statusCode?: number, responseBody?: unknown) {
    super(message);
    this.name = 'ArchipelagError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * Authentication failed (invalid or missing API key)
 */
export class AuthenticationError extends ArchipelagError {
  constructor(message = 'Authentication failed', statusCode = 401) {
    super(message, statusCode);
    this.name = 'AuthenticationError';
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitError extends ArchipelagError {
  retryAfter?: number;

  constructor(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    statusCode = 429
  ) {
    super(message, statusCode);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Insufficient credits
 */
export class InsufficientCreditsError extends ArchipelagError {
  required?: number;
  available?: number;

  constructor(
    message = 'Insufficient credits',
    required?: number,
    available?: number,
    statusCode = 402
  ) {
    super(message, statusCode);
    this.name = 'InsufficientCreditsError';
    this.required = required;
    this.available = available;
  }
}

/**
 * Job execution failed
 */
export class JobFailedError extends ArchipelagError {
  jobId?: string;
  errorCode?: string;

  constructor(message: string, jobId?: string, errorCode?: string) {
    super(message);
    this.name = 'JobFailedError';
    this.jobId = jobId;
    this.errorCode = errorCode;
  }
}

/**
 * Resource not found
 */
export class NotFoundError extends ArchipelagError {
  constructor(message = 'Resource not found', statusCode = 404) {
    super(message, statusCode);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends ArchipelagError {
  errors?: Record<string, string[]>;

  constructor(
    message = 'Validation failed',
    errors?: Record<string, string[]>,
    statusCode = 422
  ) {
    super(message, statusCode);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Request timeout
 */
export class TimeoutError extends ArchipelagError {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Connection error
 */
export class ConnectionError extends ArchipelagError {
  constructor(message = 'Connection failed') {
    super(message);
    this.name = 'ConnectionError';
  }
}
