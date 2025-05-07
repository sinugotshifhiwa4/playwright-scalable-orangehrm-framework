import { ErrorCategory } from './errorCategory.enum';
/**
 * Interface for structured error logging
 */
export interface ErrorDetails {
  source: string; // Where the error occurred (method, component)
  context?: string; // Additional context about the error
  message: string; // Human-readable error message
  category: ErrorCategory; // Classification of the error
  statusCode?: number; // HTTP status code if applicable
  url?: string; // URL for API errors
  details?: Record<string, unknown>; // Additional structured data
  timestamp: string; // ISO format
  environment: string;
  deploymentVersion?: string;
}

/**
 * Interface for Playwright matcher results in assertion errors
 */
export interface PlaywrightMatcherResult {
  name: string;
  pass: boolean;
  expected: unknown;
  actual: unknown;
  message?: string;
  log?: string[];
}

/**
 * Configuration for request expectations
 */
export interface RequestExpectation {
  expectedStatusCodes: number[];
  expectedCategories?: ErrorCategory[];
  isNegativeTest: boolean;
}

/**
 * Interface representing an error with AppError-like properties
 */
export interface AppErrorLike {
  category: ErrorCategory;
  details?: Record<string, unknown>;
  message?: string;
}
