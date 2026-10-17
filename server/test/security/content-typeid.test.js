'use strict';

const assert = require('assert');
const { Sequelize, Op } = require('sequelize');
const BaseMariaRepository = require('../../app/repository/base/BaseMariaRepository');
const { normalizeTypeId } = require('../../app/utils/content-query');
const context = require('../../app/extend/context');
const controller = require('../../app/controller/api/content');
const helper = require('../../app/extend/helper');
const ContentService = require('../../app/service/content');
const TemplateService = require('../../app/service/templateService');

const payload = "1') AND (SELECT 5102 FROM (SELECT(!SLEEP(5)))usIN) AND ('JmXo'='JmXo";
const invalidIds = [payload, '1 OR 1=1', '0', '-1', '1.5', '1e2', '9007199254740992', ['1'], {}, true];

function createContext(databaseType = 'mariadb') {
  return {
    app: { config: { repository: { databaseType }, env: 'prod' } },
    validateId: context.validateId,
    query: {},
    params: { id: '1' },
    session: {},
    logger: { error() {} },
    set() {},
    helper,
    service: {},
    __(key) {
      return key;
    },
  };
}

describe('content typeId security', () => {
  describe('ID validation', () => {
    it('normalizes valid MariaDB IDs and optional empty values', () => {
      const ctx = createContext();
      assert.strictEqual(normalizeTypeId(ctx, '123'), 123);
      assert.strictEqual(normalizeTypeId(ctx, 123), 123);
      for (const value of [undefined, null, '']) {
        assert.strictEqual(normalizeTypeId(ctx, value), undefined);
      }
    });

    for (const value of invalidIds) {
      it(`rejects invalid MariaDB category ID ${JSON.stringify(value)}`, () => {
        assert.throws(
          () => normalizeTypeId(createContext(), value),
          error => error.statusCode === 400 && error.message === 'typeId: Invalid category ID'
        );
      });
    }

    it('retains MongoDB ObjectIds and supported short IDs', () => {
      const ctx = createContext('mongodb');
      for (const value of ['64a5b2c7e8f9d123456789ab', 'Nycd05pP']) {
        assert.strictEqual(normalizeTypeId(ctx, value), value);
      }
      for (const value of [payload, ['Nycd05pP'], {}, true, 'a'.repeat(65)]) {
        assert.throws(
          () => normalizeTypeId(ctx, value),
          error => error.statusCode === 400
        );
      }
    });
  });

  describe('MariaDB relation SQL', () => {
    let sequelize;
    let repository;
    const relation = {
      type: 'belongsToMany',
      through: 'content_category_relations',
      foreignKey: 'content_id',
      otherKey: 'category_id',
    };

    before(() => {
      sequelize = new Sequelize('test', 'test', 'test', { dialect: 'mysql', logging: false });
      repository = new BaseMariaRepository(createContext(), 'Content');
      repository.connection = { getSequelize: () => sequelize };
      repository.registerModel({ relations: { categories: relation } });
    });
    after(() => sequelize.close());

    it('quotes identifiers and generates scalar and membership filters', async () => {
      for (const [condition, expected] of [
        [1, '`category_id` = 1'],
        ['Nycd05pP', "`category_id` = 'Nycd05pP'"],
        [{ [Op.in]: [1, 2] }, '`category_id` IN (1, 2)'],
        [{ [Op.in]: [] }, '`category_id` IN (NULL)'],
        [{ [Op.notIn]: [1, 2] }, '`category_id` NOT IN (1, 2)'],
        [{ [Op.notIn]: [] }, '1 = 1'],
        [{ [Op.eq]: 1 }, '`category_id` = 1'],
        [{ [Op.ne]: 1 }, '`category_id` != 1'],
      ]) {
        const options = await repository._buildQueryOptions({ where: { categories: condition } });
        const sql = options.where.id[Op.in].val;
        assert(sql.includes('SELECT `content_id`'));
        assert(sql.includes('FROM `content_category_relations`'));
        assert(sql.includes(expected));
        assert(!sql.includes('[object Object]'));
      }
    });

    it('rejects SQL expressions, unsupported operators and nested objects', () => {
      const buildQuery = condition => repository._buildBelongsToManySubQuery(relation, condition);
      for (const condition of [
        payload,
        ['1'],
        {},
        null,
        NaN,
        Infinity,
        0,
        { [Op.in]: [payload] },
        { [Op.in]: [sequelize.literal('SLEEP(5)')] },
        { [Op.eq]: payload },
        { [Op.gt]: 1 },
        { [Op.in]: [1], extra: payload },
      ]) {
        assert.throws(
          () => buildQuery(condition),
          error => error.statusCode === 400
        );
      }
    });
  });

  describe('public controllers', () => {
    const endpoints = [
      ['list', 'getContentList'],
      ['getRadomContents', 'random'],
      ['getPrevNextPosts', 'nearpost'],
    ];

    for (const [method, action] of endpoints) {
      it(`${method} rejects invalid typeId before accessing services`, async () => {
        for (const typeId of invalidIds) {
          const ctx = createContext();
          ctx.query.typeId = typeId;
          await controller[method](ctx);
          assert.strictEqual(ctx.status, 400);
          assert.strictEqual(ctx.body.message, 'typeId: Invalid category ID');
          assert(!JSON.stringify(ctx.body).includes('SLEEP'));
        }
      });

      it(`${method} forwards valid IDs and renders successful responses`, async () => {
        const ctx = createContext();
        ctx.query.typeId = '123';
        const result = { docs: [] };
        ctx.service.content = {
          async getContentList(query) {
            assert.strictEqual(action, 'getContentList');
            assert.strictEqual(query.typeId, 123);
            return result;
          },
        };
        ctx.service.templateService = {
          async fetchContent(requestedAction, args) {
            assert.strictEqual(requestedAction, action);
            assert.strictEqual(args.typeId, 123);
            return result;
          },
        };
        await controller[method](ctx);
        assert.strictEqual(ctx.status, 200);
        assert.deepStrictEqual(ctx.body.data, result);
      });

      it(`${method} sanitizes server errors without masking them with a helper error`, async () => {
        const ctx = createContext();
        const failure = async () => {
          throw new Error('SQL SELECT secret FROM users');
        };
        ctx.service.content = { getContentList: failure };
        ctx.service.templateService = { fetchContent: failure };
        await controller[method](ctx);
        assert.strictEqual(ctx.status, 500);
        assert.strictEqual(ctx.body.message, 'Internal server error');
        assert(!JSON.stringify(ctx.body).includes('secret'));
      });
    }
  });

  describe('shared service boundaries', () => {
    it('rejects invalid IDs in the content list service before repository access', async () => {
      const service = Object.create(ContentService.prototype);
      service.ctx = createContext();
      service.repository = {};
      await assert.rejects(
        () => service.getContentList({ typeId: payload }),
        error => error.statusCode === 400
      );
    });

    for (const method of ['_getRandomContent', '_getPrevNextPosts']) {
      it(`rejects invalid IDs in ${method} before repository access`, async () => {
        const service = Object.create(TemplateService.prototype);
        service.ctx = createContext();
        await assert.rejects(
          () => service[method]({ id: '1', typeId: payload }),
          error => error.statusCode === 400
        );
      });
    }
  });
});
