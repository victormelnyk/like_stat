'use strict';

const _ = require('underscore');

const logger = require('./logger').get('process');
const utils = require('./utils');
const VkRequest = require('./vkRequest');

const vk = new VkRequest();

function getUser(user) {
  logger.debug('getUser', user.key);

  return vk.get('users.get', {
    user_ids: user.key,
    fields: "first_name,last_name,photo_100"
  })
    .then(users => {
      const userRaw = users[0];

      user.id = utils.get(userRaw, 'id');
      user.firstName = utils.get(userRaw, 'first_name');
      user.lastName = utils.get(userRaw, 'last_name');
      user.photo = utils.get(userRaw, 'photo_100');

      logger.debug('getUser response', user.key, user);

      return user;
    });
}

function getFriends(user) {
  logger.debug('getFriends', user.id);

  return vk.get('friends.get', {
    user_id: user.id,
    //order: 'name',
    fields: 'first_name,last_name,photo_100'
  })
    .then(friendsData => {
      const count = utils.get(friendsData, 'count'),
        items = utils.get(friendsData, 'items'),
        friends = items.map(friendRaw => ({
          id: utils.get(friendRaw, 'id'),
          firstName: utils.get(friendRaw, 'first_name'),
          lastName: utils.get(friendRaw, 'last_name'),
          photo: utils.get(friendRaw, 'photo_100'),

          wallItems: []
        }));

      logger.debug('getFriends response', user.id, count, friends.length, friends);

      user.friends = friends;

      user.friends.forEach((friend, index) => logger.warn(friend.firstName, friend.lastName, index));
      //user.friends = [user.friends[0]]; //todo test

      return user;
    });
}

function getFriendsWallItems(user) {
  logger.debug('getFriendsWallItems', user.id, user.friends.length);

  return Promise.all(user.friends.map(friend => getFriendWallItems(user, friend)))
    .then(friendWalls => {
      logger.debug('getFriendsWallItems response', user.id, friendWalls.length);

      return user;
    });
}

function getFriendWallItems(user, friend) {
  logger.debug('getFriendWallItems', user.id, friend.id);

  return getFriendWallItemsPart(user, friend, 0, [])
    .then(wallItems => {
      logger.debug('getFriendWallItems response', user.id, friend.id,
        wallItems.length);

      friend.wallItems = wallItems;

      return friend;
    }, err => {
      if (_.has(err, 'error_code')) {
        logger.warn('getFriendWallItems error', user.id, friend.id, err);

        friend.wallItems = [];
        friend.wallErrorCode = utils.get(err, 'error_code');
        friend.wallErrorMsg = utils.get(err, 'error_msg');
      }
    });
}

function getFriendWallItemsPart(user, friend, offset, resultWellItems) {
  logger.debug('getFriendWallItemsPart', user.id, friend.id, offset);

  return vk.get('wall.get', {owner_id: friend.id, count: 100, offset})
    .then(wallData => {
      const count = utils.get(wallData, 'count'),
        items = utils.get(wallData, 'items'),
        ids = items.map(wallItem => ({id: utils.get(wallItem, 'id')}));

      logger.debug('getFriendWallItemsPart response', user.id, friend.id,
        count, ids.length, ids);

      resultWellItems = resultWellItems.concat(ids);

      if (offset + ids.length < count) {
        return getFriendWallItemsPart(user, friend, offset + 100, resultWellItems);
      } else {
        return resultWellItems;
      }
    });
}

function getFriendsWallItemsLikeUserIds(user) {
  logger.debug('getFriendsWallItemsLikeUserIds', user.id);

  const wallItemInfos = [];

  user.friends.forEach(friend => {
    friend.wallItems.forEach(wallItem => {
      wallItemInfos.push({friend, wallItem});
    });
  });

  return Promise.all(wallItemInfos.map(({friend, wallItem}) =>
    getFriendWallItemLikeUserIds(user, friend, wallItem)))
    .then(wallItems => {
      logger.debug('getFriendsWallItemsLikeUserIds results', user.id,
        wallItems.length);

      return user;
    });
}

function getFriendWallItemLikeUserIds(user, friend, wallItem) {
  logger.debug('getFriendWallItemLikeUserIds', user.id, friend.id, wallItem.id);

  return vk.get('likes.getList', {
    type: 'post',
    owner_id: friend.id,
    item_id: wallItem.id,
    friends_only: 1,
    count: 1000
  })
    .then(likeData => {
      const count = utils.get(likeData, 'count'),
        likeUserIds = utils.get(likeData, 'items');

      logger.debug('getFriendWallItemLikeUserIds response', user.id,
        friend.id, wallItem.id, likeUserIds.length, likeUserIds);

      wallItem.likeUserIds = likeUserIds;

      return wallItem;
    });
}

function calculateFriendsWallLikeCount(user) {
  logger.debug('calculateFriendsWallLikeCount', user.id);

  user.friends.forEach(friend => {
    friend.wallLikeCount = 0;

    friend.wallItems.forEach(wallItem => {
      if (wallItem.likeUserIds.indexOf(user.id) !== -1) {
        friend.wallLikeCount++;
      }
    });

    logger.debug('calculateFriendsWallLikeCount result', user.id, friend.id, friend.wallLikeCount);
  });

  return user;
}

function trimUser(user) {
  logger.debug('trimUser', user.id);

  user.friends = user.friends.map(friend => {
    const resultFriend = {
      id: friend.id,
      firstName: friend.firstName,
      lastName: friend.lastName,
      photo: friend.photo,

      wallLikeCount: friend.wallLikeCount
    };

    if (friend.wallErrorCode) {
      resultFriend.wallErrorCode = friend.wallErrorCode;
      resultFriend.wallErrorMsg = friend.wallErrorMsg;
    }

    return resultFriend;
  });

  user.friends = _.sortBy(user.friends, friend => friend.wallLikeCount ?
    friend.wallLikeCount : Number.MAX_SAFE_INTEGER);

  delete user.startTime;

  logger.info('trimUser', user.id, user);

  return user;
}

function stat(user) {
  logger.info('stat', {
    userId: user.id,
    requestCount: vk.count,
    time: ((new Date() - user.startTime) / 1000).toFixed(1)
  });
  return user;
}

function init(userKey) {
  return Promise.resolve({
    key: userKey,
    startTime: new Date()
  });
}

function process(userKey) {
  logger.debug('process', userKey);

  return init(userKey)
    .then(user => getUser(user))
    .then(user => getFriends(user))
    //.then(user => getFriendsWallItems(user))
    //.then(user => getFriendsWallItemsLikeUserIds(user))
    //.then(user => calculateFriendsWallLikeCount(user))
    .then(user => stat(user))
    .then(user => trimUser(user))
    .catch(err => {
      logger.error('process error', userKey, err);
      return Promise.reject({error: `Server error for ${userKey}`});
    });
}

module.exports = process;
