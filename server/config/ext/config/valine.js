'use strict';
module.exports = {
  match: [ctx => ctx.path.startsWith('/manage/valine'), ctx => ctx.path.startsWith('/api/valine')],
};
