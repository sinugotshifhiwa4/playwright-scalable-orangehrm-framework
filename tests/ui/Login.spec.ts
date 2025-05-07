// tests/login/login.spec.ts
import { test } from '../../fixtures/orangehrm.fixtures';
import AuthStorageManager from '../../src/utils/auth/storage/authStorageManager';
import logger from '../../src/utils/logging/loggerManager';

// Disable auto-login for this suite to test login behavior explicitly
test.use({ requireAuthentication: false, requireAuthenticationState: false });

test.describe('Login Test Suite @sanity @regression', () => {
  test.beforeEach(
    async ({
      authenticationTestContext,
      testInfo,
      requireAuthentication,
      requireAuthenticationState,
    }) => {
      if (AuthStorageManager.shouldSkipAuthSetup(testInfo)) {
        logger.info(`[Setup] Skipping authentication setup for test: ${testInfo.title}`);
        return;
      }

      await authenticationTestContext.configureLoginState(
        requireAuthentication,
        requireAuthenticationState,
      );
    },
  );

  test.afterEach(async ({ page }) => {
    if (page && !page.isClosed()) {
      await page.close();
    }
  });
  test('Verify login success with valid credentials', async ({
    authenticationTestContext,
    loginPage,
    sideMenuPage,
    topMenuPage,
  }) => {
    // Navigate to login page and perform login with valid credentials
    await authenticationTestContext.configureLoginState(true, false);

    // Verify successful login
    await loginPage.verifyErrorMessageHidden();
    await sideMenuPage.verifyDashboardMenuIsVisible();
    await topMenuPage.assertDefaultLandingPageIsDashboard('Dashboard');

    logger.info('Login success with valid credentials');
  });

  test('Verify login fail with invalid credentials', async ({
    authenticationTestContext,
    loginPage,
  }) => {
    // Setup conditions to skip global login and authentication setup
    await authenticationTestContext.configureLoginState(false, false);

    // Then attempt login with invalid credentials
    await loginPage.loginToPortal('lunah487@gmail.com', 'SomePassword@xjd8..');
    await loginPage.verifyErrorMessageIsVisible();

    logger.info('Login fail with invalid credentials. Error message displayed as expected');
  });
});
