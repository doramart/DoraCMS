import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取项目根目录的绝对路径
const rootDir = path.resolve(__dirname, '../../../../');
const distDir = path.resolve(__dirname, '../dist');
const staticTargetDir = path.resolve(rootDir, 'server/backstage/remote-page/ai-model-manage');
// const viewTargetDir = path.resolve(rootDir, 'server/app/view/remote-page');

// 确保目标目录存在
execSync(`mkdir -p "${staticTargetDir}"`);
// execSync(`mkdir -p "${viewTargetDir}"`);

// 删除目标目录中的所有内容
execSync(`find "${staticTargetDir}" -mindepth 1 -delete`);
// execSync(`find "${viewTargetDir}" -mindepth 1 -delete`);

// // 复制 index.html 到 view 目录
// execSync(`cp "${distDir}/index.html" "${viewTargetDir}/"`);

// 复制其他静态资源到 backstage 目录，保持目录结构
execSync(`cp -r "${distDir}"/* "${staticTargetDir}/"`);
// execSync(`rm "${staticTargetDir}/index.html"`);

console.log('Files copied successfully!');
