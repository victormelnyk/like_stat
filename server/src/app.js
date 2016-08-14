'use strict';

const express = require('express');

const logger = require('./logger').get('app');
const vk = require('./vkRequest');

const port = 2030;

const app = express();

app.get('/', (req, res) => {
  vk('users.get', {user_ids: 18302394})
    .then(data => {
      logger.log(data);
      res.send(data);
    })
    .catch(err => {
      logger.error(err);
      res.status(500).send(err);
    });
});

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}!`);
});
