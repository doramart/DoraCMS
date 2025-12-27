/**
 * 项目信息交互提示
 */

import inquirer from 'inquirer';
import type { CreateOptions, ProjectInfo } from '../../types';
import { detectPackageManager } from '../../utils/package-manager';

export async function promptProjectInfo(projectName: string, options: CreateOptions): Promise<ProjectInfo> {
  // 如果使用 --yes 选项，使用默认配置
  if (options.yes) {
    return {
      name: projectName,
      type: (options.template as any) || 'fullstack',
      database: (options.database as any) || 'mongodb',
      packageManager: (options.packageManager as any) || (await detectPackageManager()),
      sampleData: true,
      skipInstall: options.skipInstall,
      skipGit: options.skipGit,
    };
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '项目名称:',
      default: projectName,
    },
    {
      type: 'list',
      name: 'type',
      message: '选择项目类型:',
      default: options.template || 'fullstack',
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
    },
    {
      type: 'list',
      name: 'database',
      message: '选择数据库:',
      default: options.database || 'mongodb',
      choices: [
        { name: 'MongoDB (推荐)', value: 'mongodb' },
        { name: 'MariaDB', value: 'mariadb' },
        { name: '双数据库支持 (高级)', value: 'both' },
      ],
    },
    {
      type: 'list',
      name: 'packageManager',
      message: '选择包管理器:',
      default: options.packageManager || (await detectPackageManager()),
      choices: [
        { name: 'pnpm (推荐)', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
      ],
    },
    {
      type: 'confirm',
      name: 'sampleData',
      message: '是否包含示例数据?',
      default: true,
    },
  ]);

  return {
    ...answers,
    skipInstall: options.skipInstall,
    skipGit: options.skipGit,
  };
}
