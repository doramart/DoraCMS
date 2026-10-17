'use strict';

const RepositoryExceptions = require('../repository/base/RepositoryExceptions');

function normalizeTypeId(ctx, typeId) {
  if (typeId === undefined || typeId === null || typeId === '') {
    return undefined;
  }

  const isScalar = typeof typeId === 'string' || typeof typeId === 'number';
  const value = isScalar ? String(typeId) : '';
  const isMariaDB = ctx.app.config.repository?.databaseType === 'mariadb';
  const isValid = isMariaDB
    ? /^\d{1,16}$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0
    : /^[A-Za-z0-9_-]{1,64}$/.test(value) && ctx.validateId(value);

  if (!isValid) {
    throw RepositoryExceptions.create.validation('typeId', 'Invalid category ID');
  }

  return isMariaDB ? Number(value) : value;
}

module.exports = { normalizeTypeId };
