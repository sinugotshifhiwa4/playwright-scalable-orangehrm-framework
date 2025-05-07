import { Locator, Page } from '@playwright/test';
import BasePage from '../base/basePage';
import ErrorHandler from '../../utils/errors/errorHandler';

export class SideMenuPage extends BasePage {
  readonly page: Page;
  private readonly collapseSidebarToggle: Locator;
  private readonly expandSidebarToggle: Locator;
  private readonly orangeHrmLogo: Locator;
  private readonly searchInput: Locator;
  private readonly adminMenu: Locator;
  private readonly pimMenu: Locator;
  private readonly leaveMenu: Locator;
  private readonly timeMenu: Locator;
  private readonly recruitmentMenu: Locator;
  private readonly myInfoMenu: Locator;
  private readonly performanceMenu: Locator;
  private readonly dashboardMenu: Locator;
  private readonly directoryMenu: Locator;
  private readonly maintenanceMenu: Locator;
  private readonly claimsMenu: Locator;
  private readonly buzzMenu: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    this.collapseSidebarToggle = page.locator(`i[class='oxd-icon bi-chevron-left']`);
    this.expandSidebarToggle = page.locator(`i[class='oxd-icon bi-chevron-right']`);
    this.orangeHrmLogo = page.locator(`img[alt='client brand banner']`);
    this.searchInput = page.locator(`input[placeholder='Search']`);
    this.adminMenu = page.locator(`//a[contains(@href, 'admin')]`);
    this.pimMenu = page.locator(`//a[contains(@href, 'pim')]`).first();
    this.leaveMenu = page.locator(`//a[contains(@href, 'leave')]`);
    this.timeMenu = page.locator(`//a[contains(@href, 'time')]`);
    this.recruitmentMenu = page.locator(`//a[contains(@href, 'recruitment')]`);
    this.myInfoMenu = page.locator(`//a[contains(@href, 'pim')]`).last();
    this.performanceMenu = page.locator(`//a[contains(@href, 'performance')]`);
    this.dashboardMenu = page.locator(`//a[contains(@href, 'dashboard')]`);
    this.directoryMenu = page.locator(`//a[contains(@href, 'directory')]`);
    this.maintenanceMenu = page.locator(`//a[contains(@href, 'maintenance')]`);
    this.claimsMenu = page.locator(`//a[contains(@href, 'claim')]`);
    this.buzzMenu = page.locator(`//a[contains(@href, 'buzz')]`);
  }

  async verifyCollapseSidebarToggleIsVisible() {
    try {
      await this.verifyElementState(
        this.collapseSidebarToggle,
        'visible',
        'Collapse sidebar toggle',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyCollapseSidebarToggleIsVisible',
        'Failed to verify collapse sidebar toggle',
      );
      throw error;
    }
  }

  async verifyCollapseSidebarToggleHidden() {
    try {
      await this.verifyElementState(
        this.collapseSidebarToggle,
        'hidden',
        'Collapse sidebar toggle',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyCollapseSidebarToggleHidden',
        'Failed to verify collapse sidebar toggle',
      );
      throw error;
    }
  }

  async clickCollapseSidebarToggle() {
    try {
      await this.performAction(
        () => this.collapseSidebarToggle.click(),
        'Collapsed sidebar',
        'Failed to collapse sidebar',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'clickCollapseSidebarToggle',
        'Failed to click collapse sidebar toggle',
      );
      throw error;
    }
  }

  async verifyExpandSidebarToggleIsVisible() {
    try {
      await this.verifyElementState(this.expandSidebarToggle, 'visible', 'Expand sidebar toggle');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyExpandSidebarToggleIsVisible',
        'Failed to verify expand sidebar toggle',
      );
      throw error;
    }
  }

  async verifyExpandSidebarToggleIsHidden() {
    try {
      await this.verifyElementState(this.expandSidebarToggle, 'hidden', 'Expand sidebar toggle');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyExpandSidebarToggleIsHidden',
        'Failed to verify expand sidebar toggle',
      );
      throw error;
    }
  }

  async clickExpandSidebarToggle() {
    try {
      await this.performAction(
        () => this.expandSidebarToggle.click(),
        'Expanded sidebar',
        'Failed to expand sidebar',
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'clickExpandSidebarToggle',
        'Failed to click expand sidebar toggle',
      );
      throw error;
    }
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

  async fillSearchInput(searchTerm: string) {
    try {
      await this.fillElement(this.searchInput, searchTerm, 'Search input');
    } catch (error) {
      ErrorHandler.captureError(error, 'fillSearchInput', 'Failed to fill search input');
      throw error;
    }
  }

  async verifyAdminMenuIsVisible() {
    try {
      await this.verifyElementState(this.adminMenu, 'visible', 'Admin menu');
    } catch (error) {
      ErrorHandler.captureError(error, 'verifyAdminMenuIsVisible', 'Failed to verify admin menu');
      throw error;
    }
  }

  async verifyPimMenuIsVisible() {
    try {
      await this.verifyElementState(this.pimMenu, 'visible', 'PIM menu');
    } catch (error) {
      ErrorHandler.captureError(error, 'verifyPimMenuIsVisible', 'Failed to verify PIM menu');
      throw error;
    }
  }

  async verifyLeaveMenuIsVisible() {
    try {
      await this.verifyElementState(this.leaveMenu, 'visible', 'Leave menu');
    } catch (error) {
      ErrorHandler.captureError(error, 'verifyLeaveMenuIsVisible', 'Failed to verify leave menu');
      throw error;
    }
  }

  async verifyTimeMenuIsVisible() {
    try {
      await this.verifyElementState(this.timeMenu, 'visible', 'Time menu');
    } catch (error) {
      ErrorHandler.captureError(error, 'verifyTimeMenuIsVisible', 'Failed to verify Time menu');
      throw error;
    }
  }

  async verifyRecruitmentMenuIsVisible() {
    try {
      await this.verifyElementState(this.recruitmentMenu, 'visible', 'Recruitment menu');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyRecruitmentMenuIsVisible',
        'Failed to verify recruitment menu',
      );
      throw error;
    }
  }

  async verifyMyInfoMenuIsVisible() {
    try {
      await this.verifyElementState(this.myInfoMenu, 'visible', 'My info menu');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyMyInfoMenuIsVisible',
        'Failed to verify my info menu',
      );
      throw error;
    }
  }

  async verifyPerformanceMenuIsVisible() {
    try {
      await this.verifyElementState(this.performanceMenu, 'visible', 'Performance menu');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyPerformanceMenuIsVisible',
        'Failed to verify performance menu',
      );
      throw error;
    }
  }

  async verifyDashboardMenuIsVisible() {
    try {
      await this.verifyElementState(this.dashboardMenu, 'visible', 'Dashboard menu');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyDashboardMenuIsVisible',
        'Failed to verify dashboard menu',
      );
      throw error;
    }
  }

  async isDashboardMenuVisible() {
    try {
      return await this.isElementVisible(this.dashboardMenu);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'isDashboardMenuVisible',
        'Failed to verify dashboard menu',
      );
      throw error;
    }
  }

  async verifyDirectoryMenuIsVisible() {
    try {
      await this.verifyElementState(this.directoryMenu, 'visible', 'Directory menu');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyDirectoryMenuIsVisible',
        'Failed to verify directory menu',
      );
      throw error;
    }
  }

  async verifyMaintenanceMenuIsVisible() {
    try {
      await this.verifyElementState(this.maintenanceMenu, 'visible', 'Maintenance menu');
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'verifyMaintenanceMenuIsVisible',
        'Failed to verify maintenance menu',
      );
      throw error;
    }
  }

  async verifyClaimsMenuIsVisible() {
    try {
      await this.verifyElementState(this.claimsMenu, 'visible', 'Claims menu');
    } catch (error) {
      ErrorHandler.captureError(error, 'verifyClaimsMenuIsVisible', 'Failed to verify Claims menu');
      throw error;
    }
  }

  async verifyBuzzMenuIsVisible() {
    try {
      await this.verifyElementState(this.buzzMenu, 'visible', 'Buzz menu');
    } catch (error) {
      ErrorHandler.captureError(error, 'verifyBuzzMenuIsVisible', 'Failed to verify Buzz menu');
      throw error;
    }
  }

  async verifySideMenusAreVisible() {
    try {
      await this.verifyOrangeHrmLogoIsVisible();
      await this.verifyAdminMenuIsVisible();
      await this.verifyPimMenuIsVisible();
      await this.verifyLeaveMenuIsVisible();
      await this.verifyTimeMenuIsVisible();
      await this.verifyRecruitmentMenuIsVisible();
      await this.verifyMyInfoMenuIsVisible();
      await this.verifyPerformanceMenuIsVisible();
      await this.verifyDashboardMenuIsVisible();
      await this.verifyDirectoryMenuIsVisible();
      await this.verifyMaintenanceMenuIsVisible();
      await this.verifyClaimsMenuIsVisible();
      await this.verifyBuzzMenuIsVisible();
    } catch (error) {
      ErrorHandler.captureError(error, 'verifySideMenusAreVisible', 'Failed to verify side menus');
      throw error;
    }
  }
}
