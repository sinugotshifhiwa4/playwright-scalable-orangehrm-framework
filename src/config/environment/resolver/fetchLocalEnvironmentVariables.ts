import CryptoService from '../../../cryptography/services/encryptionService';
import { UserCredentials } from '../../../models/utils/userCredentials.interface';
import { EnvironmentSecretKeys } from '../../../utils/environment/constants/environmentFilePaths';
import SanitizationConfig from '../../../utils/sanitization/sanitizationConfig';
import ENV from '../../../utils/environment/constants/environmentVariables';
import ErrorHandler from '../../../utils/errors/errorHandler';

export class FetchLocalEnvironmentVariables {
  /**
   * Get portal base URL from local environment
   */
  public async getPortalBaseUrl(): Promise<string> {
    return this.getEnvironmentVariable(
      () => ENV.PORTAL_BASE_URL,
      'PORTAL_URL',
      'getPortalBaseUrl',
      'Failed to get local portal base URL',
      false,
    );
  }

  /**
   * Get credentials from local environment
   */
  public async getCredentials(): Promise<UserCredentials> {
    try {
      const credentials = await this.decryptCredentials(
        ENV.PORTAL_USERNAME,
        ENV.PORTAL_PASSWORD,
        EnvironmentSecretKeys.UAT,
      );
      this.verifyCredentials(credentials);
      return credentials;
    } catch (error) {
      ErrorHandler.captureError(error, 'getCredentials', 'Failed to get local credentials');
      throw error;
    }
  }

  /**
   * Decrypts credentials using the provided secret key
   */
  private async decryptCredentials(
    username: string,
    password: string,
    secretKey: string,
  ): Promise<UserCredentials> {
    try {
      return {
        username: await CryptoService.decrypt(username, secretKey),
        password: await CryptoService.decrypt(password, secretKey),
      };
    } catch (error) {
      ErrorHandler.captureError(error, 'decryptCredentials', 'Failed to decrypt credentials');
      throw error;
    }
  }

  /**
   * Verifies that the provided credentials contain both a username and password
   */
  private verifyCredentials(credentials: UserCredentials): void {
    if (!credentials.username || !credentials.password) {
      ErrorHandler.logAndThrow(
        'Invalid credentials: Missing username or password.',
        'FetchLocalEnvironmentVariables',
      );
    }
  }

  /**
   * Validates that an environment variable is not empty
   */
  private validateEnvironmentVariable(value: string, variableName: string): void {
    if (!value || value.trim() === '') {
      throw new Error(`Environment variable ${variableName} is not set or is empty`);
    }
  }

  /**
   * Generic method to retrieve and validate environment variables
   */
  private async getEnvironmentVariable(
    getValue: () => string,
    variableName: string,
    methodName: string,
    errorMessage: string,
    sanitize: boolean = true,
  ): Promise<string> {
    try {
      const value = getValue();
      this.validateEnvironmentVariable(value, variableName);
      return sanitize ? SanitizationConfig.sanitizeString(value) : value;
    } catch (error) {
      ErrorHandler.captureError(error, methodName, errorMessage);
      throw error;
    }
  }
}
