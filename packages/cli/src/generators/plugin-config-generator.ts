/**
 * 插件配置生成器
 * 根据用户选择生成 server/config/plugin.js 文件
 */

import path from 'path';
import fs from 'fs-extra';
import type { ProjectInfo } from '../types';

export async function generatePluginConfig(projectPath: string, projectInfo: ProjectInfo): Promise<void> {
  const pluginConfigPath = path.join(projectPath, 'server/config/plugin.js');

  // 读取模板文件
  const content = await fs.readFile(pluginConfigPath, 'utf-8');

  // 根据用户选择修改 AI 助手插件的 enable 状态
  const enableAiAssistant = projectInfo.enableAiAssistant !== false; // 默认启用

  // 替换 aiAssistant 插件配置
  const updatedContent = content.replace(
    /exports\.aiAssistant = \{[\s\S]*?enable: true,[\s\S]*?\};/,
    `exports.aiAssistant = {\n  enable: ${enableAiAssistant},\n  path: path.join(__dirname, '../lib/plugin/egg-ai-assistant'),\n};`
  );

  // 写回文件
  await fs.writeFile(pluginConfigPath, updatedContent, 'utf-8');
}
