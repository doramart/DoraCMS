const shortid = require('shortid');
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  require('./menu');
  const RoleSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    roleName: { type: String, required: true },
    roleCode: { type: String, required: true },
    roleDesc: { type: String },
    status: { type: String, default: '1' }, // 1: enabled, 2: disabled
    menus: [{ type: String, ref: 'Menu' }], // Menu IDs that this role has access to
    buttons: [{ type: String }], // Button codes that this role has access to
    createBy: { type: String },
    createdAt: { type: Date, default: Date.now },
    updateBy: { type: String },
    updatedAt: { type: Date, default: Date.now },
  });

  RoleSchema.path('createdAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });
  RoleSchema.path('updatedAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('Role', RoleSchema, 'roles');
};
