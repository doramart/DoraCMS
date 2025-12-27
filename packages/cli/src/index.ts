#!/usr/bin/env node

import { Command } from 'commander';
import updateNotifier from 'update-notifier';
import { createProject } from './commands/create';
import { version, name } from '../package.json';

// 检查更新
const notifier = updateNotifier({
  pkg: { name, version },
  updateCheckInterval: 1000 * 60 * 60 * 24, // 24 小时
});

if (notifier.update) {
  notifier.notify({
    isGlobal: true,
    message: '发现新版本 {updateFrom} → {updateTo}\n' + '运行 {updateCommand} 更新',
  });
}

const program = new Command();

program
  .name('doracms')
  .description('DoraCMS CLI - 项目脚手架和开发工具')
  .version(version, '-v, --version', '显示版本号')
  .helpOption('-h, --help', '显示帮助信息');

// create 命令
program
  .command('create <project-name>')
  .description('创建新的 DoraCMS 项目')
  .option('-t, --template <template>', '项目模板类型')
  .option('-d, --database <database>', '数据库类型 (mongodb/mariadb)')
  .option('-p, --package-manager <pm>', '包管理器 (pnpm/npm/yarn)')
  .option('--skip-install', '跳过依赖安装')
  .option('--skip-git', '跳过 Git 初始化')
  .option('-y, --yes', '使用默认配置，跳过交互')
  .action(createProject);

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
