import * as EnvironmentFilePaths from '../../utils/environment/constants/environmentFilePaths';
import FileManager from '../../utils/fileManager';
import fs from 'fs';
import { FileEncoding } from '../../models/utils/fileEncoding.enum';
import ErrorHandler from '../../utils/errors/errorHandler';
import logger from '../../utils/logging/loggerManager';

export class EnvironmentFileManager {
  // Path to the environment file
  public environmentDirectory: string;
  public environmentFilePath: string;
  public secretKeyVariable: string;
  private readonly baseEnvironmentFilePath: string;

  constructor() {
    // set env dir path
    this.environmentDirectory = FileManager.getDirPath(
      EnvironmentFilePaths.EnvironmentConstants.ENV_DIR,
    );

    // set base env file path
    this.baseEnvironmentFilePath = FileManager.getFilePath(
      this.environmentDirectory,
      EnvironmentFilePaths.EnvironmentConstants.BASE_ENV_FILE,
    );

    /*
     * Initialize env file path and secret key to empty strings.
     * These values will be reassigned in the initializeEncryption method.
     */
    this.environmentFilePath = '';
    this.secretKeyVariable = '';

    // Ensure dir and file exist
    FileManager.ensureDirectoryExistsSync(this.environmentDirectory);
    FileManager.ensureFileExistsSync(this.baseEnvironmentFilePath);
  }

  /**
   * Writes a key-value pair to the base environment file (.env).
   * Logs an info message upon successful write.
   * If an error occurs during the write operation, logs the error and throws an exception.
   *
   * @param content - The content to write to the .env file.
   * @param keyName - The name of the key being written to the .env file, used in log messages.
   * @throws Will log and throw an error if the write operation fails.
   */
  private async writeKeyToBaseEnvFile(content: string, keyName: string) {
    try {
      await FileManager.writeFile(this.baseEnvironmentFilePath, content, keyName);
      logger.info(`${keyName} written to .env file`);
    } catch (error) {
      ErrorHandler.captureError(error, 'writeEnvFile', `Failed to write ${keyName} to .env file`);
      throw error;
    }
  }

  /**
   * Reads the content of the base environment file.
   * Logs an error and throws an exception if reading fails.
   *
   * @returns The content of the base environment file as a string.
   * @throws {Error} If an error occurs during file reading.
   */
  private readBaseEnvFile(): string {
    try {
      return fs.readFileSync(this.baseEnvironmentFilePath, FileEncoding.UTF8);
    } catch (error) {
      ErrorHandler.captureError(error, 'readEnvFile', 'Failed to read .env file');
      throw error;
    }
  }

  /**
   * Reads the value of a key from the base environment file.
   * The value is extracted using a regular expression.
   * Logs an error and throws an exception if reading fails.
   *
   * @param keyName - The name of the key to read from the environment file.
   * @returns The value of the key as a string. If the key does not exist in the file, returns undefined.
   * @throws {Error} If an error occurs during file reading.
   */
  public getKeyValue(keyName: string): string | undefined {
    try {
      const envFilePaths = this.readBaseEnvFile();
      const regex = new RegExp(`^${keyName}=(.*)$`, 'm');
      const match = envFilePaths.match(regex);
      return match ? match[1] : undefined;
    } catch (error) {
      ErrorHandler.captureError(error, 'getKeyValue', `Failed to read ${keyName} from .env file`);
      throw error;
    }
  }

  /**
   * Stores a key-value pair in the base environment file (.env).
   *
   * This function first checks if the given key already exists in the environment file.
   * If the key exists, it logs a message and returns without making any changes.
   * If the key does not exist, it appends the key-value pair to the environment file.
   * Logs informative messages upon success or failure.
   *
   * @param keyName - The name of the key to store in the environment file.
   * @param keyValue - The value associated with the key to store in the environment file.
   * @throws Will log and handle errors if reading from or writing to the file fails.
   */
  async storeBaseEnvKey(keyName: string, keyValue: string) {
    try {
      // Read the env file
      let envFilePaths = this.readBaseEnvFile();

      // Check if the key already exists
      const regex = new RegExp(`^${keyName}=`, 'm');
      if (regex.test(envFilePaths)) {
        logger.info(
          `The environment secret key '${keyName}' already exists. Please remove it if you want to generate a new one.`,
        );
        return;
      }

      // Append the new key since it does not exist
      envFilePaths += `\n${keyName}=${keyValue}`;
      await this.writeKeyToBaseEnvFile(envFilePaths, keyName);
      logger.info(`Successfully added the environment secret key '${keyName}'.`);
    } catch (error) {
      ErrorHandler.captureError(error, 'storeKeyInEnv', `Failed to store ${keyName} in .env file`);
      throw error;
    }
  }
}
