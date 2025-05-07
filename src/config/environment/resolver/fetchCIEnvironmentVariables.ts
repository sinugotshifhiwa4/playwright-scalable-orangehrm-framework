import { UserCredentials } from '../../../models/utils/userCredentials.interface';
import { CIEnvironmentVariables } from '../../../models/utils/ciEnvironmentVariables.interface';
import SanitizationConfig from '../../../utils/sanitization/sanitizationConfig';
import ErrorHandler from '../../../utils/errors/errorHandler';

export class FetchCIEnvironmentVariables {
  // Store CI credentials from environment variables
  private readonly ciEnvironmentVariables: CIEnvironmentVariables = {
    portalBaseUrl: process.env.CI_PORTAL_BASE_URL!,
    username: process.env.CI_PORTAL_USERNAME!,
    password: process.env.CI_PORTAL_PASSWORD!,
  };

  /**
   * Get portal base URL from CI environment variables
   */
  public async getPortalBaseUrl(): Promise<string> {
    return this.getEnvironmentVariable(
      () => this.ciEnvironmentVariables.portalBaseUrl,
      'CI_PORTAL_BASE_URL',
      'getPortalBaseUrl',
      'Failed to get CI portal base URL',
    );
  }

  /**
   * Get credentials from CI environment variables
   */
  public async getCredentials(): Promise<UserCredentials> {
    try {
      const credentials = {
        username: SanitizationConfig.sanitizeString(this.ciEnvironmentVariables.username),
        password: SanitizationConfig.sanitizeString(this.ciEnvironmentVariables.password),
      };
      this.verifyCredentials(credentials);
      return credentials;
    } catch (error) {
      ErrorHandler.captureError(error, 'getCredentials', 'Failed to get CI credentials');
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
        'FetchCIEnvironmentVariables',
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
  ): Promise<string> {
    try {
      const value = getValue();
      this.validateEnvironmentVariable(value, variableName);
      return SanitizationConfig.sanitizeString(value);
    } catch (error) {
      ErrorHandler.captureError(error, methodName, errorMessage);
      throw error;
    }
  }
}
