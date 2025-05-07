import winston, { format } from 'winston';
import moment from 'moment-timezone';
import path from 'path';
import fs from 'fs';
import { WINSTON_LOGGER_PARAMS } from '../../models/utils/winstonLogger.interface';
import type { EnvironmentStage } from '../environment/constants/environmentFilePaths';

export default class WinstonLoggerFactory {
  /**
   * Creates a custom log format using winston's format.printf()
   * @returns {winston.Logform.Format} A winston format object
   */
  public static logCustomFormat() {
    try {
      // Custom log format
      const customFormat = winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}]: ${message}`;
      });
      return customFormat;
    } catch (error) {
      throw new Error(`Error creating custom log format: ${error}`);
    }
  }

  /**
   * Creates a custom timestamp format using winston's format.timestamp()
   * @returns {winston.Logform.Format} A winston format object
   */
  public static customTimestampFormat() {
    try {
      // Timestamp format in ISO 8601 with timezone
      const timestampFormat = winston.format.timestamp({
        format: () =>
          moment().tz(WINSTON_LOGGER_PARAMS.TIME_ZONE).format(WINSTON_LOGGER_PARAMS.DATE_FORMAT),
      });
      return timestampFormat;
    } catch (error) {
      throw new Error(`Error creating custom timestamp format: ${error}`);
    }
  }

  /**
   * Creates a winston transport for logging at the "info" level to a file.
   * @param timestampFormat - A winston format object for formatting timestamps
   * @param customFormat - A winston format object for formatting log messages
   * @param loggingDir - The directory where log files will be saved
   * @returns {winston.TransportInstance} A winston transport instance
   * @throws Will throw an error if the transport cannot be created
   */
  public static createInfoTransport(
    timestampFormat: winston.Logform.Format,
    customFormat: winston.Logform.Format,
    loggingDir: string,
  ) {
    try {
      return this.baseFileTransport(
        WINSTON_LOGGER_PARAMS.LOG_LEVEL_INFO,
        WINSTON_LOGGER_PARAMS.LOG_FILE_INFO,
        timestampFormat,
        customFormat,
        loggingDir,
      );
    } catch (error) {
      throw new Error(`Error creating info-level transport: ${error}`);
    }
  }

  /**
   * Creates a warn-level winston transport.
   * The transport will write log messages to a warn file in the specified logging directory.
   *
   * @param timestampFormat - The timestamp format to use for log messages.
   * @param customFormat - The custom log format to use for log messages.
   * @param loggingDir - The directory where the warn log file should be written.
   * @returns {winston.transports.FileTransportInstance} The created warn-level file transport.
   * @throws Will throw an error if there is an issue creating the warn-level transport.
   */
  public static createWarnTransport(
    timestampFormat: winston.Logform.Format,
    customFormat: winston.Logform.Format,
    loggingDir: string,
  ) {
    try {
      // Warn-level transport without date-based file naming
      return this.baseFileTransport(
        WINSTON_LOGGER_PARAMS.LOG_LEVEL_WARN,
        WINSTON_LOGGER_PARAMS.LOG_FILE_WARN,
        timestampFormat,
        customFormat,
        loggingDir,
      );
    } catch (error) {
      throw new Error(`Error creating warn-level transport: ${error}`);
    }
  }

  /**
   * Creates an error-level winston transport.
   * The transport writes log messages to an error file in the specified logging directory.
   *
   * @param timestampFormat - The timestamp format to use for log messages.
   * @param customFormat - The custom log format to use for log messages.
   * @param loggingDir - The directory where the error log file should be written.
   * @returns {winston.transports.FileTransportInstance} The created error-level file transport.
   * @throws Will throw an error if there is an issue creating the error-level transport.
   */
  public static createErrorTransport(
    timestampFormat: winston.Logform.Format,
    customFormat: winston.Logform.Format,
    loggingDir: string,
  ) {
    try {
      return this.baseFileTransport(
        WINSTON_LOGGER_PARAMS.LOG_LEVEL_ERROR,
        WINSTON_LOGGER_PARAMS.LOG_FILE_ERROR,
        timestampFormat,
        customFormat,
        loggingDir,
      );
    } catch (error) {
      throw new Error(`Error creating error-level transport: ${error}`);
    }
  }

  /**
   * Creates a debug-level winston transport.
   * The transport will write log messages to a debug file in the specified logging directory.
   *
   * @param timestampFormat - The timestamp format to use for log messages.
   * @param customFormat - The custom log format to use for log messages.
   * @param loggingDir - The directory where the debug log file should be written.
   * @returns {winston.transports.FileTransportInstance} The created debug-level file transport.
   * @throws Will throw an error if there is an issue creating the debug-level transport.
   */
  public static createDebugTransport(
    timestampFormat: winston.Logform.Format,
    customFormat: winston.Logform.Format,
    loggingDir: string,
  ) {
    try {
      return this.baseFileTransport(
        WINSTON_LOGGER_PARAMS.LOG_LEVEL_DEBUG,
        WINSTON_LOGGER_PARAMS.LOG_FILE_DEBUG,
        timestampFormat,
        customFormat,
        loggingDir,
      );
    } catch (error) {
      throw new Error(`Error creating debug-level transport: ${error}`);
    }
  }

  /**
   * Creates a console-level winston transport.
   * The transport will log messages to the console at a level determined by the environment.
   * The transport will log messages at the specified log levels for the respective environments:
   * - In production, the transport will log messages at the error level.
   * - In user acceptance testing (UAT), the transport will log messages at the info level.
   * - In development, the transport will log messages at the debug level.
   * @param timestampFormat - The timestamp format to use for log messages.
   * @param customFormat - The custom log format to use for log messages.
   * @returns {winston.transports.ConsoleTransportInstance} The created console-level file transport.
   * @throws Will throw an error if there is an issue creating the console-level transport.
   */
  public static createConsoleTransport(
    timestampFormat: winston.Logform.Format,
    customFormat: winston.Logform.Format,
  ) {
    try {
      // Determine log level based on environment
      const environment = (process.env.ENV as EnvironmentStage) || 'dev';
      const consoleLevel =
        environment === 'prod'
          ? WINSTON_LOGGER_PARAMS.LOG_LEVEL_ERROR
          : environment === 'uat'
            ? WINSTON_LOGGER_PARAMS.LOG_LEVEL_INFO
            : WINSTON_LOGGER_PARAMS.LOG_LEVEL_DEBUG;

      // Console transport
      const consoleTransport = new winston.transports.Console({
        level: consoleLevel,
        format: winston.format.combine(timestampFormat, winston.format.colorize(), customFormat),
      });

      return consoleTransport;
    } catch (error) {
      throw new Error(`Error creating console-level transport: ${error}`);
    }
  }

  /**
   * Creates a winston logger with multiple transports.
   * The logger will log messages to an info-level file, an error-level file, a debug-level file, and the console.
   * The logger will also log messages at the specified log levels.
   *
   * @param createInfoTransport - The transport to use for logging info messages.
   * @param createErrorTransport - The transport to use for logging error messages.
   * @param createDebugTransport - The transport to use for logging debug messages.
   * @param createConsoleTransport - The transport to use for logging messages to the console.
   * @returns {winston.Logger} The created logger.
   */
  public static createLogger(
    createInfoTransport: winston.transports.FileTransportInstance,
    createErrorTransport: winston.transports.FileTransportInstance,
    createWarnTransport: winston.transports.FileTransportInstance,
    createDebugTransport: winston.transports.FileTransportInstance,
    createConsoleTransport: winston.transports.ConsoleTransportInstance,
  ) {
    try {
      // Create the logger with both transports
      const instance = winston.createLogger({
        transports: [
          createInfoTransport,
          createErrorTransport,
          createWarnTransport,
          createDebugTransport,
          createConsoleTransport,
        ],
      });
      return instance;
    } catch (error) {
      throw new Error(`Error creating logger: ${error}`);
    }
  }

  /**
   * Creates a file transport with the specified log level and formats.
   * The transport will write log messages to the file at the given path.
   *
   * @param level - The log level to write messages at (e.g., 'info', 'error').
   * @param filePath - The name of the file to write log messages to.
   * @param timestampFormat - The timestamp format to use for log messages.
   * @param customFormat - The custom log format to use for log messages.
   * @param loggingDir - The directory where log files should be written.
   * @returns {winston.Transport} The created file transport.
   */
  private static baseFileTransport(
    level: string,
    filePath: string,
    timestampFormat: winston.Logform.Format,
    customFormat: winston.Logform.Format,
    loggingDir: string,
  ) {
    return new winston.transports.File({
      filename: this.resolvePath(loggingDir, filePath),
      maxsize: WINSTON_LOGGER_PARAMS.LOG_FILE_LIMIT as number,
      level,
      format: winston.format.combine(this.levelFilter(level), timestampFormat, customFormat),
    });
  }

  /**
   * Resolves a file path by combining the given directory path and file name.
   * @param dirpath - The directory path to use for resolving the file path.
   * @param fileName - The file name to use for resolving the file path.
   * @returns {string} The resolved file path.
   * @throws Will throw an error if there is an issue resolving the file path.
   */
  public static resolvePath(dirpath: string, fileName: string) {
    try {
      return path.resolve(dirpath, fileName);
    } catch (error) {
      throw new Error(`Error resolving file path: ${error}`);
    }
  }

  /**
   * Ensures that a directory exists at the given path. If the directory does not exist, creates it.
   * If the directory already exists, does nothing.
   *
   * @param path - The file system path where the directory should exist.
   * @throws Will throw an error if there is an issue creating the directory.
   */
  public static ensureDirExists(path: string): void {
    try {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
    } catch (error) {
      throw new Error(`Error ensuring directory exists: ${error}`);
    }
  }

  /**
   * Creates a format function that filters log messages based on the specified level.
   * If the log message matches the level, it is returned unchanged. Otherwise, the
   * function returns false, which causes the log message to be ignored.
   *
   * @param level - The log level to filter on (e.g., 'info', 'error', 'warn', 'debug').
   * @returns {(info: winston.Logform.TransformableInfo) => boolean | winston.Logform.TransformableInfo} The format function that filters log messages.
   * @throws {Error} Will throw an error if there is an issue creating the format function.
   */
  private static levelFilter(level: string) {
    try {
      return format((info) => {
        return info.level === level ? info : false;
      })();
    } catch (error) {
      throw new Error(`Error occurred while filtering log level: ${error}`);
    }
  }
}
