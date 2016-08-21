'use strict';

class User {
  constructor() {
    this.key = '';

    this.id = 0;
    this.firstName = '';
    this.lastName = '';
    this.photo = '';

    this.startTime = 0;
    this.finishTime = 0;
    this.time = 0;
    this.inProgres = false;

    this.friends = [];

    this.request = null;
  }
}

module.exports = User;
