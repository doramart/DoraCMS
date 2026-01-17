/**
 * 插件选择交互提示
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import type { PluginSelection, ModuleSelection } from '../../types';

export async function promptPluginSelection(projectType: string, modules: ModuleSelection): Promise<PluginSelection> {
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

  // 如果启用了 content 模块，自动启用 AI 助手插件
  if (hasContentModule) {
    console.log(chalk.yellow('\n💡 可选插件:'));
    console.log(chalk.green('  ✓ AI 助手 - AI 内容生成和图片生成（支持 OpenAI、DeepSeek、Ollama、豆包）'));
    console.log(chalk.cyan('  检测到启用了内容管理模块，自动启用 AI 助手以增强内容创作能力\n'));

    return { enableAiAssistant: true };
  }

  // 如果没有 content 模块，不提供 AI 助手选项
  console.log(chalk.yellow('\n💡 可选插件:'));
  console.log(chalk.gray('  AI 助手 - AI 内容生成和图片生成（支持 OpenAI、DeepSeek、Ollama、豆包）'));
  console.log(chalk.gray('  ⚠️  AI 助手依赖内容管理模块，当前未启用内容管理，已自动禁用 AI 助手\n'));

  return { enableAiAssistant: false };
}
