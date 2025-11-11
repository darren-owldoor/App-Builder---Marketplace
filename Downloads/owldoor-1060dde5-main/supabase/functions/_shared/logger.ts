// Structured logging utility for edge functions
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
  [key: string]: any;
}

export class Logger {
  private context: LogContext;
  
  constructor(context: LogContext = {}) {
    this.context = {
      ...context,
      requestId: context.requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const logEntry = {
      level,
      message,
      ...this.context,
      ...(data && { data }),
      timestamp: new Date().toISOString(),
    };

    // Use appropriate console method
    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'debug':
        console.debug(JSON.stringify(logEntry));
        break;
      default:
        console.log(JSON.stringify(logEntry));
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    const errorData = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack,
          name: error.name 
        }
      : error;
    this.log('error', message, errorData);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  // Track request/response
  request(method: string, path: string, headers?: any) {
    this.info('Incoming request', {
      method,
      path,
      headers: this.sanitizeHeaders(headers),
    });
  }

  response(statusCode: number, duration: number, body?: any) {
    this.info('Outgoing response', {
      statusCode,
      duration,
      bodySize: body ? JSON.stringify(body).length : 0,
    });
  }

  // Sanitize sensitive headers
  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};
    
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];
    const sanitized = { ...headers };
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  // Create child logger with additional context
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }
}
