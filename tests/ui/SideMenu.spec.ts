import { test } from '../../fixtures/orangehrm.fixtures';
import logger from '../../src/utils/logging/loggerManager';

test.describe('Side Menu Bar Test Suite @regression', () => {
  test.beforeEach(async ({ authenticationTestContext }) => {
    await authenticationTestContext.navigateToPortal();
  });

  test.afterEach(async ({ page }) => {
    if (page && !page.isClosed()) {
      await page.close();
    }
  });

  test('Verify side menus are visible', async ({ sideMenuPage }) => {
    await sideMenuPage.verifySideMenusAreVisible();
    logger.info('Side menus are visible');
  });
});
