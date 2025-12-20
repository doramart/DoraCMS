module.exports = {
  form: ctx => {
    return {
      name: {
        type: 'string',
        required: true,
        min: 2,
        max: 15,
        message: ctx.__('validation.errorField', [ctx.__('ads.name')]),
      },
      comments: {
        type: 'string',
        required: true,
        min: 5,
        max: 30,
        message: ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.comments')]),
      },
    };
  },
};
