# egg-dora-validate

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-dora-validate.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-dora-validate
[travis-image]: https://img.shields.io/travis/eggjs/egg-dora-validate.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-dora-validate
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-dora-validate.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-dora-validate?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-dora-validate.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-dora-validate
[snyk-image]: https://snyk.io/test/npm/egg-dora-validate/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-dora-validate
[download-image]: https://img.shields.io/npm/dm/egg-dora-validate.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-dora-validate

基于 [parameter](https://github.com/node-modules/parameter) 提供数据校验方法。

## 安装

```bash
$ npm i egg-dora-validate --save
```

## 配置

```js
// config/plugin.js
exports.validate = {
  enable: true,
  package: 'egg-dora-validate',
};
```

egg-dora-validate 支持 parameter 的所有配置项，查看 [parameter 文档](https://github.com/node-modules/parameter) 获取配置项的更多信息。

```js
// config/config.default.js
exports.validate = {
  // convert: false,
  // validateRoot: false,
};
```

## 使用方法

- `ctx.validate(rule[, data])`

### 默认验证请求 Body

```js
const createRule = {
  name: 'string',
  age: 'int',
  gender: ['male', 'female', 'unknow'],
};

exports.create = function* () {
  // 校验失败自动返回 422 响应
  this.validate(createRule);
  // 可以传递自己处理过的数据，默认使用 this.request.body
  // this.validate(createRule[, your_data]);
  // 校验通过
  this.body = this.request.body;
};
```

如果验证失败，会返回：

```js
HTTP/1.1 422 Unprocessable Entity

{
  "message": "Validation Failed",
  "errors": [
    {
      "field": "username",
      "code": "missing_field",
      "message": "username required"
    }
  ]
}
```

### addRule

- `app.validator.addRule(rule, checker)`

validate 除了在 `context` 上增加了 validate 方法外，还在 `application` 上增加了一个 `validator` 对象，
可以通过 `app.validator.addRule(rule, checker)` 增加自定义的检查类型。

- `app.js`

```js
module.exports = (app) => {
  app.validator.addRule('json', (rule, value) => {
    try {
      JSON.parse(value);
    } catch (err) {
      return 'must be json string';
    }
  });
};
```

- 然后在 controller 中使用

```js
const createRule = {
  username: {
    type: 'email',
  },
  password: {
    type: 'password',
    compare: 're-password',
  },
  addition: {
    required: false,
    type: 'json', // 自定义的 json 类型
  },
};

exports.create = function* () {
  this.validate(createRule);
  this.body = this.request.body;
};
```
