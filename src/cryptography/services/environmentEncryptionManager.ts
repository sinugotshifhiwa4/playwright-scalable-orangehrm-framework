import { EncryptionServiceUtils } from '../utils/encryptionServiceUtils';
import ErrorHandler from '../../utils/errors/errorHandler';

export class EnvironmentEncryptionManager {
  private encryptionServiceUtils: EncryptionServiceUtils;

  constructor(encryptionServiceUtils: EncryptionServiceUtils) {
    this.encryptionServiceUtils = encryptionServiceUtils;
  }

  public async createAndSaveSecretKey(keyName: string) {
    try {
      // Call the generateSecretKey method to generate a secret key
      const secretKey = this.encryptionServiceUtils.generateSecretKey();

      if (secretKey === undefined || secretKey === null) {
        ErrorHandler.logAndThrow(
          'Failed to generate secret key: Secret key cannot be null or undefined',
          'createAndSaveSecretKey',
        );
      }

      // Assuming there is a method to store the secret key
      await this.encryptionServiceUtils.storeSecretKeyInEnvironmentFile(keyName, secretKey);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'createAndSaveSecretKey',
        'Failed to create and save secret key',
      );
      throw error;
    }
  }

  /**
   * Encrypts environment variables for a specified environment using a provided secret key.
   *
   * This method initializes the encryption process by setting the environment file path and
   * deriving the secret key. Then, it encrypts the environment variables and stores them in
   * the environment file. If an error occurs during the encryption process, logs the error
   * and throws an exception.
   *
   * @param env - The name of the environment to encrypt variables for.
   * @param secretKey - The secret key used for key derivation and encryption.
   * @throws {Error} If an error occurs during the encryption process.
   */
  public async encryptEnvironmentVariables(
    envFilePath: string,
    secretKeyVariable: string,
    envVariables?: string[],
  ) {
    try {
      // Initialize encryption
      await this.encryptionServiceUtils.initializeEncryption(envFilePath, secretKeyVariable);

      // Encrypt environment variables
      await this.encryptionServiceUtils.encryptEnvVariables(envVariables);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'encryptEnvironmentVariables',
        'Failed to encrypt environment variables',
      );
      throw error;
    }
  }
}
