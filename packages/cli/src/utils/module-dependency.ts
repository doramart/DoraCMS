/**
 * 模块依赖解析器
 */

import type { ModuleConfig, ModuleSelection } from '../types';

export class ModuleDependencyResolver {
  private modules: Record<string, ModuleConfig>;

  constructor(modules: Record<string, ModuleConfig>) {
    this.modules = modules;
  }

  /**
   * 解析用户选择，自动处理依赖
   */
  resolve(selectedModules: string[]): ModuleSelection {
    const enabled = new Set<string>(selectedModules);
    const autoEnabled: string[] = [];
    const conflicts: string[] = [];

    // 1. 添加核心模块（始终启用）
    for (const [key, config] of Object.entries(this.modules)) {
      if (config.required) {
        enabled.add(key);
      }
    }

    // 2. 自动启用依赖的模块
    let changed = true;
    while (changed) {
      changed = false;
      for (const moduleName of enabled) {
        const config = this.modules[moduleName];
        if (!config) continue;

        for (const dep of config.dependencies) {
          if (!enabled.has(dep)) {
            enabled.add(dep);
            autoEnabled.push(dep);
            changed = true;
          }
        }
      }
    }

    // 3. 检查冲突（被依赖的模块被禁用）
    for (const [key, config] of Object.entries(this.modules)) {
      if (!enabled.has(key)) {
        // 检查是否有启用的模块依赖它
        for (const enabledModule of enabled) {
          const enabledConfig = this.modules[enabledModule];
          if (enabledConfig?.dependencies.includes(key)) {
            conflicts.push(`${enabledModule} 依赖 ${key}`);
          }
        }
      }
    }

    // 4. 计算禁用的模块
    const disabled = Object.keys(this.modules).filter(key => !enabled.has(key) && !this.modules[key].required);

    return {
      enabled: Array.from(enabled),
      disabled,
      autoEnabled,
      conflicts,
    };
  }

  /**
   * 获取禁用某个模块的影响
   */
  getDisableImpact(moduleName: string): {
    affectedModules: string[];
    canDisable: boolean;
  } {
    const config = this.modules[moduleName];
    if (!config) {
      return { affectedModules: [], canDisable: false };
    }

    // 核心模块不能禁用
    if (config.required) {
      return { affectedModules: [], canDisable: false };
    }

    // 查找依赖此模块的其他模块
    const affectedModules = config.dependedBy || [];

    return {
      affectedModules,
      canDisable: true,
    };
  }

  /**
   * 拓扑排序（确保依赖的模块先加载）
   */
  topologicalSort(modules: string[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      visiting.add(name);

      const config = this.modules[name];
      if (config) {
        for (const dep of config.dependencies) {
          if (modules.includes(dep)) {
            visit(dep);
          }
        }
      }

      visiting.delete(name);
      visited.add(name);
      sorted.push(name);
    };

    for (const name of modules) {
      visit(name);
    }

    return sorted;
  }
}
