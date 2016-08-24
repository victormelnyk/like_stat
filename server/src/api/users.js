'use strict';

const logger = require('../logger').get('api/users');
const utils = require('../utils');

function getUser(request, userKey, user) {
  logger.debug('getUser', userKey);

  return request.get('users.get', {
    user_ids: userKey,
    fields: "first_name,last_name,photo_100"
  })
    .then(users => {
      const userRaw = users[0];

      user.id = utils.get(userRaw, 'id');
      user.firstName = utils.get(userRaw, 'first_name');
      user.lastName = utils.get(userRaw, 'last_name');
      user.photo = utils.get(userRaw, 'photo_100');

      logger.debug('getUser response', userKey, user);

      return user;
    });
}

module.exports = {
  getUser
};
