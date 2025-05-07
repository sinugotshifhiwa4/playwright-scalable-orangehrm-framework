import { test } from '../../fixtures/crypto.fixture';
import * as environmentFilePaths from '../../src/utils/environment/constants/environmentFilePaths';
import ENV from '../../src/utils/environment/constants/environmentVariables';
import logger from '../../src/utils/logging/loggerManager';

test.describe('Encryption Flow', () => {
  test('Generate Secret Key @generate-key', async ({ environmentEncryptionManager }) => {
    await environmentEncryptionManager.createAndSaveSecretKey(
      environmentFilePaths.EnvironmentSecretKeys.UAT,
    );
    logger.info('Secret key generation completed successfully.');
  });

  test('Encrypt Credentials @encrypt', async ({ environmentEncryptionManager }) => {
    // Variables to encrypt
    const VARIABLES_TO_ENCRYPT = [ENV.PORTAL_USERNAME, ENV.PORTAL_PASSWORD];

    await environmentEncryptionManager.encryptEnvironmentVariables(
      environmentFilePaths.EnvironmentFilePaths.uat,
      environmentFilePaths.EnvironmentSecretKeys.UAT,
      VARIABLES_TO_ENCRYPT,
    );

    logger.info('Encryption process completed successfully.');
  });
});
