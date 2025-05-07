import axios, { AxiosResponse } from 'axios';
import ApiErrorHandler from '../../utils/errors/apiErrorResponseBuilder';
import ErrorHandler from '../../utils/errors/errorHandler';

export class ApiClient {
  // Default headers
  private defaultHeaders: { [key: string]: string };

  /**
   * Initializes the RestHttpClient with default headers.
   * The default headers set "Content-Type" to "application/json".
   */
  constructor() {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Creates headers for the HTTP request.
   * @param authorizationHeader Authorization header value if provided
   * @returns Headers object
   */
  private createHeaders(authorizationHeader?: string): {
    [key: string]: string;
  } {
    const headers = { ...this.defaultHeaders };
    if (authorizationHeader) {
      headers['Authorization'] = authorizationHeader;
    }
    return headers;
  }

  /**
   * Sends an HTTP request using the specified method, endpoint, payload, and headers.
   * Handles errors by logging them and returning the error response if it is an Axios error.
   *
   * @template T - The expected response type.
   * @param method - The HTTP method to use for the request
   * @param endpoint - The URL endpoint to which the request is sent.
   * @param payload - The optional payload to be included in the request body.
   * @param headers - Optional headers to be included in the request.
   * @returns A promise that resolves with the Axios response of the specified type.
   * @throws Will throw an error if an unexpected error occurs.
   */
  private async sendRequest<T>(
    method: 'post' | 'put' | 'patch' | 'get' | 'delete',
    endpoint: string,
    payload?: object,
    headers?: { [key: string]: string },
  ): Promise<AxiosResponse<T>> {
    try {
      const config = { headers: { ...this.defaultHeaders, ...headers } };

      // Handle different parameter orders for different HTTP methods
      if (method === 'get' || method === 'delete') {
        return await axios[method](endpoint, config);
      } else {
        return await axios[method](endpoint, payload, config);
      }
    } catch (error) {
      // If the error is an Axios error, we can return the response directly
      if (axios.isAxiosError(error) && error.response) {
        ApiErrorHandler.captureApiError(
          error,
          `${method.toUpperCase()} Request`,
          `Failed to send ${method.toUpperCase()} request to ${endpoint}`,
        );
        return error.response; // Return the error response
      }

      // For other errors, handle them normally
      ErrorHandler.captureError(
        error,
        'sendRequest',
        `Failed to send ${method.toUpperCase()} request to ${endpoint}`,
      );
      throw error;
    }
  }

  /**
   * Sends an HTTP request with the specified method to the endpoint.
   *
   * @template T - The expected response type.
   * @param endpoint - The URL endpoint to which the request is sent.
   * @param payload - The optional payload for the request body (ignored for GET/DELETE).
   * @param authorizationHeader - Optional Authorization header value.
   * @returns A promise that resolves with the Axios response.
   * @throws Will throw an error if an unexpected error occurs.
   */
  async sendPostRequest<T>(
    endpoint: string,
    payload?: object,
    authorizationHeader?: string,
  ): Promise<AxiosResponse<T>> {
    const headers = this.createHeaders(authorizationHeader);
    return this.sendRequest<T>('post', endpoint, payload, headers);
  }

  async sendPutRequest<T>(
    endpoint: string,
    payload?: object,
    authorizationHeader?: string,
  ): Promise<AxiosResponse<T>> {
    const headers = this.createHeaders(authorizationHeader);
    return this.sendRequest<T>('put', endpoint, payload, headers);
  }

  async sendPatchRequest<T>(
    endpoint: string,
    payload?: object,
    authorizationHeader?: string,
  ): Promise<AxiosResponse<T>> {
    const headers = this.createHeaders(authorizationHeader);
    return this.sendRequest<T>('patch', endpoint, payload, headers);
  }

  async sendGetRequest<T>(
    endpoint: string,
    authorizationHeader?: string,
  ): Promise<AxiosResponse<T>> {
    const headers = this.createHeaders(authorizationHeader);
    return this.sendRequest<T>('get', endpoint, undefined, headers);
  }

  async sendDeleteRequest<T>(
    endpoint: string,
    authorizationHeader?: string,
  ): Promise<AxiosResponse<T>> {
    const headers = this.createHeaders(authorizationHeader);
    return this.sendRequest<T>('delete', endpoint, undefined, headers);
  }
}
