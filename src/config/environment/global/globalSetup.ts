import environmentConfigManager from './environmentConfigLoader';
import AuthStorageManager from '../../../utils/auth/storage/authStorageManager';
import ErrorHandler from '../../../utils/errors/errorHandler';

/**
 * Initializes the environment configuration.
 *
 * This function calls the environment configuration manager to set up
 * environment variables and configurations needed for the application.
 * If an error occurs during initialization, it captures the error and
 * throws it after logging.
 *
 * @throws {Error} If the environment initialization fails.
 */
async function initializeEnvironment(): Promise<void> {
  try {
    await environmentConfigManager.initialize();
  } catch (error) {
    ErrorHandler.captureError(
      error,
      'initializeEnvironment',
      'Failed to initialize environment variables',
    );
    throw error;
  }
}

/**
 * Resets the authentication state file to an empty state.
 *
 * This method is used to clean up the authentication state after a test run.
 * It is called automatically by the globalSetup function.
 */
async function resetAuthState(): Promise<void> {
  AuthStorageManager.initializeEmptyAuthStateFile();
}

async function globalSetup(): Promise<void> {
  try {
    await initializeEnvironment();
    await resetAuthState();
  } catch (error) {
    ErrorHandler.captureError(error, 'globalSetup', 'Global setup failed');
    throw error;
  }
}

export default globalSetup;
