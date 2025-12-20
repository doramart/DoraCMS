'use strict';
const egg = require('egg');

// Workers 数量优先级：
// 1. 命令行参数：node server.js 2
// 2. 环境变量：EGG_WORKERS=1
// 3. 配置文件：config.cluster.workers（默认 1）
const workers = process.argv[2] ? Number(process.argv[2]) : undefined;

egg.startCluster({
  workers, // 如果为 undefined，则使用配置文件中的设置
  baseDir: __dirname,
});
