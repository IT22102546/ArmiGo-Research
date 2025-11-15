"use client";

const isDevelopment = process.env.NODE_ENV === "development";

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
}

const config: LoggerConfig = {
  enableDebug: isDevelopment,
  enableInfo: isDevelopment,
  enableWarn: true,
  enableError: true,
};

class Logger {
  private context?: string;
  private static recentMessages = new Map<string, number>();

  constructor(context?: string) {
    this.context = context;
  }

  private formatMessage(
    level: string,
    message: string,
    ...args: any[]
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}]` : "";
    return `${timestamp} ${level} ${contextStr} ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (config.enableDebug) {
      console.debug(this.formatMessage("DEBUG", message), ...args);
    }
  }

  log(message: string, ...args: any[]): void {
    if (config.enableInfo) {
      console.log(this.formatMessage("INFO", message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (config.enableWarn) {
      console.warn(this.formatMessage("WARN", message), ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (config.enableError) {
      try {
        // Deduplicate identical errors within short timeframe
        const key = `${this.context || "default"}:${message}`;
        const lastTs = Logger.recentMessages.get(key) ?? 0;
        const now = Date.now();
        if (now - lastTs < 10_000) {
          // Skip duplicate error
          return;
        }
        Logger.recentMessages.set(key, now);

        // Suppress noisy network errors if present
        const messageLower = (message || "").toLowerCase();
        if (
          messageLower.includes("failed to fetch") ||
          messageLower.includes("network error")
        ) {
          // Only log at warn level for network issues
          console.warn(this.formatMessage("WARN", message), error, ...args);
          return;
        }

        console.error(this.formatMessage("ERROR", message), error, ...args);
      } catch (e) {
        // Fallback to default logging
        console.error(this.formatMessage("ERROR", message), error, ...args);
      }
    }
  }

  static create(context: string): Logger {
    return new Logger(context);
  }
}

// Default logger instance
export const logger = new Logger();

// Export class for creating contextual loggers
export { Logger };

// Convenience exports
export const createLogger = (context: string) => Logger.create(context);
