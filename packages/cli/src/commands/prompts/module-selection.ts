/**
 * 模块选择交互提示
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { CORE_MODULES, BUSINESS_MODULES } from '../../config/modules';
import { ModuleDependencyResolver } from '../../utils/module-dependency';
import { ModuleRecommender } from '../../utils/module-recommender';
import { getProjectTypeName } from '../../config/presets';
import type { ModuleSelection } from '../../types';

export async function promptModuleSelection(projectType: string): Promise<ModuleSelection> {
  console.log(chalk.cyan('\n─────────────────────────────────────────────────'));
  console.log(chalk.cyan('📦 后端模块配置'));
  console.log(chalk.cyan('─────────────────────────────────────────────────\n'));

  // 显示核心模块
  console.log(chalk.cyan('核心模块（必需，自动启用）:'));
  console.log(chalk.gray('  【用户系统】'));
  console.log(chalk.green('    ✓ 用户管理 - 前台用户认证'));
  console.log(chalk.gray('  【后台管理】'));
  console.log(chalk.green('    ✓ 管理员管理 - 后台管理员认证'));
  console.log(chalk.green('    ✓ 角色权限 - 角色和权限管理'));
  console.log(chalk.green('    ✓ 菜单管理 - 后台导航菜单'));
  console.log(chalk.gray('  【系统功能】'));
  console.log(chalk.green('    ✓ 系统配置'));
  console.log(chalk.green('    ✓ 文件上传'));
  console.log(chalk.green('    ✓ API Key'));
  console.log(chalk.green('    ✓ 邮件通知 - 用户注册验证、密码重置等'));

  // 获取推荐配置
  const recommender = new ModuleRecommender();
  const recommendation = recommender.recommend(projectType);
  const message = recommender.getRecommendationMessage(projectType);

  console.log(chalk.yellow(`\n💡 推荐配置（${getProjectTypeName(projectType)}）:`));
  console.log(chalk.gray(`  ${message}\n`));

  // 让用户选择业务模块
  const { selectedModules } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedModules',
      message: '选择业务模块:',
      choices: Object.entries(BUSINESS_MODULES).map(([key, config]) => {
        const isRequired = recommendation.required.includes(key);
        const isRecommended = recommendation.recommended.includes(key);

        let name = `${config.name} - ${config.description}`;
        if (isRequired) {
          name += chalk.yellow(' (必需)');
        } else if (isRecommended) {
          name += chalk.cyan(' (推荐)');
        }

        // 显示依赖关系
        if (config.dependencies.length > 0) {
          const deps = config.dependencies
            .filter(d => !['user', 'uploadFile'].includes(d))
            .map(d => BUSINESS_MODULES[d]?.name || d);
          if (deps.length > 0) {
            name += chalk.gray(` (依赖: ${deps.join(', ')})`);
          }
        }

        return {
          name,
          value: key,
          checked: isRequired || isRecommended,
        };
      }),
    },
  ]);

  // 解析依赖
  const allModules = { ...CORE_MODULES, ...BUSINESS_MODULES };
  const resolver = new ModuleDependencyResolver(allModules);
  const result = resolver.resolve(selectedModules);

  // 显示自动启用的模块
  if (result.autoEnabled.length > 0) {
    console.log(chalk.yellow('\n✔ 自动启用依赖模块:'));
    for (const moduleName of result.autoEnabled) {
      const config = allModules[moduleName];
      console.log(chalk.yellow(`  ✓ ${config.name} (被其他模块依赖)`));
    }
  }

  // 检查冲突
  if (result.conflicts.length > 0) {
    console.log(chalk.red('\n⚠️  依赖冲突:'));
    for (const conflict of result.conflicts) {
      console.log(chalk.red(`  ✗ ${conflict}`));
    }

    const { continueAnyway } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAnyway',
        message: '检测到依赖冲突，是否继续?',
        default: false,
      },
    ]);

    if (!continueAnyway) {
      return promptModuleSelection(projectType);
    }
  }

  // 确认
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '确认模块选择?',
      default: true,
    },
  ]);

  if (!confirm) {
    return promptModuleSelection(projectType);
  }

  return result;
}
