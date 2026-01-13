/**
 * 环境配置文件生成器
 */

import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import type { ProjectInfo } from '../types';

export async function generateEnvFile(projectPath: string, projectInfo: ProjectInfo): Promise<void> {
  const envContent = buildEnvContent(projectInfo);

  // 1. 写入根目录 .env.example
  const envExamplePath = path.join(projectPath, '.env.example');
  await fs.writeFile(envExamplePath, envContent, 'utf-8');

  // 2. 写入根目录 .env（如果不存在）
  const rootEnvPath = path.join(projectPath, '.env');
  if (!(await fs.pathExists(rootEnvPath))) {
    await fs.writeFile(rootEnvPath, envContent, 'utf-8');
  }

  // 3. 写入 server/.env（确保环境变量能被正确加载）
  // 因为 pnpm --filter 会改变工作目录到 server/，所以需要在 server 目录也创建 .env
  const serverEnvPath = path.join(projectPath, 'server/.env');
  if (!(await fs.pathExists(serverEnvPath))) {
    await fs.writeFile(serverEnvPath, envContent, 'utf-8');
  }
}

function buildEnvContent(projectInfo: ProjectInfo): string {
  const jwtSecret = generateRandomSecret();
  const apiSecret = generateRandomSecret();
  const appKeys = generateRandomSecret();
  const sessionSecret = generateRandomSecret();

  let content = `# =================================
# 应用配置
# =================================
NODE_ENV=development
PORT=8080
HOSTNAME=127.0.0.1

# Worker 进程数量（默认1，推荐值：CPU核心数）
EGG_WORKERS=1
`;

  // 数据库配置
  content += `
# =================================
# 数据库配置
# =================================
DATABASE_TYPE=${projectInfo.database}
REPOSITORY_ENABLED=true
`;

  if (projectInfo.database === 'mongodb' || projectInfo.database === 'both') {
    content += `
# MongoDB 配置
MONGODB_HOST=127.0.0.1
MONGODB_PORT=27017
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_DATABASE=${projectInfo.name}
MONGODB_AUTH_SOURCE=admin
`;
  }

  if (projectInfo.database === 'mariadb' || projectInfo.database === 'both') {
    content += `
# MariaDB 配置
MARIADB_HOST=127.0.0.1
MARIADB_PORT=3307
MARIADB_DATABASE=${projectInfo.name}
MARIADB_USERNAME=root
MARIADB_PASSWORD=
MARIADB_TABLE_PREFIX=dora_
`;
  }

  // Redis 配置
  content += `
# Redis 配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
`;

  // 安全配置
  content += `
# =================================
# 安全配置
# =================================
# 应用密钥（用于 Cookie 加密，生产环境必须修改）
APP_KEYS=${appKeys}

# Session 密钥（用于密码重置令牌生成，生产环境必须修改）
SESSION_SECRET=${sessionSecret}

# 认证 Cookie 名称
AUTH_COOKIE_NAME=doracms

# 加密密钥（用于密码加密和邮件密码解密）
ENCRYPT_KEY=dora

# JWT Token 过期时间（默认 30 天）
JWT_EXPIRES_IN=30day
`;

  // CORS 配置
  content += `
# =================================
# CORS 和安全配置
# =================================
# 允许的域名（用逗号分隔）
CORS_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:9527
DOMAIN_WHITELIST=http://localhost:3000,http://localhost:8080,http://localhost:9527
`;

  // 文件存储配置
  content += `
# =================================
# 文件存储配置
# =================================
UPLOAD_PATH=
STATIC_PATH=
LOG_DIR=
LOG_LEVEL=INFO
`;

  // 第三方服务配置
  content += `
# =================================
# 第三方服务配置
# =================================
CDN_ORIGIN=https://cdn.html-js.cn
API_DOMAIN=http://localhost:8080
`;

  return content;
}

function generateRandomSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
