/**
 * 包管理器检测和执行
 */

import { execaCommand } from 'execa';
import type { PackageManager } from '../types';

/**
 * 检测可用的包管理器
 */
export async function detectPackageManager(): Promise<PackageManager> {
  try {
    await execaCommand('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    try {
      await execaCommand('yarn --version', { stdio: 'ignore' });
      return 'yarn';
    } catch {
      return 'npm';
    }
  }
}

/**
 * 获取安装命令
 */
export function getInstallCommand(pm: PackageManager): string {
  const commands: Record<PackageManager, string> = {
    pnpm: 'pnpm install',
    npm: 'npm install',
    yarn: 'yarn install',
  };
  return commands[pm];
}

/**
 * 执行安装
 */
export async function installDependencies(projectPath: string, pm: PackageManager): Promise<void> {
  const command = getInstallCommand(pm);
  await execaCommand(command, {
    cwd: projectPath,
    stdio: 'inherit',
  });
}
