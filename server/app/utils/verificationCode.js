'use strict';

const crypto = require('crypto');

const WINDOW_SECONDS = 10 * 60;
const MAX_SENDS_PER_TARGET = 3;
const MAX_SENDS_PER_IP = 20;
const MAX_CHECKS_PER_TARGET = 5;

function counterKey(kind, value) {
  const digest = crypto.createHash('sha256').update(String(value)).digest('hex');
  return `verification-code:${kind}:${digest}`;
}

async function increment(app, key) {
  if (app.redis) {
    const results = await app.redis.multi().incr(key).expire(key, WINDOW_SECONDS).exec();
    if (results[0][0]) throw results[0][0];
    return results[0][1];
  }

  const count = Number(await app.cache.get(key)) || 0;
  await app.cache.set(key, count + 1, WINDOW_SECONDS);
  return count + 1;
}

async function assertSendAllowed(ctx, codeKey) {
  const targetCount = await increment(ctx.app, counterKey('send-target', codeKey));
  const ipCount = await increment(ctx.app, counterKey('send-ip', `${ctx.app.config.session_secret}:${ctx.ip}`));
  if (targetCount > MAX_SENDS_PER_TARGET || ipCount > MAX_SENDS_PER_IP) {
    throw new Error('Verification code request limit exceeded');
  }
}

async function checkCode(ctx, codeKey, submittedCode) {
  const attempts = await increment(ctx.app, counterKey('check', codeKey));
  if (attempts > MAX_CHECKS_PER_TARGET) {
    throw new Error('Verification code attempt limit exceeded');
  }

  const currentCode = await ctx.app.cache.get(codeKey);
  return typeof submittedCode === 'string' && /^[1-9]{6}$/.test(submittedCode) && currentCode === submittedCode;
}

module.exports = { assertSendAllowed, checkCode };
