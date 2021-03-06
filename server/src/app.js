'use strict';

const express = require('express');
const cors = require('cors');

const logger = require('./logger').get('app');
const process = require('./process');

const port = 2030;

const app = express();

app.use(cors());

app.get('/:userKey', (req, res) => {
  process(req.params.userKey)
    .then(data => {
      logger.log(data);
      res.send(data);
    }, err => {
      logger.error(err);
      res.status(500).send(err);
    });
});

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}!`);
});

// process('dev_flit')
//   .then(data => {
//     logger.log(data);
//   }, err => {
//     logger.error(err);
//   });
