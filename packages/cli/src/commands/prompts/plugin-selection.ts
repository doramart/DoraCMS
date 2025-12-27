/**
 * 插件选择交互提示
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import type { PluginSelection, ModuleSelection } from '../../types';

export async function promptPluginSelection(
  projectType: string,
  modules: ModuleSelection
): Promise<PluginSelection> {
  console.log(chalk.cyan('\n─────────────────────────────────────────────────'));
  console.log(chalk.cyan('🔌 EggJS 插件配置'));
  console.log(chalk.cyan('─────────────────────────────────────────────────\n'));

  // 显示核心插件
  console.log(chalk.cyan('核心插件（必需，自动启用）:'));
  console.log(chalk.green('  ✓ Nunjucks 模板引擎'));
  console.log(chalk.green('  ✓ Session 会话管理'));
  console.log(chalk.green('  ✓ Redis 缓存'));
  console.log(chalk.green('  ✓ Dora 数据验证'));
  console.log(chalk.green('  ✓ Dora 中台管理'));
  console.log(chalk.green('  ✓ Swagger API 文档'));

  // 检查是否启用了 content 模块
  const hasContentModule = modules.enabled.includes('content');

  // 根据项目类型和模块选择决定是否推荐
  const shouldRecommend =
    hasContentModule || ['fullstack', 'backend-only', 'user-separated', 'admin-separated'].includes(projectType);

  console.log(chalk.yellow('\n💡 可选插件:'));
  console.log(chalk.gray('  AI 助手 - AI 内容生成和图片生成（支持 OpenAI、DeepSeek、Ollama、豆包）'));
  
  if (hasContentModule) {
    console.log(chalk.cyan('  检测到启用了内容管理模块，强烈推荐启用 AI 助手以增强内容创作能力\n'));
  } else if (shouldRecommend) {
    console.log(chalk.cyan('  推荐启用以增强内容创作能力\n'));
  } else {
    console.log(chalk.gray('  根据需求选择是否启用\n'));
  }

  // 询问是否启用 AI 助手
  const { enableAiAssistant } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableAiAssistant',
      message: '是否启用 AI 助手插件?',
      default: shouldRecommend,
    },
  ]);

  return { enableAiAssistant };
}
