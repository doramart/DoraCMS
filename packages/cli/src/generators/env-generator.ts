/**
 * 环境配置文件生成器
 */

import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import type { ProjectInfo } from '../types';

export async function generateEnvFile(projectPath: string, projectInfo: ProjectInfo): Promise<void> {
  const envContent = buildEnvContent(projectInfo);

  // 写入 .env.example
  const envExamplePath = path.join(projectPath, '.env.example');
  await fs.writeFile(envExamplePath, envContent, 'utf-8');

  // 写入 .env（如果不存在）
  const envPath = path.join(projectPath, '.env');
  if (!(await fs.pathExists(envPath))) {
    await fs.writeFile(envPath, envContent, 'utf-8');
  }
}

function buildEnvContent(projectInfo: ProjectInfo): string {
  const jwtSecret = generateRandomSecret();
  const apiSecret = generateRandomSecret();

  let content = `# 应用配置
APP_NAME=${projectInfo.name}
NODE_ENV=development

# 服务器配置
SERVER_PORT=7001
`;

  // 前端配置
  if (projectInfo.type === 'fullstack') {
    content += `ADMIN_PORT=8080
USER_CENTER_PORT=3000
`;
  } else if (projectInfo.type === 'user-separated') {
    content += `USER_CENTER_PORT=3000
`;
  } else if (projectInfo.type === 'admin-separated') {
    content += `ADMIN_PORT=8080
`;
  }

  // 数据库配置
  content += `\n# 数据库配置
DB_TYPE=${projectInfo.database}
`;

  if (projectInfo.database === 'mongodb' || projectInfo.database === 'both') {
    content += `
# MongoDB 配置
MONGODB_URL=mongodb://localhost:27017/${projectInfo.name}
`;
  }

  if (projectInfo.database === 'mariadb' || projectInfo.database === 'both') {
    content += `
# MariaDB 配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=${projectInfo.name}
`;
  }

  // Redis 配置
  content += `
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
`;

  // JWT 配置
  content += `
# JWT 配置
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d
`;

  // API 配置
  content += `
# API 配置
API_VERSION=v1
API_KEY_SECRET=${apiSecret}
`;

  // 文件上传配置
  content += `
# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
`;

  return content;
}

function generateRandomSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
