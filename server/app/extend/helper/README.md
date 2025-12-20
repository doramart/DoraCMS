## 2. 完整标签使用手册

### 📋 系统架构概览

DoraCMS 模板标签系统基于 Nunjucks 构建，提供了 6 大类共 30+ 个标签：

1. **内容标签** (Content Tags) - 获取各类内容数据
2. **分类标签** (Taxonomy Tags) - 处理分类和标签数据
3. **实用工具标签** (Utility Tags) - 系统功能和资源处理
4. **过滤器标签** (Filter Tags) - 数据格式化和处理
5. **区块标签** (Block Tags) - 逻辑控制和循环
6. **布局标签** (Layout Tags) - 页面结构和样式

### 🎯 标签参数语法规则

**重要提示**：所有标签参数均使用**逗号分隔**，参数值使用**双引号**包围：

```nunjucks
<!-- 正确的参数语法 -->
{% news key="latestNews", pageSize="10", typeId="64a5b2c7e8f9d123456789ab" %}
{% recommend key="featuredContent", pageSize="5", isPaging="0" %}
{% hottags key="popularTags", pageSize="20" %}

<!-- 错误的语法 -->
{% news key=latestNews pageSize=10 %}  <!-- 缺少引号和逗号 -->
{% recommend key="content" pageSize="5" typeId="xxx" %}  <!-- 缺少逗号 -->
```

### 🎯 内容标签详解

#### `{% news %}` - 获取最新内容

**功能**: 获取最新发布的内容列表，按发布时间倒序排列

**参数**:

- `key` (必填): 存储结果的变量名
- `pageSize` (可选): 返回数量，默认10
- `typeId` (可选): 指定分类ID
- `isPaging` (可选): 是否分页，"0"不分页，"1"分页

```nunjucks
<!-- 基础用法 - 获取最新10篇文章 -->
{% news key="latestNews", pageSize="10" %}

<!-- 按分类获取 - 获取特定分类下的最新文章 -->
{% news key="categoryNews", typeId="64a5b2c7e8f9d123456789ab", pageSize="5" %}

<!-- 启用分页 -->
{% news key="pagedNews", pageSize="10", isPaging="1" %}

<!-- 实际使用示例 -->
{% news key="latestList", pageSize="20" %}
<div class="news-section">
  {% if latestList.length > 0 %}
    {% for article in latestList %}
      <article class="news-item">
        <h3><a href="/details/{{ article.id }}.html">{{ article.title }}</a></h3>
        <p class="excerpt">{{ article.discription | cutwords(150) }}</p>
        <div class="meta">
          <time>{{ article.date | date('YYYY-MM-DD') }}</time>
          <span>{{ article.clickNum }} 次浏览</span>
        </div>
      </article>
    {% endfor %}
  {% endif %}
</div>
```

#### `{% recommend %}` - 获取推荐内容

**功能**: 获取系统推荐的优质内容列表

**参数**:

- `key` (必填): 存储结果的变量名
- `pageSize` (可选): 返回数量，默认10
- `typeId` (可选): 指定分类ID
- `isPaging` (可选): 是否分页，"0"不分页，"1"分页

```nunjucks
<!-- 基础用法 - 获取推荐内容 -->
{% recommend key="reCommendList", pageSize="20" %}

<!-- 按分类获取推荐内容 -->
{% recommend key="featuredContent", typeId="64a5b2c7e8f9d123456789ab", pageSize="5" %}

<!-- 实际使用示例 - 首页推荐文章展示 -->
{% recommend key="reCommendList", pageSize="20" %}
<div class="recommend-section">
  {% if reCommendList.length > 0 %}
    {% for item in reCommendList %}
      <div class="article-card">
        <div class="flex justify-between">
          <div class="flex-1 pr-4">
            <h3><a href="/details/{{ item.id }}.html">{{ item.title }}</a></h3>
            <p class="excerpt">{{ item.discription | cutwords(150) }}</p>
            <div class="meta">
              <span>{{ item.date | date('YYYY-MM-DD') }}</span>
              <span>{{ item.clickNum }} 浏览</span>
              <span>{{ item.likeNum }} 点赞</span>
            </div>
            <div class="tags">
              {% for tagItem in item.tags %}
                <a href="{{ tagItem.url }}" class="tag">{{ tagItem.name }}</a>
              {% endfor %}
            </div>
          </div>
          <div class="thumbnail">
            <img src="{{ item.sImg }}" alt="{{ item.title }}">
          </div>
        </div>
      </div>
    {% endfor %}
  {% endif %}
</div>
```

#### `{% hot %}` - 获取热门内容

**功能**: 获取热门内容列表，按点击量或热度排序

**参数**:

- `key` (必填): 存储结果的变量名
- `pageSize` (可选): 返回数量，默认10
- `typeId` (可选): 指定分类ID
- `isPaging` (可选): 是否分页，"0"不分页，"1"分页

```nunjucks
<!-- 基础用法 - 获取热门文章 -->
{% hot key="hotItemListData", pageSize="9" %}

<!-- 按分类获取热门内容 -->
{% hot key="categoryHot", typeId="64a5b2c7e8f9d123456789ab", pageSize="5" %}

<!-- 实际使用示例 - 侧边栏热门文章 -->
{% hot key="hotItemListData", pageSize="9" %}
{% if hotItemListData.length > 0 %}
  <div class="hot-posts">
    <h3>热门推荐</h3>
    <div class="hot-list">
      {% for item in hotItemListData %}
        {% if loop.index0 == 0 %}
          <!-- 第一篇热门文章特殊样式 -->
          <div class="featured-hot">
            <a href="/details/{{ item.id }}.html">
              <img src="{{ item.sImg }}" alt="{{ item.title }}">
              <h4>{{ item.title }}</h4>
            </a>
          </div>
        {% else %}
          <!-- 其他热门文章列表样式 -->
          <div class="hot-item">
            <span class="rank {% if loop.index0 <= 2 %}top-rank{% endif %}">{{ loop.index }}</span>
            <a href="/details/{{ item.id }}.html">{{ item.title }}</a>
          </div>
        {% endif %}
      {% endfor %}
    </div>
  </div>
{% endif %}
```

#### `{% random %}` - 获取随机内容

**功能**: 随机获取内容列表，每次刷新都不同

**参数**:

- `key` (可选): 存储结果的变量名，如果不指定则使用"random"
- `pageSize` (可选): 返回数量，默认5
- `typeId` (可选): 指定分类ID

```nunjucks
<!-- 基础用法 - 随机获取文章 -->
{% random pageSize="4" %}

<!-- 指定变量名和数量 -->
{% random key="randomPosts", pageSize="6" %}

<!-- 实际使用示例 - 文章详情页的随机推荐 -->
{% random pageSize="4" %}
{% if random.length > 0 %}
  <div class="random-posts">
    <h3>随机推荐</h3>
    <div class="random-grid">
      {% for item in random %}
        <div class="random-card">
          <a href="/details/{{ item.id }}.html">
            <img src="{{ item.sImg }}" alt="{{ item.title }}">
            <h4>{{ item.title }}</h4>
            <p>{{ item.discription | cutwords(50) }}</p>
          </a>
        </div>
      {% endfor %}
    </div>
  </div>
{% else %}
  <p>暂无推荐内容</p>
{% endif %}
```

#### `{% nearpost %}` - 获取相关文章

**功能**: 获取指定文章的上一篇和下一篇文章

**参数**:

- `key` (必填): 存储结果的变量名
- `id` (必填): 当前文章的ID

```nunjucks
<!-- 基础用法 - 获取当前文章的前后文章 -->
{% nearpost key="navigation", id="{{ post.id }}" %}

<!-- 实际使用示例 - 文章详情页的导航 -->
{% nearpost key="navigation", id="{{ post.id }}" %}
{% if navigation %}
  <nav class="post-navigation">
    {% if navigation.prePost %}
      <div class="nav-prev">
        <span class="nav-label">上一篇</span>
        <a href="/details/{{ navigation.prePost.id }}.html" class="nav-link">
          {{ navigation.prePost.title }}
        </a>
      </div>
    {% endif %}

    {% if navigation.nextPost %}
      <div class="nav-next">
        <span class="nav-label">下一篇</span>
        <a href="/details/{{ navigation.nextPost.id }}.html" class="nav-link">
          {{ navigation.nextPost.title }}
        </a>
      </div>
    {% endif %}
  </nav>
{% endif %}
```

### 🏷️ 分类标签详解

#### `{% tags %}` - 获取内容标签

**功能**: 获取系统中的所有标签列表

**参数**:

- `key` (可选): 存储结果的变量名，默认为"tags"
- `pageSize` (可选): 返回数量，默认为所有
- `isPaging` (可选): 是否分页，"0"不分页，"1"分页

```nunjucks
<!-- 基础用法 - 获取所有标签 -->
{% tags key="allTags" %}

<!-- 分页获取标签 -->
{% tags key="pagedTags", isPaging="1", pageSize="20" %}

<!-- 实际使用示例 - 标签云展示 -->
{% tags key="contentTags", pageSize="50" %}
{% if contentTags.length > 0 %}
  <div class="tag-cloud">
    <h3>标签云</h3>
    <div class="tags-wrapper">
      {% for tag in contentTags %}
        <a href="{{ tag.url }}" class="tag-item" title="{{ tag.comments }}">
          {{ tag.name }}
          {% if tag.refCount %}
            <span class="count">({{ tag.refCount }})</span>
          {% endif %}
        </a>
      {% endfor %}
    </div>
  </div>
{% endif %}
```

#### `{% hottags %}` - 获取热门标签

**功能**: 获取热门标签列表，按使用频率排序

**参数**:

- `key` (可选): 存储结果的变量名，默认为"hottags"
- `pageSize` (可选): 返回数量，默认20

```nunjucks
<!-- 基础用法 - 获取热门标签 -->
{% hottags pageSize="20" %}

<!-- 指定变量名 -->
{% hottags key="popularTags", pageSize="15" %}

<!-- 实际使用示例 - 侧边栏热门标签 -->
{% hottags pageSize="20" %}
<div class="hot-tags">
  <h3>热门标签</h3>
  <div class="tags-grid">
    {% for tagItem in hottags %}
      <a href="{{ tagItem.url }}" class="hot-tag">
        {{ tagItem.name }}
      </a>
    {% endfor %}
  </div>
</div>
```

#### `{% navtree %}` - 获取分类树

**功能**: 获取分类层级树结构，用于构建导航菜单

**参数**:

- `key` (可选): 存储结果的变量名，默认为"navtree"
- `parentId` (可选): 父级分类ID，获取指定分类下的子分类

```nunjucks
<!-- 基础用法 - 获取完整分类树 -->
{% navtree key="categories" %}

<!-- 获取指定分类下的子分类 -->
{% navtree key="subCategories", parentId="64a5b2c7e8f9d123456789ab" %}

<!-- 实际使用示例 - 分类导航菜单 -->
{% navtree key="categoryTree" %}
{% if categoryTree.length > 0 %}
  <nav class="category-navigation">
    {% for category in categoryTree %}
      <div class="nav-group">
        <h3>
          <a href="{{ category.url }}">{{ category.name }}</a>
        </h3>
        {% if category.children and category.children.length > 0 %}
          <ul class="sub-nav">
            {% for child in category.children %}
              <li>
                <a href="{{ child.url }}" title="{{ child.comments }}">
                  {{ child.name }}
                </a>
              </li>
            {% endfor %}
          </ul>
        {% endif %}
      </div>
    {% endfor %}
  </nav>
{% endif %}
```

#### `{% childnav %}` - 获取子分类

**功能**: 获取指定分类下的直接子分类列表

**参数**:

- `key` (必填): 存储结果的变量名
- `typeId` (必填): 父级分类的ID

```nunjucks
<!-- 基础用法 - 获取指定分类的子分类 -->
{% childnav key="frontDev", typeId="Nycd05pP" %}

<!-- 实际使用示例 - 左侧导航菜单 -->
{% childnav key="frontDev", typeId="Nycd05pP" %}
{% if frontDev.cates and frontDev.cates.length > 0 %}
  <nav class="side-navigation">
    {% for cateItem in frontDev.cates %}
      {% if cateItem.parentId != '0' %}
        <div class="nav-item">
          <a href="/{{ cateItem.defaultUrl }}___{{ cateItem.id }}"
             class="nav-link {% if cateInfo.id === cateItem.id %}active{% endif %}">
            {% if cateItem.icon %}
              <i class="{{ cateItem.icon }}"></i>
            {% endif %}
            <span>{{ cateItem.name }}</span>
          </a>
        </div>
      {% endif %}
    {% endfor %}
  </nav>
{% endif %}
```

### 🔧 实用工具标签详解

#### `{% remote %}` - 自定义API数据

**功能**: 调用系统内部API获取自定义数据

**参数**:

- `key` (必填): 存储结果的变量名
- `api` (必填): API路径，如"content/getList"
- `query` (可选): JSON格式的查询参数
- `pageSize` (可选): 返回数量
- `isPaging` (可选): 是否分页，默认"1"

```nunjucks
<!-- 基础用法 - 调用内部API -->
{% remote key="customData", api="content/getList", pageSize="10" %}

<!-- 带查询条件的API调用 -->
{% remote key="filteredData", api="content/getList", query='{"sortby":"1","state":"2"}', pageSize="5" %}

<!-- 实际使用示例 - 获取特定条件的内容 -->
{% remote key="featuredPosts", api="content/getList", query='{"roofPlacement":"1"}', pageSize="6" %}
{% if featuredPosts.length > 0 %}
  <div class="featured-section">
    <h3>精选推荐</h3>
    <div class="posts-grid">
      {% for post in featuredPosts %}
        <article class="featured-post">
          <a href="/details/{{ post.id }}.html">
            <img src="{{ post.sImg }}" alt="{{ post.title }}">
            <h4>{{ post.title }}</h4>
            <p>{{ post.discription | cutwords(100) }}</p>
          </a>
        </article>
      {% endfor %}
    </div>
  </div>
{% endif %}
```

#### `{% ads %}` - 广告内容

**功能**: 获取广告位内容数据

**参数**:

- `key` (必填): 存储结果的变量名
- `name` (必填): 广告位名称标识

```nunjucks
<!-- 基础用法 - 获取指定广告位 -->
{% ads key="bannerAds", name="homepage-banner" %}

<!-- 实际使用示例 - 横幅广告展示 -->
{% ads key="headerAds", name="header-banner" %}
{% if headerAds.length > 0 %}
  <div class="advertisement">
    {% for ad in headerAds %}
      <div class="ad-item">
        <a href="{{ ad.link }}" target="_blank" rel="nofollow">
          <img src="{{ ad.image }}" alt="{{ ad.title }}">
          {% if ad.description %}
            <p class="ad-desc">{{ ad.description }}</p>
          {% endif %}
        </a>
      </div>
    {% endfor %}
  </div>
{% endif %}
```

#### `{% assets %}` - 资源文件处理

**功能**: 自动生成CSS和JS文件的HTML标签，支持版本控制

**参数**:

- 资源文件列表 (必填): 空格分隔的文件名列表

```nunjucks
<!-- 基础用法 - 生成CSS和JS标签 -->
{% assets "style.css main.js utils.js" %}

<!-- 这会自动输出：
<link href="/public/themes/current/css/style.css?version=1234567890" rel="stylesheet">
<script src="/public/themes/current/js/main.js?version=1234567890"></script>
<script src="/public/themes/current/js/utils.js?version=1234567890"></script>
-->

<!-- 使用绝对路径 -->
{% assets "/custom/theme.css /libs/jquery.js" %}

<!-- 实际使用示例 - 页面头部资源加载 -->
<head>
  <!-- 基础样式和脚本 -->
  {% assets "reset.css main.css app.js" %}

  <!-- 页面特定资源 -->
  {% if pageType == 'post' %}
    {% assets "post.css highlight.js" %}
  {% endif %}
</head>
```




#### `{% head %}...{% endhead %}` - 页面头部

**功能**: 生成完整的HTML头部内容，包括SEO元标签和自定义内容

**参数**: 无参数，为块级标签

```nunjucks
<!-- 基础用法 - 自动生成头部内容 -->
{% head %}
  <!-- 这里可以添加自定义的meta标签、样式等 -->
  <meta name="author" content="Your Name">
  <link rel="canonical" href="{{ site.url }}{{ request.url }}">
{% endhead %}

<!-- 实际使用示例 - 完整的头部设置 -->
{% head %}
  <!-- 自定义SEO标签 -->
  {% if pageType === 'post' %}
    <meta property="article:published_time" content="{{ post.createdAt }}">
    <meta property="article:author" content="{{ post.author.userName }}">
    <meta property="article:section" content="{{ post.categories[0].name }}">
    {% for tag in post.tags %}
      <meta property="article:tag" content="{{ tag.name }}">
    {% endfor %}
  {% endif %}

  <!-- 自定义样式 -->
  <style>
    :root {
      --primary-color: {{ site.primaryColor || '#007bff' }};
      --secondary-color: {{ site.secondaryColor || '#6c757d' }};
    }
  </style>

  <!-- 结构化数据 -->
  {% if pageType === 'post' %}
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "{{ post.title }}",
      "author": {
        "@type": "Person",
        "name": "{{ post.author.userName }}"
      },
      "datePublished": "{{ post.createdAt }}",
      "dateModified": "{{ post.updatedAt }}"
    }
    </script>
  {% endif %}
{% endhead %}
```

### 🎛️ 过滤器标签详解

#### `{% date %}` - 日期格式化

**功能**: 格式化日期时间字符串

**参数**:

- 第一个参数: 要格式化的日期
- `format` (可选): 日期格式，默认"YYYY-MM-DD"
- `timeago` (可选): 是否显示相对时间，如"3天前"

```nunjucks
<!-- 基础用法 - 格式化日期 -->
{% date post.createdAt, format="YYYY-MM-DD" %}

<!-- 显示相对时间 -->
{% date post.createdAt, timeago=true %}

<!-- 自定义格式 -->
{% date post.updatedAt, format="YYYY年MM月DD日 HH:mm" %}

<!-- 实际使用示例 -->
<div class="post-meta">
  <span class="publish-date">
    发布于 {% date post.createdAt, format="YYYY-MM-DD" %}
  </span>
  <span class="update-time">
    {% date post.updatedAt, timeago=true %}
  </span>
</div>
```

#### `{% excerpt %}` - 文本摘要

**功能**: 从文本中提取指定长度的摘要，自动去除HTML标签

**参数**:

- 第一个参数: 要提取摘要的文本内容
- `words` (可选): 摘要字符数量，默认100

```nunjucks
<!-- 基础用法 - 提取摘要 -->
{% excerpt post.content, words="100" %}

<!-- 短摘要 -->
{% excerpt post.discription, words="50" %}

<!-- 实际使用示例 - 文章卡片 -->
<div class="article-card">
  <h3><a href="/details/{{ post.id }}.html">{{ post.title }}</a></h3>
  <p class="excerpt">
    {% excerpt post.content, words="120" %}
  </p>
  <div class="meta">
    <span>{{ post.author.userName }}</span>
    <span>{% date post.createdAt, format="MM-DD" %}</span>
  </div>
</div>
```

#### `{% imgurl %}` - 图片URL处理

**功能**: 处理图片URL，支持尺寸调整和默认图片

**参数**:

- 第一个参数: 原始图片URL
- `size` (可选): 图片尺寸，如"large"、"medium"、"small"
- `fallback` (可选): 默认图片URL

```nunjucks
<!-- 基础用法 - 处理图片URL -->
{% imgurl post.sImg, size="medium" %}

<!-- 带默认图片 -->
{% imgurl post.sImg, fallback="/images/default.jpg" %}

<!-- 实际使用示例 - 响应式图片 -->
<div class="post-thumbnail">
  <img src="{% imgurl post.sImg, size='large', fallback='/images/default-post.jpg' %}"
       alt="{{ post.title }}"
       loading="lazy">
</div>

<!-- 用户头像处理 -->
<div class="user-avatar">
  <img src="{% imgurl user.avatar, size='small', fallback='/images/default-avatar.png' %}"
       alt="{{ user.userName }}">
</div>
```

#### `{% readingtime %}` - 阅读时间

**功能**: 计算文章的预估阅读时间

**参数**:

- 第一个参数: 文章内容

```nunjucks
<!-- 基础用法 - 计算阅读时间 -->
{% readingtime post.content %}

<!-- 实际使用示例 - 文章元信息 -->
<div class="post-meta">
  <span class="publish-date">
    {% date post.createdAt, format="YYYY-MM-DD" %}
  </span>
  <span class="reading-time">
    {% readingtime post.content %}
  </span>
  <span class="view-count">{{ post.clickNum }} 次阅读</span>
</div>
```

#### `{% encode %}` - URL编码

**功能**: 对字符串进行URL编码，用于构建安全的链接

**参数**:

- 第一个参数: 要编码的字符串

```nunjucks
<!-- 基础用法 - URL编码 -->
{% encode post.title %}

<!-- 实际使用示例 - 分享链接 -->
<div class="share-buttons">
  <a href="https://twitter.com/share?text={% encode post.title %}&url={{ site.url }}/details/{{ post.id }}.html"
     target="_blank" rel="noopener">
    分享到Twitter
  </a>

  <a href="https://www.facebook.com/sharer/sharer.php?u={{ site.url }}/details/{{ post.id }}.html"
     target="_blank" rel="noopener">
    分享到Facebook
  </a>
</div>

<!-- 搜索链接 -->
<a href="/search?q={% encode searchKeyword %}">
  搜索"{{ searchKeyword }}"
</a>
```

#### `{% plural %}` - 复数处理

**功能**: 根据数量显示不同的文本格式

**参数**:

- 第一个参数: 数量值
- `empty` (可选): 数量为0时显示的文本
- `singular` (可选): 数量为1时显示的文本，%会被替换为数量
- `plural` (可选): 数量大于1时显示的文本，%会被替换为数量

```nunjucks
<!-- 基础用法 - 评论数量 -->
{% plural post.commentNum, empty="暂无评论", singular="% 条评论", plural="% 条评论" %}

<!-- 实际使用示例 - 各种计数显示 -->
<div class="post-stats">
  <span class="comments">
    {% plural post.commentNum, empty="暂无评论", singular="% 条评论", plural="% 条评论" %}
  </span>

  <span class="likes">
    {% plural post.likeNum, empty="暂无点赞", singular="% 个赞", plural="% 个赞" %}
  </span>

  <span class="views">
    {% plural post.clickNum, empty="暂无浏览", singular="% 次浏览", plural="% 次浏览" %}
  </span>
</div>

<!-- 分类文章数量 -->
<div class="category-info">
  <h3>{{ category.name }}</h3>
  <p>{% plural category.postCount, empty="暂无文章", singular="% 篇文章", plural="% 篇文章" %}</p>
</div>
```

### 🔄 区块标签详解

#### `{% foreach %}...{% endforeach %}` - 高级循环

**功能**: 提供比标准for循环更强大的循环控制功能

**参数**:

- 第一个参数: 要循环的数组
- `limit` (可选): 限制循环数量
- `offset` (可选): 跳过前N个元素

**特殊变量**:

- `@index`: 当前索引（从0开始）
- `@first`: 是否为第一个元素
- `@last`: 是否为最后一个元素
- `@key`: 当前键名
- `this`: 当前循环项

```nunjucks
<!-- 基础用法 - 限制数量的循环 -->
{% foreach posts, limit="5" %}
  <article data-index="{{ @index }}">
    <h2>{{ this.title }}</h2>
    {% if @first %}<span class="badge">最新</span>{% endif %}
    {% if @last %}<span class="badge">最后</span>{% endif %}
  </article>
{% endforeach %}

<!-- 带偏移的循环 -->
{% foreach posts, limit="3", offset="2" %}
  <div class="related-post">
    <a href="/details/{{ this.id }}.html">{{ this.title }}</a>
    <span class="position">第{{ @index + 1 }}个</span>
  </div>
{% endforeach %}

<!-- 实际使用示例 - 热门文章前3名特殊样式 -->
{% foreach hotPosts, limit="10" %}
  <div class="hot-item {% if @index < 3 %}top-three{% endif %}">
    <span class="rank">{{ @index + 1 }}</span>
    <a href="/details/{{ this.id }}.html">{{ this.title }}</a>
    {% if @first %}
      <span class="crown">👑</span>
    {% endif %}
  </div>
{% endforeach %}
```

#### `{% get %}...{% endget %}` - 动态数据获取

**功能**: 在模板中动态获取数据并在块内使用

**参数**:

- 第一个参数: 资源类型，如"posts"、"tags"、"categories"
- `limit` (可选): 返回数量限制
- `filter` (可选): 过滤条件，格式为"key:value"
- `typeId` (可选): 分类ID

```nunjucks
<!-- 基础用法 - 获取文章数据 -->
{% get "posts", limit="5" %}
  <div class="posts-section">
    {% for post in posts %}
      <article>
        <h3><a href="/details/{{ post.id }}.html">{{ post.title }}</a></h3>
        <p>{{ post.discription }}</p>
      </article>
    {% endfor %}
  </div>
{% endget %}

<!-- 带过滤条件的获取 -->
{% get "posts", limit="3", filter="featured:true" %}
  <section class="featured-posts">
    <h2>精选文章</h2>
    {% for post in posts %}
      <div class="featured-item">
        <h4>{{ post.title }}</h4>
        <p>{{ post.discription }}</p>
      </div>
    {% endfor %}
  </section>
{% endget %}

<!-- 按分类获取 -->
{% get "posts", typeId="64a5b2c7e8f9d123456789ab", limit="4" %}
  <div class="category-posts">
    {% for post in posts %}
      <div class="post-card">
        <h4><a href="/details/{{ post.id }}.html">{{ post.title }}</a></h4>
      </div>
    {% endfor %}
  </div>
{% endget %}
```

#### `{% if %}...{% endif %}` - 条件判断

**功能**: 根据条件显示不同的内容

**参数**:

- 第一个参数: 条件表达式

```nunjucks
<!-- 基础条件判断 -->
{% if post.isTop %}
  <div class="top-badge">置顶文章</div>
{% else %}
  <div class="normal-badge">普通文章</div>
{% endif %}

<!-- 实际使用示例 - 用户权限检查 -->
{% if logined %}
  <div class="user-actions">
    <button class="like-btn" data-id="{{ post.id }}">点赞</button>
    <button class="favorite-btn" data-id="{{ post.id }}">收藏</button>
  </div>
{% else %}
  <div class="login-prompt">
    <a href="/login">登录后可点赞和收藏</a>
  </div>
{% endif %}

<!-- 多重条件判断 -->
{% if post.state === '2' %}
  <!-- 已发布 -->
  <div class="post-content">{{ post.content }}</div>
{% else %}
  {% if post.state === '1' %}
    <!-- 草稿 -->
    <div class="draft-notice">这是一篇草稿文章</div>
  {% else %}
    <!-- 其他状态 -->
    <div class="unavailable">文章暂不可用</div>
  {% endif %}
{% endif %}
```

#### `{% has %}...{% endhas %}` - 属性检查

**功能**: 检查对象是否具有指定的属性或标签

**参数**:

- `tag` (可选): 检查是否有指定标签
- `author` (可选): 检查是否为指定作者
- `property` (可选): 检查指定属性是否存在

```nunjucks
<!-- 检查文章是否有特定标签 -->
{% has tag="技术" %}
  <span class="tech-badge">技术文章</span>
{% endhas %}

<!-- 检查是否为特定作者 -->
{% has author="admin" %}
  <div class="admin-badge">官方发布</div>
{% endhas %}

<!-- 检查属性是否存在 -->
{% has property="post.sImg" %}
  <div class="post-thumbnail">
    <img src="{{ post.sImg }}" alt="{{ post.title }}">
  </div>
{% endhas %}

<!-- 实际使用示例 - 多重属性检查 -->
<article class="post-item">
  <header>
    <h2>{{ post.title }}</h2>
    {% has property="post.sImg" %}
      <img src="{{ post.sImg }}" alt="{{ post.title }}" class="post-image">
    {% endhas %}
  </header>

  <div class="post-meta">
    {% has author="doramart" %}
      <span class="author-badge">作者认证</span>
    {% endhas %}

    {% has tag="推荐" %}
      <span class="recommend-badge">编辑推荐</span>
    {% endhas %}
  </div>
</article>
```

#### `{% is %}...{% endis %}` - 上下文判断

**功能**: 根据当前页面上下文类型显示不同内容

**参数**:

- 第一个参数: 上下文类型，如"home"、"post"、"tag"、"author"、"page"

```nunjucks
<!-- 根据页面类型显示不同内容 -->
{% is "home" %}
  <div class="hero-section">
    <h1>欢迎来到 {{ site.siteName }}</h1>
    <p>{{ site.siteDiscription }}</p>
  </div>
{% else %}
  {% is "post" %}
    <article class="post-detail">
      <h1>{{ post.title }}</h1>
      <div class="post-meta">
        <span>作者：{{ post.author.userName }}</span>
        <span>发布时间：{% date post.createdAt, format="YYYY-MM-DD" %}</span>
      </div>
      <div class="post-content">{{ post.content | safe }}</div>
    </article>
  {% else %}
    <div class="page-content">
      <h1>{{ pageTitle || "页面" }}</h1>
      <div class="content">{{ pageContent || "" }}</div>
    </div>
  {% endis %}
{% endis %}

<!-- 实际使用示例 - 导航高亮 -->
<nav class="main-navigation">
  <a href="/" class="{% is 'home' %}active{% endis %}">首页</a>
  <a href="/about" class="{% is 'page' %}active{% endis %}">关于</a>
  <a href="/contact" class="{% is 'contact' %}active{% endis %}">联系</a>
</nav>
```

### 🎨 布局标签详解

#### `{% bodyclass %}` - 页面body类

**功能**: 根据当前页面类型自动生成body的CSS类名

**参数**:

- `class` (可选): 添加自定义类名

```nunjucks
<!-- 基础用法 - 自动生成页面类 -->
<body class="{% bodyclass %}">

<!-- 添加自定义类 -->
<body class="{% bodyclass class='custom-theme dark-mode' %}">

<!-- 自动生成的类名示例：
  首页: home-template
  文章详情页: post-template
  标签页: tag-template tag-javascript
  分类页: category-template
  作者页: author-template author-admin
  页面: page-template
-->

<!-- 实际使用示例 -->
<body class="{% bodyclass class='site-wrapper' %}">
  <!-- 页面内容 -->
</body>
```

#### `{% postclass %}` - 文章类

**功能**: 为文章元素自动生成相关的CSS类名

**参数**:

- `class` (可选): 添加自定义类名

```nunjucks
<!-- 基础用法 - 自动生成文章类 -->
<article class="{% postclass %}">

<!-- 添加自定义类 -->
<article class="{% postclass class='custom-post highlight' %}">

<!-- 自动生成的类名示例：
  基础类: post
  精选文章: post featured
  根据标签: post tag-javascript tag-tutorial
  特殊状态: post sticky (置顶文章)
-->

<!-- 实际使用示例 -->
<article class="{% postclass class='post-card shadow' %}">
  <header class="post-header">
    <h2>{{ post.title }}</h2>
  </header>
  <div class="post-content">
    {{ post.content }}
  </div>
</article>
```

#### `{% navigation %}` - 导航菜单

**功能**: 生成网站导航菜单

**参数**:

- `key` (可选): 存储导航数据的变量名，默认"navigation"
- `output` (可选): 是否直接输出HTML，设为"html"时直接输出
- `containerClass` (可选): 容器CSS类名
- `linkClass` (可选): 链接CSS类名
- `activeClass` (可选): 当前页面链接的CSS类名

```nunjucks
<!-- 基础用法 - 获取导航数据 -->
{% navigation key="menuItems" %}

<!-- 直接输出HTML导航 -->
{% navigation output="html", containerClass="main-nav", linkClass="nav-link", activeClass="current" %}

<!-- 手动处理导航数据 -->
{% navigation key="menuItems" %}
{% if menuItems.length > 0 %}
  <nav class="site-navigation">
    {% for item in menuItems %}
      <a href="/{{ item.defaultUrl }}___{{ item.id }}"
         class="nav-item {% if item.current %}active{% endif %}">
        {% if item.icon %}
          <i class="{{ item.icon }}"></i>
        {% endif %}
        {{ item.name }}
      </a>
    {% endfor %}
  </nav>
{% endif %}
```

#### `{% pagination %}` - 分页

**功能**: 自动生成分页导航HTML

**参数**:

- `containerClass` (可选): 分页容器CSS类名
- `linkClass` (可选): 分页链接CSS类名
- `activeClass` (可选): 当前页CSS类名
- `ellipsisClass` (可选): 省略号CSS类名

```nunjucks
<!-- 基础用法 - 使用默认样式 -->
{% pagination %}

<!-- 自定义样式的分页 -->
{% pagination containerClass="custom-pagination", linkClass="page-link", activeClass="current-page" %}

<!-- 实际使用示例 - 带样式的分页 -->
<div class="pagination-wrapper">
  {% pagination
     containerClass="flex items-center justify-center space-x-2 my-8",
     linkClass="px-3 py-2 text-sm rounded-md hover:bg-gray-50",
     activeClass="bg-primary text-white" %}
</div>
```

#### `{% search %}` - 搜索表单

**功能**: 生成搜索表单HTML

**参数**:

- `placeholder` (可选): 输入框占位符文本
- `formClass` (可选): 表单CSS类名
- `inputClass` (可选): 输入框CSS类名
- `buttonClass` (可选): 按钮CSS类名

```nunjucks
<!-- 基础用法 - 使用默认样式 -->
{% search placeholder="搜索文章..." %}

<!-- 自定义样式的搜索框 -->
{% search placeholder="输入关键词", formClass="search-form", inputClass="search-input", buttonClass="search-btn" %}

<!-- 实际使用示例 - 头部搜索框 -->
<div class="header-search">
  {% search
     placeholder="搜索感兴趣的内容...",
     formClass="flex items-center",
     inputClass="flex-1 px-4 py-2 border rounded-l-md",
     buttonClass="px-6 py-2 bg-primary text-white rounded-r-md" %}
</div>
```

### 📊 数据结构说明

#### 文章数据结构 (post/content)

```javascript
{
  "id": 301,                           // 文章ID
  "title": "测试文章标题",              // 文章标题
  "stitle": "测试文章副标题",           // 副标题
  "sImg": "/upload/images/test.jpg",   // 缩略图
  "discription": "这是一篇测试文章的描述内容", // 描述/摘要
  "comments": "文章正文内容...",         // 文章正文
  "createdAt": "2025-08-23 13:33:11",  // 创建时间
  "updatedAt": "2025-09-09 04:48:42",  // 更新时间
  "clickNum": 1,                       // 点击数
  "likeNum": 0,                        // 点赞数
  "commentNum": 2,                     // 评论数
  "favoriteNum": 0,                    // 收藏数
  "isTop": 0,                          // 是否置顶
  "state": "2",                        // 状态：1草稿，2已发布
  "type": "1",                         // 类型：1普通文章
  "roofPlacement": "0",                // 是否推荐到首页
  "author": {                          // 作者信息
    "id": 1,
    "userName": "doramart",
    "nickName": "生哥",
    "logo": "头像URL"
  },
  "categories": [                      // 分类信息
    {
      "id": 4,
      "name": "前端开发",
      "url": "/front-development___4",
      "defaultUrl": "front-development"
    }
  ],
  "tags": [                           // 标签信息
    {
      "id": 1,
      "name": "插件",
      "url": "/tag/插件",
      "alias": "plugs"
    }
  ],
  "url": "/details/301.html"          // 文章链接
}
```

#### 分类数据结构 (category)

```javascript
{
  "id": 25,
  "name": "前端开发",                  // 分类名称
  "keywords": "开发,前端,技术",        // 关键词
  "type": "1",                        // 分类类型
  "sortId": 1,                        // 排序ID
  "parentId": 0,                      // 父级分类ID
  "enable": true,                     // 是否启用
  "defaultUrl": "front-development",   // URL别名
  "homePage": "front-development",     // 首页路径
  "comments": "分类描述",             // 描述
  "icon": "mdi:developer-board",      // 图标
  "url": "/front-development___25",   // 分类链接
  "depth": 1,                         // 层级深度
  "children": []                      // 子分类
}
```

#### 标签数据结构 (tag)

```javascript
{
  "id": 44,
  "name": "新标签",                   // 标签名称
  "alias": "newTag",                  // 标签别名
  "comments": "标签描述",             // 描述
  "url": "/tag/新标签",               // 标签链接
  "refCount": 0,                      // 引用次数
  "enable": 1,                        // 是否启用
  "enableText": "启用"                // 状态文本
}
```

### 🌐 全局变量详解

#### `{{ site }}` - 站点全局数据

```nunjucks
<title>{{ site.siteName }}</title>
<meta name="description" content="{{ site.siteDiscription }}">
<meta name="keywords" content="{{ site.siteKeywords }}">

<!-- 站点Logo -->
<img src="{{ site.siteLogo }}" alt="{{ site.siteName }}">

<!-- 备案信息 -->
<footer>
  <p>{{ site.registrationNo }}</p>
  <p>版本: {{ site.version }}</p>
</footer>
```

### ✅ 最佳实践

#### 1. 参数语法规范

```nunjucks
<!-- ✅ 正确 - 使用逗号和双引号 -->
{% news key="latestNews", pageSize="10", typeId="64a5b2c7e8f9d123456789ab" %}
{% recommend key="featuredContent", pageSize="5", isPaging="0" %}

<!-- ❌ 错误 - 缺少逗号和引号 -->
{% news key=latestNews pageSize=10 typeId=xxx %}
{% recommend key="content" pageSize="5" typeId="xxx" %}
```

#### 2. 性能优化建议

```nunjucks
<!-- ✅ 合理设置pageSize，避免一次加载过多数据 -->
{% news key="latestNews", pageSize="10" %}

<!-- ✅ 在循环中检查数据存在性 -->
{% if latestNews.length > 0 %}
  {% for article in latestNews %}
    <article>{{ article.title }}</article>
  {% endfor %}
{% endif %}

<!-- ✅ 使用条件判断避免空值错误 -->
{% if post.sImg %}
  <img src="{{ post.sImg }}" alt="{{ post.title }}">
{% endif %}
```

#### 3. SEO优化实践

```nunjucks
<!-- ✅ 合理使用head标签优化SEO -->
{% head %}
  {% if pageType === 'post' %}
    <meta property="og:title" content="{{ post.title }}">
    <meta property="og:description" content="{{ post.discription }}">
    <meta property="og:image" content="{{ post.sImg }}">
    <meta property="og:url" content="{{ site.url }}{{ post.url }}">
  {% endif %}
{% endhead %}

<!-- ✅ 使用结构化数据 -->
{% if pageType === 'post' %}
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{{ post.title }}",
    "author": {
      "@type": "Person",
      "name": "{{ post.author.userName }}"
    },
    "datePublished": "{{ post.createdAt }}",
    "image": "{{ post.sImg }}"
  }
  </script>
{% endif %}
```

### ⚠️ 常见错误和解决方案

#### 1. 参数语法错误

```nunjucks
<!-- ❌ 错误：缺少逗号 -->
{% news key="latestNews" pageSize="10" %}

<!-- ✅ 正确：使用逗号分隔参数 -->
{% news key="latestNews", pageSize="10" %}

<!-- ❌ 错误：参数值没有引号 -->
{% recommend key=featured, pageSize=5 %}

<!-- ✅ 正确：参数值使用双引号 -->
{% recommend key="featured", pageSize="5" %}
```

#### 2. 变量名错误

```nunjucks
<!-- ❌ 错误：变量名不存在 -->
{% for post in posts %}  <!-- posts变量未定义 -->
  <h2>{{ post.title }}</h2>
{% endfor %}

<!-- ✅ 正确：先获取数据，再使用 -->
{% news key="posts", pageSize="10" %}
{% for post in posts %}
  <h2>{{ post.title }}</h2>
{% endfor %}
```

#### 3. 条件判断错误

```nunjucks
<!-- ❌ 错误：直接访问可能不存在的属性 -->
<img src="{{ post.sImg }}" alt="{{ post.title }}">

<!-- ✅ 正确：先判断属性是否存在 -->
{% if post.sImg %}
  <img src="{{ post.sImg }}" alt="{{ post.title }}">
{% else %}
  <img src="/images/default.jpg" alt="{{ post.title }}">
{% endif %}
```

#### 4. 循环处理错误

```nunjucks
<!-- ❌ 错误：没有检查数组是否为空 -->
{% for tag in post.tags %}
  <span>{{ tag.name }}</span>
{% endfor %}

<!-- ✅ 正确：先检查数组存在性和长度 -->
{% if post.tags and post.tags.length > 0 %}
  {% for tag in post.tags %}
    <span>{{ tag.name }}</span>
  {% endfor %}
{% endif %}
```

### 🔧 调试技巧

#### 1. 开发环境调试

```nunjucks
<!-- 在开发环境显示调试信息 -->
{% if NODE_ENV === 'development' %}
  <div class="debug-info">
    <h4>调试信息</h4>
    <pre>{{ latestNews | dump }}</pre>
  </div>
{% endif %}
```

#### 2. 数据检查

```nunjucks
<!-- 检查变量是否存在 -->
{% if latestNews %}
  <p>数据已加载: {{ latestNews.length }} 条</p>
{% else %}
  <p>暂无数据</p>
{% endif %}
```

### 🚀 版本更新说明

- **v2.0**: 重构了标签系统架构，统一了参数语法
- **v2.1**: 新增了过滤器标签和布局标签
- **v2.2**: 优化了性能，增加了缓存机制
- **v2.3**: 新增了安全验证和错误处理

---

**注意**: 本文档基于DoraCMS v2.3版本编写，如遇到问题请查看对应版本的API文档。

#### 页面特定变量

- `{{ pageType }}` - 页面类型（"index"、"post"、"cate"、"tag"、"search"）
- `{{ post }}` - 文章详情页的文章数据
- `{{ cateInfo }}` - 分类页的分类信息
- `{{ posts }}` - 列表页的文章数据
- `{{ pageInfo }}` - 分页信息
- `{{ logined }}` - 用户登录状态
- `{{ member }}` - 当前用户信息

#### `{{ config }}` - 系统配置

```nunjucks
<!-- 环境信息 -->
<div class="debug-info" style="display: {% if config.environment === 'development' %}block{% else %}none{% endif %}">
  环境：{{ config.environment }}
</div>

<!-- 静态资源路径 -->
<link rel="stylesheet" href="{{ config.staticThemePath }}/css/theme.css">
```

#### `{{ custom }}` - 主题设置

```nunjucks
<!-- 主题相关配置 -->
<body class="theme-{{ custom.theme }}">

<!-- 主题颜色 -->
<style>
  :root {
    --primary-color: {{ custom.primaryColor | default('#007bff') }};
    --secondary-color: {{ custom.secondaryColor | default('#6c757d') }};
  }
</style>
```

#### `{{ member }}` - 用户信息

```nunjucks
<!-- 用户状态判断 -->
{% if member %}
  <div class="user-info">
    <span>欢迎，{{ member.name }}</span>
    <a href="/profile">个人中心</a>
    <a href="/logout">退出</a>
  </div>
{% else %}
  <div class="guest-info">
    <a href="/login">登录</a>
    <a href="/register">注册</a>
  </div>
{% endif %}

<!-- 用户权限判断 -->
{% if member and member.role === 'admin' %}
  <a href="/admin">管理后台</a>
{% endif %}
```
