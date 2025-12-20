#!/usr/bin/env node

/**
 * Nunjucks 模板格式化工具 v2
 * 改进版：更智能的HTML和Nunjucks格式化
 */

const fs = require('fs');
const path = require('path');

function formatNunjucksTemplate(content) {
  let formatted = content;

  // 预处理：分离挤在一起的 Nunjucks 标签
  formatted = formatted.replace(/(%})\s*({%)/g, '$1\n$2');
  formatted = formatted.replace(/(%})\s*({{)/g, '$1\n$2');
  formatted = formatted.replace(/(}})\s*({%)/g, '$1\n$2');
  formatted = formatted.replace(/(}})\s*({{)/g, '$1\n$2');
  formatted = formatted.replace(/(%})\s*({#)/g, '$1\n$2');
  formatted = formatted.replace(/(#})\s*({%)/g, '$1\n$2');
  formatted = formatted.replace(/(#})\s*({{)/g, '$1\n$2');

  // 处理跨行的 Nunjucks 标签，将它们合并到一行
  formatted = formatted.replace(/({%[^%]*)\n\s*([^%]*%})/g, '$1 $2');
  formatted = formatted.replace(/({{[^}]*)\n\s*([^}]*}})/g, '$1 $2');

  // 修复被错误分割的HTML属性和标签
  formatted = formatted.replace(/(<[^>]*)\n\s*([^<>]*>)/g, function (match, p1, p2) {
    // 如果第二部分不包含新的标签开始，则合并
    if (!p2.includes('<')) {
      return p1 + ' ' + p2.trim();
    }
    return match;
  });

  // 格式化长注释
  formatted = formatted.replace(/({#[\s\S]*?#})/g, function (match) {
    if (match.length > 80 && match.includes('使用示例')) {
      const comment = match.slice(2, -2).trim();
      let formattedComment = '{#\n  使用示例:\n';

      const parts = comment.split(/(\d+\.\s*)/);
      let currentExample = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!part) continue;

        if (/^\d+\.\s*$/.test(part)) {
          if (currentExample) {
            formattedComment += '    ' + currentExample.trim() + '\n\n';
          }
          formattedComment += '  ' + part;
          currentExample = '';
        } else {
          currentExample += part + ' ';
        }
      }

      if (currentExample) {
        formattedComment += '    ' + currentExample.trim() + '\n';
      }

      formattedComment += '#}';
      return formattedComment;
    }
    return match;
  });

  let indentLevel = 0;
  const indentSize = 2;
  const lines = formatted.split('\n');
  const formattedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      formattedLines.push('');
      continue;
    }

    // 处理 Nunjucks 控制结构
    if (line.match(/^{%\s*(endif|endfor|endmacro)\s*%}/)) {
      indentLevel = Math.max(0, indentLevel - 1);
    } else if (line.match(/^{%\s*(else|elif)\s/)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // 处理HTML结束标签
    if (line.match(/^<\/[^>]+>$/)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // 添加缩进
    const indent = ' '.repeat(indentLevel * indentSize);
    formattedLines.push(indent + line);

    // 增加缩进的条件
    if (line.match(/^{%\s*(if|for|macro)\s/) || line.match(/^{%\s*(else|elif)\s/)) {
      indentLevel++;
    }

    // HTML开始标签缩进（排除内联元素和自闭合标签）
    if (
      line.match(/^<[^\/!][^>]*[^\/]>$/) &&
      !line.match(/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i) &&
      !line.match(/^<(span|a|strong|em|code|small|b|i|u|label)[\s>]/i)
    ) {
      indentLevel++;
    }
  }

  return formattedLines.join('\n');
}

function formatNunjucksFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const formatted = formatNunjucksTemplate(content);
    fs.writeFileSync(filePath, formatted, 'utf8');
    console.log(`✅ 格式化完成: ${filePath}`);
  } catch (error) {
    console.error(`❌ 格式化失败: ${filePath}`, error.message);
  }
}

function formatDirectory(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);

    if (file.isDirectory()) {
      formatDirectory(fullPath);
    } else if (file.name.endsWith('.html') || file.name.endsWith('.njk') || file.name.endsWith('.nunjucks')) {
      formatNunjucksFile(fullPath);
    }
  }
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('使用方法:');
  console.log('  node format-nunjucks-v2.js <文件路径>');
  console.log('  node format-nunjucks-v2.js <目录路径>');
  console.log('');
  console.log('示例:');
  console.log('  node format-nunjucks-v2.js server/app/view/standard-template/templates/post.html');
  console.log('  node format-nunjucks-v2.js server/app/view/standard-template/');
  process.exit(1);
}

const targetPath = args[0];

if (!fs.existsSync(targetPath)) {
  console.error(`❌ 路径不存在: ${targetPath}`);
  process.exit(1);
}

const stat = fs.statSync(targetPath);

if (stat.isDirectory()) {
  console.log(`📁 格式化目录: ${targetPath}`);
  formatDirectory(targetPath);
} else {
  console.log(`📄 格式化文件: ${targetPath}`);
  formatNunjucksFile(targetPath);
}

console.log('🎉 格式化完成！');
