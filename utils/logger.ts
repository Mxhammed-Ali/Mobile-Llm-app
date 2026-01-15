/**
 * Logger utility for storing and displaying logs in the app
 */

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private consoleIntercepted = false;
  private isEmitting = false;

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addLog(level: LogEntry['level'], message: string, data?: any) {
    if (this.isEmitting) {
      // Prevent re-entrancy
      return;
    }
    this.isEmitting = true;

    const log: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    this.logs.push(log);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(this.logs));

    // Also log to console for development (only when not intercepting)
    if (!this.consoleIntercepted) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || '');
    }

    this.isEmitting = false;
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data);
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data);
  }

  debug(message: string, data?: any) {
    this.addLog('debug', message, data);
  }

  success(message: string, data?: any) {
    this.addLog('success', message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.listeners.forEach(listener => listener(this.logs));
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Format logs for display
  formatLogs(): string {
    return this.logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : '';
      return `[${time}] [${log.level.toUpperCase()}] ${log.message}${dataStr}`;
    }).join('\n');
  }

  // Intercept global console to mirror into logger
  attachConsoleInterceptor() {
    if (this.consoleIntercepted) return;
    try {
      const original = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        info: console.info ? console.info.bind(console) : console.log.bind(console),
        debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
      };

      console.log = (...args: any[]) => {
        this.debug(String(args[0] ?? ''), args.length > 1 ? args.slice(1) : undefined);
        original.log(...args);
      };
      console.warn = (...args: any[]) => {
        this.warn(String(args[0] ?? ''), args.length > 1 ? args.slice(1) : undefined);
        original.warn(...args);
      };
      console.error = (...args: any[]) => {
        this.error(String(args[0] ?? ''), args.length > 1 ? args.slice(1) : undefined);
        original.error(...args);
      };
      if (console.info) {
        console.info = (...args: any[]) => {
          this.info(String(args[0] ?? ''), args.length > 1 ? args.slice(1) : undefined);
          original.info(...args);
        };
      }
      if (console.debug) {
        console.debug = (...args: any[]) => {
          this.debug(String(args[0] ?? ''), args.length > 1 ? args.slice(1) : undefined);
          original.debug(...args);
        };
      }
      this.consoleIntercepted = true;
      this.info('🛰️ Console interceptor attached');
    } catch {
      // no-op
    }
  }
}

export const logger = new Logger(); 