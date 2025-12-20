const shortid = require('shortid');
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const MenuSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    menuType: { type: String, required: true }, // 1: directory, 2: menu
    menuName: { type: String, required: true },
    routeName: { type: String, required: true },
    routePath: { type: String, required: true },
    component: { type: String },
    i18nKey: { type: String },
    icon: { type: String },
    iconType: { type: String, default: '1' },
    parentId: { type: String, default: '0' }, // 0 for root level
    status: { type: String, default: '1' },
    keepAlive: { type: Boolean, default: false },
    constant: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    href: { type: String },
    hideInMenu: { type: Boolean, default: false },
    activeMenu: { type: String },
    multiTab: { type: Boolean, default: false },
    fixedIndexInTab: { type: Number },
    query: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
    buttons: [
      {
        desc: { type: String },
        api: { type: String },
        permissionCode: { type: String, required: true },
        httpMethod: { type: String, default: 'POST' },
      },
    ],
    createBy: { type: String },
    createdAt: { type: Date, default: Date.now },
    updateBy: { type: String },
    updatedAt: { type: Date, default: Date.now },
  });

  MenuSchema.path('createdAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  MenuSchema.path('updatedAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  return mongoose.model('Menu', MenuSchema, 'menus');
};
