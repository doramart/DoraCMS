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
}

export interface ModuleSelection {
  enabled: string[];
  disabled: string[];
  autoEnabled: string[];
  conflicts: string[];
}

export interface CreateOptions {
  template?: string;
  database?: string;
  packageManager?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
  yes?: boolean;
}
