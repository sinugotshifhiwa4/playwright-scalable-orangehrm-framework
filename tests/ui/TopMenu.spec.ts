import { test } from '../../fixtures/orangehrm.fixtures';
import logger from '../../src/utils/logging/loggerManager';

test.describe.only('Top Menu Bar Test Suite @regression', () => {
  test.beforeEach(async ({ authenticationTestContext }) => {
    await authenticationTestContext.navigateToPortal();
  });

  test.afterEach(async ({ page }) => {
    if (page && !page.isClosed()) {
      await page.close();
    }
  });

  test('Verify Top menus are visible', async ({ topMenuPage }) => {
    await topMenuPage.verifyAndAssertTopMenuAreVisible(
      'Dashboard',
      '/upgrade-to-advanced',
      'Upgrade to Advanced from Open Source',
    );
    logger.info('Top menus are visible');
  });

  test('Verify User Profile dropdown options are visible', async ({ topMenuPage }) => {
    await topMenuPage.verifyUserProfileDropdownOptionsAreVisible();
    logger.info('User Profile dropdown options are visible');
  });

  test.skip('Verify User Profile About Dialog Box data is visible', async ({ topMenuPage }) => {
    await topMenuPage.clickUserProfileMenu();
    await topMenuPage.clickUserProfileDropdownOptionAbout();
    await topMenuPage.verifyAndAssertAboutDialogBox('Company Name', 'Version', 'Active Employees', 'Terminated Employees');
    logger.info('User Profile About Dialog Box data is visible');
  });
});
