import fs from 'fs';
import path from 'path';
import { FileEncoding } from '../models/utils/fileEncoding.enum';
import ErrorHandler from '../utils/errors/errorHandler';
import logger from './logging/loggerManager';

export default class FileManager {
  // Asynchronous Methods
  public static async writeFile(
    filePath: string,
    content: string,
    keyName: string,
    encoding: FileEncoding = FileEncoding.UTF8,
  ): Promise<void> {
    this.validatePath(filePath, 'filePath');

    if (!content) {
      logger.warn(`No content provided for file: ${keyName}`);
      throw new Error(`No content provided for file: ${keyName}`);
    }

    try {
      const dirPath = path.dirname(filePath);
      await this.ensureDirectoryExists(dirPath);
      await fs.promises.writeFile(filePath, content, { encoding });
    } catch (error) {
      ErrorHandler.captureError(error, 'writeFile', `Failed to write file: ${filePath}`);
      throw error;
    }
  }

  public static async readFile(
    filePath: string,
    encoding: FileEncoding = FileEncoding.UTF8,
  ): Promise<string> {
    this.validatePath(filePath, 'filePath');

    try {
      const content = await fs.promises.readFile(filePath, { encoding });
      logger.debug(`Successfully loaded file: ${this.getRelativePath(filePath)}`);
      return content.toString();
    } catch (error) {
      ErrorHandler.captureError(error, 'readFile', `Failed to read file: ${filePath}`);
      throw error;
    }
  }

  public static async doesDirectoryExist(dirPath: string): Promise<boolean> {
    this.validatePath(dirPath, 'dirPath');

    try {
      const stats = await fs.promises.stat(dirPath);
      return stats.isDirectory();
    } catch {
      const relativePath = path.relative(process.cwd(), dirPath);
      logger.warn(`Directory does not exist: ${relativePath}`);
      return false;
    }
  }

  public static async doesFileExist(filePath: string): Promise<boolean> {
    this.validatePath(filePath, 'filePath');

    try {
      const stats = await fs.promises.stat(filePath);
      return stats.isFile();
    } catch {
      const baseName = path.basename(filePath);
      logger.warn(`File does not exist: ${baseName}`);
      return false;
    }
  }

  public static async ensureDirectoryExists(dirPath: string): Promise<void> {
    this.validatePath(dirPath, 'dirPath');

    try {
      // Always attempt to create the directory, even in CI
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'ensureDirectoryExists',
        `Failed to create directory: ${dirPath}`,
      );
    }
  }

  public static async ensureFileExists(filePath: string): Promise<void> {
    this.validatePath(filePath, 'filePath');

    try {
      const dirPath = path.dirname(filePath);
      await this.ensureDirectoryExists(dirPath);
      const fileHandle = await fs.promises.open(filePath, 'a');
      await fileHandle.close();
    } catch (error) {
      ErrorHandler.captureError(error, 'ensureFileExists', `Failed to create file: ${filePath}`);
    }
  }

  public static async isDirectory(path: string): Promise<boolean> {
    this.validatePath(path, 'path');

    try {
      const stats = await fs.promises.stat(path);
      return stats.isDirectory();
    } catch {
      logger.warn(`Path does not exist: ${path}`);
      return false;
    }
  }

  public static async listFiles(dirPath: string): Promise<string[]> {
    this.validatePath(dirPath, 'dirPath');

    try {
      const files = await fs.promises.readdir(dirPath);
      return files;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'listFiles',
        `Failed to list files in directory: ${dirPath}`,
      );
      throw error;
    }
  }

  public static async removeFile(filePath: string): Promise<boolean> {
    this.validatePath(filePath, 'filePath');

    try {
      await fs.promises.unlink(filePath);
      logger.debug(`Removed file: ${this.getRelativePath(filePath)}`);
      return true;
    } catch (error) {
      ErrorHandler.captureError(error, 'removeFile', `Failed to remove file: ${filePath}`);
      throw error;
    }
  }

  public static async removeDirectory(dirPath: string): Promise<void> {
    this.validatePath(dirPath, 'dirPath');

    try {
      await fs.promises.rm(dirPath, { recursive: true, force: true });
      logger.debug(`Removed directory: ${this.getRelativePath(dirPath)}`);
    } catch (error) {
      ErrorHandler.captureError(error, 'removeDirectory', `Failed to remove directory: ${dirPath}`);
    }
  }

  // Synchronous Methods
  public static doesDirectoryExistSync(dirPath: string): boolean {
    this.validatePath(dirPath, 'dirPath');

    try {
      const stats = fs.statSync(dirPath);
      return stats.isDirectory();
    } catch {
      const relativePath = path.relative(process.cwd(), dirPath);
      logger.warn(`Directory does not exist: ${relativePath}`);
      return false;
    }
  }

  public static doesFileExistSync(filePath: string): boolean {
    this.validatePath(filePath, 'filePath');

    try {
      const stats = fs.statSync(filePath);
      return stats.isFile();
    } catch {
      const baseName = path.basename(filePath);
      logger.warn(`File does not exist: ${baseName}`);
      return false;
    }
  }

  public static ensureDirectoryExistsSync(dirPath: string): void {
    this.validatePath(dirPath, 'dirPath');

    try {
      // Always attempt to create the directory, even in CI
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'ensureDirectoryExistsSync',
        `Failed to create directory: ${dirPath}`,
      );
    }
  }

  public static ensureFileExistsSync(filePath: string): void {
    this.validatePath(filePath, 'filePath');

    try {
      const dirPath = path.dirname(filePath);
      this.ensureDirectoryExistsSync(dirPath);
      fs.writeFileSync(filePath, '', { encoding: FileEncoding.UTF8, flag: 'a' });
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'ensureFileExistsSync',
        `Failed to create file: ${filePath}`,
      );
    }
  }

  public static isDirectorySync(path: string): boolean {
    this.validatePath(path, 'path');

    try {
      const stats = fs.statSync(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  public static removeFileSync(filePath: string): boolean {
    this.validatePath(filePath, 'filePath');

    try {
      fs.unlinkSync(filePath);
      logger.debug(`Removed file: ${this.getRelativePath(filePath)}`);
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        logger.warn(`File does not exist for removal: ${filePath}`);
        return false;
      }

      ErrorHandler.captureError(error, 'removeFileSync', `Failed to remove file: ${filePath}`);
      throw error;
    }
  }

  // Utility Methods
  public static getDirPath(dirPath: string): string {
    try {
      this.validatePath(dirPath, 'dirPath');
      return path.resolve(process.cwd(), dirPath);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'getDirPath',
        `Failed to resolve directory path: ${dirPath}`,
      );
      throw error;
    }
  }

  public static getFilePath(dirPath: string, fileName: string): string {
    try {
      this.validatePath(dirPath, 'dirPath');
      this.validatePath(fileName, 'fileName');

      const fullDirPath = this.getDirPath(dirPath);
      return path.join(fullDirPath, fileName);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        'getFilePath',
        `Failed to construct file path for dirPath: '${dirPath}', fileName: '${fileName}'`,
      );
      throw error;
    }
  }

  public static getRelativePath(absolutePath: string): string {
    return path.relative(process.cwd(), absolutePath);
  }

  private static validatePath(filePath: string, paramName: string): void {
    if (!filePath) {
      const message = `Invalid arguments: '${paramName}' is required.`;
      ErrorHandler.logAndThrow(message, 'validatePath');
    }

    if (paramName === 'filePath' && (filePath.endsWith('/') || filePath.endsWith('\\'))) {
      const message = `Invalid file path: '${filePath}' cannot end with a directory separator.`;
      ErrorHandler.logAndThrow(message, 'validatePath');
    }
  }
}
