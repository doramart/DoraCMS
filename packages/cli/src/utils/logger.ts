/**
 * 日志工具
 */

import chalk from 'chalk';

export const logger = {
  info(message: string) {
    console.log(chalk.blue('ℹ'), message);
  },

  success(message: string) {
    console.log(chalk.green('✔'), message);
  },

  warning(message: string) {
    console.log(chalk.yellow('⚠'), message);
  },

  error(message: string) {
    console.log(chalk.red('✖'), message);
  },

  step(message: string) {
    console.log(chalk.cyan('→'), message);
  },

  title(message: string) {
    console.log('\n' + chalk.bold.cyan(message) + '\n');
  },

  separator() {
    console.log(chalk.gray('─'.repeat(60)));
  },
};
