#!/usr/bin/env node
/**
 * 模板布局生成器 - 支持动态布局配置
 * 借鉴 Ghost CMS 的主题生成最佳实践
 */
'use strict';

const fs = require('fs');
const path = require('path');

class TemplateLayoutGenerator {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(__dirname, '..');
    this.viewDir = path.join(this.baseDir, 'app', 'view');
    this.verbose = options.verbose || false;
  }

  /**
   * 为主题生成所有布局变体
   * @param {String} themeSlug 主题标识
   * @param {Object} options 生成选项
   */
  async generateThemeLayoutVariants(themeSlug, options = {}) {
    const themePath = path.join(this.viewDir, themeSlug);

    if (!fs.existsSync(themePath)) {
      throw new Error(`Theme not found: ${themeSlug}`);
    }

    const themeConfig = await this.loadThemeConfig(themePath);
    const layouts = Array.isArray(themeConfig.layouts) ? themeConfig.layouts : ['default', 'sidebar', 'wide'];
    const contentTypes = options.contentTypes || ['index', 'category', 'post', 'search', 'tag', 'author'];

    console.log(`🎨 Generating layout variants for theme: ${themeSlug}`);
    console.log(`📐 Layouts: ${layouts.join(', ')}`);
    console.log(`📄 Content types: ${contentTypes.join(', ')}\n`);

    let generatedCount = 0;

    // 为每个内容类型生成布局变体
    for (const contentType of contentTypes) {
      for (const layout of layouts) {
        if (layout === 'default') continue; // 默认布局不需要后缀

        const generated = await this.generateTemplateVariant(themePath, contentType, layout, options);

        if (generated) {
          generatedCount++;
        }
      }
    }

    console.log(`\n✨ 完成！为主题 ${themeSlug} 生成了 ${generatedCount} 个布局变体`);
    return generatedCount;
  }

  /**
   * 生成单个模板的布局变体
   * @param {String} themePath 主题路径
   * @param {String} contentType 内容类型
   * @param {String} layout 布局名称
   * @param {Object} options 选项
   */
  async generateTemplateVariant(themePath, contentType, layout, options = {}) {
    const templatesDir = path.join(themePath, 'templates');
    const baseTemplatePath = path.join(templatesDir, `${contentType}.html`);
    const variantTemplatePath = path.join(templatesDir, `${contentType}-${layout}.html`);

    // 检查变体模板是否已存在
    if (fs.existsSync(variantTemplatePath) && !options.overwrite) {
      if (this.verbose) {
        console.log(`⚠️  Template variant already exists: ${contentType}-${layout}.html`);
      }
      return false;
    }

    // 检查基础模板是否存在
    if (!fs.existsSync(baseTemplatePath)) {
      // 如果基础模板不存在，生成默认模板
      await this.generateDefaultTemplate(templatesDir, contentType, layout);
    } else {
      // 基于现有模板生成变体
      await this.generateVariantFromBase(baseTemplatePath, variantTemplatePath, layout);
    }

    console.log(`✅ Generated: ${contentType}-${layout}.html`);
    return true;
  }

  /**
   * 基于现有模板生成布局变体
   * @param {String} baseTemplatePath 基础模板路径
   * @param {String} variantTemplatePath 变体模板路径
   * @param {String} layout 布局名称
   */
  async generateVariantFromBase(baseTemplatePath, variantTemplatePath, layout) {
    const baseContent = fs.readFileSync(baseTemplatePath, 'utf8');

    // 检查基础模板是否已有布局声明
    if (this.hasLayoutDeclaration(baseContent)) {
      // 替换现有的布局声明
      const variantContent = this.replaceLayoutDeclaration(baseContent, layout);
      fs.writeFileSync(variantTemplatePath, variantContent);
    } else {
      // 为纯内容模板添加布局声明
      const variantContent = this.wrapWithLayout(baseContent, layout);
      fs.writeFileSync(variantTemplatePath, variantContent);
    }
  }

  /**
   * 生成默认模板
   * @param {String} templatesDir 模板目录
   * @param {String} contentType 内容类型
   * @param {String} layout 布局名称
   */
  async generateDefaultTemplate(templatesDir, contentType, layout) {
    const templatePath = path.join(templatesDir, `${contentType}-${layout}.html`);
    const templateContent = this.generateDefaultTemplateContent(contentType, layout);

    // 确保模板目录存在
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    fs.writeFileSync(templatePath, templateContent);
  }

  /**
   * 生成默认模板内容
   * @param {String} contentType 内容类型
   * @param {String} layout 布局名称
   */
  generateDefaultTemplateContent(contentType, layout) {
    const contentTypeNames = {
      index: '首页',
      category: '分类页',
      post: '详情页',
      search: '搜索页',
      tag: '标签页',
      author: '作者页',
      archive: '归档页',
    };

    const typeName = contentTypeNames[contentType] || contentType;

    return `{% extends "../layouts/${layout}.html" %}
{% block content %}
<!-- ${typeName} - ${layout} 布局版本 -->
<div class="${contentType}-page ${layout}-layout">
  <section class="page-header">
    <h1>${typeName} - ${layout} 布局</h1>
    <p>这是 ${typeName} 的 ${layout} 布局版本，由模板生成器自动创建。</p>
    <div class="layout-info">
      <span class="badge">布局: ${layout}</span>
      <span class="badge">类型: ${contentType}</span>
    </div>
  </section>

  <section class="main-content">
    {% if ${contentType} === 'index' %}
      <!-- 首页内容 -->
      <div class="hero-section">
        <h2>{{ siteDynamic.title || '欢迎来到首页' }}</h2>
        <p>{{ siteDynamic.description || '这是网站描述' }}</p>
      </div>
      
      {% if posts and posts.length > 0 %}
        <div class="posts-grid">
          {% for post in posts %}
            <article class="post-card">
              <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
              <p>{{ post.excerpt }}</p>
              <div class="post-meta">
                <span>{{ post.date_show }}</span>
              </div>
            </article>
          {% endfor %}
        </div>
      {% endif %}
      
    {% elif ${contentType} === 'category' %}
      <!-- 分类页内容 -->
      {% if category %}
        <div class="category-header">
          <h2>{{ category.name }}</h2>
          <p>{{ category.description }}</p>
        </div>
      {% endif %}
      
      {% if posts and posts.length > 0 %}
        <div class="category-posts">
          {% for post in posts %}
            <article class="post-item">
              <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
              <p>{{ post.excerpt }}</p>
            </article>
          {% endfor %}
        </div>
      {% endif %}
      
    {% elif ${contentType} === 'post' %}
      <!-- 详情页内容 -->
      {% if content %}
        <article class="post-detail">
          <header class="post-header">
            <h1>{{ content.title }}</h1>
            <div class="post-meta">
              <span>发布时间: {{ content.date_show }}</span>
              {% if content.author %}
                <span>作者: {{ content.author }}</span>
              {% endif %}
            </div>
          </header>
          
          <div class="post-content">
            {{ content.content | safe }}
          </div>
        </article>
      {% endif %}
      
    {% else %}
      <!-- 其他页面类型的默认内容 -->
      <div class="page-content">
        <h2>{{ title || '页面标题' }}</h2>
        <p>这是 ${typeName} 的默认内容。</p>
        
        {% if posts and posts.length > 0 %}
          <div class="content-list">
            {% for item in posts %}
              <div class="content-item">
                <h3>{{ item.title }}</h3>
                <p>{{ item.excerpt || item.description }}</p>
              </div>
            {% endfor %}
          </div>
        {% endif %}
      </div>
    {% endif %}
  </section>

  <!-- 模板信息（开发模式显示） -->
  {% if debug %}
  <section class="template-debug">
    <h3>模板调试信息</h3>
    <ul>
      <li>模板文件: templates/${contentType}-${layout}.html</li>
      <li>布局文件: layouts/${layout}.html</li>
      <li>内容类型: ${contentType}</li>
      <li>布局类型: ${layout}</li>
      <li>生成时间: {{ "now" | date("YYYY-MM-DD HH:mm:ss") }}</li>
    </ul>
  </section>
  {% endif %}
</div>
{% endblock %}`;
  }

  /**
   * 检查模板是否包含布局声明
   * @param {String} content 模板内容
   */
  hasLayoutDeclaration(content) {
    const patterns = [/{% extends\s+[^%]+%}/, /{{!<\s*[^}]+}}/, /<!--\s*layout:\s*[^>]+-->/];

    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * 替换现有的布局声明
   * @param {String} content 模板内容
   * @param {String} newLayout 新布局名称
   */
  replaceLayoutDeclaration(content, newLayout) {
    // 替换 Nunjucks extends
    content = content.replace(/{% extends\s+[^%]+%}/, `{% extends "../layouts/${newLayout}.html" %}`);

    // 替换 Handlebars layout
    content = content.replace(/{{!<\s*[^}]+}}/, `{{!< ${newLayout}}}`);

    // 替换 HTML comment layout
    content = content.replace(/<!--\s*layout:\s*[^>]+-->/, `<!-- layout: ${newLayout} -->`);

    return content;
  }

  /**
   * 用布局包装纯内容模板
   * @param {String} content 模板内容
   * @param {String} layout 布局名称
   */
  wrapWithLayout(content, layout) {
    return `{% extends "../layouts/${layout}.html" %}
{% block content %}
${content}
{% endblock %}`;
  }

  /**
   * 加载主题配置
   * @param {String} themePath 主题路径
   */
  async loadThemeConfig(themePath) {
    const configPath = path.join(themePath, 'theme.json');

    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configContent);
      } catch (error) {
        console.warn(`⚠️  Failed to parse theme.json: ${error.message}`);
      }
    }

    // 返回默认配置
    return {
      layouts: ['default', 'sidebar', 'wide', 'minimal'],
      templates: ['index', 'category', 'post', 'search'],
      components: ['header', 'footer', 'nav'],
    };
  }

  /**
   * 生成布局文件
   * @param {String} themePath 主题路径
   * @param {String} layoutName 布局名称
   */
  async generateLayout(themePath, layoutName) {
    const layoutsDir = path.join(themePath, 'layouts');
    const layoutPath = path.join(layoutsDir, `${layoutName}.html`);

    if (fs.existsSync(layoutPath)) {
      console.log(`⚠️  Layout already exists: ${layoutName}.html`);
      return false;
    }

    const layoutContent = this.generateLayoutContent(layoutName);

    // 确保布局目录存在
    if (!fs.existsSync(layoutsDir)) {
      fs.mkdirSync(layoutsDir, { recursive: true });
    }

    fs.writeFileSync(layoutPath, layoutContent);
    console.log(`✅ Generated layout: ${layoutName}.html`);
    return true;
  }

  /**
   * 生成布局内容
   * @param {String} layoutName 布局名称
   */
  generateLayoutContent(layoutName) {
    const layoutTemplates = {
      sidebar: this.generateSidebarLayout(),
      wide: this.generateWideLayout(),
      minimal: this.generateMinimalLayout(),
    };

    return layoutTemplates[layoutName] || this.generateDefaultLayout(layoutName);
  }

  /**
   * 生成侧边栏布局
   */
  generateSidebarLayout() {
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title || siteDynamic.title || '侧边栏布局' }}</title>
    <meta name="description" content="{{ description || siteDynamic.description }}" />
    <link rel="stylesheet" href="/assets/css/style.css" />
    <style>
      .layout-container { display: flex; max-width: 1200px; margin: 0 auto; gap: 20px; }
      .sidebar { width: 300px; background: #f8f9fa; padding: 20px; border-radius: 8px; }
      .main-content { flex: 1; min-width: 0; }
      @media (max-width: 768px) {
        .layout-container { flex-direction: column; }
        .sidebar { width: 100%; order: 2; }
      }
    </style>
  </head>
  <body>
    <header class="site-header">
      <div class="container">
        <h1 class="site-title">{{ siteDynamic.title || 'DoraCMS' }}</h1>
        <nav class="main-nav">
          <a href="/">首页</a>
          <a href="/category">分类</a>
          <a href="/search">搜索</a>
        </nav>
      </div>
    </header>

    <div class="layout-container">
      <main class="main-content">
        {% block content %}{% endblock %}
      </main>
      
      <aside class="sidebar">
        {% block sidebar %}
          <div class="widget">
            <h3>侧边栏</h3>
            <p>这是侧边栏区域</p>
          </div>
        {% endblock %}
      </aside>
    </div>

    <footer class="site-footer">
      <div class="container">
        <p>&copy; {{ "now" | date("YYYY") }} {{ siteDynamic.title || 'DoraCMS' }}. 侧边栏布局.</p>
      </div>
    </footer>
  </body>
</html>`;
  }

  /**
   * 生成宽屏布局
   */
  generateWideLayout() {
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title || siteDynamic.title || '宽屏布局' }}</title>
    <meta name="description" content="{{ description || siteDynamic.description }}" />
    <link rel="stylesheet" href="/assets/css/style.css" />
    <style>
      .wide-container { max-width: 1400px; margin: 0 auto; padding: 0 20px; }
      .hero-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 0; margin-bottom: 40px; }
    </style>
  </head>
  <body>
    <header class="site-header">
      <div class="wide-container">
        <h1 class="site-title">{{ siteDynamic.title || 'DoraCMS' }}</h1>
        <nav class="main-nav">
          <a href="/">首页</a>
          <a href="/category">分类</a>
          <a href="/search">搜索</a>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <div class="wide-container">
        {% block content %}{% endblock %}
      </div>
    </main>

    <footer class="site-footer">
      <div class="wide-container">
        <p>&copy; {{ "now" | date("YYYY") }} {{ siteDynamic.title || 'DoraCMS' }}. 宽屏布局.</p>
      </div>
    </footer>
  </body>
</html>`;
  }

  /**
   * 生成极简布局
   */
  generateMinimalLayout() {
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title || siteDynamic.title || '极简布局' }}</title>
    <meta name="description" content="{{ description || siteDynamic.description }}" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
      h1, h2, h3 { color: #2c3e50; }
      .minimal-header { border-bottom: 1px solid #eee; margin-bottom: 40px; padding-bottom: 20px; }
      .minimal-footer { border-top: 1px solid #eee; margin-top: 40px; padding-top: 20px; text-align: center; color: #666; }
    </style>
  </head>
  <body>
    <header class="minimal-header">
      <h1>{{ siteDynamic.title || 'DoraCMS' }}</h1>
    </header>

    <main>
      {% block content %}{% endblock %}
    </main>

    <footer class="minimal-footer">
      <p>{{ siteDynamic.title || 'DoraCMS' }} - 极简布局</p>
    </footer>
  </body>
</html>`;
  }

  /**
   * 生成默认布局
   * @param layoutName
   */
  generateDefaultLayout(layoutName) {
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title || siteDynamic.title || '${layoutName} 布局' }}</title>
    <meta name="description" content="{{ description || siteDynamic.description }}" />
    <link rel="stylesheet" href="/assets/css/style.css" />
  </head>
  <body>
    <header class="site-header">
      <div class="container">
        <h1>{{ siteDynamic.title || 'DoraCMS' }} - ${layoutName} 布局</h1>
      </div>
    </header>

    <main class="main-content">
      <div class="container">
        {% block content %}{% endblock %}
      </div>
    </main>

    <footer class="site-footer">
      <div class="container">
        <p>&copy; {{ "now" | date("YYYY") }} {{ siteDynamic.title || 'DoraCMS' }}. ${layoutName} 布局.</p>
      </div>
    </footer>
  </body>
</html>`;
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const themeSlug = args[0] || 'standard-template';
  const options = {
    overwrite: args.includes('--overwrite'),
    verbose: args.includes('--verbose'),
    contentTypes: args.includes('--content-types') ? args[args.indexOf('--content-types') + 1]?.split(',') : undefined,
  };

  console.log('🎨 Template Layout Generator');
  console.log('============================\n');

  try {
    const generator = new TemplateLayoutGenerator({ verbose: options.verbose });

    // 生成布局变体
    await generator.generateThemeLayoutVariants(themeSlug, options);

    console.log('\n📚 使用说明:');
    console.log('1. 设置分类的 themeConfig.layout 即可使用对应布局');
    console.log('2. 系统会自动选择最匹配的模板文件');
    console.log('3. 支持运行时布局覆盖和智能回退机制');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = TemplateLayoutGenerator;
