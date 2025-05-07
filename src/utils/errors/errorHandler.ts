import axios from 'axios';
import RequestContext from '../../api/context/requestContext';
import { ErrorCategory } from '../../models/utils/errorCategory.enum';
import logger from '../logging/loggerManager';
import ErrorHandlerHelpers from './errorProcessor';

export default class ErrorHandler {
  // Cache with timestamps to enable time-based expiration
  private static loggedErrors = new Map<string, number>();

  // Configuration constants
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly CACHE_TTL = 1000 * 60 * 20; // 20 minutes in milliseconds

  /**
   * Main error handler method - use this as the primary entry point
   */
  public static captureError(error: unknown, source: string, context?: string): void {
    try {
      // Skip error logging if this is an expected error in a negative test
      if (this.shouldSkipErrorLogging(error, context)) {
        // Log as info instead of error for expected negative test results
        if (axios.isAxiosError(error) && error.response?.status) {
          logger.info(
            `Expected error in negative test [${context}]: Status ${error.response.status}`,
          );
        }
        return; // Exit early to prevent further logging
      }
      // Generate error details
      const details = ErrorHandlerHelpers.createErrorDetails(error, source, context);
      // Create a cache key to avoid duplicate logging
      const cacheKey = ErrorHandlerHelpers.createCacheKey(details);
      // Skip if already logged recently
      if (this.isRecentlyLogged(cacheKey)) {
        return;
      }
      // Add to cache and maintain cache size
      this.manageCacheSize(cacheKey);
      // Sanitize and log the structured error - ensure stack trace is removed
      const sanitizedDetails = ErrorHandlerHelpers.sanitizeObject(
        details as unknown as Record<string, unknown>,
      );
      logger.error(JSON.stringify(sanitizedDetails, null, 2));
      // Log additional details if available
      const extraDetails = ErrorHandlerHelpers.extractExtraDetails(error);
      if (Object.keys(extraDetails).length > 0) {
        logger.error(
          JSON.stringify(
            {
              source,
              type: extraDetails?.statusText || 'Unknown',
              details: extraDetails,
            },
            null,
            2,
          ),
        );
      }
    } catch (loggingError) {
      // Fallback for errors during error handling
      logger.error(
        JSON.stringify(
          {
            source,
            context: 'Error Handler Failure',
            message: ErrorHandlerHelpers.getErrorMessage(loggingError),
            category: ErrorCategory.UNKNOWN,
          },
          null,
          2,
        ),
      );
    }
  }

  /**
   * Log and throw an error with the provided message
   */
  public static logAndThrow(message: string, source: string): never {
    this.captureError(new Error(message), source);
    throw new Error(message);
  }

  /**
   * Log error but continue execution
   */
  public static logAndContinue(error: unknown, source: string, context?: string): void {
    this.captureError(error, source, context ? `${context} (non-fatal)` : 'Non-fatal error');
  }

  /**
   * Reset the logged errors cache (useful for testing)
   */
  public static resetCache(): void {
    this.loggedErrors.clear();
  }

  /**
   * Check if error was recently logged (still in cache and not expired)
   */
  private static isRecentlyLogged(cacheKey: string): boolean {
    const timestamp = this.loggedErrors.get(cacheKey);
    if (!timestamp) return false;

    const now = Date.now();
    if (now - timestamp > this.CACHE_TTL) {
      // Entry exists but expired - remove it
      this.loggedErrors.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Check if error should be skipped based on request context
   */
  private static shouldSkipErrorLogging(error: unknown, context?: string): boolean {
    if (!context) return false;

    if (axios.isAxiosError(error) && error.response?.status) {
      return (
        RequestContext.isExpectedStatus(context, error.response.status) &&
        RequestContext.isNegativeTest(context)
      );
    }

    return false;
  }

  /**
   * Add item to cache with current timestamp and manage cache size/expiration
   */
  private static manageCacheSize(cacheKey: string): void {
    const now = Date.now();

    // First clean up expired entries
    this.cleanExpiredEntries(now);

    // Add new entry with current timestamp
    this.loggedErrors.set(cacheKey, now);

    // If still over size limit after cleanup, remove oldest entries
    if (this.loggedErrors.size > this.MAX_CACHE_SIZE) {
      this.removeOldestEntries();
    }
  }

  /**
   * Remove entries that have exceeded the TTL
   */
  private static cleanExpiredEntries(now: number): void {
    this.loggedErrors.forEach((timestamp, key) => {
      if (now - timestamp > this.CACHE_TTL) {
        this.loggedErrors.delete(key);
      }
    });
  }

  /**
   * Remove the oldest logged error entries to maintain cache size within limit.
   */
  private static removeOldestEntries(): void {
    // Convert loggedErrors map to an array of [errorHash, timestamp] pairs
    const errorEntryList = Array.from(this.loggedErrors.entries());

    // Sort error entries by timestamp in ascending order (oldest first)
    errorEntryList.sort(([, timestampA], [, timestampB]) => timestampA - timestampB);

    // Determine how many entries need to be removed to stay within MAX_CACHE_SIZE
    const excessEntryCount = this.loggedErrors.size - this.MAX_CACHE_SIZE;

    // Remove the oldest entries based on the calculated excess
    for (let index = 0; index < excessEntryCount; index++) {
      const [oldestErrorHash] = errorEntryList[index];
      this.loggedErrors.delete(oldestErrorHash);
    }
  }

  /**
   * Public accessor for getErrorMessage to maintain API compatibility
   */
  public static getErrorMessage(error: unknown): string {
    return ErrorHandlerHelpers.getErrorMessage(error);
  }
}
