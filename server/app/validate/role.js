module.exports = {
  addOne: {
    roleName: {
      type: 'string',
      required: true,
      message: ctx => ctx.__('validation.role.roleName.required'),
    },
    roleDescription: {
      type: 'string',
      required: false,
      message: ctx => ctx.__('validation.role.roleDescription.invalid'),
    },
    status: {
      type: 'string',
      required: true,
      enum: ['1', '2'],
      message: ctx => ctx.__('validation.role.status.required'),
    },
    menus: {
      type: 'array',
      required: false,
      itemType: 'databaseId',
      message: ctx => ctx.__('validation.role.menus.invalid'),
    },
    buttons: {
      type: 'array',
      required: false,
      itemType: 'string',
      message: ctx => ctx.__('validation.role.buttons.invalid'),
    },
    createBy: { type: 'optionalDatabaseId', required: false },
    createdAt: { type: 'string', required: false },
    updateBy: { type: 'optionalDatabaseId', required: false },
    updatedAt: { type: 'string', required: false },
  },
  updateOne: {
    id: {
      type: 'databaseId',
      required: true,
      message: ctx => ctx.__('validation.role.id.required'),
    },
    roleName: {
      type: 'string',
      required: true,
      message: ctx => ctx.__('validation.role.roleName.required'),
    },
    roleDescription: {
      type: 'string',
      required: false,
      message: ctx => ctx.__('validation.role.roleDescription.invalid'),
    },
    status: {
      type: 'string',
      required: true,
      enum: ['1', '2'],
      message: ctx => ctx.__('validation.role.status.required'),
    },
    menus: {
      type: 'array',
      required: false,
      itemType: 'databaseId',
      message: ctx => ctx.__('validation.role.menus.invalid'),
    },
    buttons: {
      type: 'array',
      required: false,
      itemType: 'string',
      message: ctx => ctx.__('validation.role.buttons.invalid'),
    },
    createBy: { type: 'optionalDatabaseId', required: false },
    createdAt: { type: 'string', required: false },
    updateBy: { type: 'optionalDatabaseId', required: false },
    updatedAt: { type: 'string', required: false },
  },
  deleteRole: {
    ids: {
      type: 'string',
      required: true,
      message: ctx => ctx.__('validation.role.ids.required'),
    },
  },
};
