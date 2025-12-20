'use strict';

const createRule = {
  username: 'string',
  age: 'int',
};

exports.create = function* () {
  this.validate(createRule);
  this.body = this.request.body;
};
