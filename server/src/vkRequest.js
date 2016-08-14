'use strict';

const _= require('underscore');
const rp = require('request-promise');

const logger = require('./logger').get('vkRequest');

function request(name, params) {
  const paramsS = _.map(params, (value, key) => key + '=' + value).join('&'),
    url = `https://api.vk.com/method/${name}?${paramsS}`;

  logger.debug('Request', url);
  return rp(url).then(res => {
    const resObject = JSON.parse(res)
    logger.debug('Responce', resObject);
    return resObject;
  }, err => {
    logger.debug('Request error', err);
    return Promise.reject(err);
  });
}

module.exports = request;
