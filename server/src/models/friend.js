'use strict';

class Friend {
  constructor() {
    this.id = 0;
    this.firstName = '';
    this.lastName = '';
    this.photo = '';

    this.wallItems = [];
    this.wallItemCount = 0;
    this.wallLikeCount = 0;
    this.wallErrorCode = 0;
    this.wallErrorMsg = '';
  }
}

module.exports = Friend;
