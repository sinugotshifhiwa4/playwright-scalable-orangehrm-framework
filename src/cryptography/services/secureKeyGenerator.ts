import * as crypto from 'crypto';
import { CRYPTO_CONFIG } from '../../models/utils/encryption.interface';
import { FileEncoding } from '../../models/utils/fileEncoding.enum';
import ErrorHandler from '../../utils/errors/errorHandler';
export default class SecureKeyGenerator {
  // Set base64 as buffer encoding
  private static readonly BASE_64: BufferEncoding = FileEncoding.BASE64;

  // Parameters from configuration file for easier access
  private static readonly IV_LENGTH = CRYPTO_CONFIG.BYTE_LENGTHS.IV;
  private static readonly WEB_CRYPTO_IV_LENGTH = CRYPTO_CONFIG.BYTE_LENGTHS.WEB_CRYPTO_IV;
  private static readonly SALT_LENGTH = CRYPTO_CONFIG.BYTE_LENGTHS.SALT;
  private static readonly SECRET_KEY_LENGTH = CRYPTO_CONFIG.BYTE_LENGTHS.SECRET_KEY;

  /**
   * Generates a cryptographically secure initialization vector (IV) as a base64-encoded string.
   * @param length The IV length in bytes. Defaults to the configured IV length.
   * @returns A base64-encoded string containing the IV.
   * @throws {Error} If the length is invalid or IV generation fails.
   */
  public static generateBase64IV(length: number = this.IV_LENGTH): string {
    if (length <= 0) throw new Error('IV length must be greater than zero.');
    try {
      return crypto.randomBytes(length).toString(this.BASE_64);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'generateBase64IV',
        `Failed to generate IV of length ${length}`,
      );
      throw error;
    }
  }

  /**
   * Generates a cryptographically secure initialization vector (IV) as a Buffer.
   * @param length The IV length in bytes. Defaults to the configured IV length.
   * @returns A Buffer containing the IV.
   * @throws {Error} If the length is invalid or IV generation fails.
   */
  public static generateBufferIV(length: number = this.IV_LENGTH): Buffer {
    if (length <= 0) throw new Error('IV length must be greater than zero.');
    try {
      return crypto.randomBytes(length);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'generateBufferIV',
        `Failed to generate IV of length ${length}`,
      );
      throw error;
    }
  }

  /**
   * Generates a cryptographically secure IV using the Web Crypto API or Node.js crypto.
   * @param length The IV length in bytes. Defaults to the configured Web Crypto IV length.
   * @returns A Buffer containing the secure IV.
   * @throws {Error} If the length is invalid or IV generation fails.
   */
  public static generateWebCryptoIV(length: number = this.WEB_CRYPTO_IV_LENGTH): Buffer {
    if (length <= 0) throw new Error('IV length must be greater than zero.');

    try {
      let iv: Uint8Array;
      if (this.isWebCryptoIv()) {
        iv = crypto.getRandomValues(new Uint8Array(length));
      } else {
        iv = crypto.randomBytes(length);
      }
      return Buffer.from(iv);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'generateWebCryptoIV',
        `Failed to generate IV of length ${length}`,
      );
      throw error;
    }
  }

  /**
   * Generates a cryptographically secure random salt as a base64 string.
   * @param length The salt length in bytes. Defaults to the configured salt length.
   * @returns A base64-encoded string containing the salt.
   * @throws {Error} If an error occurs during salt generation.
   */
  public static generateBase64Salt(length: number = this.SALT_LENGTH): string {
    if (length <= 0) throw new Error('Salt length must be greater than zero.');
    try {
      return crypto.randomBytes(length).toString(this.BASE_64);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'generateBase64Salt',
        `Failed to generate salt of length ${length}`,
      );
      throw error;
    }
  }

  /**
   * Generates a cryptographically secure random secret key as a base64 string.
   *
   * @param length The length of the secret key in bytes. Defaults to the configured secret key length.
   * @returns A base64-encoded string containing the secret key.
   * @throws {Error} If an error occurs during key generation.
   */

  public static generateBase64SecretKey(length: number = this.SECRET_KEY_LENGTH): string {
    try {
      return crypto.randomBytes(length).toString(this.BASE_64);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'generateBase64SecretKey',
        'Failed to generate base64 secret key',
      );
      throw error;
    }
  }

  /**
   * Generates a cryptographically secure random key as a base64 string.
   * @param length The key
  

  /**
   * Detect if Web Crypto API is available.
   */
  private static isWebCryptoIv(): boolean {
    return typeof crypto !== 'undefined' && crypto.subtle !== undefined;
  }
}
