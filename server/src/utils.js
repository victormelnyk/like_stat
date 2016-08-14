'use strict';

const _= require('underscore');

function get(object, key) {
  if (!_.has(object, key)) {
    throw new Error(`No field ${key} in object: ${JSON.stringify(object)}`);
  }
  return object[key];
}

module.exports.get = get;
