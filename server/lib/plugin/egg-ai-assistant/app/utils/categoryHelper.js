/**
 * 分类辅助工具类
 * 提供分类树操作的公共方法
 *
 * @author DoraCMS Team
 * @date 2025-10-16
 */

'use strict';

class CategoryHelper {
  /**
   * 从分类列表中提取所有叶子节点（最底层分类）
   * @param {Array} categoryList - 分类列表（可能是树形结构或扁平结构）
   * @return {Object} { allCategories, leafCategories }
   * @static
   */
  static extractLeafCategories(categoryList) {
    // 递归提取所有分类（包括子分类）到扁平数组
    const extractAllCategories = categories => {
      const allCategories = [];
      const addCategory = cat => {
        allCategories.push(cat);
        if (cat.children && cat.children.length > 0) {
          cat.children.forEach(child => addCategory(child));
        }
      };
      categories.forEach(cat => addCategory(cat));
      return allCategories;
    };

    // 先展开所有分类（包括嵌套的子分类）
    const allCategories = extractAllCategories(categoryList);

    // 找出所有叶子节点（最底层分类）
    const findLeafCategories = categories => {
      return categories.filter(cat => {
        // 方法1: 通过 children 属性判断（如果数据是树形结构）
        if (cat.children !== undefined) {
          return !cat.children || cat.children.length === 0;
        }

        // 方法2: 通过检查是否有其他分类的 parentId 指向当前分类（如果数据是扁平结构）
        const hasChildren = categories.some(c => {
          const parentId = c.parentId;
          const catId = cat.id || cat._id;
          return parentId !== null && parentId !== undefined && parentId == catId;
        });
        return !hasChildren;
      });
    };

    return {
      allCategories,
      leafCategories: findLeafCategories(allCategories),
    };
  }

  /**
   * 构建分类的父子路径（从父到子的ID数组）
   * @param {Object} matchedCategory - 匹配的分类
   * @param {Array} allCategories - 所有分类的扁平数组
   * @param {Object} logger - 日志对象（可选）
   * @return {Array} 父子ID数组，如 [4, 14]
   * @static
   */
  static buildCategoryPath(matchedCategory, allCategories, logger = null) {
    const categoryPath = [];
    let currentCat = matchedCategory;

    // 向上查找父级分类，构建完整路径
    while (currentCat) {
      // 获取ID（保持原始类型，可能是数字或字符串）
      const catId = currentCat.id || currentCat._id;

      // 添加到路径开头（因为是从子向父遍历）
      categoryPath.unshift(catId);

      // 检查是否有父级分类
      const hasParent = currentCat.parentId !== null && currentCat.parentId !== undefined && currentCat.parentId !== '';

      if (hasParent) {
        // 在完整分类列表中查找父级分类
        const parentId = currentCat.parentId;
        currentCat = allCategories.find(cat => {
          const id = cat.id || cat._id;
          return id == parentId; // 使用 == 比较，自动类型转换
        });

        if (!currentCat) {
          if (logger) {
            logger.warn(`[CategoryHelper] 未找到父级分类 ID: ${parentId}`);
          }
          break;
        }
      } else {
        // 已经是顶级分类，退出循环
        break;
      }
    }

    return categoryPath;
  }

  /**
   * 在分类列表中查找匹配的分类
   * @param {String} categoryName - 分类名称
   * @param {Array} categories - 分类列表
   * @return {Object|null} 匹配的分类对象
   * @static
   */
  static findMatchedCategory(categoryName, categories) {
    return categories.find(
      cat =>
        cat.name === categoryName ||
        cat.enName === categoryName ||
        cat.name.includes(categoryName) ||
        categoryName.includes(cat.name)
    );
  }

  /**
   * 格式化分类列表（用于AI）
   * @param {Array} categories - 分类列表
   * @return {Array} 格式化后的分类列表
   * @static
   */
  static formatCategoriesForAI(categories) {
    return categories.map(cat => ({
      id: cat.id || cat._id,
      name: cat.name,
      enName: cat.enName,
      description: cat.description || '',
      parentId: cat.parentId || null,
    }));
  }
}

module.exports = CategoryHelper;
