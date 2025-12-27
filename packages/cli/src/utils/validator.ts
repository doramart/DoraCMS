/**
 * 验证工具
 */

import validateNpmPackageName from 'validate-npm-package-name';
import fs from 'fs-extra';
import path from 'path';

/**
 * 验证项目名称
 */
export function validateProjectName(name: string): boolean | string {
  const result = validateNpmPackageName(name);

  if (!result.validForNewPackages) {
    const errors = [...(result.errors || []), ...(result.warnings || [])];
    return `无效的项目名称: ${errors.join(', ')}`;
  }

  return true;
}

/**
 * 检查目录是否存在
 */
export function checkDirectoryExists(dirPath: string): boolean {
  return fs.existsSync(dirPath);
}

/**
 * 检查目录是否为空
 */
export function isDirectoryEmpty(dirPath: string): boolean {
  if (!fs.existsSync(dirPath)) {
    return true;
  }

  const files = fs.readdirSync(dirPath);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

/**
 * 获取项目路径
 */
export function getProjectPath(projectName: string): string {
  return path.resolve(process.cwd(), projectName);
}
