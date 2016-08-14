'use strict';

const _= require('underscore');
const rp = require('request-promise');

const logger = require('./logger').get('vkRequest', 'log');
const utils = require('./utils');

class VkRequest {
  constructor() {
    this.count = 0;
  }

  get(name, params) {
    this.count++;

    const paramsS = _.map(params, (value, key) => key + '=' + value).join('&'),
      url = `https://api.vk.com/method/${name}?${paramsS}&v=5.53`;

    logger.debug('Request', url);

    return rp(url).then(res => {
      const resObject = JSON.parse(res);

      logger.debug('Responce', resObject);

      const responseData = utils.get(resObject, 'response');

      return responseData;
    }, err => {
      logger.debug('Request error', err);
      return Promise.reject(err);
    });
  }
}



module.exports = VkRequest;
