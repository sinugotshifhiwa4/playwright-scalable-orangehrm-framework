import EncryptionService from '../services/encryptionService';
import { EnvironmentFileManager } from './environmentFileManager';
import SecureKeyGenerator from '../services/secureKeyGenerator';
import path from 'path';
import fs from 'fs';
import FileManager from '../../utils/fileManager';
import { FileEncoding } from '../../models/utils/fileEncoding.enum';
import ErrorHandler from '../../utils/errors/errorHandler';
import logger from '../../utils/logging/loggerManager';

export class EncryptionServiceUtils {
  private environmentFileManager: EnvironmentFileManager;

  constructor(environmentFileManager: EnvironmentFileManager) {
    this.environmentFileManager = environmentFileManager;
  }

  /**
   * Initializes the encryption settings for the given environment.
   *
   * This function ensures that the required directory and file paths exist.
   * It sets the environment file path based on the provided environment string
   * and assigns the secret key variable after validating it.
   *
   * @param env - The environment string used to resolve the environment file path.
   * @param secretKey - The secret key to be initialized and validated.
   * @throws {Error} If directory initialization or secret key processing fails.
   */
  public async initializeEncryption(env: string, secretKey: string) {
    try {
      // Initialize the environment file path and secret key
      this.environmentFileManager.environmentFilePath = path.resolve(
        this.environmentFileManager.environmentDirectory,
        env,
      );
      this.environmentFileManager.secretKeyVariable = this.getSecretKey(secretKey);
    } catch (error) {
      ErrorHandler.captureError(error, 'initializeEncryption', 'Failed to initialize encryption');
      throw error;
    }
  }

  /**
   * Encrypts environment variables in the environment file.
   * If specific variables are provided, only those are encrypted; otherwise, all variables are encrypted.
   *
   * @param envVariables - Optional array of environment variable keys or values to encrypt.
   * @throws {Error} If an error occurs during the encryption process.
   */
  public async encryptEnvVariables(envVariables?: string[]): Promise<void> {
    try {
      // Read the environment file
      const envFileLines = this.readEnvFileAsLines();

      // Extract all key-value pairs from the environment file
      const allEnvVariables = this.extractEnvironmentVariables(envFileLines);

      // Determine which variables to encrypt
      const variablesToEncrypt = this.determineVariablesToEncrypt(allEnvVariables, envVariables);

      // Update lines with encrypted values
      const { updatedLines, encryptedCount } = await this.processVariablesForEncryption(
        envFileLines,
        variablesToEncrypt,
      );

      // Write the updated lines to the environment file
      await this.writeEnvFileLines(updatedLines);

      // Only log if encryption was performed
      this.logEncryptionSuccess(Object.keys(variablesToEncrypt).length, encryptedCount);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'encryptEnvParameters',
        'Failed to encrypt environment parameters',
      );
      throw error;
    }
  }

  /**
   * Determines which variables should be encrypted based on the provided input.
   *
   * @param allEnvVariables - All environment variables from the file.
   * @param envVariables - Optional array of specific variables to encrypt.
   * @returns Record of variables to be encrypted.
   */
  private determineVariablesToEncrypt(
    allEnvVariables: Record<string, string>,
    envVariables?: string[],
  ): Record<string, string> {
    const variablesToEncrypt: Record<string, string> = {};

    if (envVariables && envVariables.length > 0) {
      for (const lookupValue of envVariables) {
        const found = this.findEnvironmentVariable(allEnvVariables, lookupValue);
        if (!found) {
          logger.warn(
            `Environment variable with key or value '${lookupValue}' not found in the file.`,
          );
        }
        Object.assign(variablesToEncrypt, found);
      }
    } else {
      Object.assign(variablesToEncrypt, allEnvVariables);
    }

    return variablesToEncrypt;
  }

  /**
   * Finds an environment variable by its key or value.
   *
   * @param allEnvVariables - All environment variables to search within.
   * @param lookupValue - The key or value to search for.
   * @returns An object with the found key-value pair or an empty object if not found.
   */
  private findEnvironmentVariable(
    allEnvVariables: Record<string, string>,
    lookupValue: string,
  ): Record<string, string> {
    const result: Record<string, string> = {};

    // Check if it's a key
    if (allEnvVariables[lookupValue]) {
      result[lookupValue] = allEnvVariables[lookupValue];
      return result;
    }

    // Check if it's a value
    for (const [key, value] of Object.entries(allEnvVariables)) {
      if (value === lookupValue) {
        result[key] = value;
        logger.info(`Environment variable key '${key}' found`);
        return result;
      }
    }

    return result;
  }

  /**
   * Processes variables for encryption and updates the environment file lines.
   *
   * @param envFileLines - The original lines from the environment file.
   * @param variablesToEncrypt - The variables that need to be encrypted.
   * @returns Updated lines and count of encrypted variables.
   */
  private async processVariablesForEncryption(
    envFileLines: string[],
    variablesToEncrypt: Record<string, string>,
  ): Promise<{ updatedLines: string[]; encryptedCount: number }> {
    let updatedLines = [...envFileLines];
    let encryptedCount = 0;

    for (const [key, value] of Object.entries(variablesToEncrypt)) {
      if (value) {
        // Check if encryption is needed
        const encryptedValue = await this.encryptIfNeeded(
          value.trim(),
          this.environmentFileManager.secretKeyVariable,
        );
        if (!encryptedValue || encryptedValue === value) {
          logger.info(`Skipping encryption: '${key}' is already encrypted.`);
          continue;
        }

        // Update the lines with the encrypted value
        updatedLines = this.updateEnvironmentLines(
          updatedLines,
          key,
          JSON.stringify(encryptedValue),
        );
        encryptedCount++;
      }
    }

    return { updatedLines, encryptedCount };
  }

  /**
   * Encrypts a value if it's not already encrypted.
   *
   * @param value - The value to encrypt.
   * @param secretKey - The secret key to use for encryption.
   * @returns The encrypted value or the original value if already encrypted.
   */
  private async encryptIfNeeded(value: string, secretKey: string) {
    if (this.isAlreadyEncrypted(value)) {
      return value;
    }

    // Encrypt the value
    const encryptedResult = await EncryptionService.encrypt(value, secretKey);
    const { salt, iv, cipherText } = encryptedResult;

    return { salt, iv, cipherText };
  }

  private isAlreadyEncrypted(value: string): boolean {
    if (!value) {
      logger.warn('Environment variable cannot be null or empty.');
      return false;
    }

    // Check if the value is a potential JSON object
    const trimmedValue = value.trim();
    if (!(trimmedValue.startsWith('{') && trimmedValue.endsWith('}'))) {
      return false;
    }

    try {
      const parsedData = JSON.parse(value);

      // Check for required encryption fields
      const hasEncryptionFields =
        typeof parsedData === 'object' &&
        parsedData !== null &&
        'salt' in parsedData &&
        'iv' in parsedData &&
        'cipherText' in parsedData;

      return hasEncryptionFields;
    } catch (error) {
      logger.error(`Error parsing environment variable: ${error}`);
      return false;
    }
  }

  /**
   * Extracts all environment variables from the given lines.
   *
   * @param lines - An array of strings, each representing a line from the environment file.
   * @returns An object mapping environment variable names to their values.
   */
  private extractEnvironmentVariables(lines: string[]): Record<string, string> {
    try {
      const variables: Record<string, string> = {};

      for (const line of lines) {
        const parsedVariable = this.parseEnvironmentLine(line);
        if (parsedVariable) {
          const [key, value] = parsedVariable;
          variables[key] = value;
        }
      }

      return variables;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'extractEnvironmentVariables',
        'Failed to extract environment variables',
      );
      throw error;
    }
  }

  /**
   * Parses a single line from the environment file.
   *
   * @param line - The line to parse.
   * @returns A tuple containing the key and value, or null if the line is invalid.
   */
  private parseEnvironmentLine(line: string): [string, string] | null {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || !trimmedLine.includes('=')) {
      return null;
    }

    const [key, ...valueParts] = trimmedLine.split('=');
    const value = valueParts.join('='); // Handle values that might contain '='

    if (key && value) {
      return [key.trim(), value.trim()];
    }

    return null;
  }

  /**
   * Updates a specific environment variable in the list of environment lines.
   * If the variable exists, its value is updated; otherwise, it is added to the end.
   *
   * @param existingLines - The current list of environment file lines.
   * @param envVariable - The name of the environment variable to update.
   * @param value - The new value for the environment variable.
   * @returns The updated list of environment file lines.
   */
  private updateEnvironmentLines(
    existingLines: string[],
    envVariable: string,
    value: string,
  ): string[] {
    try {
      let isUpdated = false;

      const updatedLines = existingLines.map((line) => {
        if (line.startsWith(`${envVariable}=`)) {
          isUpdated = true;
          return `${envVariable}=${value}`;
        }
        return line;
      });

      if (!isUpdated) {
        updatedLines.push(`${envVariable}=${value}`);
      }

      return updatedLines;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'updateEnvironmentLines',
        'Failed to update environment lines',
      );
      throw error;
    }
  }

  /**
   * Reads the contents of the environment file as an array of strings.
   * Each string is a line from the file, and the array is returned in the order
   * that the lines appear in the file.
   *
   * @returns An array of strings, each string representing a line from the file.
   * @throws {Error} If the file does not exist or cannot be read.
   */
  private readEnvFileAsLines(): string[] {
    try {
      return fs
        .readFileSync(this.environmentFileManager.environmentFilePath, FileEncoding.UTF8)
        .split('\n');
    } catch (error) {
      ErrorHandler.captureError(error, 'readEnvFile', 'Failed to read environment file');
      throw error;
    }
  }

  /**
   * Writes an array of strings to the environment file.
   * Each string in the array represents a line to be written.
   *
   * @param lines - The array of strings to write to the environment file.
   * @throws {Error} If an error occurs during file writing.
   */
  private async writeEnvFileLines(lines: string[]) {
    try {
      await FileManager.writeFile(
        this.environmentFileManager.environmentFilePath,
        lines.join('\n'),
        FileEncoding.UTF8,
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'writeEnvFile',
        'Failed to write encrypted lines to environment file',
      );
      throw error;
    }
  }

  /**
   * Logs a success message with the number of encrypted variables to the console.
   * This method is called after the encryption process is complete.
   *
   * @param originalCount - The total number of variables in the environment file.
   * @param encryptedCount - The number of variables that were successfully encrypted.
   */
  private logEncryptionSuccess(originalCount: number, encryptedCount: number): void {
    try {
      // Only log if encryption actually happened
      if (encryptedCount > 0) {
        const relativePath = path.relative(
          process.cwd(),
          this.environmentFileManager.environmentFilePath,
        );
        logger.info(
          `Encryption complete. Successfully encrypted ${encryptedCount} variable(s) in the ${relativePath} file.`,
        );
      }
      // No else message needed since individual skips are already logged
    } catch (error) {
      ErrorHandler.captureError(error, 'logEncryptionSuccess', 'Failed to log encryption success');
      throw error;
    }
  }

  /**
   * Generates a cryptographically secure random secret key of the default length.
   *
   * @returns The generated secret key as a base64 string or undefined if an error occurs.
   * @throws {Error} If an error occurs during key generation.
   */
  public generateSecretKey(): string {
    try {
      return SecureKeyGenerator.generateBase64SecretKey();
    } catch (error) {
      ErrorHandler.captureError(error, 'generateSecretKey', 'Failed to generate secret key');
      throw error;
    }
  }

  /**
   * Retrieves the secret key for encryption/decryption processes.
   *
   * Validates the presence of the secret key, logging and throwing an error if it is not found.
   *
   * @param secretKey - The secret key to validate and return.
   * @returns The validated secret key.
   * @throws {Error} If the secret key is not found or an error occurs during retrieval.
   */
  private getSecretKey(secretKey: string): string {
    try {
      if (!secretKey) {
        ErrorHandler.logAndThrow('Key not found in .env file', 'getSecretKey');
      }
      return secretKey;
    } catch (error) {
      ErrorHandler.captureError(error, 'getSecretKey', 'Failed to get secret key');
      throw error;
    }
  }

  /**
   * Stores the secret key in the environment file.
   *
   * @param keyName - The name of the key to store in the environment file.
   * @param keyValue - The value of the key to store.
   * @throws {Error} If an error occurs during secret key storage.
   */
  public async storeSecretKeyInEnvironmentFile(keyName: string, keyValue: string) {
    try {
      await this.environmentFileManager.storeBaseEnvKey(keyName, keyValue);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'storeSecretKeyInEnvironmentFile',
        'Failed to store secret key in environment file',
      );
      throw error;
    }
  }
}
