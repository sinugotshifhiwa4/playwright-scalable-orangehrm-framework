import winston from 'winston';
import WinstonLoggerFactory from './winstonLoggerFactory';
import { WINSTON_LOGGER_PARAMS } from '../../models/utils/winstonLogger.interface';

class LoggerManager extends WinstonLoggerFactory {
  // The logger instance
  public static instance: winston.Logger;

  /**
   * Initializes the winston logger with the parent class's constructor.
   * The parent class's constructor sets up the logger with the custom log format.
   */
  constructor() {
    super();
  }

  /**
   * Retrieves the singleton instance of the winston logger.
   * If the logger instance does not exist, it initializes the logger.
   *
   * @returns {winston.Logger} The winston logger instance.
   * @throws Will log and throw an error if the logger cannot be retrieved.
   */
  public static getLogger(): winston.Logger {
    try {
      if (!this.instance) {
        this.initializeLogger();
      }
      return this.instance;
    } catch (error) {
      throw new Error(`Error getting logger: ${error}`);
    }
  }

  /**
   * Initializes the winston logger instance if it does not exist.
   * Creates a logger with four transports: info, error, debug, and console.
   * The logger will write log messages to files in the logging directory
   * specified in WinstonLoggerConfig.DIR_PATH.
   *
   * @throws Will log and throw an error if the logger cannot be initialized.
   */
  private static initializeLogger(): void {
    try {
      const loggerDir = this.resolvePath(process.cwd(), WINSTON_LOGGER_PARAMS.LOG_DIR);

      // Ensure Dir exists
      this.ensureDirExists(loggerDir);

      // Create custom log format
      const customFormat = this.logCustomFormat();

      // Create Timestamp format
      const timestampFormat = this.customTimestampFormat();

      // Create Info transport
      const infoTransport = this.createInfoTransport(timestampFormat, customFormat, loggerDir);

      // Create Error transport
      const errorTransport = this.createErrorTransport(timestampFormat, customFormat, loggerDir);

      // Create Warn transport
      const warnTransport = this.createWarnTransport(timestampFormat, customFormat, loggerDir);

      // Create Debug transport
      const debugTransport = this.createDebugTransport(timestampFormat, customFormat, loggerDir);

      // Create consoleTransport
      const consoleTransport = this.createConsoleTransport(timestampFormat, customFormat);

      // Create Logger with transports
      this.instance = this.createLogger(
        infoTransport,
        errorTransport,
        warnTransport,
        debugTransport,
        consoleTransport,
      );
    } catch (error) {
      throw new Error(`Error initializing logger: ${error}`);
    }
  }
}

// Export the logger instance
export default LoggerManager.getLogger();
