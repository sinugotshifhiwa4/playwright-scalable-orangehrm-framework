export default class BrowserInitFlag {
  /**
   * Determines whether browser initialization should be skipped.
   * This is useful for tasks like crypto or DB-only operations.
   *
   * Controlled by the environment variable: SKIP_BROWSER_INIT
   *
   * @returns True if browser initialization should be skipped.
   */
  public static shouldSkipBrowserInit(): boolean {
    return process.env.SKIP_BROWSER_INIT?.toLowerCase() === 'true';
  }
}
