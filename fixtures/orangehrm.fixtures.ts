import { test as baseTest, TestInfo } from '@playwright/test';

import AuthStorageManager from '../src/utils/auth/storage/authStorageManager';
import { EnvironmentResolver } from '../src/config/environment/resolver/environmentResolver';
import { FetchCIEnvironmentVariables } from '../src/config/environment/resolver/fetchCIEnvironmentVariables';
import { FetchLocalEnvironmentVariables } from '../src/config/environment/resolver/fetchLocalEnvironmentVariables';
import FileManager from '../src/utils/fileManager';
import { BrowserSessionManager } from '../src/utils/auth/state/browserSessionManager';
import { AuthenticationTestContext  } from './authenticationTestContext';
import logger from '../src/utils/logging/loggerManager';


import { LoginPage } from '../src/ui/pages/loginPage';
import { SideMenuPage } from '../src/ui/pages/sideMenuPage';
import { TopMenuPage } from '../src/ui/pages/topMenuPage';


type OrangeHrmFixtures = {
      // Config
  requireAuthentication: boolean;
  requireAuthenticationState: boolean;
  authenticationTestContext : AuthenticationTestContext ;
  browserSessionManager: BrowserSessionManager;

  // Common
  environmentResolver: EnvironmentResolver;
  fetchCIEnvironmentVariables: FetchCIEnvironmentVariables;
  fetchLocalEnvironmentVariables: FetchLocalEnvironmentVariables;
  testInfo: TestInfo;


  // UI
  loginPage: LoginPage;
  sideMenuPage: SideMenuPage;
  topMenuPage: TopMenuPage;

}

const orangeHrmTests = baseTest.extend<OrangeHrmFixtures>({
     // Config
  requireAuthentication: [true, { option: true }],
  requireAuthenticationState: [true, { option: true }],

  authenticationTestContext: async ({ environmentResolver, loginPage, sideMenuPage }, use) => {
    await use(new AuthenticationTestContext(environmentResolver, loginPage, sideMenuPage));
  },
  browserSessionManager: async ({ page }, use) => {
    await use(new BrowserSessionManager(page));
  },

  // Common
  fetchCIEnvironmentVariables: async ({}, use) => {
    await use(new FetchCIEnvironmentVariables());
  },
  fetchLocalEnvironmentVariables: async ({}, use) => {
    await use(new FetchLocalEnvironmentVariables());
  },
  environmentResolver: async (
    { fetchCIEnvironmentVariables, fetchLocalEnvironmentVariables },
    use,
  ) => {
    await use(new EnvironmentResolver(fetchCIEnvironmentVariables, fetchLocalEnvironmentVariables));
  },
  testInfo: async ({}, use) => {
    await use(baseTest.info());
  },


  // UI

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  sideMenuPage: async ({ page }, use) => {
    await use(new SideMenuPage(page));
  },
  topMenuPage: async ({ page }, use) => {
    await use(new TopMenuPage(page));
  },

  /**
   * Creates a new context with the stored authentication state if required.
   * @remarks
   * If `requireAuthentication` is true, it will check if the authentication state file exists
   * at the path specified by `AuthStorageManager#resolveAuthStateFilePath()`. If the file exists,
   * it will use the authentication state from the file. Otherwise, it will log a warning message
   * and use an empty authentication state.
   * @param browser - The browser instance to create a new context from
   * @param requireAuthentication - Whether to require authentication state to be configured
   * @param use - The callback to invoke with the created context
   */
  context: async ({ browser, requireAuthentication }, use) => {
    let storageState: string | undefined;

    if (requireAuthentication) {
      const storagePath = AuthStorageManager.resolveAuthStateFilePath();
      const fileExists = FileManager.doesFileExistSync(storagePath);

      if (fileExists) {
        storageState = storagePath;
      } else {
        logger.warn(`Authentication state file not found at: ${storagePath}`);
        storageState = undefined;
      }
    }

    const context = await browser.newContext({ storageState });
    await use(context);
  },


});


export const test = orangeHrmTests;
export const expect = baseTest.expect;
