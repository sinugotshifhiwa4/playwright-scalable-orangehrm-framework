import { test as baseTest } from '@playwright/test';

import { EnvironmentFileManager } from '../src/cryptography/utils/environmentFileManager';
import { EncryptionServiceUtils } from '../src/cryptography/utils/encryptionServiceUtils';
import { EnvironmentEncryptionManager } from '../src/cryptography/services/environmentEncryptionManager';

// Add global annotations
baseTest.beforeAll(async () => {
  baseTest.info().annotations.push({
    type: 'Start',
    description: 'Encryption Test Suite Execution Started',
  });
});

baseTest.afterAll(async () => {
  baseTest.info().annotations.push({
    type: 'End',
    description: 'Encryption Test Suite Execution Completed',
  });
});

type customFixtures = {
  environmentFileManager: EnvironmentFileManager;
  encryptionServiceUtils: EncryptionServiceUtils;
  environmentEncryptionManager: EnvironmentEncryptionManager;
};

export const cryptoFixtures = baseTest.extend<customFixtures>({
  environmentFileManager: async ({}, use) => {
    await use(new EnvironmentFileManager());
  },
  encryptionServiceUtils: async ({ environmentFileManager }, use) => {
    await use(new EncryptionServiceUtils(environmentFileManager));
  },
  environmentEncryptionManager: async ({ encryptionServiceUtils }, use) => {
    await use(new EnvironmentEncryptionManager(encryptionServiceUtils));
  },
});

export const test = cryptoFixtures;
export const expect = baseTest.expect;
