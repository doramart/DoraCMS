# DoraCMS 模板标签系统

本文档详细说明了 DoraCMS 的模板标签系统，该系统受到 Ghost CMS 的启发，但使用 Nunjucks 实现。

## 可用标签和辅助函数

### 内容标签

1. **{% news %}** - 获取最新内容

   ```nunjucks
   {% news key="latestNews" typeId="xxx" pageSize="10" isPaging="0" %}
   ```

2. **{% recommend %}** - 获取推荐内容

   ```nunjucks
   {% recommend key="featuredContent" typeId="xxx" pageSize="5" %}
   ```

3. **{% hot %}** - 获取热门内容

   ```nunjucks
   {% hot key="popularContent" typeId="xxx" pageSize="10" %}
   ```

4. **{% random %}** - 获取随机内容

   ```nunjucks
   {% random key="randomContent" typeId="xxx" pageSize="5" %}
   ```

5. **{% nearpost %}** - 获取当前文章附近的内容
   ```nunjucks
   {% nearpost key="relatedPosts" id="xxxxx" %}
   ```

### 分类标签

1. **{% tags %}** - 获取内容标签

   ```nunjucks
   {% tags key="contentTags" isPaging="0" %}
   ```

2. **{% hottags %}** - 获取热门标签

   ```nunjucks
   {% hottags key="popularTags" %}
   ```

3. **{% navtree %}** - 获取分类树

   ```nunjucks
   {% navtree key="categoryTree" %}
   ```

4. **{% childnav %}** - 获取子分类
   ```nunjucks
   {% childnav key="childCategories" %}
   ```

### 实用工具标签

1. **{% remote %}** - 从任意 API 获取数据

   ```nunjucks
   {% remote key="customData" api="content/getList" query='{"sortby":"1"}' pageSize="10" %}
   ```

2. **{% ads %}** - 获取广告内容

   ```nunjucks
   {% ads key="bannerAds" name="homepage-banner" %}
   ```

3. **{% asset %}** - 生成主题资源的 URL

   ```nunjucks
   <link rel="stylesheet" href="{% asset "css/style.css" %}">
   ```



### 过滤器标签

1. **{% date %}** - 格式化日期

   ```nunjucks
   {% date post.created_at format="YYYY-MM-DD" %}
   {% date post.created_at timeago=true %}
   ```

2. **{% excerpt %}** - 获取文本摘要

   ```nunjucks
   {% excerpt post.content words="30" %}
   ```

3. **{% img_url %}** - 生成带选项的图片 URL

   ```nunjucks
   {% img_url post.feature_image size="medium" %}
   {% img_url post.feature_image fallback="/images/default.jpg" %}
   ```

4. **{% reading_time %}** - 计算预估阅读时间

   ```nunjucks
   {% reading_time post.content %}
   ```

5. **{% encode %}** - URL 编码字符串

   ```nunjucks
   {% encode post.title %}
   ```

6. **{% plural %}** - 根据数量输出不同文本
   ```nunjucks
   {% plural count.posts empty="没有文章" singular="% 篇文章" plural="% 篇文章" %}
   ```

### 区块标签

1. **{% foreach %}** - 使用高级选项遍历数组

   ```nunjucks
   {% foreach posts limit="5" %}
     <h2>{{ this.title }}</h2>
     {% if @first %}(第一篇){% endif %}
     {% if @last %}(最后一篇){% endif %}
   {% endforeach %}
   ```

2. **{% get %}** - 获取动态内容

   ```nunjucks
   {% get "posts" limit="5" filter="tag:featured" %}
     {% foreach posts %}
       <h2>{{ this.title }}</h2>
     {% endforeach %}
   {% endget %}
   ```

3. **{% if %}** - 条件块渲染

   ```nunjucks
   {% if post.featured %}
     <span class="featured">推荐文章</span>
   {% else %}
     <span>普通文章</span>
   {% endif %}
   ```

4. **{% has %}** - 检查属性是否存在且不为空

   ```nunjucks
   {% has tag="featured" %}
     <span class="featured-badge">推荐</span>
   {% endhas %}
   ```

5. **{% is %}** - 检查当前上下文
   ```nunjucks
   {% is "home" %}
     <h1>欢迎访问首页</h1>
   {% else %}
     <h1>欢迎访问我们的网站</h1>
   {% endis %}
   ```

### 布局标签

1. **{% body_class %}** - 根据当前页面输出 body 类

   ```nunjucks
   <body class="{% body_class %}">
   ```

2. **{% post_class %}** - 输出文章特定的类

   ```nunjucks
   <article class="{% post_class %}">
   ```

3. **{% navigation %}** - 生成导航 HTML

   ```nunjucks
   {% navigation %}
   ```

4. **{% pagination %}** - 生成分页 HTML

   ```nunjucks
   {% pagination %}
   ```

5. **{% search %}** - 生成搜索表单
   ```nunjucks
   {% search placeholder="搜索博客..." %}
   ```

### 上下文标签

1. **{{ site.* }}** - 访问全局站点数据

   ```nunjucks
   <title>{{ site.title }}</title>
   <meta name="description" content="{{ site.description }}">
   ```

2. **{{ page.* }}** - 访问当前页面数据

   ```nunjucks
   <h1>{{ page.title }}</h1>
   ```

3. **{{ custom.* }}** - 访问主题特定设置

   ```nunjucks
   <div class="theme-{{ custom.theme }}">
   ```

4. **{{ config.* }}** - 访问配置数据

   ```nunjucks
   <footer>版本 {{ config.version }}</footer>
   ```

5. **{{ member.* }}** - 访问当前用户数据
   ```nunjucks
   {% if member %}
     <p>欢迎回来，{{ member.name }}</p>
   {% else %}
     <p>请登录</p>
   {% endif %}
   ```

### Nunjucks 过滤器

你也可以将这些辅助函数作为过滤器使用：

```nunjucks
{{ post.published_at | date("YYYY-MM-DD") }}
{{ post.content | excerpt(30) }}
{{ post.feature_image | img_url("medium") }}
{{ post.content | reading_time }}
{{ post.title | encode }}
```

## 常用参数

大多数标签接受以下参数：

- **key**: 在模板上下文中存储结果的变量名
- **pageSize**: 返回的项目数量
- **isPaging**: 是否使用分页 (1) 或不使用 (0)
- **typeId**: 按分类 ID 筛选

## 使用示例

### 示例 1: 显示最新新闻

```nunjucks
{% news key="latestNews" pageSize="5" %}

<div class="news-list">
  {% foreach latestNews.data %}
    <div class="news-item">
      <h3><a href="/details/{{ this._id }}.html">{{ this.title }}</a></h3>
      <p>{{ this.discription }}</p>
      <small>{{ this.created_at | date("YYYY-MM-DD") }}</small>
    </div>
  {% endforeach %}
</div>
```

### 示例 2: 显示分类及其文章

```nunjucks
{% navtree key="categories" %}

<div class="category-section">
  {% foreach categories %}
    <div class="category">
      <h2>{{ this.name }}</h2>

      {% get "posts" typeId=this._id pageSize="3" %}

      <div class="posts">
        {% foreach posts.data %}
          <div class="post">
            <h3><a href="/details/{{ this._id }}.html">{{ this.title }}</a></h3>
          </div>
        {% endforeach %}
      </div>
    </div>
  {% endforeach %}
</div>
```

### 示例 3: 基于上下文的条件显示

```nunjucks
{% is "home" %}
  <h1>欢迎访问 {{ site.title }}</h1>
  <p>{{ site.description }}</p>
{% else %}
  {% is "post" %}
    <h1>{{ post.title }}</h1>
    <div class="post-meta">
      <span>{{ post.created_at | date("YYYY-MM-DD") }}</span>
      <span>{{ post.content | reading_time }}</span>
    </div>
  {% else %}
    <h1>{{ page.title }}</h1>
  {% endis %}
{% endis %}
```

### 示例 4: 热门文章和标签的侧边栏

```nunjucks
<div class="sidebar">
  <div class="widget">
    <h3>热门文章</h3>
    {% hot key="popularPosts" pageSize="5" %}
    <ul>
      {% foreach popularPosts.data %}
        <li>
          <a href="/details/{{ this._id }}.html">{{ this.title }}</a>
          <span class="view-count">{{ this.viewCount }} 次阅读</span>
        </li>
      {% endforeach %}
    </ul>
  </div>

  <div class="widget">
    <h3>热门标签</h3>
    {% hottags key="popularTags" %}
    <div class="tags-cloud">
      {% foreach popularTags %}
        <a href="/tag/{{ this.name }}" class="tag tag-{{ @index }}">{{ this.name }}</a>
      {% endforeach %}
    </div>
  </div>
</div>
```

### 示例 5: 使用远程数据

```nunjucks
{% remote key="weatherData" api="external/weather" query='{"city":"beijing"}' %}

<div class="weather-widget">
  <h3>今日天气</h3>
  {% if weatherData %}
    <div class="weather-info">
      <div class="temp">{{ weatherData.temperature }}°C</div>
      <div class="condition">{{ weatherData.condition }}</div>
      <div class="humidity">湿度: {{ weatherData.humidity }}%</div>
    </div>
  {% else %}
    <div class="error">无法获取天气信息</div>
  {% endif %}
</div>
```

### 示例 6: 复杂布局示例

```nunjucks
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>{{ site.title }}{% if page.title %} - {{ page.title }}{% endif %}</title>
  <meta name="description" content="{{ site.description }}">
  <link rel="stylesheet" href="{% asset "css/style.css" %}">
  <link rel="icon" href="{{ site.icon }}">
</head>
<body class="{% body_class %}">
  <header class="site-header">
    <div class="container">
      <div class="logo">
        <a href="/"><img src="{{ site.logo }}" alt="{{ site.title }}"></a>
      </div>
      {% navigation %}
      {% search placeholder="搜索内容..." %}
    </div>
  </header>

  <main class="site-main">
    <div class="container">
      {% is "home" %}
        <!-- 首页布局 -->
        <div class="featured-posts">
          {% recommend key="featuredPosts" pageSize="3" %}
          <div class="carousel">
            {% foreach featuredPosts.data %}
              <div class="slide">
                <div class="slide-image">
                  <img src="{{ this.sImg }}" alt="{{ this.title }}">
                </div>
                <div class="slide-content">
                  <h2><a href="/details/{{ this._id }}.html">{{ this.title }}</a></h2>
                  <p>{{ this.discription }}</p>
                </div>
              </div>
            {% endforeach %}
          </div>
        </div>

        <div class="latest-posts">
          <h2>最新文章</h2>
          {% news key="latestPosts" pageSize="10" isPaging="1" %}
          <div class="post-grid">
            {% foreach latestPosts.data %}
              <article class="post-card">
                <div class="post-thumbnail">
                  <a href="/details/{{ this._id }}.html">
                    <img src="{{ this.sImg }}" alt="{{ this.title }}">
                  </a>
                </div>
                <div class="post-content">
                  <h3><a href="/details/{{ this._id }}.html">{{ this.title }}</a></h3>
                  <div class="post-meta">
                    <span class="date">{{ this.created_at | date("YYYY-MM-DD") }}</span>
                    <span class="reading-time">{{ this.content | reading_time }}</span>
                  </div>
                  <p>{{ this.discription }}</p>
                </div>
              </article>
            {% endforeach %}
          </div>
          {% pagination %}
        </div>
      {% else %}
        {% is "post" %}
          <!-- 文章详情页布局 -->
          <article class="{% post_class %}">
            <header class="post-header">
              <h1>{{ post.title }}</h1>
              <div class="post-meta">
                <span class="date">{{ post.created_at | date("YYYY-MM-DD") }}</span>
                <span class="author">作者: {{ post.author.name }}</span>
                <span class="reading-time">{{ post.content | reading_time }}</span>
              </div>
            </header>

            <div class="post-content">
              {{ post.content }}
            </div>

            <footer class="post-footer">
              <div class="post-tags">
                标签:
                {% foreach post.tags %}
                  <a href="/tag/{{ this.name }}" class="tag">{{ this.name }}</a>
                {% endforeach %}
              </div>
            </footer>
          </article>

          <div class="related-posts">
            <h3>相关文章</h3>
            {% nearpost key="relatedPosts" id=post._id %}
            <div class="post-list">
              {% if relatedPosts.prePost %}
                <div class="post prev-post">
                  <span>上一篇:</span>
                  <a href="/details/{{ relatedPosts.prePost._id }}.html">{{ relatedPosts.prePost.title }}</a>
                </div>
              {% endif %}
              {% if relatedPosts.nextPost %}
                <div class="post next-post">
                  <span>下一篇:</span>
                  <a href="/details/{{ relatedPosts.nextPost._id }}.html">{{ relatedPosts.nextPost.title }}</a>
                </div>
              {% endif %}
            </div>
          </div>
        {% else %}
          <!-- 其他页面布局 -->
          <div class="page-content">
            <h1>{{ page.title }}</h1>
            {{ page.content }}
          </div>
        {% endis %}
      {% endis %}
    </div>
  </main>

  <aside class="site-sidebar">
    <div class="container">
      <div class="widget about-widget">
        <h3>关于我们</h3>
        <p>{{ site.description }}</p>
      </div>

      <div class="widget">
        <h3>分类目录</h3>
        {% navtree key="categories" %}
        <ul class="category-list">
          {% foreach categories %}
            <li><a href="/cate/{{ this._id }}">{{ this.name }}</a></li>
          {% endforeach %}
        </ul>
      </div>

      <div class="widget">
        <h3>热门标签</h3>
        {% hottags key="popularTags" %}
        <div class="tag-cloud">
          {% foreach popularTags %}
            <a href="/tag/{{ this.name }}" class="tag">{{ this.name }}</a>
          {% endforeach %}
        </div>
      </div>
    </div>
  </aside>

  <footer class="site-footer">
    <div class="container">
      <div class="copyright">
        &copy; {{ site.title }} {{ config.currentYear }}
      </div>
    </div>
  </footer>

  <script src="{% asset "js/main.js" %}"></script>
</body>
</html>
```

## 全局变量

以下全局变量在所有模板中都可用：

- **site**: 全局站点配置
- **page**: 当前页面信息
- **custom**: 主题特定配置
- **config**: 系统配置
- **member**: 当前登录用户信息（如果有）

## 标签系统架构

DoraCMS 模板标签系统采用模块化设计，主要包含以下几个组件：

1. **标签注册器（Registry）**: 负责注册和管理所有可用标签
2. **基础标签类（BaseTag）**: 所有标签的基类，提供通用功能
3. **内容标签（Content Tags）**: 用于获取各种内容数据
4. **分类标签（Taxonomy Tags）**: 用于获取分类和标签数据
5. **过滤器标签（Filter Tags）**: 用于处理和格式化数据
6. **区块标签（Block Tags）**: 提供高级逻辑和循环功能
7. **布局标签（Layout Tags）**: 生成特定的 HTML 布局元素
8. **上下文管理器（Context Manager）**: 管理全局数据和状态

这些组件协同工作，提供了一个灵活且强大的模板系统，可以构建各种复杂的网站布局和功能。
