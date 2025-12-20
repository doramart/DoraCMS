# 文章列表公共部件使用指南

## 概述

`article-list.html` 是一个通用的文章列表显示组件，支持多种布局样式，可以在不同的页面中复用。

## 使用方法

### 1. 导入组件

```nunjucks
{% from "standard-template/partials/article-list.html" import articleList %}
```

### 2. 基本使用

```nunjucks
{{ articleList(posts) }}
```

## 支持的布局类型

### 1. horizontal（水平布局）- 默认

适用于：分类页面、搜索结果页面

```nunjucks
{{ articleList(posts, layout='horizontal') }}
```

### 2. vertical（垂直布局）

适用于：热门内容展示

```nunjucks
{{ articleList(hotItemListData, layout='vertical') }}
```

### 3. grid（网格布局）

适用于：前端技术、相关文章展示

```nunjucks
{{ articleList(frontendNews, layout='grid') }}
```

### 4. compact（紧凑布局）

适用于：侧边栏推荐内容

```nunjucks
{{ articleList(reCommendList, layout='compact') }}
```

### 5. featured（特色布局）

适用于：科技前沿、重点文章展示

```nunjucks
{{ articleList(categoryNews, layout='featured') }}
```

## 参数说明

| 参数            | 类型    | 默认值       | 说明               |
| --------------- | ------- | ------------ | ------------------ |
| articles        | Array   | 必需         | 文章数组数据       |
| layout          | String  | 'horizontal' | 布局类型           |
| showImage       | Boolean | true         | 是否显示图片       |
| showMeta        | Boolean | true         | 是否显示元信息     |
| showDescription | Boolean | true         | 是否显示描述       |
| showAuthor      | Boolean | true         | 是否显示作者       |
| showCategory    | Boolean | true         | 是否显示分类       |
| customClass     | String  | ''           | 自定义CSS类名      |
| emptyText       | String  | '暂无文章'   | 无数据时显示的文本 |

## 使用示例

### 分类页面

```nunjucks
{% from "standard-template/partials/article-list.html" import articleList %}
{{ articleList(posts) }}
```

### 搜索结果页面

```nunjucks
{{ articleList(posts, emptyText='未找到相关文章') }}
```

### 热门内容

```nunjucks
{{ articleList(hotItemListData, layout='vertical', emptyText='暂无热门内容') }}
```

### 侧边栏推荐

```nunjucks
{{ articleList(reCommendList, layout='compact', showDescription=false, emptyText='暂无推荐内容') }}
```

### 网格展示

```nunjucks
{{ articleList(frontendNews, layout='grid', emptyText='暂无前端技术内容') }}
```

### 特色文章

```nunjucks
{{ articleList(categoryNews, layout='featured', emptyText='暂无科技前沿内容') }}
```

## 数据结构要求

文章对象应包含以下字段：

```javascript
{
  id: "文章ID",
  title: "文章标题",
  url: "文章链接",
  sImg: "文章图片",
  discription: "文章描述",
  summary: "文章摘要",
  createdAt: "创建时间",
  author: {
    userName: "作者名称"
  },
  categoryName: "分类名称",
  categoryUrl: "分类链接"
}
```

## 注意事项

1. 确保传入的文章数据包含必要的字段
2. 图片字段支持 `sImg`，如果没有会显示默认图片
3. 描述字段优先使用 `discription`，其次使用 `summary`
4. 所有布局都支持响应式设计
5. 支持深色模式切换
