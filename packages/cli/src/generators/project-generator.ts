/**
 * 项目生成器
 */

import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { execaCommand } from 'execa';
import type { ProjectInfo, ModuleSelection } from '../types';
import { logger } from '../utils/logger';
import { installDependencies } from '../utils/package-manager';
import { generateModulesConfig } from './modules-config-generator';
import { generateEnvFile } from './env-generator';
import { generatePackageJson } from './package-json-generator';

export async function generateProject(
  projectPath: string,
  projectInfo: ProjectInfo,
  modules: ModuleSelection
): Promise<void> {
  // 1. 创建项目目录
  let spinner = ora('创建项目目录').start();
  await fs.ensureDir(projectPath);
  spinner.succeed('创建项目目录');

  // 2. 复制后端代码
  spinner = ora('复制后端代码').start();
  await copyServerCode(projectPath);
  spinner.succeed('复制后端代码');

  // 3. 复制前端代码（根据项目类型）
  if (projectInfo.type !== 'backend-only') {
    spinner = ora('复制前端代码').start();
    await copyClientCode(projectPath, projectInfo.type);
    spinner.succeed('复制前端代码');
  }

  // 4. 生成环境配置文件
  spinner = ora('生成环境配置文件').start();
  await generateEnvFile(projectPath, projectInfo);
  spinner.succeed('生成环境配置文件');

  // 5. 生成模块配置文件
  spinner = ora('生成模块配置文件').start();
  await generateModulesConfig(projectPath, modules);
  spinner.succeed('生成模块配置文件');

  // 6. 生成 package.json
  spinner = ora('优化 package.json').start();
  await generatePackageJson(projectPath, projectInfo);
  spinner.succeed('优化 package.json');

  // 7. 复制配置文件
  spinner = ora('复制配置文件').start();
  await copyConfigFiles(projectPath);
  spinner.succeed('复制配置文件');

  // 8. 安装依赖
  if (!projectInfo.skipInstall) {
    spinner = ora('安装依赖 (这可能需要几分钟)').start();
    try {
      await installDependencies(projectPath, projectInfo.packageManager);
      spinner.succeed('安装依赖');
    } catch (error) {
      spinner.fail('安装依赖失败');
      logger.warning('请手动运行安装命令');
    }
  } else {
    logger.info('跳过依赖安装');
  }

  // 9. 初始化 Git
  if (!projectInfo.skipGit) {
    spinner = ora('初始化 Git 仓库').start();
    try {
      await execaCommand('git init', { cwd: projectPath });
      await execaCommand('git add .', { cwd: projectPath });
      await execaCommand('git commit -m "Initial commit from DoraCMS CLI"', {
        cwd: projectPath,
      });
      spinner.succeed('初始化 Git 仓库');
    } catch (error) {
      spinner.fail('Git 初始化失败');
      logger.warning('请手动初始化 Git 仓库');
    }
  } else {
    logger.info('跳过 Git 初始化');
  }
}

/**
 * 复制后端代码
 */
async function copyServerCode(projectPath: string): Promise<void> {
  const sourceRoot = path.resolve(__dirname, '../../../..');
  const serverSource = path.join(sourceRoot, 'server');
  const serverDest = path.join(projectPath, 'server');

  // 复制整个 server 目录
  await fs.copy(serverSource, serverDest, {
    filter: src => {
      // 排除 node_modules, logs, run 等目录
      const relativePath = path.relative(serverSource, src);
      const excludes = ['node_modules', 'logs', 'run', 'coverage', '.nyc_output', 'dist'];
      return !excludes.some(exclude => relativePath.startsWith(exclude));
    },
  });
}

/**
 * 复制前端代码
 */
async function copyClientCode(projectPath: string, projectType: string): Promise<void> {
  const sourceRoot = path.resolve(__dirname, '../../../..');
  const clientDest = path.join(projectPath, 'client');

  await fs.ensureDir(clientDest);

  if (projectType === 'fullstack') {
    // 复制所有前端项目
    const clientSource = path.join(sourceRoot, 'client');
    await fs.copy(clientSource, clientDest, {
      filter: src => {
        const relativePath = path.relative(clientSource, src);
        const excludes = ['node_modules', 'dist', '.nuxt', 'coverage'];
        return !excludes.some(exclude => relativePath.startsWith(exclude));
      },
    });
  } else if (projectType === 'user-separated') {
    // 只复制 user-center
    const userCenterSource = path.join(sourceRoot, 'client/user-center');
    const userCenterDest = path.join(clientDest, 'user-center');
    await fs.copy(userCenterSource, userCenterDest, {
      filter: src => {
        const relativePath = path.relative(userCenterSource, src);
        const excludes = ['node_modules', 'dist', 'coverage'];
        return !excludes.some(exclude => relativePath.startsWith(exclude));
      },
    });
  } else if (projectType === 'admin-separated') {
    // 只复制 admin-center
    const adminCenterSource = path.join(sourceRoot, 'client/admin-center');
    const adminCenterDest = path.join(clientDest, 'admin-center');
    await fs.copy(adminCenterSource, adminCenterDest, {
      filter: src => {
        const relativePath = path.relative(adminCenterSource, src);
        const excludes = ['node_modules', 'dist', 'coverage'];
        return !excludes.some(exclude => relativePath.startsWith(exclude));
      },
    });
  }
}

/**
 * 复制配置文件
 */
async function copyConfigFiles(projectPath: string): Promise<void> {
  const sourceRoot = path.resolve(__dirname, '../../../..');

  // 复制根目录配置文件
  const configFiles = ['.gitignore', '.prettierrc', '.prettierignore', 'pnpm-workspace.yaml', 'tsconfig.base.json'];

  for (const file of configFiles) {
    const source = path.join(sourceRoot, file);
    const dest = path.join(projectPath, file);
    if (await fs.pathExists(source)) {
      await fs.copy(source, dest);
    }
  }

  // 复制 scripts 目录
  const scriptsSource = path.join(sourceRoot, 'scripts');
  const scriptsDest = path.join(projectPath, 'scripts');
  if (await fs.pathExists(scriptsSource)) {
    await fs.copy(scriptsSource, scriptsDest, {
      filter: src => {
        const relativePath = path.relative(scriptsSource, src);
        return !relativePath.startsWith('node_modules');
      },
    });
  }

  // 复制 docker 目录（可选）
  const dockerSource = path.join(sourceRoot, 'docker');
  const dockerDest = path.join(projectPath, 'docker');
  if (await fs.pathExists(dockerSource)) {
    await fs.copy(dockerSource, dockerDest);
  }
}
