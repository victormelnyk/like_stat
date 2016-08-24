'use strict';

const _ = require('underscore');

const logger = require('./logger').get('process');
const utils = require('./utils');

const getUser = require('./api/users').getUser;
const getUserFriends = require('./api/friends').getUserFriends;
const getUserFriendsWallItemsLikeCount = require('./api/wall').getUserFriendsWallItemsLikeCount;

const VkRequest = require('./vkRequest');
const User = require('./models/user');

const users = {};

function trimUser(user) {
  logger.debug('trimUser', user.id);

  user.finishTime = new Date();
  user.time = ((user.finishTime - user.startTime) / 1000).toFixed(1);
  user.inProgres = false;

  logger.info('stat', {
    userId: user.id,
    requestCount: user.request.count,
    time: user.time
  });

  user.friends = user.friends.map(friend => {
    friend.wallItems = [];

    return friend;
  });

  user.request = undefined;

  logger.info('trimUser', user.id, user);

  return user;
}

function initUser(userKey) {
  const user = new User();
  const request = new VkRequest();

  user.key = userKey;
  user.startTime = new Date();
  user.inProgres = true;
  user.request = request;

  return user;
}

function process(userKey) {
  logger.debug('process', userKey);

  let user;

  if (users[userKey]) {
    user = users[userKey];
  } else {
    user = initUser(userKey);
    users[userKey] = user;
    load(user);
  }

  user.friends = _.sortBy(user.friends, friend => friend.wallLikeCount * -1);

  return Promise.resolve(user);
}

function load(user) {
  logger.debug('load', user.key);

  return getUser(user.request, user.key, user)
    .then(user => getUserFriends(user))
    .then(user => getUserFriendsWallItemsLikeCount(user))
    .then(user => trimUser(user))
    .catch(err => {
      logger.error('process error', user.key, err);
    });
}

module.exports = process;
