/**
 * CLI 类型定义
 */

export type ProjectType = 'fullstack' | 'backend-only' | 'user-separated' | 'admin-separated' | 'mobile-optimized';

export type DatabaseType = 'mongodb' | 'mariadb' | 'both';

export type PackageManager = 'pnpm' | 'npm' | 'yarn';

export interface ProjectInfo {
  name: string;
  type: ProjectType;
  database: DatabaseType;
  packageManager: PackageManager;
  sampleData: boolean;
  skipInstall?: boolean;
  skipGit?: boolean;
  enableAiAssistant?: boolean; // 是否启用 AI 助手插件
}

export interface ModuleConfig {
  name: string;
  description: string;
  required: boolean;
  repositories: string[];
  services: string[];
  controllers: string[];
  routes: string[];
  dependencies: string[];
  dependedBy: string[];
  aiRepositories?: string[]; // AI 助手插件的 repositories（可选）
}

export interface ModuleSelection {
  enabled: string[];
  disabled: string[];
  autoEnabled: string[];
  conflicts: string[];
}

export interface PluginSelection {
  enableAiAssistant: boolean;
}

export interface CreateOptions {
  template?: string;
  database?: string;
  packageManager?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
  yes?: boolean;
  enableAiAssistant?: boolean; // 命令行选项：是否启用 AI 助手
}
