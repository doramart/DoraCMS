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
import { generatePluginConfig } from './plugin-config-generator';

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
  await copyServerCode(projectPath, projectInfo.type);
  spinner.succeed('复制后端代码');

  // 3. 根据项目类型配置路由文件
  spinner = ora('配置路由文件').start();
  await configureRouterFile(projectPath, projectInfo.type);
  spinner.succeed('配置路由文件');

  // 3. 清理模块相关的静态资源
  spinner = ora('清理模块相关资源').start();
  await cleanupModuleAssets(projectPath, modules);
  spinner.succeed('清理模块相关资源');

  // 4. 复制前端代码（根据项目类型）
  spinner = ora('复制前端代码').start();
  await copyClientCode(projectPath, projectInfo.type);
  spinner.succeed('复制前端代码');

  // 5. 生成环境配置文件
  spinner = ora('生成环境配置文件').start();
  await generateEnvFile(projectPath, projectInfo);
  spinner.succeed('生成环境配置文件');

  // 6. 生成模块配置文件
  spinner = ora('生成模块配置文件').start();
  await generateModulesConfig(projectPath, modules);
  spinner.succeed('生成模块配置文件');

  // 7. 生成插件配置文件
  spinner = ora('生成插件配置文件').start();
  await generatePluginConfig(projectPath, projectInfo);
  spinner.succeed('生成插件配置文件');

  // 8. 生成 package.json
  spinner = ora('优化 package.json').start();
  await generatePackageJson(projectPath, projectInfo);
  spinner.succeed('优化 package.json');

  // 9. 复制配置文件
  spinner = ora('复制配置文件').start();
  await copyConfigFiles(projectPath);
  spinner.succeed('复制配置文件');

  // 10. 安装依赖
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

  // 11. 初始化 Git
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
 * 清理模块相关的静态资源
 * 根据模块选择删除不需要的静态资源
 */
async function cleanupModuleAssets(projectPath: string, modules: ModuleSelection): Promise<void> {
  // 如果未启用 content 模块，删除 AI 助手的静态资源
  if (!modules.enabled.includes('content')) {
    const aiContentPublishPath = path.join(projectPath, 'server/backstage/remote-page/ai-content-publish');
    const aiModelManagePath = path.join(projectPath, 'server/backstage/remote-page/ai-model-manage');

    if (await fs.pathExists(aiContentPublishPath)) {
      await fs.remove(aiContentPublishPath);
    }

    if (await fs.pathExists(aiModelManagePath)) {
      await fs.remove(aiModelManagePath);
    }
  }
}

/**
 * 复制后端代码
 */
async function copyServerCode(projectPath: string, projectType: string): Promise<void> {
  // 从 CLI 包的 templates 目录复制
  // 在编译后，__dirname 指向 dist/，所以需要向上一级到 cli 目录，然后进入 templates
  const templatesRoot = path.resolve(__dirname, '../templates');
  const serverSource = path.join(templatesRoot, 'server');
  const serverDest = path.join(projectPath, 'server');

  // 检查模板是否存在
  if (!(await fs.pathExists(serverSource))) {
    throw new Error('Server 模板不存在，请确保 CLI 工具已正确构建');
  }

  // 根据项目类型过滤文件
  await fs.copy(serverSource, serverDest, {
    filter: src => {
      // backend-only: 只排除用户前端（保留 remote-page，因为它是后台管理的微前端模块）
      if (projectType === 'backend-only') {
        if (src.includes('/backstage/user-center')) {
          return false;
        }
      }

      // mobile-optimized: 保留所有（remote-page 用于后台管理）
      // admin-separated: 只排除用户中心（保留 remote-page）
      if (projectType === 'admin-separated') {
        if (src.includes('/backstage/user-center')) {
          return false;
        }
      }

      return true;
    },
  });
}

/**
 * 复制前端代码
 */
async function copyClientCode(projectPath: string, projectType: string): Promise<void> {
  // 从 CLI 包的 templates 目录复制
  const templatesRoot = path.resolve(__dirname, '../templates');
  const clientSource = path.join(templatesRoot, 'client');
  const clientDest = path.join(projectPath, 'client');

  // 检查模板是否存在
  if (!(await fs.pathExists(clientSource))) {
    throw new Error('Client 模板不存在，请确保 CLI 工具已正确构建');
  }

  await fs.ensureDir(clientDest);

  if (projectType === 'fullstack') {
    // 复制所有前端项目
    await fs.copy(clientSource, clientDest);
  } else if (projectType === 'mobile-optimized') {
    // 复制 admin-center 和 user-center（不包含 remote-page）
    const adminCenterSource = path.join(clientSource, 'admin-center');
    const adminCenterDest = path.join(clientDest, 'admin-center');
    const userCenterSource = path.join(clientSource, 'user-center');
    const userCenterDest = path.join(clientDest, 'user-center');

    if (await fs.pathExists(adminCenterSource)) {
      await fs.copy(adminCenterSource, adminCenterDest);
    }
    if (await fs.pathExists(userCenterSource)) {
      await fs.copy(userCenterSource, userCenterDest);
    }
  } else if (projectType === 'admin-separated' || projectType === 'backend-only') {
    // 只复制 admin-center
    const adminCenterSource = path.join(clientSource, 'admin-center');
    const adminCenterDest = path.join(clientDest, 'admin-center');

    if (await fs.pathExists(adminCenterSource)) {
      await fs.copy(adminCenterSource, adminCenterDest);
    }
  }
}

/**
 * 根据项目类型配置路由文件
 * 动态修改 router.js，移除不需要的路由
 */
async function configureRouterFile(projectPath: string, projectType: string): Promise<void> {
  const routerPath = path.join(projectPath, 'server/app/router.js');

  if (!(await fs.pathExists(routerPath))) {
    logger.warning('路由文件不存在，跳过配置');
    return;
  }

  let content = await fs.readFile(routerPath, 'utf-8');

  // backend-only 和 admin-separated: 移除前端页面路由
  if (projectType === 'backend-only' || projectType === 'admin-separated') {
    // 移除 home 和 users 路由行（包括换行符）
    content = content.replace(/\n\s*require\('\.\/router\/home'\)\(app\);?/g, '');
    content = content.replace(/\n\s*require\('\.\/router\/users'\)\(app\);?/g, '');

    // 更新注释并修复缩进
    content = content.replace(/\/\/ 页面渲染路由/, '  // 管理后台路由');

    // 修复 manage 路由的缩进
    content = content.replace(
      /\n\s+\/\/ 管理后台路由\n\s*require\('\.\/router\/manage'\)/,
      "\n\n  // 管理后台路由\n  require('./router/manage')"
    );

    logger.info(`已配置 ${projectType} 模式的路由文件`);
  }

  // mobile-optimized: 只移除 home 路由（保留 users 和 manage）
  if (projectType === 'mobile-optimized') {
    // 移除 home 路由
    content = content.replace(/\n\s*require\('\.\/router\/home'\)\(app\);?/g, '');

    logger.info(`已配置 ${projectType} 模式的路由文件`);
  }

  // 写回文件
  await fs.writeFile(routerPath, content, 'utf-8');
}

/**
 * 复制配置文件
 */
async function copyConfigFiles(projectPath: string): Promise<void> {
  // 从 CLI 包的 templates 目录复制
  const templatesRoot = path.resolve(__dirname, '../templates');

  // 复制根目录配置文件
  const configFiles = ['.gitignore', '.prettierrc', '.prettierignore', 'pnpm-workspace.yaml', 'tsconfig.base.json'];

  for (const file of configFiles) {
    const source = path.join(templatesRoot, file);
    const dest = path.join(projectPath, file);
    if (await fs.pathExists(source)) {
      await fs.copy(source, dest);
    }
  }

  // 复制 scripts 目录
  const scriptsSource = path.join(templatesRoot, 'scripts');
  const scriptsDest = path.join(projectPath, 'scripts');
  if (await fs.pathExists(scriptsSource)) {
    await fs.copy(scriptsSource, scriptsDest);
  }

  // 复制 docker 目录
  const dockerSource = path.join(templatesRoot, 'docker');
  const dockerDest = path.join(projectPath, 'docker');
  if (await fs.pathExists(dockerSource)) {
    await fs.copy(dockerSource, dockerDest);
  }

  // 复制 Docker 相关文件
  const dockerFiles = [
    'Dockerfile',
    'docker-compose.yml',
    'docker-quickstart.sh',
    '.dockerignore',
    'docker.env.example',
    'docker.env.mariadb.example',
  ];

  for (const file of dockerFiles) {
    const source = path.join(templatesRoot, file);
    const dest = path.join(projectPath, file);
    if (await fs.pathExists(source)) {
      await fs.copy(source, dest);
    }
  }
}
