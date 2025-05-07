/**
 * Enum representing environment configuration constants.
 * Contains directory and file path values for environment settings.
 * @enum {string}
 */
export enum EnvironmentConstants {
  ENV_DIR = 'envs', // Directory where environment files are stored
  BASE_ENV_FILE = '.env', // Base environment file for secret keys
}

/**
 * Enum representing specific environment file names.
 * Each value corresponds to a specific environment configuration file.
 * @enum {string}
 */
export enum EnvironmentFiles {
  DEV = '.env.dev', // Development environment file
  UAT = '.env.uat', // User Acceptance Testing environment file
  PROD = '.env.prod', // Production environment file
}

/**
 * Enum representing the secret keys for different environments.
 * @enum {string}
 */
export enum EnvironmentSecretKeys {
  DEV = 'DEV_SECRET_KEY',
  UAT = 'UAT_SECRET_KEY',
  PROD = 'PROD_SECRET_KEY',
}

/**
 * Type representing the possible environment stages.
 * This type restricts values to 'dev', 'uat', or 'prod'.
 * @typedef {('dev' | 'uat' | 'prod')} EnvironmentStage
 */
export type EnvironmentStage = 'dev' | 'uat' | 'prod';

/**
 * Mapping of environment stages to their corresponding environment file paths.
 * This mapping is used to select the appropriate environment configuration file.
 * @type {Record<EnvironmentStage, string>}
 */
export const EnvironmentFilePaths: Record<EnvironmentStage, string> = {
  dev: EnvironmentFiles.DEV,
  uat: EnvironmentFiles.UAT,
  prod: EnvironmentFiles.PROD,
};

/**
 * Mapping of environment stages to their corresponding secret keys.
 * This mapping is used to select the appropriate secret key for each environment.
 * @type {Record<EnvironmentStage, string>}
 */
export const SecretKeyPaths: Record<EnvironmentStage, string> = {
  dev: EnvironmentSecretKeys.DEV,
  uat: EnvironmentSecretKeys.UAT,
  prod: EnvironmentSecretKeys.PROD,
};
