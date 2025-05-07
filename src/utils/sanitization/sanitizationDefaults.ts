/**
 * List of sensitive keys to sanitize
 */
export const DefaultSensitiveKeys = [
  'password',
  'apiKey',
  'secret',
  'authorization',
  'token',
  'accessToken',
  'refreshToken',
  'cookie',
];

export const neverTruncateDefaultKeys = [
  'context',
  'url',
  'source',
  'method',
  'environment',
  'timestamp',
];

/**
 * Default mask value for sensitive data
 */
export const MaskValue = '********';
