/**
 * 模块配置文件生成器
 */

import path from 'path';
import fs from 'fs-extra';
import { CORE_MODULES, BUSINESS_MODULES } from '../config/modules';
import { ModuleDependencyResolver } from '../utils/module-dependency';
import type { ModuleSelection } from '../types';

export async function generateModulesConfig(projectPath: string, modules: ModuleSelection): Promise<void> {
  const allModules = { ...CORE_MODULES, ...BUSINESS_MODULES };
  const resolver = new ModuleDependencyResolver(allModules);

  // 拓扑排序，确保依赖顺序
  const sortedModules = resolver.topologicalSort(modules.enabled);

  // 构建配置对象
  const config: any = {
    core: {},
    business: {},
  };

  // 添加启用的模块
  for (const moduleName of sortedModules) {
    const moduleConfig = allModules[moduleName];
    if (!moduleConfig) continue;

    const configEntry = {
      enabled: true,
      name: moduleConfig.name,
      description: moduleConfig.description,
      repositories: moduleConfig.repositories,
      services: moduleConfig.services,
      controllers: moduleConfig.controllers,
      routes: moduleConfig.routes,
      dependencies: moduleConfig.dependencies,
    };

    // 如果模块有 aiRepositories，也添加到配置中
    if (moduleConfig.aiRepositories) {
      (configEntry as any).aiRepositories = moduleConfig.aiRepositories;
    }

    if (moduleConfig.required) {
      config.core[moduleName] = configEntry;
    } else {
      config.business[moduleName] = configEntry;
    }
  }

  // 添加禁用的模块（保留配置，但设置 enabled: false）
  for (const [key, moduleConfig] of Object.entries(BUSINESS_MODULES)) {
    if (!modules.enabled.includes(key)) {
      const disabledEntry: any = {
        enabled: false,
        name: moduleConfig.name,
        description: moduleConfig.description,
        repositories: moduleConfig.repositories,
        services: moduleConfig.services,
        controllers: moduleConfig.controllers,
        routes: moduleConfig.routes,
        dependencies: moduleConfig.dependencies,
      };

      // 如果模块有 aiRepositories，也添加到配置中
      if (moduleConfig.aiRepositories) {
        disabledEntry.aiRepositories = moduleConfig.aiRepositories;
      }

      config.business[key] = disabledEntry;
    }
  }

  // 生成配置文件内容
  const configContent = `/**
 * DoraCMS 模块配置
 * 
 * 此文件由 CLI 自动生成
 * 可以手动修改来启用/禁用模块
 * 
 * 注意：
 * 1. 核心模块不能禁用
 * 2. 禁用模块时请注意依赖关系
 * 3. 修改后需要重启应用
 */

'use strict';

module.exports = ${JSON.stringify(config, null, 2)};
`;

  // 写入文件
  const configPath = path.join(projectPath, 'server/config/modules.config.js');
  await fs.ensureDir(path.dirname(configPath));
  await fs.writeFile(configPath, configContent, 'utf-8');
}
