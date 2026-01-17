/**
 * create 命令实现
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import type { CreateOptions, ProjectInfo } from '../types';
import { logger } from '../utils/logger';
import { validateProjectName, checkDirectoryExists, isDirectoryEmpty, getProjectPath } from '../utils/validator';
import { detectPackageManager, installDependencies } from '../utils/package-manager';
import { promptProjectInfo } from './prompts/project-info';
import { promptModuleSelection } from './prompts/module-selection';
import { promptPluginSelection } from './prompts/plugin-selection';
import { generateProject } from '../generators/project-generator';

export async function createProject(projectName: string, options: CreateOptions) {
  try {
    // 显示欢迎信息
    console.log(chalk.cyan.bold('\n🎉 欢迎使用 DoraCMS CLI!\n'));

    // 1. 验证项目名称
    const validation = validateProjectName(projectName);
    if (validation !== true) {
      logger.error(validation as string);
      process.exit(1);
    }

    // 2. 检查目录
    const projectPath = getProjectPath(projectName);
    if (checkDirectoryExists(projectPath)) {
      if (!isDirectoryEmpty(projectPath)) {
        logger.error(`目录 ${projectName} 已存在且不为空`);
        process.exit(1);
      }
    }

    // 3. 获取项目信息
    const projectInfo = await promptProjectInfo(projectName, options);

    // 4. 选择模块
    const modules = await promptModuleSelection(projectInfo.type);

    // 5. 选择插件（根据模块选择智能推荐）
    const plugins = await promptPluginSelection(projectInfo.type, modules);
    projectInfo.enableAiAssistant = plugins.enableAiAssistant;

    // 6. 确认创建
    logger.separator();
    logger.title('📋 项目配置确认');
    console.log(chalk.gray('项目名称:'), chalk.white(projectInfo.name));
    console.log(chalk.gray('项目类型:'), chalk.white(getProjectTypeLabel(projectInfo.type)));
    console.log(chalk.gray('数据库:'), chalk.white(getDatabaseLabel(projectInfo.database)));
    console.log(chalk.gray('包管理器:'), chalk.white(projectInfo.packageManager));
    console.log(chalk.gray('示例数据:'), chalk.white(projectInfo.sampleData ? '是' : '否'));
    console.log(
      chalk.gray('启用模块:'),
      chalk.white(
        modules.enabled.filter(
          m => !['user', 'admin', 'role', 'menu', 'systemConfig', 'uploadFile', 'apiKey', 'mail'].includes(m)
        ).length + ' 个'
      )
    );
    console.log(chalk.gray('AI 助手:'), chalk.white(projectInfo.enableAiAssistant ? '启用' : '禁用'));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '确认创建项目?',
        default: true,
      },
    ]);

    if (!confirm) {
      logger.warning('已取消创建');
      process.exit(0);
    }

    // 6. 创建项目
    logger.separator();
    logger.title('🚀 开始创建项目');

    await generateProject(projectPath, projectInfo, modules);

    // 7. 显示成功信息
    showSuccessMessage(projectInfo, modules);
  } catch (error) {
    logger.error('创建项目失败');
    console.error(error);
    process.exit(1);
  }
}

function getProjectTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    fullstack: '完整全栈项目',
    'backend-only': '纯后端 API (Headless CMS)',
    'user-separated': '前后端分离 - 用户端',
    'admin-separated': '前后端分离 - 管理端',
    'mobile-optimized': '移动端适配',
  };
  return labels[type] || type;
}

function getDatabaseLabel(database: string): string {
  const labels: Record<string, string> = {
    mongodb: 'MongoDB',
    mariadb: 'MariaDB',
    both: '双数据库支持',
  };
  return labels[database] || database;
}

function showSuccessMessage(projectInfo: ProjectInfo, modules: any) {
  logger.separator();
  logger.title('🎉 项目创建成功！');

  console.log(chalk.bold('项目信息:'));
  console.log(chalk.gray('  名称:'), chalk.white(projectInfo.name));
  console.log(chalk.gray('  类型:'), chalk.white(getProjectTypeLabel(projectInfo.type)));
  console.log(chalk.gray('  数据库:'), chalk.white(getDatabaseLabel(projectInfo.database)));
  console.log(chalk.gray('  路径:'), chalk.white(getProjectPath(projectInfo.name)));

  // 显示启用的模块
  const enabledBusinessModules = modules.enabled.filter(
    (m: string) => !['user', 'admin', 'role', 'menu', 'systemConfig', 'uploadFile', 'apiKey', 'mail'].includes(m)
  );

  if (enabledBusinessModules.length > 0) {
    console.log(chalk.bold('\n已启用的模块:'));
    enabledBusinessModules.forEach((m: string) => {
      console.log(chalk.green('  ✓'), m);
    });
  }

  if (modules.disabled.length > 0) {
    console.log(chalk.bold('\n已禁用的模块:'));
    modules.disabled.forEach((m: string) => {
      console.log(chalk.gray('  ✗'), m);
    });
  }

  // 显示插件状态
  console.log(chalk.bold('\n插件状态:'));
  console.log(chalk.green('  ✓ Dora 中台管理'));
  console.log(chalk.green('  ✓ Swagger API 文档'));
  if (projectInfo.enableAiAssistant) {
    console.log(chalk.green('  ✓ AI 助手'));
  } else {
    console.log(chalk.gray('  ✗ AI 助手 (已禁用)'));
  }

  // 下一步提示
  console.log(chalk.bold('\n下一步:'));
  console.log(chalk.cyan(`  cd ${projectInfo.name}`));

  // 检查是否跳过了依赖安装
  if (projectInfo.skipInstall) {
    console.log(chalk.cyan('  pnpm install'));
    console.log(chalk.gray('  # 安装项目依赖'));
  }

  console.log(chalk.cyan('  nano .env'));
  console.log(chalk.gray('  # 编辑 .env 文件，配置数据库连接'));
  console.log(chalk.gray('  # .env 文件已自动生成，包含默认配置'));

  if (projectInfo.type === 'fullstack') {
    console.log(chalk.cyan('  pnpm run dev:all'));
    console.log(chalk.gray('\n访问应用:'));
    console.log(chalk.gray('  管理后台:'), 'http://localhost:8080');
    console.log(chalk.gray('  用户中心:'), 'http://localhost:3000');
    console.log(chalk.gray('  后端 API:'), 'http://localhost:7001');
  } else if (projectInfo.type === 'backend-only') {
    console.log(chalk.cyan('  pnpm run dev:server'));
    console.log(chalk.gray('\n访问 API:'));
    console.log(chalk.gray('  后端 API:'), 'http://localhost:7001');
    console.log(chalk.gray('  API 文档:'), 'http://localhost:7001/swagger-ui.html');
  } else {
    console.log(chalk.cyan('  pnpm run dev'));
    console.log(chalk.gray('\n访问应用:'));
    console.log(chalk.gray('  用户中心:'), 'http://localhost:3000');
    console.log(chalk.gray('  后端 API:'), 'http://localhost:7001');
  }

  console.log(chalk.gray('\n文档:'), 'https://docs.doracms.com');
  console.log();
}
