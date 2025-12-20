'use strict';
module.exports = app => {
  require('./router/api')(app);
  require('./router/home')(app);
  require('./router/users')(app);
  require('./router/manage')(app);
};
