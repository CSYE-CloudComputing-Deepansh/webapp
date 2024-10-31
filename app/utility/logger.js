// logger.js
const { createLogger, format, transports } = require('winston');

// Create a custom logger configuration
const logger = createLogger({
  level: 'info', // Default log level
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
      )
    }),

    // File transport to log all info and above level logs into a file
    new transports.File({
      filename: 'logs/app.log',
      level: 'info',
    }),

    // File transport to log only errors
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
  ],
});

// Export the logger to be used in other files
module.exports = logger;
