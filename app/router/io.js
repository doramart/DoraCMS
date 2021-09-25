'use strict';
module.exports = (app) => {
  const { io } = app;

  io.of('/').route('chat', io.controller.chat);
};
