import ErrorHandler from '../../errors/errorHandler';
import logger from '../../logging/loggerManager';

export default class TestDataStoreManager {
  /**
   * Sets a value in the data map for a given testId.
   *
   * @param map - The map containing data objects associated with test identifiers
   * @param testId - The identifier of the test to store the data for
   * @param key - The key to store the value at
   * @param value - The value to store (string or number)
   * @returns true if the operation was successful
   * @throws {Error} If inputs are invalid or operation fails
   */
  public static setValue<T extends Record<string, string | number | null>>(
    map: Map<string, T>,
    testId: string,
    key: keyof T,
    value: string | number,
  ): boolean {
    this.validateInputs(testId, key, 'setValue');

    try {
      const dataForId = this.getDataForTest(map, testId);
      dataForId[key] = value as T[keyof T];
      map.set(testId, dataForId);
      logger.info(`Key "${String(key)}" set for testId: "${testId}".`);
      return true;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'setValue',
        `Failed to set value for testId: ${testId}, key: ${String(key)} in the map`,
      );
      throw error;
    }
  }

  /**
   * Retrieves a value from the data map for a given testId.
   *
   * @param map - The map storing test data
   * @param testId - The identifier for the test
   * @param key - The key to retrieve the value for
   * @param throwIfMissing - Whether to throw an error if key is missing (default: false)
   * @param defaultValue - Value to return if key not found (when not throwing)
   * @returns The value associated with the key, or defaultValue if not found
   * @throws {Error} If testId/key is invalid, or if key is missing and throwIfMissing is true
   */
  public static getValue<T extends Record<string, string | number | null>>(
    map: Map<string, T>,
    testId: string,
    key: keyof T,
    throwIfMissing: boolean = false,
    defaultValue: string | number | null = null,
  ): string | number | null {
    this.validateInputs(testId, key, 'getValue');

    try {
      if (!map.has(testId)) {
        return this.handleMissingTest(testId, throwIfMissing, defaultValue);
      }

      const dataForId = map.get(testId);

      if (!this.validateDataFormat(dataForId, testId, throwIfMissing)) {
        return defaultValue;
      }

      if (!this.validateKeyExists(dataForId as T, key, testId, throwIfMissing)) {
        return defaultValue;
      }

      return (dataForId as T)[key];
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'getValue',
        `Failed to get data from storage for testId: ${testId}, key: ${String(key)}`,
      );
      throw error;
    }
  }

  /**
   * Checks if a specific field exists for a testId.
   *
   * @param map - The map containing data objects associated with test identifiers
   * @param testId - The identifier of the test
   * @param key - The key to check
   * @returns true if the field exists, false otherwise
   */
  public static hasField<T extends Record<string, string | number | null>>(
    map: Map<string, T>,
    testId: string,
    key: keyof T,
  ): boolean {
    try {
      const dataForId = map.get(testId);
      return Boolean(dataForId && Object.prototype.hasOwnProperty.call(dataForId, key));
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'hasField',
        `Failed to check if field exists for testId: ${testId}, key: ${String(key)}`,
      );
      throw error;
    }
  }

  /**
   * Checks if a testId exists in the data map.
   *
   * @param map - The map containing data objects associated with test identifiers
   * @param testId - The identifier of the test to check for
   * @returns true if the testId exists in the map; false otherwise
   */
  public static hasTest<T>(map: Map<string, T>, testId: string): boolean {
    try {
      return map.has(testId);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'hasTest',
        `Failed to check if testId: ${testId} exists in the map`,
      );
      throw error;
    }
  }

  /**
   * Removes a testId from the data map.
   *
   * @param map - The map containing data objects associated with test identifiers
   * @param testId - The identifier of the test to remove from the map
   * @returns true if the operation was successful, false otherwise
   */
  public static removeTest<T>(map: Map<string, T>, testId: string): boolean {
    try {
      return map.delete(testId);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'removeTest',
        `Failed to remove testId: ${testId} from the map`,
      );
      throw error;
    }
  }

  /** Validates input parameters */
  private static validateInputs(
    testId: string,
    key: string | number | symbol,
    methodName: string,
  ): void {
    if (!testId || !key) {
      const message = `Invalid testId or key provided to ${methodName}.`;
      logger.error(message);
      throw new Error(message);
    }
  }

  /** Retrieves existing test data or initializes a new object */
  private static getDataForTest<T>(map: Map<string, T>, testId: string): T {
    return map.get(testId) ?? ({} as T);
  }

  /**
   * Handles the case when a test ID does not exist in the map
   *
   * @param testId - The identifier that was not found
   * @param throwIfMissing - Whether to throw an error
   * @param defaultValue - The value to return if not throwing
   * @returns The default value if not throwing
   * @throws {Error} If throwIfMissing is true
   */
  private static handleMissingTest(
    testId: string,
    throwIfMissing: boolean,
    defaultValue: string | number | null,
  ): string | number | null {
    const message = `No data found for testId: "${testId}".`;
    if (throwIfMissing) {
      logger.error(message);
      throw new Error(message);
    }
    logger.warn(message);
    return defaultValue;
  }

  /**
   * Validates that the data retrieved for a test ID has a valid format
   *
   * @param dataForId - The data to validate
   * @param testId - The test identifier associated with the data
   * @param throwIfMissing - Whether to throw on invalid format
   * @param defaultValue - The value used for return type inference
   * @returns true if format is valid, false otherwise
   * @throws {Error} If format is invalid and throwIfMissing is true
   */
  private static validateDataFormat<T>(
    dataForId: T | undefined,
    testId: string,
    throwIfMissing: boolean,
  ): boolean {
    if (dataForId === null || dataForId === undefined || typeof dataForId !== 'object') {
      const message = `Invalid data format for testId: "${testId}".`;
      if (throwIfMissing) {
        logger.error(message);
        throw new Error(message);
      }
      logger.warn(message);
      return false;
    }
    return true;
  }

  /**
   * Validates that a key exists in the data object
   *
   * @param dataForId - The data object to check
   * @param key - The key to look for
   * @param testId - The test identifier for error messages
   * @param throwIfMissing - Whether to throw if key doesn't exist
   * @param defaultValue - The value used for return type inference
   * @returns true if key exists, false otherwise
   * @throws {Error} If key doesn't exist and throwIfMissing is true
   */
  private static validateKeyExists<T extends Record<string, string | number | null>>(
    dataForId: T,
    key: keyof T,
    testId: string,
    throwIfMissing: boolean,
  ): boolean {
    if (!Object.prototype.hasOwnProperty.call(dataForId, key)) {
      const message = `Key "${String(key)}" is not set for testId: "${testId}".`;
      if (throwIfMissing) {
        logger.error(message);
        throw new Error(message);
      }
      logger.warn(message);
      return false;
    }
    return true;
  }
}
