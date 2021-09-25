'use strict';
module.exports = (app) => {
  require('./router/io')(app);

  require('./router/api')(app);
  // FRONT_ROUTER_BEGIN
  require('./router/home')(app);
  require('./router/users')(app);
  // FRONT_ROUTER_END
  require('./router/manage')(app);
};
