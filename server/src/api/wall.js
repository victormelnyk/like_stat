const logger = require('../logger').get('api/wall');
const utils = require('../utils');

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

        friend.wallErrorCode = utils.get(err, 'error_code');
        friend.wallErrorMsg = utils.get(err, 'error_msg');
      }
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

module.exports = {
  getFriendsWallItems
};
