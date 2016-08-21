const logger = require('../logger').get('api/likes');
const utils = require('../utils');

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

  return user.request.get('likes.getList', {
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

module.exports = {
  getFriendsWallItemsLikeUserIds
};
