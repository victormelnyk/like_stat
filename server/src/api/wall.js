const logger = require('../logger').get('api/wall');
const utils = require('../utils');

const setUserFriendWallItemsLikeCount = require('./likes').setUserFriendWallItemsLikeCount;

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
      friend.wallItemCount = wallItems.length;

      return friend;
    }, err => {
      if (_.has(err, 'error_code')) {
        logger.warn('getFriendWallItems error', user.id, friend.id, err);

        friend.wallErrorCode = utils.get(err, 'error_code');
        friend.wallErrorMsg = utils.get(err, 'error_msg');

        return friend;
      }
      return Promise.reject(err);
    });
}

function getFriendWallItemsPart(user, friend, offset, resultWellItems) {
  logger.debug('getFriendWallItemsPart', user.id, friend.id, offset);

  return user.request.get('wall.get', {owner_id: friend.id, count: 100, offset})
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

function getUserFriendsWallItemsLikeCount(user) {
  logger.debug('getUserFriendsWallItemsLikeCount', user.id, user.friends.length);

  return Promise.all(user.friends.map(friend => getUserFriendWallItemsLikeCount(user, friend)))
    .then(friends => {
      logger.debug('getUserFriendsWallItemsLikeCount response', user.id, friends.length);

      return user;
    });
}

function getUserFriendWallItemsLikeCount(user, friend) {
  logger.debug('getUserFriendWallItemsLikeCount', user.id, friend.id);

  return getFriendWallItems(user, friend)
    .then(friend => {
      logger.debug('getUserFriendWallItemsLikeCount response', user.id, friend.id, friend.wallItems.length);

      return setUserFriendWallItemsLikeCount(user, friend);
    })
}

module.exports = {
  getUserFriendsWallItemsLikeCount
};
