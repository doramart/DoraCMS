# AI Assistant Plugin Static Resources

这个目录用于存放 `egg-ai-assistant` 插件的静态资源文件。

## 目录结构

```
app/public/
├── css/          # 样式文件
├── js/           # JavaScript 文件
├── images/       # 图片资源
├── fonts/        # 字体文件
└── README.md     # 说明文件
```

## 访问方式

插件的静态资源可以通过以下 URL 前缀访问：

```
/static/ai-assistant/
```

例如：

- CSS 文件：`/static/ai-assistant/css/ai-assistant.css`
- JavaScript 文件：`/static/ai-assistant/js/ai-assistant.js`
- 图片文件：`/static/ai-assistant/images/logo.png`

## 配置说明

静态资源配置在 `config/config.default.js` 中：

```javascript
config.aiAssistantStatic = {
  // 插件静态资源目录
  dir: path.join(appInfo.baseDir, 'app/public'),
  // URL 访问前缀
  prefix: '/static/ai-assistant',
  // 是否启用
  enabled: true,
};
```

## 注意事项

1. 静态资源文件会在插件启动时自动添加到主应用的静态资源配置中
2. 请确保文件名不与主应用的静态资源冲突
3. 建议使用有意义的目录结构来组织文件
