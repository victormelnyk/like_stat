'use strict';

const _ = require('underscore');

const logger = require('./logger').get('process');
const utils = require('./utils');

const getUser = require('./api/users').getUser;
const getFriends = require('./api/friends').getFriends;
const getFriendsWallItems = require('./api/wall').getFriendsWallItems;
const getFriendsWallItemsLikeUserIds = require('./api/likes').getFriendsWallItemsLikeUserIds;

const VkRequest = require('./vkRequest');
const User = require('./models/user');


const users = {};

function calculateFriendsWallLikeCount(user) {
  logger.debug('calculateFriendsWallLikeCount', user.id);

  user.friends.forEach(friend => {
    friend.wallItems.forEach(wallItem => {
      if (wallItem.likeUserIds.indexOf(user.id) !== -1) {
        friend.wallLikeCount++;
      }
    });

    logger.debug('calculateFriendsWallLikeCount result', user.id, friend.id, friend.wallLikeCount);
  });

  user.finishTime = new Date();
  user.time = ((user.finishTime - user.startTime) / 1000).toFixed(1);
  user.inProgres = false;

  logger.info('stat', {
    userId: user.id,
    requestCount: user.request.count,
    time: user.time
  });

  return user;
}

function trimUser(user) {
  logger.debug('trimUser', user.id);

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
  logger.debug('getUser', userKey);

  let user;

  if (users[userKey]) {
    user = users[userKey];
  } else {
    user = initUser(userKey);
    users[userKey] = user;
    load(user);
  }

  user.friends = _.sortBy(user.friends, friend => friend.wallLikeCount ?
    friend.wallLikeCount : Number.MAX_SAFE_INTEGER);

  return Promise.resolve(user);
}

function load(user) {
  logger.debug('process', user.key);

  return getUser(user.key, user, user.request)
    .then(user => getFriends(user.id, user.request))
    .then(friends => {
      user.friends = friends;

      return user;
    })
    .then(user => getFriendsWallItems(user))
    .then(user => getFriendsWallItemsLikeUserIds(user))
    .then(user => calculateFriendsWallLikeCount(user))
    .then(user => trimUser(user))
    .catch(err => {
      logger.error('process error', userKey, err);
      return Promise.reject({error: `Server error for ${userKey}`});
    });
}

module.exports = process;
