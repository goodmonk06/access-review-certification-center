import { randomUUID } from 'crypto';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  action?: string;
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private context: LogContext = {};

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  getCorrelationId(): string {
    if (!this.context.correlationId) {
      this.context.correlationId = randomUUID();
    }
    return this.context.correlationId as string;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...meta,
    };

    // In production, send to logging service (e.g., Winston, Pino, DataDog)
    if (process.env.NODE_ENV === 'test') {
      return; // Suppress logs in tests
    }

    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(output);
        }
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
    const errorMeta = error instanceof Error
      ? { error: { message: error.message, stack: error.stack } }
      : { error };

    this.log('error', message, { ...errorMeta, ...meta });
  }
}

export const logger = new Logger();
