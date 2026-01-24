#!/usr/bin/env node
'use strict';

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

const repoRoot = path.resolve(__dirname, '..');
const demoRoot = path.join(repoRoot, 'demo-post');
const envCandidates = [
  path.join(repoRoot, 'server', '.env.local'),
  path.join(process.cwd(), 'server', '.env.local'),
  path.join(process.cwd(), '.env.local'),
  path.join(__dirname, '..', '..', 'server', '.env.local'),
];

for (const candidate of envCandidates) {
  if (fsSync.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

const dbConfig = {
  host: process.env.MARIADB_HOST || '127.0.0.1',
  port: Number(process.env.MARIADB_PORT || 3306),
  database: process.env.MARIADB_DATABASE,
  user: process.env.MARIADB_USERNAME,
  password: process.env.MARIADB_PASSWORD,
};

const sImg = 'https://cdn.html-js.cn/cms/upload/ai-generated/doubao_1768997538735_4g7tg5.jpg';
const sImgType = '2';
const contentType = '1';

const keywordPool = [
  'alpha',
  'bravo',
  'charlie',
  'delta',
  'echo',
  'foxtrot',
  'golf',
  'hotel',
  'india',
  'juliet',
  'kilo',
  'lima',
  'mike',
  'november',
  'oscar',
  'papa',
  'quebec',
  'romeo',
  'sierra',
  'tango',
  'uniform',
  'victor',
  'whiskey',
  'xray',
  'yankee',
  'zulu',
];

function requireEnv(config) {
  const missing = Object.entries(config)
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing DB config: ${missing.join(', ')}`);
  }
}

async function walkTxtFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkTxtFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.txt')) {
      files.push(fullPath);
    }
  }
  return files;
}

function firstNChars(text, count) {
  return Array.from(text).slice(0, count).join('');
}

function pickRandom(list, count) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeCategoryName(name) {
  return name.replace(/[\s\u3000\-_]+/g, '').trim();
}

function findCategoryPathIds(pathParts, categories) {
  const selected = [];
  let parentId = 0;

  for (const name of pathParts) {
    const normalized = normalizeCategoryName(name);
    let matches = categories.filter(
      item =>
        normalizeCategoryName(item.name) === normalized &&
        (Number(item.parentId) === Number(parentId) || (Number(parentId) === 0 && Number(item.parentId) === 0))
    );

    if (matches.length === 0 && parentId === 0) {
      matches = categories.filter(item => normalizeCategoryName(item.name) === normalized);
    }

    if (matches.length === 0) {
      const globalMatches = categories.filter(item => normalizeCategoryName(item.name) === normalized);
      if (globalMatches.length === 1) {
        const match = globalMatches[0];
        selected.push(match.id);
        parentId = match.id;
        console.log(`Category fallback match: "${name}" -> ${match.id} (parentId ${match.parentId})`);
        continue;
      }
    }

    if (matches.length !== 1) {
      const detail = matches.length === 0 ? 'not found' : 'ambiguous';
      throw new Error(`Category ${detail} for "${name}" with parentId ${parentId}`);
    }

    const match = matches[0];
    selected.push(match.id);
    parentId = match.id;
  }

  return selected;
}

async function getTableColumns(connection, tableName) {
  const [rows] = await connection.query(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [dbConfig.database, tableName]
  );
  return new Set(rows.map(row => row.COLUMN_NAME));
}

function buildRelationRow(baseRow, columns, now) {
  const filtered = {};
  for (const key of Object.keys(baseRow)) {
    if (columns.has(key)) {
      filtered[key] = baseRow[key];
    }
  }
  if (columns.has('createdAt') && filtered.createdAt === undefined) {
    filtered.createdAt = now;
  }
  if (columns.has('updatedAt') && filtered.updatedAt === undefined) {
    filtered.updatedAt = now;
  }
  if (columns.has('created_at') && filtered.created_at === undefined) {
    filtered.created_at = now;
  }
  if (columns.has('updated_at') && filtered.updated_at === undefined) {
    filtered.updated_at = now;
  }
  return filtered;
}

async function main() {
  requireEnv(dbConfig);

  const connection = await mysql.createConnection(dbConfig);
  try {
    const [categoryRows] = await connection.query('SELECT id, name, parentId FROM content_categories');
    const [tagRows] = await connection.query('SELECT id FROM content_tags');
    const [contentRows] = await connection.query('SELECT * FROM contents LIMIT 1');
    const categoryRelationColumns = await getTableColumns(connection, 'content_category_relations');
    const tagRelationColumns = await getTableColumns(connection, 'content_tag_relations');

    if (!contentRows.length) {
      throw new Error('contents table is empty; add a demo row first.');
    }
    if (!tagRows.length) {
      throw new Error('content_tags table is empty; add tags first.');
    }

    const baseContent = contentRows[0];
    const files = await walkTxtFiles(demoRoot);

    let inserted = 0;
    let skipped = 0;

    for (const filePath of files) {
      const raw = await fs.readFile(filePath, 'utf8');
      const contentText = raw.trim();
      if (!contentText) {
        skipped += 1;
        console.log(`Skip empty file: ${filePath}`);
        continue;
      }

      const title = firstNChars(contentText, 20);
      const stitle = title;
      const keywords = pickRandom(keywordPool, 3).join(',');
      const simpleText = normalizeText(contentText);
      const discription = firstNChars(simpleText, 120);
      const now = new Date();

      const relativePath = path.relative(demoRoot, filePath);
      const pathParts = path.dirname(relativePath).split(path.sep).filter(Boolean);
      const categoryIds = findCategoryPathIds(pathParts, categoryRows);

      const [existing] = await connection.query('SELECT id FROM contents WHERE title = ? LIMIT 1', [title]);
      if (existing.length) {
        skipped += 1;
        console.log(`Skip existing title: ${title}`);
        continue;
      }

      const contentRow = { ...baseContent };
      delete contentRow.id;

      Object.assign(contentRow, {
        title,
        stitle,
        type: contentType,
        keywords: JSON.stringify(keywords),
        sImg,
        sImgType,
        comments: contentText,
        simpleComments: simpleText,
        markDownComments: contentText,
        discription,
        createdAt: now,
        updatedAt: now,
      });

      const columns = Object.keys(contentRow);
      const values = columns.map(key => (contentRow[key] === undefined ? null : contentRow[key]));
      const placeholders = columns.map(() => '?').join(', ');

      await connection.beginTransaction();
      try {
        const [insertResult] = await connection.query(
          `INSERT INTO contents (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
        const contentId = insertResult.insertId;

        const tagIds = pickRandom(
          tagRows.map(row => row.id),
          3
        );

        const categoryRelations = [...categoryIds].reverse().map((categoryId, index) =>
          buildRelationRow(
            {
              content_id: contentId,
              category_id: categoryId,
              sort_order: index,
              relation_type: index === 0 ? 'primary' : 'secondary',
            },
            categoryRelationColumns,
            now
          )
        );

        const tagRelations = tagIds.map((tagId, index) =>
          buildRelationRow(
            {
              content_id: contentId,
              tag_id: tagId,
              sort_order: index,
              importance: index < 3 ? 'high' : index < 6 ? 'medium' : 'low',
            },
            tagRelationColumns,
            now
          )
        );

        if (categoryRelations.length) {
          await connection.query('INSERT INTO content_category_relations SET ?', categoryRelations[0]);
          for (const relation of categoryRelations.slice(1)) {
            await connection.query('INSERT INTO content_category_relations SET ?', relation);
          }
        }

        if (tagRelations.length) {
          await connection.query('INSERT INTO content_tag_relations SET ?', tagRelations[0]);
          for (const relation of tagRelations.slice(1)) {
            await connection.query('INSERT INTO content_tag_relations SET ?', relation);
          }
        }

        await connection.commit();
        inserted += 1;
        console.log(`Inserted: ${title}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    console.log(`Done. Inserted ${inserted}, skipped ${skipped}.`);
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
