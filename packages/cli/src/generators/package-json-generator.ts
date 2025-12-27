/**
 * package.json 生成器
 */

import path from 'path';
import fs from 'fs-extra';
import type { ProjectInfo } from '../types';

export async function generatePackageJson(projectPath: string, projectInfo: ProjectInfo): Promise<void> {
  const packageJson: any = {
    name: projectInfo.name,
    version: '1.0.0',
    description: `DoraCMS project - ${projectInfo.name}`,
    private: true,
    workspaces: [],
    scripts: {},
    keywords: ['doracms'],
    author: '',
    license: 'MIT',
  };

  // 配置 workspaces
  packageJson.workspaces.push('server');

  if (projectInfo.type !== 'backend-only') {
    if (projectInfo.type === 'fullstack') {
      packageJson.workspaces.push('client/admin-center');
      packageJson.workspaces.push('client/user-center');
    } else if (projectInfo.type === 'user-separated') {
      packageJson.workspaces.push('client/user-center');
    } else if (projectInfo.type === 'admin-separated') {
      packageJson.workspaces.push('client/admin-center');
    }
  }

  // 配置 scripts
  if (projectInfo.type === 'fullstack') {
    packageJson.scripts = {
      'dev:server': 'pnpm --filter "./server" run dev',
      'dev:admin': 'pnpm --filter "./client/admin-center" run dev',
      'dev:user': 'pnpm --filter "./client/user-center" run dev',
      'dev:all': 'concurrently "pnpm run dev:server" "pnpm run dev:admin" "pnpm run dev:user"',
      'build:server': 'pnpm --filter "./server" run build',
      'build:admin': 'pnpm --filter "./client/admin-center" run build',
      'build:user': 'pnpm --filter "./client/user-center" run build',
      build: 'pnpm run build:server && pnpm run build:admin && pnpm run build:user',
      lint: 'pnpm -r run lint',
      format: 'pnpm -r run format',
      test: 'pnpm --filter "./server" run test',
    };
  } else if (projectInfo.type === 'backend-only') {
    packageJson.scripts = {
      'dev:server': 'pnpm --filter "./server" run dev',
      dev: 'pnpm run dev:server',
      'build:server': 'pnpm --filter "./server" run build',
      build: 'pnpm run build:server',
      lint: 'pnpm -r run lint',
      format: 'pnpm -r run format',
      test: 'pnpm --filter "./server" run test',
    };
  } else if (projectInfo.type === 'user-separated') {
    packageJson.scripts = {
      'dev:server': 'pnpm --filter "./server" run dev',
      'dev:user': 'pnpm --filter "./client/user-center" run dev',
      dev: 'concurrently "pnpm run dev:server" "pnpm run dev:user"',
      'build:server': 'pnpm --filter "./server" run build',
      'build:user': 'pnpm --filter "./client/user-center" run build',
      build: 'pnpm run build:server && pnpm run build:user',
      lint: 'pnpm -r run lint',
      format: 'pnpm -r run format',
      test: 'pnpm --filter "./server" run test',
    };
  }

  // 添加 devDependencies
  if (projectInfo.type !== 'backend-only') {
    packageJson.devDependencies = {
      concurrently: '^8.2.2',
    };
  }

  // 写入文件
  const packageJsonPath = path.join(projectPath, 'package.json');
  await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
}
