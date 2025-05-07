import { Locator, Page, expect } from '@playwright/test';
import BasePage from '../base/basePage';
import ErrorHandler from '../../utils/errors/errorHandler';

export class LoginPage extends BasePage {
  readonly page: Page;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly orangeHrmLogo: Locator;
  private readonly errorMessage: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly resetPasswordPageHeader: Locator;
  private readonly resetPasswordCancelButton: Locator;
  private readonly resetPasswordButton: Locator;
  private readonly resetPasswordConfirmationMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    this.usernameInput = page.locator(`input[name='username']`);
    this.passwordInput = page.locator(`input[name='password']`);
    this.loginButton = page.locator(`button[type='submit']`);
    this.orangeHrmLogo = page.locator(`img[alt='company-branding']`);
    this.errorMessage = page.locator(`div[role='alert']`);
    this.forgotPasswordLink = page.locator(`.orangehrm-login-forgot-header`);
    this.resetPasswordPageHeader = page.locator(`//h6[text()='Reset Password']`);
    this.resetPasswordCancelButton = page.locator(`button[type='button']`);
    this.resetPasswordButton = page.locator(`button[type='submit']`);
    this.resetPasswordConfirmationMessage = page.locator(
      `//h6[text()='Reset Password link sent successfully']`,
    );
  }

  async verifyOrangeHrmLogoIsVisible() {
    try {
      await this.verifyElementState(this.orangeHrmLogo, 'visible', 'OrangeHRM company logo');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyOrangeHrmLogoIsVisible',
        'Failed to verify OrangeHRM logo is visible',
      );
      throw error;
    }
  }

  async fillUsername(username: string) {
    try {
      await this.fillElement(this.usernameInput, username, 'Username');
    } catch (error) {
      ErrorHandler.captureError(error, 'fillUsername', 'Failed to fill username');
      throw error;
    }
  }

  async fillPassword(password: string) {
    try {
      await this.fillElement(this.passwordInput, password, 'Password');
    } catch (error) {
      ErrorHandler.captureError(error, 'fillPassword', 'Failed to fill password');
      throw error;
    }
  }

  async clickLoginButton() {
    try {
      await this.clickElement(this.loginButton, 'Login button');
    } catch (error) {
      ErrorHandler.captureError(error, 'clickLoginButton', 'Failed to click login button');
      throw error;
    }
  }

  async verifyErrorMessageIsVisible() {
    try {
      await this.verifyElementState(this.errorMessage, 'visible', 'Error message');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyErrorMessageIsVisible',
        'Failed to verify error message',
      );
      throw error;
    }
  }

  async verifyErrorMessageHidden() {
    try {
      await this.verifyElementState(this.errorMessage, 'hidden', 'Error message');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyErrorMessageHidden',
        'Failed to verify error message',
      );
      throw error;
    }
  }

  async loginToPortal(username: string, password: string) {
    try {
      await this.fillUsername(username);
      await this.fillPassword(password);
      await this.clickLoginButton();
    } catch (error) {
      ErrorHandler.captureError(error, 'loginToPortal', 'Failed to login to portal');
      throw error;
    }
  }

  // Forgot password
  async verifyForgotPasswordLinkIsVisible() {
    try {
      await this.verifyElementState(this.forgotPasswordLink, 'visible', 'Forgot password link');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyForgotPasswordLinkIsVisible',
        'Failed to verify forgot password link',
      );
      throw error;
    }
  }

  async clickForgotPasswordLink() {
    try {
      await this.clickElement(this.forgotPasswordLink, 'Forgot password link');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'clickForgotPasswordLink',
        'Failed to click forgot password link',
      );
      throw error;
    }
  }

  async verifyResetPasswordPageHeaderIsVisible() {
    try {
      await this.verifyElementState(
        this.resetPasswordPageHeader,
        'visible',
        'Reset password page header',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyResetPasswordPageHeaderIsVisible',
        'Failed to verify reset password page header',
      );
      throw error;
    }
  }

  async clickResetPasswordCancelButton() {
    try {
      await this.clickElement(this.resetPasswordCancelButton, 'Reset password cancel button');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'clickResetPasswordCancelButton',
        'Failed to click reset password cancel button',
      );
      throw error;
    }
  }

  async clickResetPasswordButton() {
    try {
      await this.clickElement(this.resetPasswordButton, 'Reset password button');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'clickResetPasswordButton',
        'Failed to click reset password button',
      );
      throw error;
    }
  }

  async getResetPasswordConfirmationMessage() {
    try {
      return await this.getElementProperty<string>(
        this.resetPasswordConfirmationMessage,
        'textContent',
        undefined,
        'Reset password confirmation message',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'getResetPasswordConfirmationMessage',
        'Failed to get reset password confirmation message',
      );
      throw error;
    }
  }

  async validateResetPasswordConfirmationMessageIsVisible(expectedMessage: string) {
    try {
      const actualMessage = await this.getResetPasswordConfirmationMessage();

      await expect(actualMessage).toBe(expectedMessage);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyResetPasswordConfirmationMessageIsVisible',
        'Failed to validate reset password confirmation message',
      );
      throw error;
    }
  }
}
