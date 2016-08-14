'use strict';

const logger = require('./logger').get('process');

const vk = require('./vkRequest');

function get(object, key) {
  if (!object[key]) {
    throw new Error(`No field ${key} in object: ${JSON.stringify(object)}`);
  }
  return object[key];
}


function getUser(userKey) {
  logger.debug('getUser', userKey);

  return vk('users.get', {user_ids: userKey})
    .then(res => {
      const userRaw = get(res, 'response')[0];

      const user = {
        userId: get(userRaw, 'uid'),
        firstName: get(userRaw, 'first_name'),
        lastName: get(userRaw, 'last_name')
      };

      logger.debug('getUser response', userKey, user);

      return user;
    });
}

function getFriendIds(user) {
  logger.debug('getFriendIds', user.userId);

  return vk('friends.get', {user_id: user.userId})
    .then(res => {
      const friends = get(res, 'response');

      logger.debug('getFriendIds response', friends);

      user.friends = friends;

      return user;
    });
}

function getFriendUsers(user) {

  return user;
}

function process(userId) {
  logger.debug('process', userId);

  return getUser(userId)
    .then(user => getFriendIds(user))
    .then(user => getFriendUsers(user))
}

module.exports = process;
