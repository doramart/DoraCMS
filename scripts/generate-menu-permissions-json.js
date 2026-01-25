#!/usr/bin/env node
'use strict';

/**
 * 生成菜单权限JSON文件
 * 基于 server/app/permission/definitions/manage.js 数据
 * 输出格式: {"admin": [{"desc":"...","api":"...","permissionCode":"...","httpMethod":"..."},...]}
 */

const fs = require('fs');
const path = require('path');

// 读取权限定义文件
const permissionsPath = path.join(__dirname, '../server/app/permission/definitions/manage.js');
const permissions = require(permissionsPath);

// 按 group 分组权限
const groupedPermissions = {};

permissions.forEach(permission => {
  const group = permission.group;
  
  if (!groupedPermissions[group]) {
    groupedPermissions[group] = [];
  }
  
  // 转换为目标格式
  groupedPermissions[group].push({
    desc: permission.desc,
    api: permission.path.replace('/manage/', ''), // 移除 /manage/ 前缀
    permissionCode: permission.code,
    httpMethod: permission.method
  });
});

// 生成输出内容 - 每个菜单权限一行显示
const outputLines = [];
outputLines.push('{');

const groups = Object.keys(groupedPermissions);
groups.forEach((group, index) => {
  const permissions = groupedPermissions[group];
  const isLast = index === groups.length - 1;
  
  // 将权限数组转为单行JSON字符串
  const permissionsJson = JSON.stringify(permissions);
  
  // 格式化为: "groupName": [...]
  const line = `  "${group}": ${permissionsJson}${isLast ? '' : ','}`;
  outputLines.push(line);
});

outputLines.push('}');

// 输出到文件
const outputPath = path.join(__dirname, '../server/menu-permissions.json');
const outputContent = outputLines.join('\n');

fs.writeFileSync(outputPath, outputContent, 'utf8');

console.log(`✅ 菜单权限JSON文件已生成: ${outputPath}`);
console.log(`📊 共处理 ${groups.length} 个菜单分组，${permissions.length} 个权限`);
