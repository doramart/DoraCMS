'use strict';
module.exports = function (app) {
  app.get('/users.json', app.controller.user.create);
  app.post('/users.json', app.controller.user.create);
};
