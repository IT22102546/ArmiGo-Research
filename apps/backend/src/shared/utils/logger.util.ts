import { Logger } from "@nestjs/common";

/** AppLogger: structured logging utility with context support. */
export class AppLogger {
  private logger: Logger;
  private context: string;

  constructor(context: string) {
    this.context = context;
    this.logger = new Logger(context);
  }

  /**
   * Log informational messages
   */
  log(message: string, data?: any): void {
    if (data) {
      this.logger.log(`${message} ${JSON.stringify(data)}`);
    } else {
      this.logger.log(message);
    }
  }

  /**
   * Log error messages
   */
  error(message: string, trace?: string, data?: any): void {
    if (data) {
      this.logger.error(`${message} ${JSON.stringify(data)}`, trace);
    } else {
      this.logger.error(message, trace);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any): void {
    if (data) {
      this.logger.warn(`${message} ${JSON.stringify(data)}`);
    } else {
      this.logger.warn(message);
    }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV !== "production") {
      if (data) {
        this.logger.debug(`${message} ${JSON.stringify(data)}`);
      } else {
        this.logger.debug(message);
      }
    }
  }

  /**
   * Log verbose messages
   */
  verbose(message: string, data?: any): void {
    if (data) {
      this.logger.verbose(`${message} ${JSON.stringify(data)}`);
    } else {
      this.logger.verbose(message);
    }
  }
}

/**
 * Factory function to create logger instances
 */
export function createLogger(context: string): AppLogger {
  return new AppLogger(context);
}

/**
 * Default logger instance
 */
export const logger = new AppLogger("Application");
