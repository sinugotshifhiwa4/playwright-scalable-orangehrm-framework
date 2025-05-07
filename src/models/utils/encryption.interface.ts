/**
 * Represents the parameters required for encryption.
 */
export interface EncryptionParameters {
  salt: string;
  iv: string;
  cipherText: string;
}

export interface ByteLengths {
  IV: number;
  WEB_CRYPTO_IV: number;
  SALT: number;
  SECRET_KEY: number;
}

export interface Argon2Parameters {
  MEMORY_COST: number;
  TIME_COST: number;
  PARALLELISM: number;
}

export interface CryptoConfig {
  BYTE_LENGTHS: ByteLengths;
  ARGON2_PARAMETERS: Argon2Parameters;
}

export const CRYPTO_CONFIG: CryptoConfig = {
  BYTE_LENGTHS: {
    IV: 16,
    WEB_CRYPTO_IV: 12,
    SALT: 32,
    SECRET_KEY: 32,
  },
  ARGON2_PARAMETERS: {
    MEMORY_COST: 262144, // 256 MB
    TIME_COST: 4,
    PARALLELISM: 3,
  },
};
