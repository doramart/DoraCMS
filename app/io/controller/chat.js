'use strict';
module.exports = (app) => {
  return function* () {
    const self = this;
    const message = this.args[0];
    console.log('chat 控制器打印', message);
    this.socket.emit('res', `Hi! I've got your message: ${message}`);
  };
};
