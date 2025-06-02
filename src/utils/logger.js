import fs from 'fs/promises';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), '.astro', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Ensure log directory exists
async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (err) {
    // Ignore if directory already exists
    if (err.code !== 'EEXIST') {
      console.error('Error creating log directory:', err);
    }
  }
}

// Simple file logger
const logger = {
  async log(...args) {
    await ensureLogDir();
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    const logEntry = `[${timestamp}] ${message}\n`;
    
    try {
      await fs.appendFile(LOG_FILE, logEntry, 'utf-8');
    } catch (err) {
      console.error('Error writing to log file:', err);
    }
    
    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log(`[${timestamp}]`, ...args);
    }
  },
  
  async error(...args) {
    await this.log('[ERROR]', ...args);
  },
  
  async debug(...args) {
    if (import.meta.env.DEBUG) {
      await this.log('[DEBUG]', ...args);
    }
  }
};

export default logger;
