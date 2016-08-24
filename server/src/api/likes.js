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

function getFriendWallItemLikeUserIds(request, ownerId, itemId) {
  logger.debug('getFriendWallItemLikeUserIds', ownerId, itemId);

  return request.get('likes.getList', {
    type: 'post',
    owner_id: ownerId,
    item_id: itemId,
    friends_only: 1,
    count: 1000
  })
    .then(likeData => {
      const count = utils.get(likeData, 'count'),
        likeUserIds = utils.get(likeData, 'items');

      logger.debug('getFriendWallItemLikeUserIds response', ownerId, itemId, likeUserIds.length, likeUserIds);

      return likeUserIds;
    });
}

function setUserFriendWallItemsLikeCount(user, friend) {
  logger.debug('setUserFriendWallItemsLikeCount', user.id, friend.id);

  return Promise.all(friend.wallItems.map(wallItem => setUserFriendWallItemLikeCount(user, friend, wallItem)))
    .then(wallItems => {
      logger.debug('setUserFriendWallItemsLikeCount', user.id, friend.id);

      return friend;
    });
}

function setUserFriendWallItemLikeCount(user, friend, wallItem) {
  logger.debug('setUserFriendWallItemLikeCount', user.id, friend.id, wallItem.id);

  return getIsLiked2(user.request, user.id, friend.id, wallItem.id)
    .then(isLiked => {
      logger.debug('setUserFriendWallItemLikeCount response', user.id, friend.id, wallItem.id, isLiked);

      if (isLiked) {
        wallItem.isLiked = isLiked;
        friend.wallLikeCount++;
      }
      return wallItem;
    })
}

function getIsLiked(request, userId, ownerId, itemId) {
  logger.debug('getIsLiked', userId, ownerId, itemId);

  return request.get('likes.isLiked', {
    user_id: userId,
    type: 'post',
    owner_id: ownerId,
    item_id: itemId
  })
    .then(likeData => {
      const isLiked = utils.get(likeData, 'liked') === 1;

      logger.debug('getIsLiked response', userId, ownerId, itemId, isLiked);

      return isLiked;
    });
}

function getIsLiked2(request, userId, ownerId, itemId) {
  logger.debug('getIsLiked', userId, ownerId, itemId);

  return getFriendWallItemLikeUserIds(request, ownerId, itemId)
    .then(userIds => {
      const isLiked = userIds.indexOf(userId) > -1;

      logger.debug('getIsLiked response', userId, ownerId, itemId, isLiked);

      return isLiked;
    });
}

module.exports = {
  setUserFriendWallItemsLikeCount
};
