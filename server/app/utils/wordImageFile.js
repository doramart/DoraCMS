'use strict';

const crypto = require('crypto');
const path = require('path');

const extensions = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/gif', 'gif'],
  ['image/bmp', 'bmp'],
  ['image/webp', 'webp'],
]);

function createWordImageFile(directory, contentType) {
  const extension = extensions.get(String(contentType || '').toLowerCase());
  if (!extension) {
    throw new Error('Unsupported Word image type');
  }

  const filename = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
  const fullPath = path.join(directory, filename);
  return { filename, fullPath };
}

module.exports = { createWordImageFile };
