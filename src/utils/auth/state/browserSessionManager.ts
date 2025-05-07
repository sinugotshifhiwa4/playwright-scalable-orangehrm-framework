import { Page } from '@playwright/test';
import AuthStateManager from '../storage/authStorageManager';
import ErrorHandler from '../../errors/errorHandler';
import logger from '../../logging/loggerManager';

export class BrowserSessionManager {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Saves the current browser session state to the authentication state file
   * @returns Promise that resolves when the storage state has been saved
   */
  async saveSessionState(): Promise<void> {
    try {
      const storagePath = AuthStateManager.resolveAuthStateFilePath();
      await this.page.context().storageState({ path: storagePath });
      logger.info(`Successfully saved browser session state to: ${storagePath}`);
    } catch (error) {
      ErrorHandler.captureError(error, 'saveSessionState', 'Failed to save browser session state');
      throw error;
    }
  }

  /**
   * Checks if the current session state is valid or expired
   * @param expiryMinutes Time in minutes after which the session is considered expired
   * @returns Promise that resolves to true if session exists and is not expired
   */
  async isSessionValid(expiryMinutes: number = 60): Promise<boolean> {
    try {
      // Check if auth state file exists
      if (!AuthStateManager.doesAuthStateFileExist()) {
        logger.info('No session state file exists');
        return false;
      }

      // Check if the file is expired
      const isExpired = await AuthStateManager.isAuthStateExpired(expiryMinutes);
      if (isExpired) {
        logger.info(`Session state is expired (older than ${expiryMinutes} minutes)`);
        return false;
      }

      return true;
    } catch (error) {
      logger.warn(`Error checking session validity: ${error}`);
      return false; // Assume invalid if there was an error
    }
  }

  /**
   * Clears the current session state by initializing an empty state file
   * @returns true if successfully cleared, false otherwise
   */
  clearSessionState(): boolean {
    try {
      return AuthStateManager.initializeEmptyAuthStateFile();
    } catch (error) {
      logger.error(`Failed to clear session state: ${error}`);
      return false;
    }
  }
}
