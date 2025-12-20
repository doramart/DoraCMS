'use strict';

/**
 * 回填角色按钮权限脚本
 *
 * 用法：
 *   node scripts/backfill-role-permissions.js --db=mongo      # 仅处理 MongoDB
 *   node scripts/backfill-role-permissions.js --db=mariadb    # 仅处理 MariaDB
 *   node scripts/backfill-role-permissions.js --db=all        # 两种库都处理（默认）
 *   node scripts/backfill-role-permissions.js --dry-run       # 预览，不写入
 *
 * 数据库连接信息默认读取 server/.env.local，可通过环境变量覆盖。
 */

const path = require('path');
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const fs = require('fs');

const ENV_PATH = path.join(__dirname, '../server/.env.local');
if (fs.existsSync(ENV_PATH)) {
  require('dotenv').config({ path: ENV_PATH });
}

const SUPPORTED_DBS = new Set(['mongo', 'mariadb', 'all']);
const args = process.argv.slice(2);
const argMap = args.reduce((acc, arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  acc[key] = value === undefined ? true : value;
  return acc;
}, {});

const targetDb = SUPPORTED_DBS.has(argMap.db) ? argMap.db : 'all';
const isDryRun = Boolean(argMap['dry-run'] || argMap.dryRun);

function buildButtonMap(menus) {
  const map = new Map();
  menus.forEach(menu => {
    if (!menu || !Array.isArray(menu.buttons)) {
      return;
    }
    menu.buttons.forEach(button => {
      if (!button || !button.permissionCode) {
        return;
      }
      const normalized = button.permissionCode;
      map.set(normalized, normalized);
    });
  });
  return map;
}

function normalizeMenuButtons(rawValue) {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) return rawValue;
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeRoleButtons(rawValue) {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) return rawValue;
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function dedupeButtons(buttons) {
  return [...new Set(buttons.filter(Boolean))];
}

async function backfillMongo() {
  const host = process.env.MONGODB_HOST;
  const port = process.env.MONGODB_PORT || 27017;
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const database = process.env.MONGODB_DATABASE;
  const authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';

  if (!host || !username || !password || !database) {
    console.error('[Mongo] 缺少必要的环境变量，跳过处理');
    return;
  }

  const uri = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?authSource=${authSource}`;

  console.log('[Mongo] Connecting to %s:%s/%s ...', host, port, database);
  await mongoose.connect(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });
  const db = mongoose.connection;
  const menusCol = db.collection('menus');
  const rolesCol = db.collection('roles');

  const menus = await menusCol
    .find({}, { projection: { buttons: 1 } })
    .toArray();
  const buttonMap = buildButtonMap(
    menus.map(menu => ({ buttons: normalizeMenuButtons(menu.buttons) }))
  );

  console.log('[Mongo] Loaded %d menus / %d button aliases', menus.length, buttonMap.size);

  const cursor = rolesCol.find({}, { projection: { buttons: 1 } });
  let scanned = 0;
  let updated = 0;

  while (await cursor.hasNext()) {
    const role = await cursor.next();
    scanned += 1;
    const originalButtons = normalizeRoleButtons(role.buttons);
    if (originalButtons.length === 0) {
      continue;
    }

    const mapped = dedupeButtons(originalButtons.map(code => buttonMap.get(code) || code));
    const changed =
      mapped.length !== originalButtons.length ||
      mapped.some((btn, idx) => btn !== originalButtons[idx]);

    if (!changed) {
      continue;
    }

    updated += 1;
    console.log(
      `[Mongo] Role ${role._id} buttons updated: ${JSON.stringify(originalButtons)} -> ${JSON.stringify(mapped)}`
    );

    if (!isDryRun) {
      await rolesCol.updateOne({ _id: role._id }, { $set: { buttons: mapped } });
    }
  }

  await mongoose.disconnect();
  console.log('[Mongo] Completed. scanned=%d updated=%d %s', scanned, updated, isDryRun ? '(dry-run)' : '');
}

async function backfillMaria() {
  const host = process.env.MARIADB_HOST;
  const port = Number(process.env.MARIADB_PORT || 3306);
  const database = process.env.MARIADB_DATABASE;
  const user = process.env.MARIADB_USERNAME;
  const password = process.env.MARIADB_PASSWORD;

  if (!host || !database || !user || password === undefined) {
    console.error('[MariaDB] 缺少必要的环境变量，跳过处理');
    return;
  }

  console.log('[MariaDB] Connecting to %s:%s/%s ...', host, port, database);
  const connection = await mysql.createConnection({
    host,
    port,
    database,
    user,
    password,
    multipleStatements: false,
  });

  const [menuRows] = await connection.execute('SELECT id, buttons FROM menus');
  const menus = menuRows.map(row => ({
    id: row.id,
    buttons: normalizeMenuButtons(row.buttons),
  }));
  const buttonMap = buildButtonMap(menus);
  console.log('[MariaDB] Loaded %d menus / %d button aliases', menus.length, buttonMap.size);

  const [roleRows] = await connection.execute('SELECT id, buttons FROM roles');
  let updated = 0;

  for (const role of roleRows) {
    const originalButtons = normalizeRoleButtons(role.buttons);
    if (originalButtons.length === 0) {
      continue;
    }

    const mapped = dedupeButtons(originalButtons.map(code => buttonMap.get(code) || code));
    const changed =
      mapped.length !== originalButtons.length ||
      mapped.some((btn, idx) => btn !== originalButtons[idx]);

    if (!changed) {
      continue;
    }

    updated += 1;
    console.log(
      `[MariaDB] Role ${role.id} buttons updated: ${JSON.stringify(originalButtons)} -> ${JSON.stringify(mapped)}`
    );

    if (!isDryRun) {
      await connection.execute('UPDATE roles SET buttons = ? WHERE id = ?', [JSON.stringify(mapped), role.id]);
    }
  }

  await connection.end();
  console.log('[MariaDB] Completed. scanned=%d updated=%d %s', roleRows.length, updated, isDryRun ? '(dry-run)' : '');
}

async function run() {
  try {
    if (targetDb === 'mongo' || targetDb === 'all') {
      await backfillMongo();
    }
    if (targetDb === 'mariadb' || targetDb === 'all') {
      await backfillMaria();
    }
    console.log('Backfill finished.');
    if (isDryRun) {
      console.log('Dry-run mode, no data was persisted.');
    } else {
      console.log('请重新登录受影响的后台账号以获得最新权限。');
    }
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  }
}

run();
