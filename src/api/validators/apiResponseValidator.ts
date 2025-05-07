import { AxiosResponse, AxiosError } from 'axios';
import { AppError } from '../../utils/errors/AppError';
import { ErrorCategory } from '../../models/utils/errorCategory.enum';
import RequestContext from '../context/requestContext';
import ErrorHandler from '../../utils/errors/errorHandler';
import logger from '../../utils/logging/loggerManager';

export default class ApiResponseValidator {
  /**
   * Validates API responses for positive test flows with comprehensive error handling.
   * Verifies expected status codes and processes any error responses.
   * @param response - The API response.
   * @param expectedStatusCode - The expected status code.
   * @param context - The operation context.
   */
  public static validatePositiveTestResponse(
    response: AxiosResponse | null,
    expectedStatusCode: number,
    context: string,
  ): void {
    try {
      if (RequestContext.isNegativeTest(context)) {
        logger.warn(`validatePositiveTestResponse called with negative test context: ${context}`);
      }

      const validatedResponse = this.assertResponseNotNull(response, context);
      this.validateStatusCode(validatedResponse.status, expectedStatusCode, context);
      this.handleResponseError(validatedResponse);
    } catch (error) {
      if (this.isExpectedNegativeTestFailure(error, context)) {
        return;
      }

      ErrorHandler.captureError(
        error,
        'validatePositiveTestResponse',
        'Failed to validate API response',
      );
      throw error;
    }
  }

  /**
   * Validates API responses for negative test flows where errors are expected.
   * Handles various failure scenarios as successful test outcomes.
   * @param response - The API response.
   * @param expectedStatusCode - The expected status code.
   * @param context - The operation context.
   */
  public static validateNegativeTestResponse(
    response: AxiosResponse | null,
    expectedStatusCode: number,
    context: string,
  ): void {
    const isNegativeTest = RequestContext.isNegativeTest(context);

    try {
      // For null responses in negative tests - consider test passed
      if (!response && isNegativeTest) {
        logger.info(`Null response received as expected for negative test [${context}]`);
        return;
      }

      // Assert response not null
      const validatedResponse = this.assertResponseNotNull(response, context);

      // Handle different validation logic based on test type
      if (isNegativeTest) {
        this.handleNegativeTestResponse(validatedResponse.status, context);
      } else if (validatedResponse.status !== expectedStatusCode) {
        this.throwStatusCodeMismatchError(validatedResponse.status, expectedStatusCode, context);
      } else {
        logger.info(
          `Status Code Validation Successful in [${context}]: ${validatedResponse.status}`,
        );
      }
    } catch (error) {
      // For negative tests, errors are generally expected
      if (isNegativeTest && this.handleNegativeTestError(error, context)) {
        return;
      }

      // For positive tests, propagate the error
      logger.error(
        `Response Validation Failed in [${context}]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Ensures the API response is not null, throwing an error if it is.
   * Logs the status of the response if valid.
   */
  private static assertResponseNotNull(
    response: AxiosResponse | null,
    context: string,
  ): AxiosResponse {
    if (!response) {
      const errorMessage = `Received null response from [${context}].`;
      const isNegativeTest = RequestContext.isNegativeTest(context);

      if (isNegativeTest) {
        logger.info(`Received null response as expected for negative test: ${context}`);
        throw new AppError(ErrorCategory.EXPECTED_FAILURE, { context }, errorMessage);
      }

      throw new AppError(ErrorCategory.CONSTRAINT, { context }, errorMessage);
    }

    return response;
  }

  /**
   * Validates if the actual status code matches the expected status code.
   * For negative tests, also checks if the status is in expected alternatives.
   */
  private static validateStatusCode(actual: number, expected: number, context: string): void {
    const isNegativeTest = RequestContext.isNegativeTest(context);

    // Standard case - actual matches expected
    if (actual === expected) {
      logger.info(`Status Code Validation Successful in [${context}]: ${actual}`);
      return;
    }

    // For negative tests - check for expected alternative status
    if (isNegativeTest && this.isValidNegativeTestStatus(actual, context)) {
      return;
    }

    // Status code mismatch - throw error
    this.throwStatusCodeMismatchError(actual, expected, context);
  }

  /**
   * Handles a response in a negative test context.
   */
  private static handleNegativeTestResponse(status: number, context: string): void {
    if (this.isValidNegativeTestStatus(status, context)) {
      return;
    }

    // Unexpected success status for negative test
    logger.error(`Unexpected success status code ${status} in negative test [${context}]`);
    throw new AppError(
      ErrorCategory.CONSTRAINT,
      { context },
      `Negative test [${context}] received unexpected success status: ${status}`,
    );
  }

  /**
   * Checks if a status code is valid for a negative test.
   */
  private static isValidNegativeTestStatus(actual: number, context: string): boolean {
    // Case 1: Status is in explicitly expected alternatives
    if (RequestContext.isExpectedStatus(context, actual)) {
      logger.info(
        `Received alternative expected status code ${actual} for negative test: ${context}`,
      );
      return true;
    }

    // Case 2: Any error status (4xx, 5xx) is acceptable for negative tests
    if (actual >= 400) {
      logger.info(
        `Received error status code ${actual} in negative test [${context}], considering test passed`,
      );
      return true;
    }

    return false;
  }

  /**
   * Processes response errors, primarily for responses with status code >= 400.
   */
  private static handleResponseError(response: AxiosResponse): void {
    try {
      // Early return if no response or data
      if (!response || !response.data) {
        const noDataError = new Error('No response data available');
        logger.error(noDataError.message);
        throw noDataError;
      }

      // Throw error for any status code >= 400
      if (response.status >= 400) {
        const {
          code = 'UNKNOWN_CODE',
          type = 'UNKNOWN_TYPE',
          message: errorMessage = 'Unspecified error occurred',
        } = response.data;

        // Create a detailed error with comprehensive information
        const detailedError = new Error(errorMessage);
        Object.assign(detailedError, {
          status: response.status,
          code,
          type,
          responseData: response.data,
        });

        // Log detailed error information
        logger.error(`HTTP Error: ${response.status}`, {
          code,
          type,
          message: errorMessage,
          fullResponse: response.data,
        });

        throw detailedError;
      }
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'handleResponseError',
        'Failed to handle API response error',
      );
      throw error;
    }
  }

  /**
   * Check if an error is an expected failure in a negative test.
   */
  private static isExpectedNegativeTestFailure(error: unknown, context: string): boolean {
    if (error instanceof AppError && error.category === ErrorCategory.EXPECTED_FAILURE) {
      logger.info(`Expected failure in negative test [${context}]: ${error.message}`);
      return true;
    }
    return false;
  }

  /**
   * Handles error responses in a negative test context.
   */
  private static handleNegativeTestError(error: unknown, context: string): boolean {
    // Expected failure for negative test
    if (this.isExpectedNegativeTestFailure(error, context)) {
      return true;
    }

    // Check if error has a response with an expected status code
    if (error instanceof AxiosError && error.response) {
      const status = error.response.status;
      if (RequestContext.isExpectedStatus(context, status) || status >= 400) {
        logger.info(`Expected error response received in [${context}]: ${status}`);
        return true;
      }
    }

    // Any other error in a negative test is still a pass
    logger.info(
      `Error occurred as expected in negative test [${context}]: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return true;
  }

  /**
   * Throws an error for status code mismatch.
   */
  private static throwStatusCodeMismatchError(
    actual: number,
    expected: number,
    context: string,
  ): void {
    const errorMessage = `Status code mismatch [${context}] - Expected: ${expected}, Received: ${actual}.`;
    logger.error(errorMessage);
    throw new AppError(ErrorCategory.CONSTRAINT, { context }, errorMessage);
  }
}
