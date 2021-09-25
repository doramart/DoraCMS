'use strict';
module.exports = (app) => {
  return function* (next) {
    this.socket.emit('res', 'packet received!');
    console.log('packet:', this.packet);
    yield* next;
  };
};
