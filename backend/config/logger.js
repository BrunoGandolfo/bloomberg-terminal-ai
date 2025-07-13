const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Crear directorio de logs si no existe
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Configuración de rotación de archivos
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '7d',
  level: 'info' // NO debug para evitar logs excesivos
});

// Configuración para archivos de error
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '7d',
  level: 'error'
});

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(info => {
      return `${info.timestamp} [${info.level}]: ${info.message}`;
    })
  ),
  transports: [
    fileRotateTransport,
    errorFileRotateTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: process.env.NODE_ENV === 'production' ? 'error' : 'info'
    })
  ],
  // No logs en tests
  silent: process.env.NODE_ENV === 'test'
});

module.exports = logger; 