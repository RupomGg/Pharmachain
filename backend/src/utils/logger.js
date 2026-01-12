import winston from 'winston';

/**
 * Winston Logger Configuration
 * 
 * Logs to:
 * - Console (development)
 * - File (production)
 */

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport (always enabled)
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    }),

    // File transport (production)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Stream for Morgan HTTP logging
export const stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};
