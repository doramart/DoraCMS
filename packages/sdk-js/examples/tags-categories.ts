/**
 * 标签和分类使用示例
 */

import { DoraCMSClient } from '@doracms/sdk';

async function main() {
  // 创建客户端
  const client = new DoraCMSClient({
    apiUrl: 'http://localhost:8080',
  });

  // ============================================
  // 1. 获取标签列表
  // ============================================
  console.log('\n=== 获取标签列表 ===');
  
  // 获取所有标签（分页）
  const tags = await client.content.getTags({
    page: 1,
    pageSize: 20,
  });
  
  console.log('标签列表:', tags);
  console.log('总数:', tags.total);
  console.log('标签:', tags.items.map(tag => tag.name).join(', '));

  // 搜索标签
  const searchedTags = await client.content.getTags({
    keyword: 'JavaScript',
    page: 1,
    pageSize: 10,
  });
  
  console.log('搜索结果:', searchedTags.items);

  // 获取热门标签
  const hotTags = await client.content.getTags({
    hot: true,
    pageSize: 10,
  });
  
  console.log('热门标签:', hotTags.items);

  // ============================================
  // 2. 获取分类列表
  // ============================================
  console.log('\n=== 获取分类列表 ===');
  
  // 获取分类列表（分页）
  const categories = await client.content.getCategories({
    page: 1,
    pageSize: 20,
  });
  
  console.log('分类列表:', categories);
  if ('total' in categories) {
    console.log('总数:', categories.total);
    console.log('分类:', categories.items.map(cat => cat.name).join(', '));
  }

  // 获取分类树（树形结构）
  const categoryTree = await client.content.getCategories({
    tree: true,
  });
  
  console.log('分类树:', categoryTree);
  if (Array.isArray(categoryTree)) {
    console.log('顶级分类数量:', categoryTree.length);
    
    // 打印树形结构
    function printTree(categories: any[], level = 0) {
      categories.forEach(cat => {
        console.log('  '.repeat(level) + '- ' + cat.name);
        if (cat.children && cat.children.length > 0) {
          printTree(cat.children, level + 1);
        }
      });
    }
    
    printTree(categoryTree);
  }

  // 只获取启用的分类
  const enabledCategories = await client.content.getCategories({
    enable: true,
    page: 1,
    pageSize: 20,
  });
  
  console.log('启用的分类:', enabledCategories);

  // ============================================
  // 3. 获取单个分类详情
  // ============================================
  console.log('\n=== 获取分类详情 ===');
  
  if (Array.isArray(categoryTree) && categoryTree.length > 0) {
    const firstCategory = categoryTree[0];
    const categoryDetail = await client.content.getCategory(firstCategory.id);
    
    console.log('分类详情:', categoryDetail);
    console.log('分类名称:', categoryDetail.name);
    console.log('分类描述:', categoryDetail.description);
  }

  // ============================================
  // 4. 根据分类获取内容
  // ============================================
  console.log('\n=== 根据分类获取内容 ===');
  
  if (Array.isArray(categoryTree) && categoryTree.length > 0) {
    const firstCategory = categoryTree[0];
    
    const contentsByCategory = await client.content.list({
      categoryId: firstCategory.id,
      page: 1,
      pageSize: 10,
    });
    
    console.log(`分类 "${firstCategory.name}" 下的内容:`, contentsByCategory.items);
    console.log('内容数量:', contentsByCategory.total);
  }

  // ============================================
  // 5. 根据标签获取内容
  // ============================================
  console.log('\n=== 根据标签获取内容 ===');
  
  if (tags.items.length > 0) {
    const firstTag = tags.items[0];
    
    const contentsByTag = await client.content.list({
      tagId: firstTag.id,
      page: 1,
      pageSize: 10,
    });
    
    console.log(`标签 "${firstTag.name}" 下的内容:`, contentsByTag.items);
    console.log('内容数量:', contentsByTag.total);
  }

  // ============================================
  // 6. 组合查询
  // ============================================
  console.log('\n=== 组合查询 ===');
  
  if (Array.isArray(categoryTree) && categoryTree.length > 0 && tags.items.length > 0) {
    const category = categoryTree[0];
    const tag = tags.items[0];
    
    const combinedResults = await client.content.list({
      categoryId: category.id,
      tagId: tag.id,
      state: '2', // 已发布
      keyword: 'JavaScript',
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    
    console.log('组合查询结果:', combinedResults);
    console.log('匹配的内容数量:', combinedResults.total);
  }

  // ============================================
  // 7. 创建内容时使用标签和分类
  // ============================================
  console.log('\n=== 创建内容时使用标签和分类 ===');
  
  // 注意：需要认证
  try {
    // 假设已经登录并有 token
    const newContent = await client.content.create({
      title: '新文章',
      stitle: '这是一篇新文章',
      discription: '文章描述',
      comments: '文章内容...',
      sImg: 'https://example.com/image.jpg',
      categories: Array.isArray(categoryTree) && categoryTree.length > 0 
        ? [categoryTree[0].id] 
        : [],
      tags: tags.items.length > 0 
        ? [tags.items[0].id, tags.items[1]?.id].filter(Boolean) 
        : [],
      state: '0', // 草稿
    });
    
    console.log('创建成功:', newContent);
  } catch (error) {
    console.log('创建失败（可能需要认证）:', error.message);
  }

  // ============================================
  // 8. 实用函数示例
  // ============================================
  console.log('\n=== 实用函数示例 ===');
  
  // 查找特定名称的标签
  function findTagByName(tags: any[], name: string) {
    return tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
  }
  
  const jsTag = findTagByName(tags.items, 'JavaScript');
  console.log('JavaScript 标签:', jsTag);
  
  // 查找特定名称的分类
  function findCategoryByName(categories: any[], name: string): any {
    for (const cat of categories) {
      if (cat.name.toLowerCase() === name.toLowerCase()) {
        return cat;
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryByName(cat.children, name);
        if (found) return found;
      }
    }
    return null;
  }
  
  if (Array.isArray(categoryTree)) {
    const techCategory = findCategoryByName(categoryTree, '技术');
    console.log('技术分类:', techCategory);
  }
  
  // 获取分类的所有子分类ID
  function getAllCategoryIds(category: any): string[] {
    const ids = [category.id];
    if (category.children && category.children.length > 0) {
      category.children.forEach((child: any) => {
        ids.push(...getAllCategoryIds(child));
      });
    }
    return ids;
  }
  
  if (Array.isArray(categoryTree) && categoryTree.length > 0) {
    const allIds = getAllCategoryIds(categoryTree[0]);
    console.log('分类及其所有子分类ID:', allIds);
  }
}

// 运行示例
main().catch(console.error);

// ============================================
// TypeScript 类型使用示例
// ============================================

import type { Tag, Category, TagQueryParams, CategoryQueryParams } from '@doracms/sdk';

// 标签类型
const tag: Tag = {
  id: '123',
  name: 'JavaScript',
  description: 'JavaScript 相关内容',
  count: 100,
  createdAt: '2024-01-01T00:00:00.000Z',
};

// 分类类型
const category: Category = {
  id: '456',
  name: '技术',
  description: '技术相关内容',
  enable: true,
  children: [
    {
      id: '789',
      name: '前端',
      description: '前端技术',
      enable: true,
      parentId: '456',
    },
  ],
};

// 标签查询参数
const tagParams: TagQueryParams = {
  page: 1,
  pageSize: 20,
  keyword: 'JavaScript',
  hot: true,
};

// 分类查询参数
const categoryParams: CategoryQueryParams = {
  tree: true,
  enable: true,
};

console.log('类型示例:', { tag, category, tagParams, categoryParams });
