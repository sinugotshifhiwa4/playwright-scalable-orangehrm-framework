export default class EnvironmentDetector {
  /**
   * Checks if the current test run is being executed in a CI environment.
   *
   * Checks for the presence of a variety of standard CI variables, such as
   * `CI`, `GITHUB_ACTIONS`, `GITLAB_CI`, `TRAVIS`, `CIRCLECI`, `JENKINS_URL`,
   * and `BITBUCKET_BUILD_NUMBER`. If any of these variables are present,
   * then the function returns `true`, indicating that the tests are running in
   * a CI environment. Otherwise, it returns `false`.
   *
   * @returns {boolean} `true` if the tests are running in a CI environment, `false` otherwise
   */
  public static isRunningInCI(): boolean {
    return !!(
      process.env.CI || // Standard CI variable
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.TRAVIS ||
      process.env.CIRCLECI ||
      process.env.JENKINS_URL ||
      process.env.BITBUCKET_BUILD_NUMBER
    );
  }
}
