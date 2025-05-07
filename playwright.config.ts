import { defineConfig, devices } from '@playwright/test';
import { OrtoniReportConfig } from 'ortoni-report';
import AuthStorageManager from './src/utils/auth/storage/authStorageManager';
import BrowserInitFlag from './src/utils/environment/browserInitFlag';

// Path to the authentication state storage file
const authStorageFilePath = AuthStorageManager.resolveAuthStateFilePath();

// Performance optimization: Skip browser initialization for crypto and database operations
const shouldSkipBrowserInit = BrowserInitFlag.shouldSkipBrowserInit();

// Operation timeout configurations (in milliseconds)
// CI environments use longer timeouts to accommodate potential resource constraints
const TIMEOUTS = {
  test: process.env.CI ? 120_000 : 60_000, // Test execution timeout
  expect: process.env.CI ? 120_000 : 60_000, // Assertion wait timeout
  action: process.env.CI ? 80_000 : 40_000, // User action timeout
  navigation: process.env.CI ? 50_000 : 25_000, // Page navigation timeout
};

const reportConfig: OrtoniReportConfig = {
  open: process.env.CI ? 'never' : 'always',
  folderPath: 'ortoni-report',
  filename: 'index.html',
  logo: './src/logo/orangehrm-logo.png',
  title: 'Orange HRM Test Report',
  showProject: false,
  projectName: 'Orange-HRM-Automation',
  testType: process.env.TEST_TYPE || 'Regression | Sanity',
  authorName: 'Tshifhiwa Sinugo',
  base64Image: false,
  stdIO: false,
  preferredTheme: 'dark',
  meta: {
    project: 'orangehrm-automation-framework',
    description: 'Framework for validating Orange HRM UI and workflows',
    platform: process.env.TEST_PLATFORM || 'Windows',
    environment: process.env.ENV || 'QA',
  },
};

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: TIMEOUTS.test,
  expect: {
    timeout: TIMEOUTS.expect,
  },
  testDir: './tests',
  globalSetup: './src/config/environment/global/globalSetup.ts',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'results.xml' }],
        ['dot'],
        ['playwright-trx-reporter', { outputFile: 'results.trx' }],
      ]
    : [
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'results.xml' }],
        ['dot'],
        ['ortoni-report', reportConfig],
        ['allure-playwright'],
      ],
  grep:
    typeof process.env.PLAYWRIGHT_GREP === 'string'
      ? new RegExp(process.env.PLAYWRIGHT_GREP)
      : process.env.PLAYWRIGHT_GREP || /.*/,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /*
     *Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
     * Taking screenshot and videos during test execution
     * Maximum time each action such as click() can take. Defaults to 0 (no limit).
     * Maximum time the page can wait for actions such as waitForSelector(). Defaults to 0 (no limit).
     */
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
    actionTimeout: TIMEOUTS.action,
    navigationTimeout: TIMEOUTS.navigation,
  },

  /* Configure projects for major browsers */
  projects: [
    /*
     * Project configuration with conditional browser setup:
     *
     * 1. When shouldSkipBrowserInit is FALSE (normal mode):
     *    - We include the "setup" project that handles browser initialization
     *    - The "setup" project runs tests matching the *.setup.ts pattern
     *    - The "chromium" project depends on "setup" to ensure proper sequencing
     *    - This ensures authentication is properly established before tests run
     *
     * 2. When shouldSkipBrowserInit is TRUE (performance optimization):
     *    - We completely skip the "setup" project (empty array is spread)
     *    - The "chromium" project has no dependencies (empty dependencies array)
     *    - This optimization is useful for operations that don't need browser context
     *      like crypto or database-only operations
     *
     * In both cases, the "chromium" project uses the authentication state from
     * the file path specified in authStorageFilePath.
     */
    ...(!shouldSkipBrowserInit
      ? [
          {
            name: 'setup',
            use: { ...devices['Desktop Chrome'] },
            testMatch: /.*\.setup\.ts/,
          },
        ]
      : []),
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStorageFilePath, // Use the authentication state file path
      },
      dependencies: shouldSkipBrowserInit ? [] : ['setup'], // If browser init should be skipped, don't depend on "setup"
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: authStorageFilePath },
      dependencies: shouldSkipBrowserInit ? [] : ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: authStorageFilePath },
      dependencies: shouldSkipBrowserInit ? [] : ['setup'],
    },
    // {
    //   name: 'chromium',
    //   use: { ...devices['Desktop Chrome'] },
    // },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
