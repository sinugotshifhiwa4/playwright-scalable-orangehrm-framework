import axios, { AxiosError } from 'axios';
import * as interfaces from '../../models/utils/errorHandler.interface';
import { ErrorCategory } from '../../models/utils/errorCategory.enum';
import { AppError } from './AppError';
import SanitizationConfig from '../sanitization/sanitizationConfig';

export default class ErrorProcessor {
  /**
   * Create a standardized error object with source, context, message, and category.
   * HTTP details are added if the error is an Axios error.
   * @param error - The error object to process.
   * @param source - The source of the error.
   * @param context - The context of the error (optional).
   * @returns A structured error object with source, context, message, and category.
   */
  public static createErrorDetails(
    error: unknown,
    source: string,
    context?: string,
  ): interfaces.ErrorDetails {
    // Analyze the error to get category and context
    const analysis = this.analyzeError(error);

    // Base error details
    const details: interfaces.ErrorDetails = {
      source,
      context: context || analysis.context,
      message: this.getErrorMessage(error),
      category: analysis.category,
      timestamp: new Date().toISOString(),
      environment: process.env.ENV || 'dev',
      deploymentVersion: process.env.APP_VERSION,
    };

    // Add HTTP details if it's an Axios error
    if (axios.isAxiosError(error) && error.response?.status) {
      details.statusCode = error.response.status;
      details.url = error.config?.url;
    }

    return details;
  }

  /**
   * Clean any error message by stripping ANSI sequences and keeping only first line
   */
  public static cleanMessage(message: string): string {
    if (!message) return '';

    // First sanitize the string using SanitizationConfig
    let cleaned = SanitizationConfig.sanitizeString(message);

    // Strip ANSI escape sequences
    // Using the decimal code for ESC (27) in a character class
    const ESC = String.fromCharCode(27);
    cleaned = cleaned.replace(
      new RegExp(ESC + '\\[\\d+(?:;\\d+)*m|' + ESC + '\\??[0-9;]*[A-Za-z]', 'g'),
      '',
    );

    // Strip error prefix and quotes
    cleaned = cleaned.replace(/^'Error: |^'|'$/g, '');

    // Only keep first line (common pattern in stacktraces)
    return cleaned.split('\n')[0];
  }

  /**
   * Get the error message from any error type
   */
  public static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return this.cleanMessage(error.message);
    }

    if (axios.isAxiosError(error)) {
      return this.formatAxiosErrorMessage(error);
    }

    if (typeof error === 'string') {
      return this.cleanMessage(error);
    }

    if (error && typeof error === 'object') {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === 'string') {
        return this.cleanMessage(message);
      }
    }

    return 'Unknown error occurred';
  }

  /**
   * Create a cache key for error deduplication
   */
  public static createCacheKey(details: interfaces.ErrorDetails): string {
    return `${details.source}_${details.category}_${
      details.statusCode || '0'
    }_${details.message.substring(0, 30)}`;
  }

  /**
   * Extract additional details from error objects
   */
  public static extractExtraDetails(error: unknown): Record<string, unknown> {
    // Handle Playwright matcher results
    if (this.isPlaywrightError(error)) {
      return this.extractPlaywrightDetails(error);
    }

    // Handle axios errors
    if (axios.isAxiosError(error)) {
      return this.extractAxiosDetails(error);
    }

    // Handle general objects
    if (typeof error === 'object' && error !== null) {
      return this.sanitizeObject(error as Record<string, unknown>);
    }

    return {};
  }

  /**
   * Sanitize object for safe logging, using SanitizationConfig
   */
  public static sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    if (!obj) return {};

    // Define custom sanitization parameters
    const customSanitizationParams = {
      ...SanitizationConfig.getDefaultParams(),
      skipProperties: ['stack'],
      truncateUrls: true,
      maxStringLength: 1000,
    };

    // Use a single sanitization call
    return SanitizationConfig.sanitizeData(obj, customSanitizationParams);
  }

  // PRIVATE HELPER METHODS BELOW

  /**
   * Format an Axios error into a readable message
   */
  private static formatAxiosErrorMessage(error: AxiosError): string {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const url = error.config?.url
      ? new URL(error.config.url, 'http://example.com').pathname
      : 'unknown';

    return `HTTP ${status || 'Error'}: ${statusText || error.message} (${
      error.config?.method || 'GET'
    } ${url})`;
  }

  /**
   * Combined method to analyze errors and determine both category and context
   * @param error The error object to analyze
   * @returns An object containing both the error category and context
   */
  private static analyzeError(error: unknown): { category: ErrorCategory; context: string } {
    // Default result
    const result = {
      category: ErrorCategory.UNKNOWN,
      context: 'General Error',
    };

    // Handle specific error types in order of priority
    if (axios.isAxiosError(error)) {
      return this.analyzeAxiosError(error);
    }

    if (this.isPlaywrightError(error)) {
      return this.analyzePlaywrightError(error);
    }

    if (error instanceof Error && 'code' in error) {
      const systemResult = this.analyzeSystemError(error as Error & { code?: string | undefined });
      if (systemResult) return systemResult;
    }

    // Check for timeout patterns in regular errors
    if (this.isTimeoutError(error)) {
      return {
        category: ErrorCategory.TIMEOUT,
        context: 'Timeout Error',
      };
    }

    // Handle AppError case
    if (error instanceof AppError) {
      return this.analyzeAppError(error);
    }

    // For other error types, analyze the message text
    const messageAnalysisResult = this.analyzeErrorMessage(error);
    if (messageAnalysisResult.category !== ErrorCategory.UNKNOWN) {
      return messageAnalysisResult;
    }

    // Default with error name if available
    if (error instanceof Error && error.name) {
      result.context = `${error.name} Error`;
    }

    return result;
  }

  /**
   * Analyze Axios errors
   */
  private static analyzeAxiosError(error: AxiosError): {
    category: ErrorCategory;
    context: string;
  } {
    return {
      category: this.categorizeAxiosError(error),
      context: `API Request: ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${this.safeUrl(error.config?.url)}`,
    };
  }

  /**
   * Analyze Playwright test errors
   */
  private static analyzePlaywrightError(
    error: Error & { matcherResult?: interfaces.PlaywrightMatcherResult },
  ): { category: ErrorCategory; context: string } {
    // Check specifically for timeout errors in Playwright tests first
    if (this.isTimeoutError(error)) {
      return {
        category: ErrorCategory.TIMEOUT,
        context: 'Playwright Timeout Error',
      };
    }

    return {
      category: ErrorCategory.TEST,
      context: `Playwright Assertion: ${error.matcherResult?.name || 'Unknown'}`,
    };
  }

  /**
   * Analyze Node.js system errors
   */
  private static analyzeSystemError(
    error: Error & { code?: string | undefined },
  ): { category: ErrorCategory; context: string } | null {
    if (!error.code) return null;

    const systemCategory = this.getSystemErrorCategory(error);
    if (systemCategory) {
      return {
        category: systemCategory,
        context: this.getContextFromSystemError(error),
      };
    }

    return null;
  }

  /**
   * Check if an error is a timeout error based on its message
   */
  private static isTimeoutError(error: unknown): boolean {
    const errorMessage =
      typeof error === 'string'
        ? error.toLowerCase()
        : error instanceof Error
          ? error.message.toLowerCase()
          : String(error).toLowerCase();

    return (
      errorMessage.includes('timeout') &&
      (errorMessage.includes('exceeded') || errorMessage.includes('timed out'))
    );
  }

  /**
   * Analyze AppError instances
   */
  private static analyzeAppError(error: AppError): { category: ErrorCategory; context: string } {
    return {
      category:
        error.category in ErrorCategory ? (error.category as ErrorCategory) : ErrorCategory.UNKNOWN,
      context: `App Error: ${(error.category as string) || 'Unknown'}`,
    };
  }

  /**
   * Analyze error messages for patterns that indicate specific categories
   */
  private static analyzeErrorMessage(error: unknown): { category: ErrorCategory; context: string } {
    const result = {
      category: ErrorCategory.UNKNOWN,
      context: 'General Error',
    };

    const errorMessage =
      typeof error === 'string'
        ? error.toLowerCase()
        : error instanceof Error
          ? error.message.toLowerCase()
          : String(error).toLowerCase();

    // Check against our category-keyword map
    const categoryMatch = this.findCategoryFromErrorMessage(errorMessage);
    if (categoryMatch) {
      result.category = categoryMatch.category;
      result.context = categoryMatch.context;
    }

    return result;
  }

  /**
   * Find a matching error category based on keywords in the error message
   */
  private static findCategoryFromErrorMessage(
    errorMessage: string,
  ): { category: ErrorCategory; context: string } | null {
    // Define category-context mapping with more precise keywords to avoid false positives
    const categoryContextMap = [
      // Timeout errors - prioritize these first
      {
        category: ErrorCategory.TIMEOUT,
        context: 'Timeout Error',
        keywords: ['timeout', 'timed out', 'timeout exceeded', 'wait timeout'],
      },
      // Authentication and permission errors
      {
        category: ErrorCategory.AUTHENTICATION,
        context: 'Authentication Error',
        keywords: [
          'authentication failed',
          'login failed',
          'unauthorized access',
          'not authenticated',
        ],
      },
      {
        category: ErrorCategory.AUTHORIZATION,
        context: 'Permission Error',
        keywords: [
          'authorization failed',
          'forbidden access',
          'access denied',
          'permission denied',
        ],
      },
      // Database errors - use more specific phrases to avoid false positives
      {
        category: ErrorCategory.DATABASE,
        context: 'Database Error',
        keywords: [
          'database error',
          'database connection failed',
          'sql error',
          'db query failed',
          'database exception',
        ],
      },
      {
        category: ErrorCategory.CONNECTION,
        context: 'Database Connection Error',
        keywords: [
          'database connection failed',
          'failed to connect to database',
          'connection refused',
        ],
      },
      {
        category: ErrorCategory.CONSTRAINT,
        context: 'Database Constraint Error',
        keywords: ['constraint violation', 'duplicate key', 'foreign key constraint'],
      },
      {
        category: ErrorCategory.TRANSACTION,
        context: 'Database Transaction Error',
        keywords: ['transaction failed', 'rollback transaction', 'deadlock detected'],
      },
      // Not found errors
      {
        category: ErrorCategory.NOT_FOUND,
        context: 'Not Found Error',
        keywords: ['not found', 'resource missing', "doesn't exist", 'no such resource'],
      },
      // Network errors
      {
        category: ErrorCategory.NETWORK,
        context: 'Network Error',
        keywords: ['network failure', 'connection refused', 'network timeout'],
      },
      // Validation errors
      {
        category: ErrorCategory.VALIDATION,
        context: 'Validation Error',
        keywords: ['validation', 'invalid', 'schema'],
      },
      // Resource limit errors
      {
        category: ErrorCategory.RESOURCE_LIMIT,
        context: 'Resource Limit Error',
        keywords: ['resource limit', 'quota', 'no space', 'disk full'],
      },
      // File system errors
      {
        category: ErrorCategory.IO,
        context: 'File System Error',
        keywords: ['file', 'directory', 'path', 'fs', 'i/o', 'input/output'],
      },
      // Configuration errors
      {
        category: ErrorCategory.CONFIGURATION,
        context: 'Configuration Error',
        keywords: ['config', 'setting', 'environment', 'configuration'],
      },
      // Service errors
      {
        category: ErrorCategory.SERVICE,
        context: 'Service Error',
        keywords: ['service', 'unavailable'],
      },
      // UI errors
      {
        category: ErrorCategory.UI,
        context: 'UI Error',
        keywords: ['ui', 'interface', 'view', 'render'],
      },
      // Test errors
      {
        category: ErrorCategory.TEST,
        context: 'Test Error',
        keywords: ['test failed', 'test error'],
      },
      // Conflict errors
      {
        category: ErrorCategory.CONFLICT,
        context: 'Conflict Error',
        keywords: ['conflict'],
      },
    ];

    // Check for matching category and context using word boundary matching
    for (const mapping of categoryContextMap) {
      for (const keyword of mapping.keywords) {
        // Build a more precise matching pattern
        const hasMatch =
          errorMessage.includes(keyword) &&
          (errorMessage === keyword ||
            new RegExp(`[\\s.,;:"'!?()\\[\\]{}|\\-]${keyword}[\\s.,;:"'!?()\\[\\]{}|\\-]`).test(
              ` ${errorMessage} `,
            ));

        if (hasMatch) {
          return {
            category: mapping.category,
            context: mapping.context,
          };
        }
      }
    }

    return null;
  }

  /**
   * Get context from system error codes
   */
  private static getContextFromSystemError(error: Error & { code?: string }): string {
    if (!error.code) return 'System Error';

    const contextMap: Record<string, string> = {
      ENOENT: 'File Not Found Error',
      EISDIR: 'Path Is Directory Error',
      ENOTDIR: 'Not A Directory Error',
      ENOTEMPTY: 'Directory Not Empty Error',
      EEXIST: 'File Already Exists Error',
      EACCES: 'File Access Denied Error',
      EBUSY: 'File Busy Error',
      EFBIG: 'File Too Large Error',
      ENAMETOOLONG: 'File Name Too Long Error',
      ENOSPC: 'No Space Error',
      EROFS: 'Read Only File System Error',
    };

    return contextMap[error.code] || 'System Error';
  }

  /**
   * Safely extract a readable URL path from a URL string
   */
  private static safeUrl(url?: string): string {
    if (!url) return 'unknown';

    try {
      const parsed = new URL(url);
      // Remove query parameters and return just the path
      return parsed.pathname;
    } catch {
      // If URL parsing fails, return a truncated version
      return url.slice(0, 50);
    }
  }

  /**
   * Categorize Axios errors based on status code
   */
  private static categorizeAxiosError(error: AxiosError): ErrorCategory {
    const statusCode = error.response?.status;

    if (!statusCode) {
      return ErrorCategory.NETWORK;
    }

    if (statusCode === 401) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (statusCode === 403) {
      return ErrorCategory.AUTHORIZATION;
    }

    if (statusCode === 404) {
      return ErrorCategory.NOT_FOUND;
    }

    if (statusCode >= 400 && statusCode < 500) {
      return ErrorCategory.HTTP_CLIENT;
    }

    if (statusCode >= 500) {
      return ErrorCategory.HTTP_SERVER;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Extract system error category from NodeJS error codes
   */
  private static getSystemErrorCategory(error: Error & { code?: string }): ErrorCategory | null {
    if (!error.code) return null;

    const codeMap: Record<string, ErrorCategory> = {
      ENOENT: ErrorCategory.FILE_NOT_FOUND,
      EISDIR: ErrorCategory.PATH_IS_DIRECTORY,
      ENOTDIR: ErrorCategory.NOT_A_DIRECTORY,
      ENOTEMPTY: ErrorCategory.DIRECTORY_NOT_EMPTY,
      EEXIST: ErrorCategory.FILE_EXISTS,
      EACCES: ErrorCategory.ACCESS_DENIED,
      EBUSY: ErrorCategory.FILE_BUSY,
      EFBIG: ErrorCategory.FILE_TOO_LARGE,
      ENAMETOOLONG: ErrorCategory.FILE_NAME_TOO_LONG,
      ENOSPC: ErrorCategory.NO_SPACE,
      EROFS: ErrorCategory.READ_ONLY_FILE_SYSTEM,
    };

    return codeMap[error.code] || null;
  }

  /**
   * Type guard to safely check if an error is a Playwright error
   */
  private static isPlaywrightError(error: unknown): error is Error & {
    matcherResult?: interfaces.PlaywrightMatcherResult;
  } {
    return error instanceof Error && 'matcherResult' in error;
  }

  /**
   * Extract details from Playwright errors
   */
  private static extractPlaywrightDetails(
    error: Error & { matcherResult?: interfaces.PlaywrightMatcherResult },
  ): Record<string, unknown> {
    const matcher = error.matcherResult;

    if (!matcher) {
      return {};
    }

    return {
      name: matcher.name,
      pass: matcher.pass,
      expected: matcher.expected,
      actual: matcher.actual,
      message: matcher.message ? this.cleanMessage(matcher.message) : undefined,
      log: Array.isArray(matcher.log)
        ? matcher.log
            .filter((entry) => !entry.includes('http'))
            .map((entry) => this.cleanMessage(entry))
        : undefined,
    };
  }

  /**
   * Extract details from Axios errors
   */
  private static extractAxiosDetails(error: AxiosError): Record<string, unknown> {
    const result: Record<string, unknown> = {
      status: error.response?.status,
      statusText: error.response?.statusText,
    };

    // Include safe parts of the request
    if (error.config) {
      result.method = error.config.method;
      result.url = error.config.url
        ? new URL(error.config.url, 'http://example.com').pathname
        : undefined;
      result.headers = SanitizationConfig.sanitizeHeaders(error.config.headers);
    }

    // Include response data, filtering out any sensitive information
    if (error.response?.data && typeof error.response.data === 'object') {
      result.data = this.sanitizeObject(error.response.data as Record<string, unknown>);
    }

    return result;
  }
}
