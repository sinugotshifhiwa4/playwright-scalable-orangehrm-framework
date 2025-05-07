import { RequestExpectation } from '../../models/utils/errorHandler.interface';

export default class RequestContext {
  private static expectations = new Map<string, RequestExpectation>();

  /**
   * Register expectation for a specific request context
   * @param contextKey Unique identifier for the request context
   * @param expectedStatusCodes Array of HTTP status codes that are expected
   * @param isNegativeTest Whether this is a negative test case
   */
  public static registerExpectation(
    contextKey: string,
    expectedStatusCodes: number[],
    isNegativeTest: boolean = false,
  ): void {
    this.expectations.set(contextKey, {
      expectedStatusCodes,
      isNegativeTest,
    });
  }

  /**
   * Check if a status code is expected for a specific context
   * @param contextKey The context identifier
   * @param statusCode The HTTP status code to check
   * @returns True if status code is expected for this context
   */
  public static isExpectedStatus(contextKey: string, statusCode: number): boolean {
    const expectation = this.expectations.get(contextKey);
    return expectation?.expectedStatusCodes.includes(statusCode) || false;
  }

  /**
   * Check if context is a negative test
   * @param contextKey The context identifier
   * @returns True if this context is registered as a negative test
   */
  public static isNegativeTest(contextKey: string): boolean {
    return this.expectations.get(contextKey)?.isNegativeTest || false;
  }

  /**
   * Clear expectations after test completion
   */
  public static clearExpectations(): void {
    this.expectations.clear();
  }

  /**
   * Get all registered expectations (useful for debugging)
   */
  public static getExpectations(): Map<string, RequestExpectation> {
    return new Map(this.expectations);
  }

  /**
   * Remove a specific expectation
   * @param contextKey The context identifier to remove
   */
  public static removeExpectation(contextKey: string): void {
    this.expectations.delete(contextKey);
  }
}
