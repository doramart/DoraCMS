# 标准模板主题

这是一个标准的模板主题，包含基本的页面结构和组件，用于演示模板系统的功能。

## 目录结构

```
template-demo/
├── layouts/           # 布局文件
│   ├── default.html   # 默认布局（必需）
│   └── sidebar.html   # 侧边栏布局
├── templates/         # 模板文件
│   ├── index.html     # 首页模板（必需）
│   ├── category.html  # 分类页模板
│   ├── post.html      # 文章页模板
│   └── search.html    # 搜索页模板
├── components/        # 组件文件
│   ├── header.html    # 页头组件
│   ├── footer.html    # 页脚组件
│   └── nav.html       # 导航组件
├── partials/          # 片段文件
│   └── pagination.html # 分页组件
├── assets/            # 静态资源
│   ├── css/
│   │   └── style.css  # 样式文件
│   ├── js/
│   │   └── main.js    # JavaScript文件
│   └── images/
│       └── placeholder.jpg # 占位图片
└── theme.json         # 主题配置文件
```

## 文件说明

### 布局文件 (layouts/)

- **default.html**: 默认布局，包含基本的页面结构
- **sidebar.html**: 侧边栏布局，包含侧边栏导航

### 模板文件 (templates/)

- **index.html**: 首页模板，显示网站主要内容
- **category.html**: 分类页模板，显示特定分类下的文章
- **post.html**: 文章页模板，显示单篇文章的详细内容
- **search.html**: 搜索页模板，显示搜索结果

### 组件文件 (components/)

- **header.html**: 页头组件，包含网站Logo和导航
- **footer.html**: 页脚组件，包含联系信息和链接
- **nav.html**: 导航组件，包含主导航菜单

### 片段文件 (partials/)

- **pagination.html**: 分页组件，用于文章列表的分页显示

### 静态资源 (assets/)

- **css/style.css**: 基本的CSS样式
- **js/main.js**: 基本的JavaScript功能
- **images/placeholder.jpg**: 占位图片文件

### 配置文件

- **theme.json**: 主题配置文件，包含主题信息和设置

## 使用方法

1. 将整个模板目录复制到主题目录中
2. 在模板系统中注册这个主题
3. 根据需要修改模板文件的内容和样式
4. 在主题配置文件中调整设置

## 注意事项

- 所有HTML文件都包含简单的示例内容，用于标识模板的不同部分
- 实际使用时需要替换示例内容为真实的变量和动态内容
- CSS和JavaScript文件提供了基本的样式和功能，可以根据需要进行扩展
- 主题配置文件定义了主题的基本信息和设置选项

## 扩展建议

- 添加更多的布局选项
- 增加更多的组件和片段
- 优化响应式设计
- 添加主题切换功能
- 增加更多的自定义选项
