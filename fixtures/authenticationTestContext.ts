import EnvironmentDetector from '../src/config/environmentDetector';
import { EnvironmentResolver } from '../src/config/environment/resolver/environmentResolver';
import { LoginPage } from '../src/ui/pages/loginPage';
import { SideMenuPage } from '../src/ui/pages/sideMenuPage';
import ErrorHandler from '../src/utils/errors/errorHandler';
import logger from '../src/utils/logging/loggerManager';

export class AuthenticationTestContext {
  private readonly environmentResolver: EnvironmentResolver;
  private readonly loginPage: LoginPage;
  private readonly sideMenuPage: SideMenuPage;

  constructor(
    environmentResolver: EnvironmentResolver,
    loginPage: LoginPage,
    sideMenuPage: SideMenuPage,
  ) {
    this.environmentResolver = environmentResolver;
    this.loginPage = loginPage;
    this.sideMenuPage = sideMenuPage;
  }

  async navigateToPortal() {
    try {
      EnvironmentDetector.isRunningInCI();
      const portalBaseUrl = await this.environmentResolver.getPortalBaseUrl();
      await this.loginPage.navigateToUrl(portalBaseUrl);
    } catch (error) {
      ErrorHandler.captureError(error, 'navigateToPortal', 'Failed to navigate to portal');
      throw error;
    }
  }

  /**
   * Configures the login state of the portal based on the given options
   * @param {boolean} [requireAuthentication=true] Whether to require authentication to be configured
   * @param {boolean} [requireAuthenticationState=true] Whether to require authentication state to be configured
   * @returns {Promise<void>}
   */
  async configureLoginState(requireAuthentication = true, requireAuthenticationState = true) {
    try {
      // Check if user is already authenticated
      if (requireAuthenticationState && (await this.isUserAuthenticated())) {
        return;
      }

      await this.navigateToPortal();
      await this.loginPage.verifyOrangeHrmLogoIsVisible();

      if (requireAuthentication) {
        const { username, password } = await this.environmentResolver.getCredentials();
        await this.loginPage.loginToPortal(username, password);

        await this.loginPage.verifyErrorMessageHidden();
        await this.sideMenuPage.verifyDashboardMenuIsVisible();
      }
    } catch (error) {
      ErrorHandler.captureError(error, 'configureLoginState', 'Failed to configure login state');
      throw error;
    }
  }

  async isUserAuthenticated(): Promise<boolean> {
    try {
      const isAuthenticated = await this.sideMenuPage.isDashboardMenuVisible();
      logger.info(`User ${isAuthenticated ? 'authenticated' : 'not authenticated'}`);
      return isAuthenticated;
    } catch (error) {
      logger.warn('[Auth] Error checking authentication status', error);
      return false;
    }
  }
}
