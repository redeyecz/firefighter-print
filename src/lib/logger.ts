/**
 * Logging Utility
 * Provides structured logging with levels, context, and correlation IDs
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogContext {
  jobId?: string;
  step?: string;
  userId?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * In-memory log store (last 1000 entries)
 * In production, this would be replaced with file storage or log aggregation
 */
const LOG_STORE: LogEntry[] = [];
const MAX_LOG_ENTRIES = 1000;

/**
 * Current log level threshold
 */
let currentLogLevel: LogLevel = LogLevel.INFO;

/**
 * Log level priority for filtering
 */
const LOG_LEVEL_PRIORITY = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Sets the minimum log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Checks if a log level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

/**
 * Adds a log entry to the store
 */
function addToStore(entry: LogEntry): void {
  LOG_STORE.push(entry);
  if (LOG_STORE.length > MAX_LOG_ENTRIES) {
    LOG_STORE.shift(); // Remove oldest entry
  }
}

/**
 * Formats log entry for console output
 */
function formatForConsole(entry: LogEntry): string {
  const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`, entry.message];

  if (entry.context && Object.keys(entry.context).length > 0) {
    parts.push(JSON.stringify(entry.context));
  }

  if (entry.error) {
    parts.push(`Error: ${entry.error.message}`);
    if (entry.error.stack) {
      parts.push(`\n${entry.error.stack}`);
    }
  }

  return parts.join(" ");
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    ...(error && {
      error: {
        message: error.message,
        stack: error.stack,
      },
    }),
  };

  // Add to in-memory store
  addToStore(entry);

  // Output to console
  const formatted = formatForConsole(entry);
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formatted);
      break;
    case LogLevel.INFO:
      console.info(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted);
      break;
    case LogLevel.ERROR:
      console.error(formatted);
      break;
  }
}

/**
 * Logger class with fluent interface
 */
export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Creates a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Logs a debug message
   */
  debug(message: string, context?: LogContext): void {
    log(LogLevel.DEBUG, message, { ...this.context, ...context });
  }

  /**
   * Logs an info message
   */
  info(message: string, context?: LogContext): void {
    log(LogLevel.INFO, message, { ...this.context, ...context });
  }

  /**
   * Logs a warning message
   */
  warn(message: string, context?: LogContext): void {
    log(LogLevel.WARN, message, { ...this.context, ...context });
  }

  /**
   * Logs an error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    log(LogLevel.ERROR, message, { ...this.context, ...context }, error);
  }

  /**
   * Logs job processing step
   */
  logJobStep(step: string, message: string, duration?: number): void {
    this.info(message, { step, duration });
  }

  /**
   * Logs job start
   */
  logJobStart(jobId: string): void {
    this.info("Job processing started", { jobId, step: "start" });
  }

  /**
   * Logs job completion
   */
  logJobComplete(jobId: string, duration: number): void {
    this.info("Job processing completed", { jobId, step: "complete", duration });
  }

  /**
   * Logs job failure
   */
  logJobFailure(jobId: string, error: Error, step?: string): void {
    this.error("Job processing failed", error, { jobId, step });
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Gets all log entries (for API access)
 */
export function getLogEntries(limit?: number, level?: LogLevel, jobId?: string): LogEntry[] {
  let entries = [...LOG_STORE];

  // Filter by level
  if (level) {
    entries = entries.filter((e) => e.level === level);
  }

  // Filter by jobId
  if (jobId) {
    entries = entries.filter((e) => e.context?.jobId === jobId);
  }

  // Apply limit
  if (limit) {
    entries = entries.slice(-limit);
  }

  // Return newest first
  return entries.reverse();
}

/**
 * Clears all log entries (for testing)
 */
export function clearLogs(): void {
  LOG_STORE.length = 0;
}

/**
 * Performance measurement helper
 */
export function measurePerformance<T>(
  logger: Logger,
  step: string,
  fn: () => T | Promise<T>
): Promise<T> {
  return (async () => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      logger.logJobStep(step, `${step} completed`, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`${step} failed`, error as Error, { step, duration });
      throw error;
    }
  })();
}
