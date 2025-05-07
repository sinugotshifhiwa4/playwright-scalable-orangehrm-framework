export interface SanitizationParams {
  sensitiveKeys: string[];
  maskValue: string;
  skipProperties?: string[];
  truncateUrls?: boolean;
  maxStringLength?: number;
  neverTruncateKeys?: string[];
}
