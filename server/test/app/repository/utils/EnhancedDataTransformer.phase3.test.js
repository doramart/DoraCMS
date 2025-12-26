/**
 * Phase3 增强功能单元测试
 * 测试嵌套查询、查询复杂度、日期标准化等新功能
 */
'use strict';

const assert = require('assert');
const EnhancedDataTransformer = require('../../../../app/repository/utils/EnhancedDataTransformer');

describe('EnhancedDataTransformer - Phase3 增强功能', () => {
  let transformer;

  beforeEach(() => {
    // 创建一个新的transformer实例
    transformer = new EnhancedDataTransformer({ logger: console });
  });

  describe('向后兼容性测试', () => {
    it('默认配置应该禁用所有Phase3功能', () => {
      assert.strictEqual(transformer.config.enableDepthCheck, false);
      assert.strictEqual(transformer.config.enableComplexityCheck, false);
      assert.strictEqual(transformer.config.enableDateNormalization, false);
    });

    it('未启用深度检查时，应该允许深层嵌套查询', () => {
      const deepQuery = {
        $or: [{ $and: [{ $or: [{ $and: [{ field: 1 }] }] }] }],
      };

      // 应该不抛出异常
      const { Op } = require('sequelize');
      const result = transformer.buildMariaDBWhereCondition(deepQuery, Op);
      assert.ok(result);
    });

    it('未启用复杂度检查时，应该允许复杂查询', () => {
      const complexity = transformer._calculateQueryComplexity({
        $or: Array(50).fill({ field: { $gt: 1, $lt: 100 } }),
      });

      // 应该计算出复杂度，但不抛出异常
      assert.ok(complexity > 100);
    });
  });

  describe('配置管理', () => {
    it('应该能够配置查询增强选项', () => {
      transformer.configureQueryEnhancements({
        enableDepthCheck: true,
        maxNestingDepth: 3,
        enableComplexityCheck: true,
        maxQueryComplexity: 50,
      });

      assert.strictEqual(transformer.config.enableDepthCheck, true);
      assert.strictEqual(transformer.config.maxNestingDepth, 3);
      assert.strictEqual(transformer.config.enableComplexityCheck, true);
      assert.strictEqual(transformer.config.maxQueryComplexity, 50);
    });

    it('应该保留未指定的配置项', () => {
      const originalTimezone = transformer.config.dateTimezone;

      transformer.configureQueryEnhancements({
        enableDepthCheck: true,
      });

      assert.strictEqual(transformer.config.enableDepthCheck, true);
      assert.strictEqual(transformer.config.dateTimezone, originalTimezone);
    });
  });

  describe('嵌套深度检查', () => {
    beforeEach(() => {
      transformer.configureQueryEnhancements({
        enableDepthCheck: true,
        maxNestingDepth: 3,
      });
    });

    it('应该通过浅层嵌套查询', () => {
      const { Op } = require('sequelize');
      const shallowQuery = {
        $or: [{ field1: 1 }, { field2: 2 }],
      };

      const result = transformer.buildMariaDBWhereCondition(shallowQuery, Op);
      assert.ok(result);
    });

    it('应该拒绝过深的嵌套查询', () => {
      const { Op } = require('sequelize');
      const deepQuery = {
        $or: [
          {
            $and: [
              {
                $or: [
                  {
                    $and: [
                      {
                        $or: [{ field: 1 }], // 深度 = 5
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      assert.throws(() => {
        transformer.buildMariaDBWhereCondition(deepQuery, Op);
      }, /Query nesting too deep/);
    });

    it('应该在错误消息中显示当前深度', () => {
      const { Op } = require('sequelize');
      const deepQuery = {
        $or: [
          {
            $and: [
              {
                $or: [
                  {
                    $and: [
                      {
                        $or: [{ field: 1 }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      try {
        transformer.buildMariaDBWhereCondition(deepQuery, Op);
        assert.fail('应该抛出异常');
      } catch (error) {
        assert.ok(error.message.includes('current:'));
        assert.ok(error.message.includes('max:'));
      }
    });
  });

  describe('查询复杂度计算', () => {
    it('应该正确计算简单查询的复杂度', () => {
      const simpleQuery = { field: 1 };
      const complexity = transformer._calculateQueryComplexity(simpleQuery);
      assert.strictEqual(complexity, 1);
    });

    it('应该正确计算带操作符查询的复杂度', () => {
      const query = {
        field1: { $gt: 1, $lt: 100 },
        field2: { $in: [1, 2, 3] },
      };
      const complexity = transformer._calculateQueryComplexity(query);
      // field1: 2个操作符, field2: 1个操作符, 基础1 = 1 + 2 + 1 = 4
      assert.strictEqual(complexity, 4);
    });

    it('应该正确计算带$or的复杂度', () => {
      const query = {
        $or: [{ field1: 1 }, { field2: 2 }, { field3: 3 }],
      };
      const complexity = transformer._calculateQueryComplexity(query);
      // 基础1 + $or数组长度*2 + 每个子查询1*3 = 1 + 6 + 3 = 10
      assert.strictEqual(complexity, 10);
    });

    it('应该对嵌套查询应用深度惩罚', () => {
      const flatQuery = {
        $or: [{ field1: 1 }, { field2: 2 }],
      };
      const flatComplexity = transformer._calculateQueryComplexity(flatQuery);

      const nestedQuery = {
        $or: [
          {
            $and: [{ field1: 1 }, { field2: 2 }],
          },
        ],
      };
      const nestedComplexity = transformer._calculateQueryComplexity(nestedQuery);

      // 嵌套查询应该有更高的复杂度
      assert.ok(nestedComplexity > flatComplexity);
    });
  });

  describe('查询复杂度验证', () => {
    beforeEach(() => {
      transformer.configureQueryEnhancements({
        enableComplexityCheck: true,
        maxQueryComplexity: 20,
      });
    });

    it('应该通过简单查询', () => {
      const simpleQuery = {
        field1: 1,
        field2: 2,
      };

      const complexity = transformer._validateQueryComplexity(simpleQuery);
      assert.ok(complexity <= 20);
    });

    it('应该拒绝过于复杂的查询', () => {
      const complexQuery = {
        $or: Array(20).fill({
          field: { $gt: 1, $lt: 100 },
        }),
      };

      assert.throws(() => {
        transformer._validateQueryComplexity(complexQuery);
      }, /Query too complex/);
    });

    it('应该在错误消息中显示复杂度', () => {
      const complexQuery = {
        $or: Array(20).fill({
          field: { $gt: 1, $lt: 100 },
        }),
      };

      try {
        transformer._validateQueryComplexity(complexQuery);
        assert.fail('应该抛出异常');
      } catch (error) {
        assert.ok(error.message.includes('complexity:'));
        assert.ok(error.message.includes('max:'));
      }
    });

    it('未启用时，应该返回0且不抛出异常', () => {
      transformer.configureQueryEnhancements({
        enableComplexityCheck: false,
      });

      const complexQuery = {
        $or: Array(50).fill({
          field: { $gt: 1, $lt: 100 },
        }),
      };

      const complexity = transformer._validateQueryComplexity(complexQuery);
      assert.strictEqual(complexity, 0);
    });
  });

  describe('日期字段检测', () => {
    it('应该识别常见的日期字段', () => {
      const dateFields = ['createdAt', 'updatedAt', 'deletedAt', 'publishAt', 'expireAt', 'startTime', 'endTime'];

      dateFields.forEach(field => {
        assert.strictEqual(transformer._isDateField(field), true, `应该识别 ${field} 为日期字段`);
      });
    });

    it('应该识别包含日期关键词的字段', () => {
      const dateFields = ['createDate', 'updateTime', 'loginTimestamp', 'birthday', 'deadline'];

      dateFields.forEach(field => {
        assert.strictEqual(transformer._isDateField(field), true, `应该识别 ${field} 为日期字段`);
      });
    });

    it('应该不识别普通字段', () => {
      const nonDateFields = ['name', 'email', 'count', 'status', 'description'];

      nonDateFields.forEach(field => {
        assert.strictEqual(transformer._isDateField(field), false, `不应该识别 ${field} 为日期字段`);
      });
    });

    it('应该处理大小写不敏感（驼峰命名）', () => {
      assert.strictEqual(transformer._isDateField('CREATEDAT'), true);
      assert.strictEqual(transformer._isDateField('CreatedAt'), true);
      assert.strictEqual(transformer._isDateField('createdat'), true);
    });

    it('应该排除下划线命名法', () => {
      assert.strictEqual(transformer._isDateField('created_at'), false);
      assert.strictEqual(transformer._isDateField('updated_at'), false);
      assert.strictEqual(transformer._isDateField('publish_date'), false);
    });
  });

  describe('日期值标准化', () => {
    beforeEach(() => {
      transformer.configureQueryEnhancements({
        enableDateNormalization: true,
        dateTimezone: 'UTC',
      });
    });

    it('应该标准化Date对象', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const normalized = transformer._normalizeDateValue(date);

      assert.strictEqual(typeof normalized, 'string');
      assert.ok(normalized.endsWith('Z')); // UTC格式
      assert.strictEqual(normalized, '2024-01-01T12:00:00.000Z');
    });

    it('应该标准化日期字符串', () => {
      const dateStr = '2024-01-01';
      const normalized = transformer._normalizeDateValue(dateStr);

      assert.strictEqual(typeof normalized, 'string');
      assert.ok(normalized.endsWith('Z'));
    });

    it('应该标准化时间戳', () => {
      const timestamp = 1704110400000; // 2024-01-01 12:00:00 UTC
      const normalized = transformer._normalizeDateValue(timestamp);

      assert.strictEqual(typeof normalized, 'string');
      assert.ok(normalized.endsWith('Z'));
    });

    it('应该返回无效日期原值', () => {
      const invalidDate = 'not a date';
      const normalized = transformer._normalizeDateValue(invalidDate);
      assert.strictEqual(normalized, invalidDate);
    });

    it('应该返回null和undefined原值', () => {
      assert.strictEqual(transformer._normalizeDateValue(null), null);
      assert.strictEqual(transformer._normalizeDateValue(undefined), undefined);
    });

    it('未启用时，应该返回原值', () => {
      transformer.configureQueryEnhancements({
        enableDateNormalization: false,
      });

      const date = new Date('2024-01-01T12:00:00Z');
      const normalized = transformer._normalizeDateValue(date);
      assert.strictEqual(normalized, date);
    });
  });

  describe('日期条件转换', () => {
    beforeEach(() => {
      transformer.configureQueryEnhancements({
        enableDateNormalization: true,
      });
    });

    it('应该转换日期字段的简单值', () => {
      const condition = '2024-01-01';
      const transformed = transformer._transformDateCondition(condition, 'createdAt');

      assert.strictEqual(typeof transformed, 'string');
      assert.ok(transformed.endsWith('Z'));
    });

    it('应该转换日期字段的操作符', () => {
      const condition = {
        $gte: '2024-01-01',
        $lte: '2024-12-31',
      };
      const transformed = transformer._transformDateCondition(condition, 'createdAt');

      assert.ok(transformed.$gte.endsWith('Z'));
      assert.ok(transformed.$lte.endsWith('Z'));
    });

    it('应该保留非日期操作符', () => {
      const condition = {
        $gte: '2024-01-01',
        $exists: true,
      };
      const transformed = transformer._transformDateCondition(condition, 'createdAt');

      assert.ok(transformed.$gte.endsWith('Z'));
      assert.strictEqual(transformed.$exists, true);
    });

    it('不应该转换非日期字段', () => {
      const condition = {
        $gte: '2024-01-01',
      };
      const transformed = transformer._transformDateCondition(condition, 'name');

      assert.strictEqual(transformed.$gte, '2024-01-01'); // 未转换
    });

    it('未启用时，应该返回原值', () => {
      transformer.configureQueryEnhancements({
        enableDateNormalization: false,
      });

      const condition = {
        $gte: '2024-01-01',
      };
      const transformed = transformer._transformDateCondition(condition, 'createdAt');

      assert.strictEqual(transformed.$gte, '2024-01-01'); // 未转换
    });
  });

  describe('集成测试', () => {
    it('应该能同时启用多个增强功能', () => {
      transformer.configureQueryEnhancements({
        enableDepthCheck: true,
        maxNestingDepth: 3,
        enableComplexityCheck: true,
        maxQueryComplexity: 50,
        enableDateNormalization: true,
      });

      assert.strictEqual(transformer.config.enableDepthCheck, true);
      assert.strictEqual(transformer.config.enableComplexityCheck, true);
      assert.strictEqual(transformer.config.enableDateNormalization, true);
    });

    it('所有功能默认关闭时，应该保持完全向后兼容', () => {
      const { Op } = require('sequelize');

      // 深层嵌套查询
      const deepQuery = {
        $or: [
          {
            $and: [
              {
                $or: [
                  {
                    $and: [
                      {
                        $or: [{ field: 1 }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      // 应该不抛出任何异常
      const result = transformer.buildMariaDBWhereCondition(deepQuery, Op);
      assert.ok(result);

      // 复杂查询
      const complexQuery = {
        $or: Array(50).fill({ field: { $gt: 1, $lt: 100 } }),
      };
      const complexity = transformer._validateQueryComplexity(complexQuery);
      assert.strictEqual(complexity, 0); // 未启用，返回0

      // 日期值
      const date = new Date('2024-01-01');
      const normalized = transformer._normalizeDateValue(date);
      assert.strictEqual(normalized, date); // 未启用，返回原值
    });
  });

  describe('错误处理', () => {
    it('深度检查错误应该包含详细信息', () => {
      transformer.configureQueryEnhancements({
        enableDepthCheck: true,
        maxNestingDepth: 2,
      });

      const { Op } = require('sequelize');
      const deepQuery = {
        $or: [
          {
            $and: [
              {
                $or: [{ field: 1 }], // 深度 = 3
              },
            ],
          },
        ],
      };

      try {
        transformer.buildMariaDBWhereCondition(deepQuery, Op);
        assert.fail('应该抛出异常');
      } catch (error) {
        assert.ok(error.message.includes('EnhancedDataTransformer'));
        assert.ok(error.message.includes('Query nesting too deep'));
        assert.ok(error.message.includes('current:'));
        assert.ok(error.message.includes('max:'));
      }
    });

    it('复杂度检查错误应该包含详细信息', () => {
      transformer.configureQueryEnhancements({
        enableComplexityCheck: true,
        maxQueryComplexity: 10,
      });

      const complexQuery = {
        $or: Array(20).fill({ field: { $gt: 1, $lt: 100 } }),
      };

      try {
        transformer._validateQueryComplexity(complexQuery);
        assert.fail('应该抛出异常');
      } catch (error) {
        assert.ok(error.message.includes('EnhancedDataTransformer'));
        assert.ok(error.message.includes('Query too complex'));
        assert.ok(error.message.includes('complexity:'));
        assert.ok(error.message.includes('max:'));
      }
    });
  });
});
