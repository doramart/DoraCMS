'use strict';

const crypto = require('crypto');
const BaseMongoRepository = require('../../base/BaseMongoRepository');

class PermissionDefinitionMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'PermissionDefinition');
    this.model = this.app.model.PermissionDefinition;
    this.registerModel({
      mongoModel: this.model,
    });
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
    const query = Object.assign({ status: 'enabled' }, options.query || {});
    const sort = this._transformSortToMongo(options.sort || this._getDefaultSort());
    return await this.model.find(query).sort(sort).lean();
  }

  async getLatestRevision() {
    const doc = await this.model
      .findOne({}, { revision: 1, updatedAt: 1 })
      .sort({ revision: -1, updatedAt: -1 })
      .lean();
    if (!doc) {
      return 0;
    }
    return Number(doc.revision || 0) || (doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0);
  }

  async bulkUpsert(definitions = [], operator = {}) {
    if (!Array.isArray(definitions) || definitions.length === 0) {
      return { created: 0, updated: 0, skipped: 0 };
    }

    const stats = { created: 0, updated: 0, skipped: 0 };
    const updater = operator?.name || operator?.username || operator?.id || 'system';

    for (const def of definitions) {
      const normalized = this._normalizeDefinition(def);
      if (!normalized.code || !normalized.path) {
        stats.skipped++;
        continue;
      }

      const now = new Date();
      const hash = this._createHash(normalized);
      const existing = await this.model.findOne({ code: normalized.code });

      if (!existing) {
        await this.model.create({
          ...normalized,
          hash,
          revision: 1,
          createdAt: now,
          updatedAt: now,
          createdBy: updater,
          updatedBy: updater,
        });
        stats.created++;
        continue;
      }

      if (existing.hash === hash && existing.status === normalized.status) {
        stats.skipped++;
        continue;
      }

      await this.model.updateOne(
        { _id: existing._id },
        {
          ...normalized,
          hash,
          updatedAt: now,
          updatedBy: updater,
          revision: (existing.revision || 1) + 1,
        }
      );
      stats.updated++;
    }

    return stats;
  }

  async markDisabledByCodes(codes = [], operator = {}) {
    if (!Array.isArray(codes) || codes.length === 0) {
      return { matched: 0, modified: 0 };
    }
    const updater = operator?.name || operator?.username || operator?.id || 'system';
    const result = await this.model.updateMany(
      { code: { $in: codes } },
      {
        $set: {
          status: 'disabled',
          updatedBy: updater,
          updatedAt: new Date(),
        },
        $inc: { revision: 1 },
      }
    );
    return { matched: result.matchedCount || 0, modified: result.modifiedCount || 0 };
  }

  _normalizeDefinition(def = {}) {
    const method = (def.method || 'GET').toString().toUpperCase();
    const normalizedPath = this._normalizePath(def.path || '/');
    const aliases = Array.isArray(def.aliases) ? def.aliases.filter(Boolean) : def.aliases ? [String(def.aliases)] : [];

    return {
      code: String(def.code || '').trim(),
      method,
      path: normalizedPath,
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
        })
      )
      .digest('hex');
  }
}

module.exports = PermissionDefinitionMongoRepository;
