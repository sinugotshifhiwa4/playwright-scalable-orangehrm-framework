import { SanitizationParams } from '../../models/utils/sanitization.interface';
import { DefaultSensitiveKeys, MaskValue, neverTruncateDefaultKeys } from './sanitizationDefaults';
import logger from '../logging/loggerManager';

export default class SanitizationConfig {
  private static defaultSanitizationParams: SanitizationParams = {
    sensitiveKeys: DefaultSensitiveKeys,
    maskValue: MaskValue,
    truncateUrls: false,
    maxStringLength: 1000,
    neverTruncateKeys: neverTruncateDefaultKeys,
  };

  /**
   * Updates the default sanitization parameters
   * @param params Partial sanitization parameters to update
   */
  public static updateDefaultParams(params: Partial<SanitizationParams>): void {
    this.defaultSanitizationParams = {
      ...this.defaultSanitizationParams,
      ...params,
    };
  }

  /**
   * Get current default sanitization parameters
   * @returns Current default sanitization parameters
   */
  public static getDefaultParams(): SanitizationParams {
    return { ...this.defaultSanitizationParams };
  }

  /**
   * Sanitizes sensitive data from an object or error
   * @param data - The data to sanitize
   * @param config - Sanitization configuration
   * @returns Sanitized data
   */
  public static sanitizeData<T>(
    data: T,
    config: SanitizationParams = this.defaultSanitizationParams,
  ): T {
    // Handle null, undefined, or primitive types
    if (data === null || data === undefined || typeof data !== 'object') {
      return this.handlePrimitiveValue(data, config);
    }

    // Handle arrays - with proper type preservation
    if (Array.isArray(data)) {
      return this.sanitizeArray(data, config) as unknown as T;
    }

    // Handle objects
    return this.sanitizeObject(data, config);
  }

  /**
   * Sanitizes data by specific paths (e.g., "user.credentials.password")
   * @param data - The data to sanitize
   * @param paths - Array of dot-notation paths to sensitive data
   * @param maskValue - Value to replace sensitive data with
   * @returns Sanitized data
   */
  public static sanitizeByPaths<T extends Record<string, unknown>>(
    data: T,
    paths: string[],
    maskValue: string = this.defaultSanitizationParams.maskValue || MaskValue,
  ): T {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return data;
    }

    // Create a deep copy to avoid mutations
    const result = JSON.parse(JSON.stringify(data)) as T;

    paths.forEach((path) => this.processSinglePath(result, path, maskValue));

    return result;
  }

  /**
   * Sanitizes data by specific key-value pairs, including nested objects
   * @param data - The data to sanitize
   * @param keysOrKeyValuePairs - Array of keys or an object of key-value pairs to sensitive data
   * @param maskValue - Value to replace sensitive data with
   * @returns Sanitized data
   */
  public static sanitizeByKeyValuePairs<T extends Record<string, unknown>>(
    data: T,
    keysOrKeyValuePairs: string[] | Record<string, string | number>,
    maskValue: string = this.defaultSanitizationParams.maskValue || MaskValue,
  ): T {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return data;
    }

    // Convert input to key-value pairs if it's an array of keys
    const keyValuePairs: Record<string, string | number> = Array.isArray(keysOrKeyValuePairs)
      ? this.extractKeyValuePairs(data, keysOrKeyValuePairs)
      : keysOrKeyValuePairs;

    // Create a deep copy to avoid mutations
    const result = JSON.parse(JSON.stringify(data)) as T;

    // Process the object recursively
    this.applyKeyValueMaskingRecursive(result, keyValuePairs, maskValue);

    return result;
  }

  /**
   * Apply masking to key-value pairs recursively through an object
   * @param obj - Object to process
   * @param keyValuePairs - Key-value pairs to look for and mask
   * @param maskValue - Value to use for masking
   */
  private static applyKeyValueMaskingRecursive(
    obj: Record<string, unknown>,
    keyValuePairs: Record<string, string | number>,
    maskValue: string,
  ): void {
    // First handle the current level
    for (const [key, valueToMask] of Object.entries(keyValuePairs)) {
      if (key in obj && obj[key] === valueToMask) {
        obj[key] = maskValue;
      }
    }

    // Then recursively process nested objects
    for (const [_key, value] of Object.entries(obj)) {
      if (value !== null && typeof value === 'object') {
        if (Array.isArray(value)) {
          // Handle arrays
          value.forEach((item) => {
            if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
              this.applyKeyValueMaskingRecursive(
                item as Record<string, unknown>,
                keyValuePairs,
                maskValue,
              );
            }
          });
        } else {
          // Handle nested objects
          this.applyKeyValueMaskingRecursive(
            value as Record<string, unknown>,
            keyValuePairs,
            maskValue,
          );
        }
      }
    }
  }

  /**
   * Sanitizes headers to remove sensitive information
   * Uses default SanitizationConfig parameters
   */
  public static sanitizeHeaders(headers: unknown): Record<string, unknown> {
    if (!headers || typeof headers !== 'object') {
      return {};
    }

    // Use default sanitization parameters which already include header sensitive keys
    return SanitizationConfig.sanitizeData(headers as Record<string, unknown>);
  }

  /**
   * Sanitizes string values by removing potentially dangerous characters.
   * Can be used for credentials, URLs, or any string that needs sanitization.
   *
   * @param value The string value to sanitize
   * @returns A sanitized string with potentially dangerous characters removed
   */
  public static sanitizeString(value: string): string {
    if (!value) return '';

    // Remove quotes, backslashes, angle brackets, and trim whitespace
    return value.replace(/["'\\<>]/g, '').trim();
  }

  /**
   * Creates a sanitization function that can be used with Winston logger
   * @returns A function that sanitizes objects for logging
   */
  public static createLogSanitizer(): (info: Record<string, unknown>) => Record<string, unknown> {
    return (info: Record<string, unknown>) => this.sanitizeData(info);
  }

  // =================== HELPER METHODS ===================

  /**
   * Handles primitive values during sanitization process
   */
  private static handlePrimitiveValue<T>(data: T, config: SanitizationParams): T {
    // Handle string truncation for primitive string values
    if (typeof data === 'string' && config.maxStringLength) {
      return this.truncateString(data, config.maxStringLength) as unknown as T;
    }
    return data;
  }

  /**
   * Sanitizes an array by processing each element
   */
  private static sanitizeArray<T>(data: T[], config: SanitizationParams): T[] {
    return data.map((item) =>
      typeof item === 'object' && item !== null ? this.sanitizeData(item, config) : item,
    );
  }

  /**
   * Sanitizes an object by processing its properties
   */
  private static sanitizeObject<T>(data: T, config: SanitizationParams): T {
    const sanitizedObject = { ...(data as object) } as Record<string, unknown>;

    // Handle skip properties first
    this.processSkipProperties(sanitizedObject, config);

    // Process remaining properties
    this.processObjectProperties(sanitizedObject, config);

    return sanitizedObject as T;
  }

  /**
   * Removes properties that should be skipped based on configuration
   */
  private static processSkipProperties(
    obj: Record<string, unknown>,
    config: SanitizationParams,
  ): void {
    if (!config.skipProperties || config.skipProperties.length === 0) return;

    for (const key of Object.keys(obj)) {
      if (config.skipProperties.some((prop) => key.toLowerCase().includes(prop.toLowerCase()))) {
        delete obj[key];
      }
    }
  }

  /**
   * Processes object properties for sanitization
   */
  private static processObjectProperties(
    obj: Record<string, unknown>,
    config: SanitizationParams,
  ): void {
    // Create a Set for O(1) lookups of sensitive keys
    const sensitiveKeysSet = new Set(config.sensitiveKeys.map((key) => key.toLowerCase()));

    Object.keys(obj).forEach((key) => {
      const value = obj[key];

      // Check if key matches sensitive keys (case-insensitive)
      if (this.isSensitiveKey(key, sensitiveKeysSet, config.sensitiveKeys)) {
        obj[key] = config.maskValue;
      } else if (typeof value === 'string') {
        obj[key] = this.processStringValue(value, key, config);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        obj[key] = this.sanitizeData(value, config);
      }
    });
  }

  /**
   * Checks if a key should be considered sensitive
   */
  private static isSensitiveKey(
    key: string,
    sensitiveKeysSet: Set<string>,
    sensitiveKeys: string[],
  ): boolean {
    return (
      sensitiveKeysSet.has(key.toLowerCase()) ||
      sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase()))
    );
  }

  /**
   * Process a string value for sanitization
   */
  private static processStringValue(
    value: string,
    key: string,
    config: SanitizationParams,
  ): string {
    // If key should never be truncated, return as is
    if (this.shouldNeverTruncate(key, config.neverTruncateKeys)) {
      return value;
    }

    let processedValue = value;

    // Sanitize URLs if enabled
    if (config.truncateUrls && processedValue.includes('http')) {
      processedValue = this.sanitizeUrl(processedValue, config.maxStringLength);
    }

    // Truncate long strings if maximum length is specified
    if (config.maxStringLength) {
      processedValue = this.truncateString(processedValue, config.maxStringLength);
    }

    return processedValue;
  }

  /**
   * Checks if a key should never be truncated
   */
  private static shouldNeverTruncate(key: string, neverTruncateKeys?: string[]): boolean {
    if (!neverTruncateKeys) return false;

    return neverTruncateKeys.some((neverKey) => neverKey.toLowerCase() === key.toLowerCase());
  }

  /**
   * Process a single path for path-based sanitization
   */
  private static processSinglePath(
    obj: Record<string, unknown>,
    path: string,
    maskValue: string,
  ): void {
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;

    // Navigate to the parent object
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (
        current[part] === undefined ||
        current[part] === null ||
        typeof current[part] !== 'object'
      ) {
        return; // Path doesn't exist or is invalid
      }
      current = current[part] as Record<string, unknown>;
    }

    // Set the value if we can reach it
    const lastPart = parts[parts.length - 1];
    if (lastPart in current) {
      current[lastPart] = maskValue;
    }
  }

  /**
   * Apply masking to key-value pairs
   */
  private static applyKeyValueMasking(
    obj: Record<string, unknown>,
    keyValuePairs: Record<string, string | number>,
    maskValue: string,
  ): void {
    for (const [key, valueToMask] of Object.entries(keyValuePairs)) {
      if (key in obj && obj[key] === valueToMask) {
        obj[key] = maskValue;
      }
    }
  }

  /**
   * Truncates a string to the specified maximum length, preserving any URLs
   * @param value - String to truncate
   * @param maxLength - Maximum length (from config)
   * @returns Truncated string with ellipsis if necessary, with URLs preserved
   */
  private static truncateString(value: string, maxLength?: number): string {
    const limit = maxLength ?? this.defaultSanitizationParams.maxStringLength ?? 1000;

    // If string is under the limit or no limit specified, return as is
    if (!limit || value.length <= limit) return value;

    // Check if the string contains a URL
    if (value.includes('http')) {
      return this.truncateStringWithUrl(value, limit);
    }

    // Standard truncation for non-URL strings
    return value.substring(0, limit) + '...';
  }

  /**
   * Helper to truncate strings that contain URLs
   */
  private static truncateStringWithUrl(value: string, limit: number): string {
    // URL detection regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = value.match(urlRegex) || [];

    // If we have URLs, preserve them in the truncated string
    if (urls.length > 0) {
      // If the string starts with a URL, keep the URL intact
      for (const url of urls) {
        if (value.startsWith(url)) {
          return this.truncateStartingWithUrl(value, url, limit);
        }
      }

      // Otherwise, truncate normally but mention URLs are present
      return value.substring(0, limit) + '... [URLs omitted]';
    }

    // Fallback to standard truncation
    return value.substring(0, limit) + '...';
  }

  /**
   * Helper for truncating strings that start with a URL
   */
  private static truncateStartingWithUrl(value: string, url: string, limit: number): string {
    const remainingLength = limit - url.length - 3; // -3 for ellipsis
    if (remainingLength > 0) {
      const nonUrlPart = value.substring(url.length);
      return url + nonUrlPart.substring(0, remainingLength) + '...';
    }
    return url; // If URL is already at or over limit, just return the URL
  }

  /**
   * Sanitizes URLs by preserving the essential parts (protocol, domain) and truncating the path if needed
   * @param value - String potentially containing URLs
   * @param maxUrlLength - Maximum length for URLs (defaults to overall maxStringLength)
   * @returns String with URLs properly truncated
   */
  private static sanitizeUrl(value: string, maxUrlLength?: number): string {
    if (!value.includes('http')) return value;

    const limit = maxUrlLength ?? this.defaultSanitizationParams.maxStringLength ?? 1000;

    // Find all URLs in the string
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return value.replace(urlRegex, (url) => {
      if (url.length <= limit) return url;

      return this.truncateUrl(url);
    });
  }

  /**
   * Helper to truncate a single URL
   */
  private static truncateUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const origin = parsedUrl.origin; // Contains protocol + domain

      // Keep the domain and truncate the path
      const pathAndQuery = parsedUrl.pathname + parsedUrl.search;
      if (pathAndQuery.length > 20) {
        // If the path is long, show the beginning and end
        const pathStart = parsedUrl.pathname.substring(0, 10);
        return `${origin}${pathStart}...[truncated]`;
      }

      return origin + pathAndQuery;
    } catch (error) {
      logger.error('URL parsing failed:', error);
      // If URL parsing fails, return the beginning of the URL
      return url.substring(0, 30) + '...[truncated]';
    }
  }


/**
 * Extracts key-value pairs from the provided data object based on the given sensitive keys.
 * Only keys with string or number values are included in the result.
 * 
 * @template T - Type of the data object
 * @param data - The data object to extract key-value pairs from
 * @param sensitiveKeys - An array of keys to extract values for
 * @returns An object containing the extracted key-value pairs with keys as strings
 */
  private static extractKeyValuePairs<T extends Record<string, unknown>>(
    data: T,
    sensitiveKeys: Array<keyof T>
  ): Record<string, string | number> {
    return sensitiveKeys.reduce((acc, key) => {
      const value = data[key];
      if (typeof value === 'string' || typeof value === 'number') {
        acc[key as string] = value;
      }
      return acc;
    }, {} as Record<string, string | number>);
  }
  
}
