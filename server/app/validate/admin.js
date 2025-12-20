module.exports = {
  login: ctx => {
    return {
      userName: {
        type: 'string',
        required: true,
        message: ctx.__('validation.admin.userName.required'),
      },
      password: {
        type: 'string',
        required: false,
        message: ctx.__('validation.admin.password.invalid'),
      },
    };
  },
  addOne: ctx => {
    return {
      userName: {
        type: 'string',
        required: true,
        message: ctx.__('validation.admin.userName.required'),
      },
      password: {
        type: 'string',
        required: false,
        message: ctx.__('validation.admin.password.invalid'),
      },
      userGender: {
        type: 'string',
        required: true,
        enum: ['1', '2'],
        message: ctx.__('validation.admin.userGender.required'),
      },
      nickName: {
        type: 'string',
        required: true,
        message: ctx.__('validation.admin.nickName.required'),
      },
      userPhone: {
        type: 'string',
        required: true,
        format: /^1[3-9]\d{9}$/,
        message: ctx.__('validation.admin.userPhone.format'),
      },
      userEmail: {
        type: 'string',
        required: true,
        format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: ctx.__('validation.admin.userEmail.format'),
      },
      userRoles: {
        type: 'array',
        required: false,
        itemType: 'databaseId',
        message: ctx.__('validation.admin.userRoles.invalid'),
      },
      status: {
        type: 'string',
        required: true,
        enum: ['1', '2'],
        message: ctx.__('validation.admin.status.required'),
      },
      createBy: { type: 'optionalDatabaseId', required: false },
      createdAt: { type: 'string', required: false },
      updateBy: { type: 'optionalDatabaseId', required: false },
      updatedAt: { type: 'string', required: false },
    };
  },
  initOne: ctx => {
    return {
      userName: {
        type: 'string',
        required: true,
        message: ctx.__('validation.admin.userName.required'),
      },
      password: {
        type: 'string',
        required: true,
        message: ctx.__('validation.admin.password.invalid'),
      },
      nickName: {
        type: 'string',
        required: true,
        message: ctx.__('validation.admin.nickName.required'),
      },
      userPhone: {
        type: 'string',
        required: false,
        format: /^1[3-9]\d{9}$/,
        message: ctx.__('validation.admin.userPhone.format'),
      },
      userEmail: {
        type: 'string',
        required: true,
        format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: ctx.__('validation.admin.userEmail.format'),
      },
    };
  },
  updateOne: ctx => {
    return {
      id: {
        type: 'databaseId',
        required: true,
        message: ctx.__('validation.admin.id.required'),
      },
      userName: {
        type: 'string',
        required: true,
        message: ctx.__('validation.admin.userName.required'),
      },
      password: {
        type: 'string',
        required: false,
        message: ctx.__('validation.admin.password.invalid'),
      },
      userGender: {
        type: 'string',
        required: true,
        enum: ['1', '2'],
        message: ctx.__('validation.admin.userGender.required'),
      },
      nickName: {
        type: 'string',
        required: true,
        message: ctx.__('validation.admin.nickName.required'),
      },
      userPhone: {
        type: 'string',
        required: true,
        format: /^1[3-9]\d{9}$/,
        message: ctx.__('validation.admin.userPhone.format'),
      },
      userEmail: {
        type: 'string',
        required: true,
        format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: ctx.__('validation.admin.userEmail.format'),
      },
      userRoles: {
        type: 'array',
        required: false,
        itemType: 'databaseId',
        message: ctx.__('validation.admin.userRoles.invalid'),
      },
      status: {
        type: 'string',
        required: true,
        enum: ['1', '2'],
        message: ctx.__('validation.admin.status.required'),
      },
      createBy: { type: 'optionalDatabaseId', required: false },
      createdAt: { type: 'string', required: false },
      updateBy: { type: 'optionalDatabaseId', required: false },
      updatedAt: { type: 'string', required: false },
    };
  },
  deleteUser: ctx => {
    return {
      ids: {
        type: 'string',
        required: true,
        message: ctx.__('validation.admin.ids.required'),
      },
    };
  },
};
