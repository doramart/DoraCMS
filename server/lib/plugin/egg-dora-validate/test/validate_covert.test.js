'use strict';

const mm = require('egg-mock');

describe('test/validate.test.js', () => {
  let app;
  before(() => {
    app = mm.app({
      baseDir: 'validate_form_convert',
    });
    return app.ready();
  });

  after(() => app.close());

  describe('post', () => {
    it('should all pass', () => {
      return app
        .httpRequest()
        .post('/users.json')
        .send({
          username: 123,
          age: '24',
        })
        .expect({
          username: '123',
          age: 24,
        })
        .expect(200);
    });
  });
});
