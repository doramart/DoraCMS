/**
 * 项目信息交互提示
 */

import inquirer from 'inquirer';
import type { CreateOptions, ProjectInfo } from '../../types';
import { detectPackageManager } from '../../utils/package-manager';

export async function promptProjectInfo(projectName: string, options: CreateOptions): Promise<ProjectInfo> {
  // 如果使用 --yes 选项，或者所有必需选项都已提供，使用非交互模式
  const hasAllOptions = options.template && options.database && options.packageManager;

  if (options.yes || hasAllOptions) {
    return {
      name: projectName,
      type: (options.template as any) || 'fullstack',
      database: (options.database as any) || 'mongodb',
      packageManager: (options.packageManager as any) || (await detectPackageManager()),
      sampleData: true,
      skipInstall: options.skipInstall || false,
      skipGit: options.skipGit || false,
    };
  }

  // 构建交互式问题列表，只询问未提供的选项
  const questions: any[] = [];

  // 项目名称（总是询问，允许用户修改）
  questions.push({
    type: 'input',
    name: 'name',
    message: '项目名称:',
    default: projectName,
  });

  // 项目类型
  if (!options.template) {
    questions.push({
      type: 'list',
      name: 'type',
      message: '选择项目类型:',
      default: 'fullstack',
      choices: [
        { name: '完整全栈项目 (推荐学习)', value: 'fullstack' },
        { name: '纯后端 API (Headless CMS)', value: 'backend-only' },
        { name: '前后端分离 - 用户端', value: 'user-separated' },
        new inquirer.Separator('─────────────────────────'),
        {
          name: '前后端分离 - 管理端 (开发中)',
          value: 'admin-separated',
          disabled: '即将推出',
        },
        {
          name: '移动端适配 (开发中)',
          value: 'mobile-optimized',
          disabled: '即将推出',
        },
      ],
    });
  }

  // 数据库类型
  if (!options.database) {
    questions.push({
      type: 'list',
      name: 'database',
      message: '选择数据库:',
      default: 'mongodb',
      choices: [
        { name: 'MongoDB (推荐)', value: 'mongodb' },
        { name: 'MariaDB', value: 'mariadb' },
        { name: '双数据库支持 (高级)', value: 'both' },
      ],
    });
  }

  // 包管理器
  if (!options.packageManager) {
    questions.push({
      type: 'list',
      name: 'packageManager',
      message: '选择包管理器:',
      default: await detectPackageManager(),
      choices: [
        { name: 'pnpm (推荐)', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
      ],
    });
  }

  // 示例数据（总是询问）
  questions.push({
    type: 'confirm',
    name: 'sampleData',
    message: '是否包含示例数据?',
    default: true,
  });

  const answers = await inquirer.prompt(questions);

  // 合并命令行选项和交互式答案
  return {
    name: answers.name || projectName,
    type: (options.template as any) || answers.type || 'fullstack',
    database: (options.database as any) || answers.database || 'mongodb',
    packageManager: (options.packageManager as any) || answers.packageManager || (await detectPackageManager()),
    sampleData: answers.sampleData !== undefined ? answers.sampleData : true,
    skipInstall: options.skipInstall || false,
    skipGit: options.skipGit || false,
  };
}
