import dotenv from 'dotenv';
import * as environmentFilePaths from '../../../utils/environment/constants/environmentFilePaths';
import fileManager from '../../../utils/fileManager';
import EnvironmentDetector from '../../environmentDetector';
import path from 'path';
import fs from 'fs';
import ErrorHandler from '../../../utils/errors/errorHandler';
import logger from '../../../utils/logging/loggerManager';

export default class EnvironmentConfigLoader {
  // Keep track of whether the environment has been initialized
  private static initialized = false;
  private static loadedFiles: string[] = [];

  /**
   * Initializes the environment configuration.
   * This function ensures that the environment directory exists, validates the base environment file
   * if it exists, loads the base environment variables, and determines the current environment.
   * If the base environment file does not exist, a warning message is logged.
   * If an error occurs during the setup process, an error is logged and thrown.
   *
   * @returns {Promise<void>}
   */
  public static async initialize(): Promise<void> {
    // Skip if already initialized
    if (this.initialized) {
      logger.info('Environment already initialized, skipping');
      return;
    }

    try {
      // Check if we are running in a CI environment
      if (EnvironmentDetector.isRunningInCI()) {
        logger.info(`CI environment detected. Skipping local environment file loading.`);
        this.initialized = true;
        return;
      }

      // ensure the environment directory exists
      await fileManager.doesDirectoryExist(environmentFilePaths.EnvironmentConstants.ENV_DIR);

      // base env file path
      const baseEnvFilePath = path.resolve(
        environmentFilePaths.EnvironmentConstants.ENV_DIR,
        environmentFilePaths.EnvironmentConstants.BASE_ENV_FILE,
      );

      // handle base environment file
      const baseEnvExists = await fileManager.doesFileExist(baseEnvFilePath);
      this.handleBaseEnvFile(baseEnvFilePath, baseEnvExists);

      // load base environment variables and determine the current environment
      const env = this.determineEnvironment();

      // Load environment-specific file
      const envSpecificFilePath =
        environmentFilePaths.EnvironmentFilePaths[
          env as keyof typeof environmentFilePaths.EnvironmentFilePaths
        ];

      this.loadEnvironmentSpecificFile(envSpecificFilePath);

      // Validate required environment variables if specified
      const requiredVarsString = process.env.REQUIRED_ENV_VARS;
      if (requiredVarsString) {
        const requiredVars = requiredVarsString.split(',').map((v) => v.trim());
        this.validateRequiredVariables(requiredVars);
      }

      // Setup file watchers for development mode
      if (env === 'development' && process.env.ENABLE_ENV_WATCHING === 'true') {
        this.setupEnvFileWatchers();
      }

      this.initialized = true;
      logger.info(`Environment initialized successfully for ${env} environment`);
    } catch (error) {
      ErrorHandler.captureError(error, 'initialize', 'Failed to set up environment variables');
      throw error;
    }
  }

  /**
   * Validates and retrieves the current environment from process variables.
   * It checks if the environment specified in the process environment variables is valid
   * by ensuring it matches one of the keys in the EnvironmentFilePathsMap.
   * If the environment is invalid or not specified, it throws an error.
   * Logs the error if it occurs and throws an exception.
   *
   * @returns {string} The validated environment string.
   * @throws Will log and throw an error if the environment is invalid or cannot be loaded.
   */
  private static determineEnvironment(): string {
    try {
      const env = process.env.ENV;
      const validEnvironments = Object.keys(environmentFilePaths.EnvironmentFilePaths);

      if (!env || !validEnvironments.includes(env)) {
        logger.error(
          `Invalid environment specified: ${env}. Expected one of: ${validEnvironments.join(', ')}`,
        );
        throw new Error(
          `Invalid environment specified: ${env}. Expected one of: ${validEnvironments.join(', ')}`,
        );
      }
      return env;
    } catch (error) {
      ErrorHandler.captureError(error, 'determineEnvironment', 'Failed to determine environment');
      throw error;
    }
  }

  /**
   * Loads environment variables from the specified file using the dotenv library.
   * If the file does not exist, it logs a warning message with the file path.
   * If an error occurs, it logs the error and throws an exception.
   *
   * @param fileName - The name of the file from which to load environment variables.
   * @returns {void}
   */
  private static loadEnvironmentSpecificFile(fileName: string): void {
    try {
      // get the path to the file
      const filePath = this.getEnvFilePath(fileName);

      if (fs.existsSync(filePath)) {
        // Get base file name
        const baseName = path.basename(filePath);
        this.loadEnvironmentVariables(filePath);
        this.loadedFiles.push(baseName);
        logger.info(`Successfully loaded variables from environment file: ${baseName}`);
      } else {
        const envDirPath = environmentFilePaths.EnvironmentConstants.ENV_DIR;
        logger.warn(
          `Environment '${process.env.ENV}' was specified but its configuration file could not be found at ${filePath}. Please ensure an environment file for '${process.env.ENV}' exists in the "${envDirPath}" directory.`,
        );
      }
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'loadEnvironmentSpecificFile',
        'Failed to load environment file',
      );
      throw error;
    }
  }

  /**
   * Handles loading of the base environment file (.env) if it exists.
   * If the file exists, it loads the environment variables from the file.
   * If the file is required but missing, it throws an error.
   * Otherwise, it logs a warning message.
   * If an error occurs during file loading, it logs the error and throws an exception.
   *
   * @param baseEnvFilePath - The path to the base environment file.
   * @param baseEnvExists - A boolean indicating whether the base environment file exists.
   * @returns {void}
   */
  private static handleBaseEnvFile(baseEnvFilePath: string, baseEnvExists: boolean): void {
    try {
      // Check if the base environment file exists
      if (baseEnvExists) {
        this.loadEnvironmentVariables(baseEnvFilePath);

        // Get base file name
        const baseName = path.basename(baseEnvFilePath);
        this.loadedFiles.push(baseName);
        logger.info(`Successfully loaded base environment file: ${baseName}`);
      } else {
        const shouldRequireBaseFile = process.env.REQUIRE_BASE_ENV_FILE === 'true';
        const envDir = environmentFilePaths.EnvironmentConstants.ENV_DIR;
        const baseEnvFile = environmentFilePaths.EnvironmentConstants.BASE_ENV_FILE;

        if (shouldRequireBaseFile) {
          throw new Error(
            `Required base environment file not found at ${baseEnvFilePath}. Expected location: ${envDir}/${baseEnvFile}`,
          );
        } else {
          logger.warn(
            `Base environment file not found at ${baseEnvFilePath}. Expected location: ${envDir}/${baseEnvFile}`,
          );
        }
      }
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'handleBaseEnvFile',
        'Failed to handle base environment file',
      );
      throw error;
    }
  }

  /**
   * Loads environment variables from the specified file path using the dotenv library.
   * Overrides existing environment variables if they are already set.
   * Logs an error and throws an exception if loading fails.
   *
   * @param filePath - The path to the environment file from which variables are to be loaded.
   * @returns {void}
   */
  private static loadEnvironmentVariables(filePath: string): void {
    try {
      const result = dotenv.config({ path: filePath, override: true });

      if (result.error) {
        logger.error(
          `Error loading environment variables from ${filePath}: ${result.error.message}`,
        );
        throw new Error(
          `Error loading environment variables from ${filePath}: ${result.error.message}`,
        );
      }
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'loadEnvironmentVariables',
        `Failed to load variables from ${filePath}`,
      );
      throw error;
    }
  }

  /**
   * Returns the path to the environment file with the given file name.
   * This function will log an error if an exception occurs and throw the error.
   *
   * @param fileName - The name of the file to get the path for (e.g., ".env", ".env.dev", etc.)
   * @returns {string} The path to the environment file.
   */
  private static getEnvFilePath(fileName: string): string {
    try {
      return path.resolve(environmentFilePaths.EnvironmentConstants.ENV_DIR, fileName);
    } catch (error) {
      ErrorHandler.captureError(error, 'getEnvFilePath', 'Failed to get environment file path');
      throw error;
    }
  }

  /**
   * Validates that all required environment variables are present.
   * Throws an error if any required variable is missing.
   *
   * @param requiredVars - Array of environment variable names that are required
   * @returns {void}
   */
  private static validateRequiredVariables(requiredVars: string[]): void {
    try {
      const missing = requiredVars.filter((varName) => process.env[varName] === undefined);
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
      logger.info('All required environment variables are present');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'validateRequiredVariables',
        'Failed to validate required environment variables',
      );
      throw error;
    }
  }

  /**
   * Sets up file watchers for environment files in development mode.
   * When environment files change, they are automatically reloaded.
   *
   * @returns {void}
   */
  private static setupEnvFileWatchers(): void {
    try {
      const envDir = environmentFilePaths.EnvironmentConstants.ENV_DIR;

      if (!fs.existsSync(envDir)) {
        logger.warn(`Cannot setup environment file watchers. Directory ${envDir} does not exist.`);
        return;
      }

      fs.readdirSync(envDir).forEach((file) => {
        if (file.startsWith('.env')) {
          const filePath = path.join(envDir, file);
          this.setupFileWatcher(filePath);
        }
      });
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'setupEnvFileWatchers',
        'Failed to setup environment file watchers',
      );
      // Don't throw here as this is a non-critical feature
      logger.warn('Environment file watching disabled due to error');
    }
  }

  /**
   * Sets up a file watcher for a specific environment file.
   *
   * @param filePath - The path to the environment file to watch
   * @returns {void}
   */
  private static setupFileWatcher(filePath: string): void {
    try {
      fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
          const baseName = path.basename(filePath);
          logger.info(`Environment file ${baseName} changed, reloading...`);
          this.loadEnvironmentVariables(filePath);
          logger.info(`Reloaded environment file: ${baseName}`);
        }
      });
      logger.info(`Watching for changes in ${path.basename(filePath)}`);
    } catch (error) {
      logger.warn(`Failed to watch file ${filePath}: ${error}`);
    }
  }

  /**
   * Forces a reload of all environment files.
   * Useful when environment files have been modified externally.
   *
   * @returns {Promise<void>}
   */
  public static async reload(): Promise<void> {
    try {
      logger.info('Reloading environment configuration...');
      this.initialized = false;
      this.loadedFiles = [];
      await this.initialize();
      logger.info('Environment configuration reloaded successfully');
    } catch (error) {
      ErrorHandler.captureError(error, 'reload', 'Failed to reload environment configuration');
      throw error;
    }
  }
}
