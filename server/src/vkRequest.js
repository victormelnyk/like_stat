'use strict';

const _ = require('underscore');
const rp = require('request-promise');

const logger = require('./logger').get('vkRequest'/*, 'info'*/);
const utils = require('./utils');

class VkRequest {
  constructor() {
    this.count = 0;
    this.inProgressCount = 0;
    this.inProgressMaxCount = 20;
    this.queue = [];
  }

  getInternal(name, params) {
    this.count++;

    const paramsS = _.map(params, (value, key) => key + '=' + value).join('&'),
      url = `https://api.vk.com/method/${name}?${paramsS}&v=5.53`;

    logger.debug('Request', url);

    return rp(url).then(res => {
      const resObject = JSON.parse(res);

      logger.debug('Responce', resObject);

      if (resObject.error) {
        return Promise.reject(resObject.error);
      } else {
        return utils.get(resObject, 'response');
      }
    }, err => {
      logger.debug('Request error', err);
      return Promise.reject(err);
    });
  }

  get(name, params) {
    logger.silly('get', this.inProgressCount, this.queue.length, name, params);
    return new Promise((resolve, reject) => {
      this.queue.push({
        name,
        params,
        resolve,
        reject
      });
      this.tryRun();
    });
  }

  tryRun() {
    logger.silly('tryRun', this.inProgressCount, this.queue.length);

    if (this.inProgressCount <= this.inProgressMaxCount && this.queue.length) {
      this.inProgressCount++;
      const requestInfo = this.queue.pop();
      this.getInternal(requestInfo.name, requestInfo.params)
        .then(data => {
          this.inProgressCount--;
          this.tryRun();
          requestInfo.resolve(data);
        }, err => {
          this.inProgressCount--;
          this.tryRun();
          requestInfo.reject(err);
        });
    }
  }
}

module.exports = VkRequest;
