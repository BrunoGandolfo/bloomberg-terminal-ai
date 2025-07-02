const { createLogger, format, transports } = require('winston');
module.exports = createLogger({
  level: 'info',
  format: format.json(),
  transports: [ new transports.Console() ]
}); 