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

  // About
  private readonly companyNameLabel: Locator;
  private readonly versionLabel: Locator;
  private readonly activeEmployeesLabel: Locator;
  private readonly employeesTerminatedLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    this.defaultLandingPageHeader = page.locator(`//h6[normalize-space()='Dashboard']`);
    this.upgradeButton = page.locator(
      `//button[@type='button' and contains(normalize-space(), 'Upgrade')]`,
    );
    this.userProfileMenu = page.locator(`span[class='oxd-userdropdown-tab']`);
    this.userProfileDropdownOptionAbout = page.locator(`//a[@role='menuitem' and text()='About']`);
    this.userProfileDropdownOptionSupport = page.locator(
      `//a[@role='menuitem' and text()='Support']`,
    );
    this.userProfileDropdownOptionChangePassword = page.locator(
      `//a[@role='menuitem' and text()='Change Password']`,
    );
    this.userProfileDropdownOptionLogout = page.locator(
      `//a[@role='menuitem' and text()='Logout']`,
    );

    // About
    this.companyNameLabel = page.locator(
      `//div[@class='oxd-grid-2 orangehrm-about']//p[normalize-space(.)='Company Name:']`,
    );
    this.versionLabel = page.locator(
      `//div[@class='oxd-grid-2 orangehrm-about']//p[normalize-space(.)='Version:']`,
    );
    this.activeEmployeesLabel = page.locator(
      `//div[@class='oxd-grid-2 orangehrm-about']//p[normalize-space(.)='Active Employees:']`,
    );
    this.employeesTerminatedLabel = page.locator(
      `//div[contains(@class,'oxd-grid-2') and contains(@class,'orangehrm-about')]//p[normalize-space(.)='Employees Terminated:']`,
    );
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

  async assertDefaultLandingPageIsDashboard(expectedHeaderText: string) {
    try {
      const actualHeader = await this.getDefaultDashboardHeaderText();
      expect(actualHeader).toBe(expectedHeaderText);
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
      await this.clickElement(this.upgradeButton, 'Upgrade button', { force: true });
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

      await newPage.waitForLoadState('domcontentloaded');

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

  async verifyAndAssertTopMenuAreVisible(
    expectedHeaderText: string,
    expectedUrl: string,
    expectedTitle: string,
  ) {
    try {
      await this.assertDefaultLandingPageIsDashboard(expectedHeaderText);
      await this.verifyUpgradeButtonIsVisible();

      await this.assertUpgradeButtonOpenNewTab(expectedUrl, expectedTitle);
      await this.verifyUserProfileMenuIsVisible();
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyTopMenuAreVisible',
        'Failed to verify top menu are visible',
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

  async verifyUserProfileDropdownOptionsAreVisible() {
    try {
      await this.clickUserProfileMenu();
      await this.verifyUserProfileDropdownOptionAboutIsVisible();
      await this.verifyUserProfileDropdownOptionSupportIsVisible();
      await this.verifyUserProfileDropdownOptionChangePasswordIsVisible();
      await this.verifyLogoutButtonIsVisible();
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyUserProfileDropdownOptionsAreVisible',
        'Failed to verify user profile dropdown options are visible',
      );
      throw error;
    }
  }

  // About

  async verifyCompanyNameLabelIsVisible() {
    try {
      await this.verifyElementState(this.companyNameLabel, 'visible', 'Company Name label');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyCompanyNameLabelIsVisible',
        'Failed to verify company name label',
      );
      throw error;
    }
  }

  async getCompanyLabelText() {
    try {
      return await this.getElementProperty<string>(
        this.companyNameLabel,
        'textContent',
        undefined,
        'Company Name label',
      );
    } catch (error) {
      ErrorHandler.captureError(error, 'getCompanyLabelText', 'Failed to get company label text');
      throw error;
    }
  }

  async assertCompanyLabelText(expectedLabel: string) {
    try {
      await this.verifyCompanyNameLabelIsVisible();

      const actualLabelText = await this.getCompanyLabelText();

      expect(actualLabelText).toBe(expectedLabel);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'assertCompanyLabelText',
        'Failed to validate company label text',
      );
      throw error;
    }
  }

  async verifyVersionLabelIsVisible() {
    try {
      await this.verifyElementState(this.versionLabel, 'visible', 'Version label');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyVersionLabelIsVisible',
        'Failed to verify version label',
      );
      throw error;
    }
  }

  async getVersionLabelText() {
    try {
      return await this.getElementProperty<string>(
        this.versionLabel,
        'textContent',
        undefined,
        'Version label',
      );
    } catch (error) {
      ErrorHandler.captureError(error, 'getVersionLabelText', 'Failed to get version label text');
      throw error;
    }
  }

  async assertVersionLabelText(expectedLabel: string) {
    try {
      await this.verifyVersionLabelIsVisible();

      const actualLabelText = await this.getVersionLabelText();

      expect(actualLabelText).toBe(expectedLabel);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'assertVersionLabelText',
        'Failed to validate version label text',
      );
      throw error;
    }
  }

  async verifyActiveEmployeesLabelIsVisible() {
    try {
      await this.verifyElementState(this.activeEmployeesLabel, 'visible', 'Active Employees label');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyActiveEmployeesLabelIsVisible',
        'Failed to verify active employees label',
      );
      throw error;
    }
  }

  async getActiveEmployeesLabelText() {
    try {
      return await this.getElementProperty<string>(
        this.activeEmployeesLabel,
        'textContent',
        undefined,
        'Active Employees label',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'getActiveEmployeesLabelText',
        'Failed to get active employees label text',
      );
      throw error;
    }
  }

  async assertActiveEmployeesLabelText(expectedLabel: string) {
    try {
      await this.verifyActiveEmployeesLabelIsVisible();

      const actualLabelText = await this.getActiveEmployeesLabelText();

      expect(actualLabelText).toBe(expectedLabel);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'assertActiveEmployeesLabelText',
        'Failed to validate active employees label text',
      );
      throw error;
    }
  }

  async verifyEmployeesTerminatedLabelIsVisible() {
    try {
      await this.verifyElementState(
        this.employeesTerminatedLabel,
        'visible',
        'Employees Terminated label',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyEmployeesTerminatedLabelIsVisible',
        'Failed to verify employees terminated label',
      );
      throw error;
    }
  }

  async getEmployeesTerminatedLabelText() {
    try {
      return await this.getElementProperty<string>(
        this.employeesTerminatedLabel,
        'textContent',
        undefined,
        'Employees Terminated label',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'getEmployeesTerminatedLabelText',
        'Failed to get employees terminated label text',
      );
      throw error;
    }
  }

  async assertEmployeesTerminatedLabelText(expectedLabel: string) {
    try {
      await this.verifyEmployeesTerminatedLabelIsVisible();

      const actualLabelText = await this.getEmployeesTerminatedLabelText();

      expect(actualLabelText).toBe(expectedLabel);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'assertEmployeesTerminatedLabelText',
        'Failed to validate employees terminated label text',
      );
      throw error;
    }
  }

  async assertAboutLabels(
    companyNameLabel: string,
    versionLabel: string,
    activeEmployeesLabel: string,
    employeesTerminatedLabel: string,
  ) {
    try {
      await this.assertCompanyLabelText(companyNameLabel);
      await this.assertVersionLabelText(versionLabel);
      await this.assertActiveEmployeesLabelText(activeEmployeesLabel);
      await this.assertEmployeesTerminatedLabelText(employeesTerminatedLabel);
    } catch (error) {
      ErrorHandler.captureError(error, 'assertAboutLabels', 'Failed to validate about labels');
      throw error;
    }
  }

  async verifyAboutLabelsAreVisibleInDialogBox() {
    try {
      await this.verifyCompanyNameLabelIsVisible();
      await this.verifyVersionLabelIsVisible();
      await this.verifyActiveEmployeesLabelIsVisible();
      await this.verifyEmployeesTerminatedLabelIsVisible();
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyAboutLabelsAreVisibleInDialogBox',
        'Failed to verify about labels are visible in dialog box',
      );
      throw error;
    }
  }

  async verifyAndAssertAboutDialogBox(
    expectedCompanyNameLabel: string,
    expectedVersionLabel: string,
    expectedActiveEmployeesLabel: string,
    expectedEmployeesTerminatedLabel: string,
  ) {
    try {
      await this.verifyAboutLabelsAreVisibleInDialogBox();

      // Get values
      const actualCompanyNameLabelText = await this.getCompanyLabelText();
      const actualVersionLabelText = await this.getVersionLabelText();
      const actualActiveEmployeesLabelText = await this.getActiveEmployeesLabelText();
      const actualEmployeesTerminatedLabelText = await this.getEmployeesTerminatedLabelText();

      // Assertions
      expect(actualCompanyNameLabelText).toContain(expectedCompanyNameLabel);
      expect(actualVersionLabelText).toContain(expectedVersionLabel);
      expect(actualActiveEmployeesLabelText).toContain(expectedActiveEmployeesLabel);
      expect(actualEmployeesTerminatedLabelText).toContain(expectedEmployeesTerminatedLabel);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyAndAssertAboutDialogBox',
        'Failed to verify and assert about dialog box',
      );
      throw error;
    }
  }

  // Support
}
