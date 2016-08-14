'use strict';

const winston = require('winston');

function add(name, logLevel) {
  const options = {
    level: logLevel || 'debug',
    colorize: true,
    timestamp: false
  };

  if (name !== 'default') {
    options.label = name;
  }

  winston.loggers.add(name, {
    console: options
  });
}

function get(name, logLevel) {
  add(name, logLevel);
  return winston.loggers.get(name);
}

module.exports = get('default');
module.exports.get = get;
