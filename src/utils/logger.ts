import fs from 'fs/promises';
import path from 'path';

type Loggable = string | number | boolean | object | null | undefined;

const LOG_DIR = path.join(process.cwd(), '.astro', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Ensure log directory exists
async function ensureLogDir(): Promise<void> {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (err: unknown) {
    // Ignore if directory already exists
    if (err instanceof Error && 'code' in err && err.code !== 'EEXIST') {
      console.error('Error creating log directory:', err);
    }
  }
}

interface Logger {
  log(...args: Loggable[]): Promise<void>;
  error(...args: Loggable[]): Promise<void>;
  debug(...args: Loggable[]): Promise<void>;
}

// Simple file logger
const logger: Logger = {
  async log(...args: Loggable[]): Promise<void> {
    await ensureLogDir();
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      arg !== null && typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    const logEntry = `[${timestamp}] ${message}\n`;
    
    try {
      await fs.appendFile(LOG_FILE, logEntry, 'utf-8');
    } catch (err: unknown) {
      console.error('Error writing to log file:', err);
    }
    
    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log(`[${timestamp}]`, ...args);
    }
  },
  
  async error(...args: Loggable[]): Promise<void> {
    await this.log('[ERROR]', ...args);
  },
  
  async debug(...args: Loggable[]): Promise<void> {
    if (import.meta.env.DEBUG) {
      await this.log('[DEBUG]', ...args);
    }
  }
};

export default logger;
