import { Locator, Page, expect } from '@playwright/test';
import BasePage from '../base/basePage';
import ErrorHandler from '../../utils/errors/errorHandler';

export class TopMenuPage extends BasePage {
  readonly page: Page;
  private readonly defaultLandingPageHeader: Locator;
  private readonly upgradeButton: Locator;
  private readonly userProfileMenu: Locator;
  private readonly userProfileDropdownOptionAbout: Locator;
  private readonly userProfileDropdownOptionSupport: Locator;
  private readonly userProfileDropdownOptionChangePassword: Locator;
  private readonly userProfileDropdownOptionLogout: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    this.defaultLandingPageHeader = page.locator(`//h6[normalize-space()='Dashboard']`);
    this.upgradeButton = page.locator(`//button[@type='button' and contains(normalize-space(), 'Upgrade')]`);
    this.userProfileMenu = page.locator(`span[class='oxd-userdropdown-tab']`);
    this.userProfileDropdownOptionAbout = page.locator(`//a[@role='menuitem' and text()='About']`);
    this.userProfileDropdownOptionSupport = page.locator(`//a[@role='menuitem' and text()='Support']`);
    this.userProfileDropdownOptionChangePassword = page.locator(`//a[@role='menuitem' and text()='Change Password']`);
    this.userProfileDropdownOptionLogout = page.locator(`//a[@role='menuitem' and text()='Logout']`);
  }

  async getDefaultDashboardHeaderText() {
    try {
      return await this.getElementProperty<string>(
        this.defaultLandingPageHeader,
        'textContent',
        undefined,
        'Default page header',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'getDefaultDashboardHeaderText',
        'Failed to get default dashboard header text',
      );
      throw error;
    }
  }

  async assertDefaultLandingPageIsDashboard(expectedHeader: string) {
    try {
      const actualHeader = await this.getDefaultDashboardHeaderText();
      expect(actualHeader).toBe(expectedHeader);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'assertDefaultLandingPageIsDashboard',
        'Failed to assert default landing page is dashboard',
      );
      throw error;
    }
  }

  async verifyUpgradeButtonIsVisible() {
    try {
      await this.verifyElementState(this.upgradeButton, 'visible', 'Upgrade button');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyUpgradeButtonIsVisible',
        'Failed to verify upgrade button',
      );
      throw error;
    }
  }

  async clickUpgradeButton() {
    try {
      await this.clickElement(this.upgradeButton, 'Upgrade button');
    } catch (error) {
      ErrorHandler.captureError(error, 'clickUpgradeButton', 'Failed to click upgrade button');
      throw error;
    }
  }

  async assertUpgradeButtonOpenNewTab(expectedUrl: string, expectedTitle: string) {
    try {
      const [newPage] = await Promise.all([
        this.page.context().waitForEvent('page'),
        this.clickUpgradeButton(),
      ]);

      await newPage.waitForLoadState('networkidle');

      const actualUrl = newPage.url();
      expect(actualUrl).toContain(expectedUrl);

      const actualTitle = await newPage.title();
      expect(actualTitle).toContain(expectedTitle);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'assertUpgradeButtonOpenNewTab',
        'Failed to assert upgrade button opened a new tab',
      );
      throw error;
    }
  }


  // User profile
  async verifyUserProfileMenuIsVisible() {
    try {
      await this.verifyElementState(this.userProfileMenu, 'visible', 'User profile menu');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyUserProfileMenuIsVisible',
        'Failed to verify user profile menu',
      );
      throw error;
    }
  }

  async clickUserProfileMenu() {
    try {
      await this.clickElement(this.userProfileMenu, 'User profile menu');
    } catch (error) {
      ErrorHandler.captureError(error, 'clickUserProfileMenu', 'Failed to click user profile menu');
      throw error;
    }
  }

  async verifyUserProfileDropdownOptionAboutIsVisible() {
    try {
      await this.verifyElementState(
        this.userProfileDropdownOptionAbout,
        'visible',
        'User profile dropdown option about',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyUserProfileDropdownOptionAboutIsVisible',
        'Failed to verify user profile dropdown option about',
      );
      throw error;
    }
  }

  async clickUserProfileDropdownOptionAbout() {
    try {
      await this.clickElement(
        this.userProfileDropdownOptionAbout,
        'User profile dropdown option about',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'clickUserProfileDropdownOptionAbout',
        'Failed to click user profile dropdown option about',
      );
      throw error;
    }
  }

  async verifyUserProfileDropdownOptionSupportIsVisible() {
    try {
      await this.verifyElementState(
        this.userProfileDropdownOptionSupport,
        'visible',
        'User profile dropdown option support',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyUserProfileDropdownOptionSupportIsVisible',
        'Failed to verify user profile dropdown option support',
      );
      throw error;
    }
  }

  async clickUserProfileDropdownOptionSupport() {
    try {
      await this.clickElement(
        this.userProfileDropdownOptionSupport,
        'User profile dropdown option support',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'clickUserProfileDropdownOptionSupport',
        'Failed to click user profile dropdown option support',
      );
      throw error;
    }
  }

  async verifyUserProfileDropdownOptionChangePasswordIsVisible() {
    try {
      await this.verifyElementState(
        this.userProfileDropdownOptionChangePassword,
        'visible',
        'User profile dropdown option change password',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyUserProfileDropdownOptionChangePasswordIsVisible',
        'Failed to verify user profile dropdown option change password',
      );
      throw error;
    }
  }

  async clickUserProfileDropdownOptionChangePassword() {
    try {
      await this.clickElement(
        this.userProfileDropdownOptionChangePassword,
        'User profile dropdown option change password',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'clickUserProfileDropdownOptionChangePassword',
        'Failed to click user profile dropdown option change password',
      );
      throw error;
    }
  }

  async clickLogoutButton() {
    try {
      await this.clickElement(this.userProfileDropdownOptionLogout, 'Logout button');
    } catch (error) {
      ErrorHandler.captureError(error, 'clickLogoutButton', 'Failed to click logout button');
      throw error;
    }
  }

  async verifyLogoutButtonIsVisible() {
    try {
      await this.verifyElementState(
        this.userProfileDropdownOptionLogout,
        'visible',
        'Logout button',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyLogoutButtonIsVisible',
        'Failed to verify logout button',
      );
      throw error;
    }
  }

  // add all user profile dropdown options pages
}
