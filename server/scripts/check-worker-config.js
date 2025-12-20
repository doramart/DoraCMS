#!/usr/bin/env node
'use strict';

/**
 * Worker 配置检查脚本
 * 用于验证 EggJS Worker 配置是否正确
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

console.log('');
console.log('🔍 EggJS Worker 配置检查');
console.log('='.repeat(60));

// 1. 加载环境配置
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  console.log('✅ 环境变量已加载');
} catch (err) {
  console.log('⚠️  未找到 .env 文件，使用默认配置');
}

// 2. 读取配置
const envConfig = require('../config/env');
const cpuCount = os.cpus().length;
const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
const workerCount = envConfig.WORKERS;

console.log('');
console.log('📊 系统信息:');
console.log('-'.repeat(60));
console.log(`CPU 核心数:      ${cpuCount} 核`);
console.log(`总内存:         ${totalMemory} GB`);
console.log(`可用内存:       ${freeMemory} GB`);
console.log(`内存使用率:     ${((1 - freeMemory / totalMemory) * 100).toFixed(1)}%`);

console.log('');
console.log('⚙️  Worker 配置:');
console.log('-'.repeat(60));
console.log(`环境变量 EGG_WORKERS: ${process.env.EGG_WORKERS || '(未设置)'}`);
console.log(`实际 Worker 数量:     ${workerCount}`);
console.log(`配置来源:            ${process.env.EGG_WORKERS ? '环境变量' : '默认值'}`);

// 3. 内存预估
const estimatedMemory = {
  master: 50,
  agent: 50,
  workerBase: 150,
  workerPerProcess: 150,
};

const totalEstimated =
  estimatedMemory.master +
  estimatedMemory.agent +
  estimatedMemory.workerBase +
  estimatedMemory.workerPerProcess * workerCount;

console.log('');
console.log('💾 内存使用预估:');
console.log('-'.repeat(60));
console.log(`Master 进程:    ~${estimatedMemory.master} MB`);
console.log(`Agent 进程:     ~${estimatedMemory.agent} MB`);
console.log(
  `Worker 进程:    ~${estimatedMemory.workerBase + estimatedMemory.workerPerProcess * workerCount} MB (${workerCount} × ${estimatedMemory.workerPerProcess} MB)`
);
console.log(`预计总占用:     ~${totalEstimated} MB (~${(totalEstimated / 1024).toFixed(2)} GB)`);
console.log(`剩余可用:       ~${(freeMemory - totalEstimated / 1024).toFixed(2)} GB`);

// 4. 配置建议
console.log('');
console.log('💡 配置建议:');
console.log('-'.repeat(60));

const recommendations = [];
const warnings = [];

// 检查 CPU 核心数
if (workerCount > cpuCount) {
  warnings.push(`⚠️  Worker 数量 (${workerCount}) 超过 CPU 核心数 (${cpuCount})`);
  recommendations.push(`建议: 设置 EGG_WORKERS=${cpuCount}`);
}

// 检查内存
const memoryUsagePercent = (totalEstimated / 1024 / totalMemory) * 100;
if (memoryUsagePercent > 60) {
  warnings.push(`⚠️  预计内存使用率过高 (${memoryUsagePercent.toFixed(1)}%)`);
  if (workerCount > 1) {
    recommendations.push(`建议: 减少 Worker 数量到 ${Math.max(1, workerCount - 1)}`);
    recommendations.push('建议: 启用 Swap 空间作为缓冲');
  }
} else if (memoryUsagePercent < 30 && workerCount < cpuCount && totalMemory > 2) {
  recommendations.push(`✨ 内存充足，可以考虑增加 Worker 数量到 ${Math.min(cpuCount, workerCount + 1)}`);
}

// 内存不足警告
if (freeMemory < 1) {
  warnings.push('🚨 可用内存不足 1GB，建议立即释放内存或配置 Swap');
}

// 小内存服务器特殊建议
if (totalMemory <= 2) {
  recommendations.push('📌 检测到小内存服务器 (≤2GB):');
  recommendations.push('   - 推荐配置 1 个 Worker');
  recommendations.push('   - 启用 Swap 空间 (2-4GB)');
  recommendations.push('   - 使用外部 Redis 缓存');
  recommendations.push('   - 定期清理日志文件');
}

// 输出警告
if (warnings.length > 0) {
  console.log('');
  console.log('⚠️  警告:');
  warnings.forEach(w => console.log(`   ${w}`));
}

// 输出建议
if (recommendations.length > 0) {
  console.log('');
  if (warnings.length === 0) {
    console.log('✅ 当前配置合理');
  }
  recommendations.forEach(r => console.log(`   ${r}`));
}

// 5. 最优配置
console.log('');
console.log('🎯 推荐配置:');
console.log('-'.repeat(60));

let optimalWorkers;
if (totalMemory <= 2) {
  optimalWorkers = 1;
} else if (totalMemory <= 4) {
  optimalWorkers = Math.min(2, cpuCount);
} else {
  optimalWorkers = Math.min(Math.floor(cpuCount * 0.75), 8);
}

console.log(`在当前服务器上，建议配置 ${optimalWorkers} 个 Worker`);
console.log('');
console.log('配置方法:');
console.log('');
console.log('1. 编辑 .env 文件:');
console.log(`   echo "EGG_WORKERS=${optimalWorkers}" >> server/.env`);
console.log('');
console.log('2. 或设置环境变量:');
console.log(`   export EGG_WORKERS=${optimalWorkers}`);
console.log('');
console.log('3. 重启应用:');
console.log('   pm2 restart eggcms');
console.log('   # 或');
console.log('   npm stop && npm start');

// 6. 快速测试命令
console.log('');
console.log('🧪 验证配置:');
console.log('-'.repeat(60));
console.log('启动应用后，运行以下命令验证:');
console.log('');
console.log('# 查看 Worker 进程数');
console.log('ps aux | grep "egg-worker" | grep -v grep | wc -l');
console.log('');
console.log('# 查看内存使用');
console.log('ps aux --sort=-%mem | grep node | head -5');
console.log('');
console.log('# 使用 PM2 监控');
console.log('pm2 monit');

console.log('');
console.log('='.repeat(60));
console.log('✨ 检查完成');
console.log('');

// 7. 写入检查报告
const reportPath = path.resolve(__dirname, '../logs/worker-config-report.txt');
const reportContent = `
EggJS Worker 配置检查报告
生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

系统信息:
- CPU 核心数: ${cpuCount}
- 总内存: ${totalMemory} GB
- 可用内存: ${freeMemory} GB
- 内存使用率: ${((1 - freeMemory / totalMemory) * 100).toFixed(1)}%

Worker 配置:
- 环境变量 EGG_WORKERS: ${process.env.EGG_WORKERS || '(未设置)'}
- 实际 Worker 数量: ${workerCount}
- 配置来源: ${process.env.EGG_WORKERS ? '环境变量' : '默认值'}

内存使用预估:
- 预计总占用: ~${totalEstimated} MB
- 剩余可用: ~${(freeMemory - totalEstimated / 1024).toFixed(2)} GB

推荐配置:
- 建议 Worker 数量: ${optimalWorkers}
- 配置命令: EGG_WORKERS=${optimalWorkers}

${warnings.length > 0 ? '\n警告:\n' + warnings.map(w => `- ${w}`).join('\n') : ''}
${recommendations.length > 0 ? '\n建议:\n' + recommendations.map(r => `- ${r}`).join('\n') : ''}
`;

try {
  const logsDir = path.dirname(reportPath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, reportContent.trim());
  console.log(`📄 详细报告已保存到: ${reportPath}`);
  console.log('');
} catch (err) {
  // 忽略写入错误
}
