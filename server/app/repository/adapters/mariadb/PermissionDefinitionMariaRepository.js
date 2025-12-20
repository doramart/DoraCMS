'use strict';

const crypto = require('crypto');
const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const PermissionDefinitionSchema = require('../../schemas/mariadb/PermissionDefinitionSchema');

class PermissionDefinitionMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'PermissionDefinition');
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
  }

  async _initializeConnection() {
    await this.connection.initialize();
    const sequelize = this.connection.getSequelize();
    this.model = PermissionDefinitionSchema(sequelize, this.app);
    this.registerModel({
      mariaModel: this.model,
    });
  }

  async _ensureConnection() {
    if (!this.model) {
      await this._initializeConnection();
    }
  }

  _getDefaultSort() {
    return [
      { field: 'group', order: 'asc' },
      { field: 'code', order: 'asc' },
    ];
  }

  _getStatusMapping() {
    return {
      enabled: '启用',
      disabled: '禁用',
    };
  }

  async findActiveDefinitions(options = {}) {
    await this._ensureConnection();
    const where = Object.assign({ status: 'enabled' }, options.query || {});
    const records = await this.model.findAll({
      where,
      order: [
        ['group', 'ASC'],
        ['code', 'ASC'],
      ],
    });
    return records.map(record => record.get({ plain: true }));
  }

  async getLatestRevision() {
    await this._ensureConnection();
    const record = await this.model.findOne({
      order: [
        ['revision', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
      attributes: ['revision', 'updatedAt'],
    });
    if (!record) {
      return 0;
    }
    const plain = record.get({ plain: true });
    return Number(plain.revision || 0) || (plain.updatedAt ? new Date(plain.updatedAt).getTime() : 0);
  }

  async bulkUpsert(definitions = [], operator = {}) {
    if (!Array.isArray(definitions) || definitions.length === 0) {
      return { created: 0, updated: 0, skipped: 0 };
    }

    await this._ensureConnection();
    const stats = { created: 0, updated: 0, skipped: 0 };
    const updater = operator?.name || operator?.username || operator?.id || 'system';
    const transaction = await this.connection.getSequelize().transaction();

    try {
      for (const def of definitions) {
        const normalized = this._normalizeDefinition(def);
        if (!normalized.code || !normalized.path) {
          stats.skipped++;
          continue;
        }

        const now = new Date();
        const hash = this._createHash(normalized);
        const existing = await this.model.findOne({ where: { code: normalized.code }, transaction });

        if (!existing) {
          await this.model.create(
            {
              ...normalized,
              hash,
              revision: 1,
              createdBy: updater,
              updatedBy: updater,
              createdAt: now,
              updatedAt: now,
            },
            { transaction }
          );
          stats.created++;
          continue;
        }

        if (existing.hash === hash && existing.status === normalized.status) {
          stats.skipped++;
          continue;
        }

        await existing.update(
          {
            ...normalized,
            hash,
            revision: (existing.revision || 1) + 1,
            updatedBy: updater,
            updatedAt: now,
          },
          { transaction }
        );
        stats.updated++;
      }

      await transaction.commit();
      return stats;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async markDisabledByCodes(codes = [], operator = {}) {
    if (!Array.isArray(codes) || codes.length === 0) {
      return { affectedRows: 0 };
    }
    await this._ensureConnection();
    const updater = operator?.name || operator?.username || operator?.id || 'system';
    const [affectedRows] = await this.model.update(
      {
        status: 'disabled',
        updatedBy: updater,
        updatedAt: new Date(),
        revision: this.connection.getSequelize().literal('revision + 1'),
      },
      {
        where: { code: { [this.Op.in]: codes } },
      }
    );
    return { affectedRows };
  }

  _normalizeDefinition(def = {}) {
    const method = (def.method || 'GET').toString().toUpperCase();
    const path = this._normalizePath(def.path || '/');
    const aliases = Array.isArray(def.aliases) ? def.aliases.filter(Boolean) : def.aliases ? [String(def.aliases)] : [];

    return {
      code: String(def.code || '').trim(),
      method,
      path,
      desc: def.desc || '',
      group: def.group || 'default',
      resourceType: def.resourceType || 'api',
      scope: def.scope || 'global',
      status: def.status || 'enabled',
      aliases,
      meta: def.meta || {},
      tags: Array.isArray(def.tags) ? def.tags : [],
      version: Number(def.version || 1),
    };
  }

  _normalizePath(pathname) {
    if (!pathname) {
      return '/';
    }
    const trimmed = pathname.trim();
    if (!trimmed.startsWith('/')) {
      return `/${trimmed}`;
    }
    if (trimmed.length > 1 && trimmed.endsWith('/')) {
      return trimmed.replace(/\/+$/, '');
    }
    return trimmed;
  }

  _createHash(definition) {
    return crypto
      .createHash('md5')
      .update(
        JSON.stringify({
          code: definition.code,
          method: definition.method,
          path: definition.path,
          group: definition.group,
          resourceType: definition.resourceType,
          scope: definition.scope,
          meta: definition.meta,
          aliases: definition.aliases,
          tags: definition.tags,
          version: definition.version,
          status: definition.status,
        })
      )
      .digest('hex');
  }
}

module.exports = PermissionDefinitionMariaRepository;
