'use strict';

const logger = require('./logger').get('process');
const utils = require('./utils');
const VkRequest = require('./vkRequest');

const vk = new VkRequest();

function getUser(userKey) {
  logger.debug('getUser', userKey);

  return vk.get('users.get', {user_ids: userKey})
    .then(users => {
      const userRaw = users[0];

      const user = {
        id: utils.get(userRaw, 'id'),
        firstName: utils.get(userRaw, 'first_name'),
        lastName: utils.get(userRaw, 'last_name')
      };

      logger.debug('getUser response', userKey, user);

      return user;
    });
}

function getFriends(user) {
  logger.debug('getFriends', user.id);

  return vk.get('friends.get', {
    user_id: user.id,
    order: 'hints',
    fields: 'first_name,last_name'
  })
    .then(friendsData => {
      const count = utils.get(friendsData, 'count'),
        items = utils.get(friendsData, 'items'),
        friends = items.map(friendRaw => ({
          id: utils.get(friendRaw, 'id'),
          firstName: utils.get(friendRaw, 'first_name'),
          lastName: utils.get(friendRaw, 'last_name')
        }));

      logger.debug('getFriends response', user.id, count, friends.length, friends);

      user.friends = friends;

      user.friends.forEach((friend, index) =>
        logger.warn(friend.firstName, friend.lastName, index));

      user.friends = [user.friends[98]]; //todo test

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
      friend.wallItems = wallItems.slice(0, 300); // todo test

      return friend;
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

  user.friends = user.friends.map(friend => ({
    id: friend.id,
    firstName: friend.firstName,
    lastName: friend.lastName,
    wallLikeCount: friend.wallLikeCount
  }));

  logger.info('trimUser', user.id, user);

  return user;
}

function stat(user) {
  logger.info('stat', user.id, vk.count);
}

function process(userKey) {
  logger.debug('process', userKey);

  return getUser(userKey)
    .then(user => getFriends(user))
    .then(user => getFriendsWallItems(user))
    .then(user => getFriendsWallItemsLikeUserIds(user))
    .then(user => calculateFriendsWallLikeCount(user))
    .then(user => trimUser(user))
    .then(user => stat(user))
    .catch(err => {
      logger.error('process error', userKey, err);
      return Promise.reject({error: `Server error for ${userKey}`});
    })
}

module.exports = process;
