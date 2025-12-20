'use strict';
module.exports = function (app) {
  app.post('/users.json', app.controller.user.create);
};
