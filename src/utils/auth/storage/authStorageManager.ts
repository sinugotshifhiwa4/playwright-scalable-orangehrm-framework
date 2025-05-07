import { TestInfo } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import logger from '../../logging/loggerManager';
import FileManager from '../../fileManager';
import { FileEncoding } from '../../../models/utils/fileEncoding.enum';
import ErrorHandler from '../../errors/errorHandler';

export default class AuthStorageManager {
  // Constants
  private static AUTH_ENABLED_ENV = 'USE_AUTH_STORAGE';
  private static AUTH_STATE_DIR = '.auth';
  private static LOCAL_AUTH_FILE = 'local-login.json';
  private static CI_AUTH_FILE = 'ci-login.json';
  private static hasBeenReset = false;

  /**
   * Checks if auth storage mechanism is enabled via environment variable
   */
  public static isAuthStorageEnabled(): boolean {
    const useAuthStorage = process.env[this.AUTH_ENABLED_ENV]?.toLowerCase();
    return (
      useAuthStorage === undefined ||
      useAuthStorage === 'true' ||
      useAuthStorage === '1' ||
      useAuthStorage === 'yes'
    );
  }

  /**
   * Determines if authentication setup should be skipped for a test
   * based on test metadata and test title patterns
   *
   * @param testInfo - The TestInfo object from Playwright
   * @param additionalSkipConditions - Additional test title patterns that should skip auth
   * @returns boolean - true if auth setup should be skipped
   */
  public static shouldSkipAuthSetup(
    testInfo: TestInfo,
    additionalSkipConditions: string[] = [],
  ): boolean {
    try {
      // Default conditions that should skip auth setup
      const defaultSkipConditions = ['Authenticate', 'Login'];

      // Combine default and additional conditions
      const allSkipConditions = [...defaultSkipConditions, ...additionalSkipConditions];

      // Check if test has explicit metadata to skip auth
      const skipAuth =
        testInfo.annotations.find((a) => a.type === 'skipAuth')?.description === 'true';

      // Check if the test title contains any of the skip conditions
      const titleContainsSkipCondition = allSkipConditions.some((condition) =>
        testInfo.title.includes(condition),
      );

      return skipAuth || titleContainsSkipCondition;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'shouldSkipAuthSetup',
        `Failed to determine if auth setup should be skipped`,
      );
      throw error;
    }
  }

  /**
   * Ensures the auth state directory exists
   */
  public static createAuthDirectoryIfNeeded(): void {
    try {
      const dirPath = path.join(process.cwd(), this.AUTH_STATE_DIR);
      // Always ensure directory exists, even in CI environment
      FileManager.ensureDirectoryExistsSync(dirPath);
      logger.debug(`Authentication directory created: ${dirPath}`);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'createAuthDirectoryIfNeeded',
        `Failed to create auth state directory`,
      );
      throw error;
    }
  }

  /**
   * Resolves the path to the authentication state file based on the environment
   * - CI mode: `.auth/ci-login.json`
   * - Local mode: `.auth/local-login.json`
   * Also ensures the directory exists and optionally resets file to empty state
   * @param resetFile Whether to reset the file to an empty state (default: false)
   */
  public static resolveAuthStateFilePath(resetFile: boolean = false): string {
    try {
      // First ensure the directory exists
      this.createAuthDirectoryIfNeeded();

      const fileName = process.env.CI ? this.CI_AUTH_FILE : this.LOCAL_AUTH_FILE;
      const filePath = path.resolve(this.AUTH_STATE_DIR, fileName);

      if (resetFile) {
        this.initializeEmptyAuthStateFile();
      }

      return filePath;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'resolveAuthStateFilePath',
        `Failed to resolve auth state file path`,
      );
      throw error;
    }
  }

  /**
   * Deletes the auth state directory
   */
  public static deleteAuthStateDirectory(): boolean {
    try {
      const dirPath = path.join(process.cwd(), this.AUTH_STATE_DIR);
      if (FileManager.doesDirectoryExistSync(dirPath)) {
        FileManager.removeDirectory(dirPath);
        logger.debug(`Auth state directory deleted: ${dirPath}`);
      }
      return true;
    } catch (error) {
      logger.error(`Failed to delete auth state directory: ${error}`);
      return false;
    }
  }

  /**
   * Gets the age of the auth state file in minutes
   */
  public static async getAuthStateAgeInMinutes(): Promise<number> {
    try {
      const filePath = this.resolveAuthStateFilePath(false); // Don't reset file when checking age
      if (!(await FileManager.doesFileExist(filePath))) {
        return -1;
      }

      const stats = fs.statSync(filePath);
      const ageMs = Date.now() - stats.mtime.getTime();
      return Math.floor(ageMs / (1000 * 60)); // minutes
    } catch (error) {
      logger.warn(`Error checking auth state age: ${error}`);
      return -1;
    }
  }

  /**
   * Checks if the auth state file is expired
   * @param expiryMinutes Time in minutes after which the auth state is considered expired
   */
  public static async isAuthStateExpired(expiryMinutes = 60): Promise<boolean> {
    const ageMinutes = await this.getAuthStateAgeInMinutes();
    return ageMinutes === -1 || ageMinutes > expiryMinutes;
  }

  /**
   * Checks if the auth state file exists
   * @param resetIfExists Whether to reset the file to empty state if it exists (default: false)
   */
  public static doesAuthStateFileExist(resetIfExists: boolean = false): boolean {
    try {
      // This will ensure the directory exists first
      const filePath = this.resolveAuthStateFilePath(resetIfExists);
      const exists = FileManager.doesFileExistSync(filePath);
      logger.debug(`Auth state file ${exists ? 'exists' : 'does not exist'}: ${filePath}`);
      return exists;
    } catch (error) {
      logger.warn(`Error checking auth state file: ${error}`);
      return false;
    }
  }

  /**
   * Initializes the authentication state file to an empty state.
   * This method ensures the file reset happens only once per test run.
   * It creates the file with an empty JSON object if it doesn't exist,
   * or resets it if it does. The directory is created if needed.
   *
   * @returns {boolean} true if the file was successfully initialized or had already been reset; false if an error occurred.
   */
  public static initializeEmptyAuthStateFile(): boolean {
    // This ensures the reset happens exactly once per test run
    if (this.hasBeenReset) {
      return true;
    }

    try {
      // Set the flag to prevent further resets
      this.hasBeenReset = true;

      // Ensure directory exists
      this.createAuthDirectoryIfNeeded();

      // Get the file path
      const fileName = process.env.CI ? this.CI_AUTH_FILE : this.LOCAL_AUTH_FILE;
      const filePath = path.resolve(this.AUTH_STATE_DIR, fileName);

      // Create or reset the file with empty JSON object
      FileManager.writeFile(filePath, JSON.stringify({}), 'authStateFile', FileEncoding.UTF8);
      logger.debug(`Initialized authentication state file with empty state: ${filePath}`);

      return true;
    } catch (error) {
      logger.error(`Failed to initialize auth state file: ${error}`);
      this.hasBeenReset = false; // Reset flag so it can try again
      return false;
    }
  }
}