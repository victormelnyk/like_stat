'use strict';

const logger = require('../logger').get('api/users');
const utils = require('../utils');

const Friend = require('../models/friend');

function getFriends(userId, request) {
  logger.debug('getFriends', userId);

  return request.get('friends.get', {
    user_id: userId,
    //order: 'name',
    fields: 'first_name,last_name,photo_100'
  })
    .then(friendsData => {
      const count = utils.get(friendsData, 'count'),
        items = utils.get(friendsData, 'items'),
        friends = items.map(friendRaw => {
          const friend = new Friend();

          friend.id = utils.get(friendRaw, 'id');
          friend.firstName = utils.get(friendRaw, 'first_name');
          friend.lastName = utils.get(friendRaw, 'last_name');
          friend.photo = utils.get(friendRaw, 'photo_100');

          return friend;
        });

      logger.debug('getFriends response', userId, count, friends.length, friends);

      return [friends[2]];
    });
}


module.exports = {
  getFriends
};
