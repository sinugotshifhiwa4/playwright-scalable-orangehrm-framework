import { Frame, Locator, Page, expect, Response } from '@playwright/test';
import SanitizationConfig from '../../utils/sanitization/sanitizationConfig';
import EnvironmentDetector from '../../config/environmentDetector';
import * as fs from 'fs';
import ErrorHandler from '../../utils/errors/errorHandler';
import logger from '../../utils/logging/loggerManager';

export default class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async performAction<T>(
    action: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string,
  ): Promise<T> {
    try {
      const result = await action();
      if (successMessage) logger.info(successMessage);
      return result;
    } catch (error) {
      ErrorHandler.captureError(error, 'performAction', errorMessage);
      throw error;
    }
  }

  /**
   * =============================================
   * NAVIGATION METHODS
   * =============================================
   */

  /**
   * Navigation
   * @param url The URL to navigate to.
   * @returns The response object.
   */
  async navigateToUrl(url: string): Promise<Response | null> {
    return this.performAction(
      () => this.page.goto(url),
      `Navigated to ${url}`,
      `Failed to navigate to ${url}`,
    );
  }

  /**
   * Get frame by name
   * @param frameName The name of the frame to retrieve
   * @returns The frame or null if not found
   */
  async getFrameByName(frameName: string): Promise<Frame | null> {
    return this.performAction(
      () => Promise.resolve(this.page.frame({ name: frameName })),
      `Retrieved frame: ${frameName}`,
      `Failed to get frame: ${frameName}`,
    );
  }

  /**
   * =============================================
   * ELEMENT INTERACTION METHODS
   * =============================================
   */

  /**
   * Element Interaction
   * Fills an input element with the specified value.
   * @param element The element locator.
   * @param value The value to enter in the element.
   * @param elementName The name of the element (optional), used for logging purposes.
   * If the element name contains any of the sensitive keys defined in the SanitizationConfig,
   * the entered value will be masked in the log message.
   * @param options Optional parameters for the fill action.
   * @param options.force A boolean indicating whether to force the fill action.
   */
  async fillElement(
    element: Locator,
    value: string,
    elementName?: string,
    options?: { force?: boolean },
  ) {
    // Get the current sanitization config
    const sanitizationConfig = SanitizationConfig.getDefaultParams();

    // Check if the element name contains any sensitive key
    const isSensitiveField =
      elementName &&
      sanitizationConfig.sensitiveKeys.some((key: string) =>
        elementName.toLowerCase().includes(key.toLowerCase()),
      );

    // Prepare the log message, masking value if sensitive
    const logValue = isSensitiveField ? sanitizationConfig.maskValue : value;
    const logMessage = `${elementName} filled successfully with value: ${logValue}`;

    await this.performAction(
      () => element.fill(value, { force: options?.force || false }),
      logMessage,
      `Error entering text in ${elementName}`,
    );
  }

  /**
   * Enter Text Sequentially
   * @param element The element locator.
   * @param text The text to enter sequentially.
   * @param elementName The name of the element (optional).
   */
  async enterTextSequentially(element: Locator, text: string, elementName?: string) {
    await this.performAction(
      async () => {
        await element.pressSequentially(text);
      },
      `Text entered sequentially in ${elementName}`,
      `Error entering text sequentially in ${elementName}`,
    );
  }

  /**
   * Press Digits in Keyboard
   * @param element The element locator.
   * @param digits The string of digits to press.
   * @param elementName The name of the element.
   */
  async pressDigitsInKeyboard(element: Locator, keys: string, elementName: string) {
    await this.performAction(
      async () => {
        await this.focusElement(element, elementName);
        await this.pressKeyboardKeys(keys);
        await this.blurElement(element, elementName);
      },
      `Digits pressed sequentially in ${elementName}`,
      `Error pressing digits in ${elementName}`,
    );
  }

  /**
   * Clicks on an element.
   * @param element The element locator.
   * @param elementName The name of the element (optional), used for logging purposes.
   * @param options Optional parameters for the click action.
   * @param options.force A boolean indicating whether to force the click action.
   */
  async clickElement(element: Locator, elementName?: string, options?: { force?: boolean }) {
    await this.performAction(
      () => element.click({ force: options?.force || false }),
      `Clicked on ${elementName}`,
      `Error clicking on ${elementName}`,
    );
  }

  /**
   * Clear Element
   * @param element The element locator.
   * @param elementName The name of the element (optional).
   */
  async clearElement(element: Locator, elementName?: string) {
    await this.performAction(
      () => element.clear(),
      `Cleared ${elementName}`,
      `Error clearing ${elementName}`,
    );
  }

  /**
   * Focus on an element
   * @param element The element locator
   * @param elementName The name of the element (optional)
   */
  async focusElement(element: Locator, elementName?: string): Promise<void> {
    return this.performAction(
      () => element.focus(),
      `Focused on ${elementName}`,
      `Failed to focus on ${elementName}`,
    );
  }

  /**
   * Blur (unfocus) an element
   * @param element The element locator
   * @param elementName The name of the element (optional)
   */
  async blurElement(element: Locator, elementName?: string): Promise<void> {
    return this.performAction(
      () => element.blur(),
      `Blurred ${elementName}`,
      `Failed to blur ${elementName}`,
    );
  }

  async hoverElement(element: Locator, elementName?: string): Promise<void> {
    await this.performAction(
      async () => {
        await element.hover();
      },
      `Hovered on ${elementName}`,
      `Failed to hover on ${elementName}`,
    );
  }

  /**
   * Hover and Click on Element
   * @param element The element locator.
   * @param elementName The name of the element (optional).
   */
  async hoverAndClickElement(element: Locator, elementName?: string): Promise<void> {
    await this.performAction(
      async () => {
        await this.hoverElement(element, elementName);
        await this.clickElement(element, elementName);
      },
      `Hovered and clicked on ${elementName}`,
      `Failed to hover and click on ${elementName}`,
    );
  }

  /**
   * Check a checkbox element
   * @param element The element locator.
   * @param elementName The name of the element (optional).
   */
  async checkElement(element: Locator, elementName?: string): Promise<void> {
    await this.performAction(
      () => element.check({ force: true }),
      `${elementName} checked successfully`,
      `Failed to check ${elementName}`,
    );
  }

  /**
   * Press Keyboard Keys
   * @param keys The key or key combination to press.
   * @param description Description of the key action (optional).
   */
  async pressKeyboardKeys(keys: string, description?: string): Promise<void> {
    await this.performAction(
      () => this.page.keyboard.press(keys),
      `Pressed keyboard keys: ${keys} ${description ? `(${description})` : ''}`,
      `Failed to press keyboard keys: ${keys}`,
    );
  }

  /**
   * Select Dropdown Option
   * @param element The element locator.
   * @param optionValue The value of the option.
   * @param elementName The name of the element (optional).
   */
  async selectDropdownOption(element: Locator, optionValue: string, elementName?: string) {
    // Remove any extra quotes from the optionValue
    const cleanOptionValue = optionValue.replace(/^"|"$/g, '');

    return this.performAction(
      () => element.selectOption(cleanOptionValue),
      `${elementName} option selected successfully with value: ${optionValue}`,
      `Error selecting option in ${elementName}`,
    );
  }

  /**
   * Uploads a file using either file chooser or input element
   * @param element The element locator
   * @param filePath The path to the file to be uploaded
   * @param method The upload method: 'fileChooser' or 'input'
   * @param elementName The name of the element (optional)
   */
  async uploadFile(
    element: Locator,
    filePath: string,
    method: 'fileChooser' | 'input',
    elementName?: string,
  ) {
    return this.performAction(
      async () => {
        if (method === 'fileChooser') {
          // Wait for fileChooser to be triggered
          const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.clickElement(element, elementName),
          ]);
          await fileChooser.setFiles(filePath);
          await this.waitForFullPageReady();
        } else {
          await element.setInputFiles(filePath);
        }
      },
      `File '${elementName}' uploaded successfully via ${method}: ${filePath}`,
      `Failed to upload file via ${method}`,
    );
  }

  /**
   * Interact with Element in Frame
   * @param frameName The name attribute of the frame.
   * @param selector The selector of the element in the frame.
   * @param action The action to perform: 'click', 'fill', or 'check'.
   * @param value The value to fill (for 'fill' action only).
   * @param elementName The name of the element (optional).
   */
  async interactWithElementInFrame(
    frameName: string,
    selector: string,
    action: 'click' | 'fill' | 'check',
    value?: string,
    elementName?: string,
  ): Promise<void> {
    await this.performAction(
      async () => {
        const frame = await this.getFrameByName(frameName);
        if (!frame) throw new Error(`Frame '${frameName}' not found`);

        const element = frame.locator(selector);
        switch (action) {
          case 'click':
            await this.clickElement(element, elementName);
            break;
          case 'fill':
            if (value) await this.fillElement(element, value, elementName);
            break;
          case 'check':
            await this.checkElement(element, elementName);
            break;
        }
      },
      `Performed ${action} on ${elementName} in frame ${frameName}`,
      `Failed to perform ${action} on ${elementName} in frame ${frameName}`,
    );
  }

  /**
   * =============================================
   * GETTER METHODS
   * =============================================
   */

  /**
   * Get Element Property
   * @param element The element locator.
   * @param propertyType The type of property to retrieve: 'attribute', 'dimensions', 'text', 'completeText', 'inputValue'.
   * @param options Additional options depending on propertyType (e.g., attributeName for 'attribute' type).
   * @param elementName The name of the element (optional).
   * @returns The requested property value.
   */
  async getElementProperty<T>(
    element: Locator,
    propertyType: 'attribute' | 'dimensions' | 'visibleText' | 'textContent' | 'inputValue',
    options?: { attributeName?: string },
    elementName?: string,
  ): Promise<T> {
    return this.performAction(
      async () => {
        switch (propertyType) {
          case 'attribute':
            if (!options?.attributeName) {
              throw new Error("attributeName is required for 'attribute' property type");
            }
            return element.getAttribute(options.attributeName) as unknown as T;

          case 'dimensions': {
            const boundingBox = await element.boundingBox();
            if (!boundingBox) throw new Error('Failed to get element bounding box');
            return {
              width: boundingBox.width,
              height: boundingBox.height,
            } as unknown as T;
          }

          case 'visibleText':
            return element.innerText() as unknown as T;

          case 'textContent':
            return element.textContent() as unknown as T;

          case 'inputValue':
            return element.inputValue() as unknown as T;

          default:
            logger.error(`Unsupported property type: ${propertyType}`);
            throw new Error(`Unsupported property type: ${propertyType}`);
        }
      },
      `Retrieved ${propertyType} from ${elementName}`,
      `Failed to get ${propertyType} from ${elementName}`,
    );
  }

  /**
   * =============================================
   * WAIT AND STATE METHODS
   * =============================================
   */

  async verifyElementState(
    element: Locator,
    state: 'enabled' | 'disabled' | 'visible' | 'hidden',
    elementName?: string,
  ): Promise<void> {
    await this.performAction(
      async () => {
        switch (state) {
          case 'enabled':
            await expect(element).toBeEnabled();
            break;
          case 'disabled':
            await expect(element).toBeDisabled();
            break;
          case 'visible':
            await expect(element).toBeVisible();
            break;
          case 'hidden':
            await expect(element).not.toBeVisible();
            break;
        }
      },
      `Element ${elementName} state transitioned to ${state}`,
      `Failed waiting for element ${elementName} to be ${state}`,
    );
  }

  /**
   * Waits for an element to reach a specified state.
   * @param element The element locator.
   * @param state The desired state: 'attached', 'detached', 'visible', or 'hidden'.
   * @param elementName The name of the element (optional), used for logging purposes.
   */

  async waitForElementState(
    element: Locator,
    state: 'attached' | 'detached' | 'visible' | 'hidden',
    elementName?: string,
  ) {
    await this.performAction(
      async () => {
        await element.waitFor({ state });
      },
      `Element ${elementName} state transitioned to ${state}`,
      `Failed waiting for element ${elementName} to be ${state}`,
    );
  }

  /**
   * Wait for a selector to reach the specified state
   * @param selector CSS or XPath selector string
   * @param state The desired state: 'attached', 'detached', 'visible', or 'hidden'
   * @param elementName The name of the element (optional)
   * @param timeout Timeout in milliseconds (optional)
   */
  async waitForSelectorState(
    selector: string,
    state: 'attached' | 'detached' | 'visible' | 'hidden',
    elementName?: string,
    timeout?: number,
  ): Promise<void> {
    await this.performAction(
      async () => {
        await this.page.waitForSelector(selector, {
          state,
          timeout,
        });
      },
      `Selector ${elementName || selector} state transitioned to ${state}`,
      `Failed waiting for selector ${elementName || selector} to be ${state}`,
    );
  }

  /**
   * Check if element is currently visible without waiting
   * @param element The element locator.
   * @returns Boolean indicating visibility
   */
  async isElementVisible(element: Locator): Promise<boolean> {
    return this.performAction(
      () => element.isVisible(),
      undefined,
      `Failed to check element visibility`,
    );
  }

  /**
   * =============================================
   * VERIFICATION METHODS
   * =============================================
   */

  /**
   * Verification
   * @param element The element locator.
   * @param expectedText The expected text.
   * @param elementName The name of the element (optional).
   */
  async verifyElementText(element: Locator, expectedText: string, elementName?: string) {
    const actualText = await this.getElementProperty<string>(
      element,
      'visibleText',
      undefined,
      elementName,
    );

    return this.performAction(
      async () => {
        expect(actualText.trim()).toBe(expectedText.trim());
        return true;
      },
      `Verified text for ${elementName}. Expected: "${expectedText}", Actual: "${actualText}"`,
      `Text verification failed for ${elementName}. Expected: "${expectedText}", Actual: "${actualText}"`,
    );
  }

  /**
   * Element State Verification
   * @param element The element locator.
   * @param elementName The name of the element (optional).
   */
  async verifyElementEditable(element: Locator, elementName?: string) {
    return this.performAction(
      async () => {
        const isEnabled = await element.isEnabled();
        const isReadOnly = await element.getAttribute('readonly');
        const isDisabled = await element.getAttribute('disabled');

        expect(isEnabled).toBe(true);
        expect(isReadOnly).toBe(null);
        expect(isDisabled).toBe(null);

        return true;
      },
      `Verified that ${elementName} is editable`,
      `Element ${elementName} is not editable`,
    );
  }

  /**
   * Verifies that a file exists at the specified path after download.
   * @param filePath The path to the downloaded file.
   */
  async verifyDownloadedFile(filePath: string): Promise<void> {
    return this.performAction(
      () => fs.promises.access(filePath),
      `File successfully downloaded to: ${filePath}`,
      `File not found after download`,
    );
  }

  /**
   * =============================================
   * UTILITY METHODS
   * =============================================
   */

  /**
   * Take a screenshot of the current page.
   * @returns A promise that resolves with a Buffer containing the screenshot.
   */
  async takeScreenshot(screenshotName: string = 'unnamed'): Promise<Buffer> {
    return this.performAction(
      () => this.page.screenshot(),
      `Screenshot of ${screenshotName} taken`,
      `Error taking screenshot "${screenshotName}"`,
    );
  }

  /**
   * Creates a random string with configurable options
   * @param length The length of the random string to create
   * @param options Configuration options for string generation
   * @returns A random string
   *
   * @example
   * // Basic usage (alphanumeric)
   * const basic = utils.createRandomString(10);
   *
   * @example
   * // With specific character sets
   * const passwordSafe = utils.createRandomString(12, {
   *   includeUppercase: true,
   *   includeLowercase: true,
   *   includeNumbers: true,
   *   includeSpecial: false
   * });
   *
   * @example
   * // With prefix/suffix for test data
   * const testEmail = utils.createRandomString(8, {
   *   includeLowercase: true,
   *   includeNumbers: true,
   *   suffix: '@example.com'
   * });
   *
   * @example
   * // For password generation
   * const strongPassword = utils.createRandomString(16, {
   *   includeUppercase: true,
   *   includeLowercase: true,
   *   includeNumbers: true,
   *   includeSpecial: true
   * });
   */
  public createRandomString(
    length: number,
    options?: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      includeSpecial?: boolean;
      prefix?: string;
      suffix?: string;
    },
  ): string {
    // Set defaults if options aren't provided
    const config = {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSpecial: false,
      prefix: '',
      suffix: '',
      ...options,
    };

    let chars = '';
    if (config.includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (config.includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (config.includeNumbers) chars += '0123456789';
    if (config.includeSpecial) chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';

    // If no character sets are selected, default to alphanumeric
    if (chars === '') {
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    }

    // Generate the random string
    const randomPart = Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join('');

    // Add prefix and suffix if provided
    return `${config.prefix}${randomPart}${config.suffix}`;
  }

  /**
   * Wait until the DOM content is loaded.
   */
  async waitForDOMContentLoaded(): Promise<void> {
    await this.performAction(
      () => this.page.waitForLoadState('domcontentloaded'),
      'DOM content loaded',
      'Failed to wait for DOM content to load',
    );
  }

  /**
   * Wait until the network is idle.
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.performAction(
      () => this.page.waitForLoadState('networkidle'),
      'Network is idle',
      'Failed to wait for network to be idle',
    );
  }

  /**
   * Wait until both DOM content is loaded and network is idle.
   */
  async waitForFullPageReady(): Promise<void> {
    await this.performAction(
      () =>
        Promise.all([
          this.page.waitForLoadState('domcontentloaded'),
          this.page.waitForLoadState('networkidle'),
        ]),
      'Page is fully ready (DOMContentLoaded + NetworkIdle)',
      'Failed to wait for full page readiness',
    );
  }

  /**
   * Wait for a specified amount of time to pass.
   * @param timeout The amount of time to wait in milliseconds.
   */
  async waitForTimeout(timeout: number): Promise<void> {
    await this.performAction(
      () => new Promise((resolve) => setTimeout(resolve, timeout)),
      `Waited for ${timeout}ms`,
      `Failed to wait for ${timeout}ms`,
    );
  }

  /**
   * Wait for a timeout with different durations for CI and local environments.
   * @param ciTimeout The timeout to use in CI environments (default: 4000ms).
   * @param localTimeout The timeout to use in local environments (default: 2000ms).
   */
  async waitForManualTimeout(ciTimeout = 4000, localTimeout = 2000): Promise<void> {
    const isCI = EnvironmentDetector.isRunningInCI();
    const timeout = isCI ? ciTimeout : localTimeout;

    return this.performAction(
      () => this.page.waitForTimeout(timeout),
      `Waited for ${timeout}ms (${isCI ? 'CI' : 'local'} environment)`,
      `Failed to wait for ${timeout}ms (${isCI ? 'CI' : 'local'} environment)`,
    );
  }
}
