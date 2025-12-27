/**
 * 模块推荐器
 */

import { MODULE_PRESETS } from '../config/presets';

export class ModuleRecommender {
  /**
   * 根据项目类型推荐模块
   */
  recommend(projectType: string): {
    required: string[];
    recommended: string[];
    optional: string[];
  } {
    const preset = MODULE_PRESETS[projectType];

    if (!preset) {
      // 默认推荐
      return {
        required: ['content'],
        recommended: ['comment', 'mail'],
        optional: ['webhook', 'menu', 'role', 'ads', 'template', 'plugin'],
      };
    }

    return {
      required: preset.required,
      recommended: preset.optional.slice(0, 2), // 前 2 个可选项作为推荐
      optional: preset.optional.slice(2),
    };
  }

  /**
   * 生成推荐说明
   */
  getRecommendationMessage(projectType: string): string {
    const preset = MODULE_PRESETS[projectType];
    return preset?.description || '根据需求选择模块';
  }
}
