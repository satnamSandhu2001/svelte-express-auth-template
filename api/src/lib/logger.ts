import { createLogger, format, transports } from 'winston';
import { inspect } from 'util';
import { appConfig } from './config';

const { combine, timestamp, printf, colorize, errors } = format;

const isProduction = appConfig.NODE_ENV === 'production';
const logLevel = appConfig.LOG_LEVEL || (isProduction ? 'info' : 'debug');

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack }) => {
    const formattedMessage =
      typeof message === 'object' || Array.isArray(message)
        ? inspect(message, { depth: 3, colors: true })
        : message;

    return `${timestamp} [${level}]: ${stack || formattedMessage}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack }) => {
    const formattedMessage =
      typeof message === 'object' || Array.isArray(message)
        ? inspect(message, { depth: 3, colors: false })
        : message;

    return `${timestamp} [${level}]: ${stack || formattedMessage}`;
  })
);

const logger = createLogger({
  level: logLevel,
  format: isProduction ? prodFormat : devFormat,
  transports: [new transports.Console()],
  exitOnError: false,
});

// Helper function for handling multiple arguments
function logMessage(level: string, ...args: any[]) {
  const formattedArgs = args.map(arg =>
    typeof arg === 'object' || Array.isArray(arg)
      ? inspect(arg, { depth: 3, colors: true })
      : arg
  );

  logger.log(level, formattedArgs.join(' '));
}

// Helper functions for different log levels
function error(...args: any[]) {
  logMessage('error', ...args);
}

function info(...args: any[]) {
  logMessage('info', ...args);
}

function warn(...args: any[]) {
  logMessage('warn', ...args);
}

function debug(...args: any[]) {
  logMessage('debug', ...args);
}

export default { error, info, warn, debug };
