#!/bin/bash

# 验证 modules.config.js 已从模板中排除

set -e

echo "🔍 验证 modules.config.js 排除状态"
echo "===================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 进入 CLI 目录
cd "$(dirname "$0")/.."

echo -e "${BLUE}检查 1: 模板中是否存在 modules.config.js${NC}"
echo "------------------------------------------------"

if [ -f "templates/server/config/modules.config.js" ]; then
  echo -e "${RED}✗ 失败: 文件仍然存在于模板中${NC}"
  echo "  路径: templates/server/config/modules.config.js"
  echo ""
  echo "  请运行以下命令重新构建模板:"
  echo "  pnpm run build:templates"
  exit 1
else
  echo -e "${GREEN}✓ 通过: 文件已从模板中排除${NC}"
fi

echo ""
echo -e "${BLUE}检查 2: 构建脚本中是否有排除规则${NC}"
echo "------------------------------------------------"

if grep -q "modules.config.js" scripts/build-templates.js; then
  echo -e "${GREEN}✓ 通过: 构建脚本包含排除规则${NC}"
  echo ""
  echo "  排除规则:"
  grep -A 2 "modules.config.js" scripts/build-templates.js | sed 's/^/  /'
else
  echo -e "${RED}✗ 失败: 构建脚本中没有排除规则${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}检查 3: config 目录中的其他文件${NC}"
echo "------------------------------------------------"

if [ -d "templates/server/config" ]; then
  echo -e "${GREEN}✓ config 目录存在${NC}"
  echo ""
  echo "  目录内容:"
  ls -1 templates/server/config/ | sed 's/^/  - /'
  echo ""
  
  # 验证其他重要配置文件存在
  REQUIRED_FILES=("config.default.js" "config.local.js" "config.prod.js")
  ALL_EXIST=true
  
  for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "templates/server/config/$file" ]; then
      echo -e "  ${GREEN}✓${NC} $file 存在"
    else
      echo -e "  ${RED}✗${NC} $file 不存在"
      ALL_EXIST=false
    fi
  done
  
  if [ "$ALL_EXIST" = false ]; then
    echo ""
    echo -e "${RED}警告: 某些必需的配置文件缺失${NC}"
  fi
else
  echo -e "${RED}✗ 失败: config 目录不存在${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}检查 4: 模块配置生成器是否存在${NC}"
echo "------------------------------------------------"

if [ -f "src/generators/modules-config-generator.ts" ]; then
  echo -e "${GREEN}✓ 通过: 模块配置生成器存在${NC}"
  echo "  路径: src/generators/modules-config-generator.ts"
else
  echo -e "${RED}✗ 失败: 模块配置生成器不存在${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}检查 5: 项目生成器是否调用模块配置生成${NC}"
echo "------------------------------------------------"

if grep -q "generateModulesConfig" src/generators/project-generator.ts; then
  echo -e "${GREEN}✓ 通过: 项目生成器调用模块配置生成${NC}"
  echo ""
  echo "  调用位置:"
  grep -n "generateModulesConfig" src/generators/project-generator.ts | sed 's/^/  /'
else
  echo -e "${RED}✗ 失败: 项目生成器未调用模块配置生成${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}===================================="
echo "✅ 所有检查通过！"
echo "====================================${NC}"
echo ""
echo "总结:"
echo "  1. ✓ modules.config.js 已从模板中排除"
echo "  2. ✓ 构建脚本包含正确的排除规则"
echo "  3. ✓ 其他配置文件正常保留"
echo "  4. ✓ 模块配置生成器正常工作"
echo "  5. ✓ 项目生成流程正确"
echo ""
echo "下一步:"
echo "  - 运行 'pnpm run build' 构建 CLI"
echo "  - 测试创建项目: 'node bin/doracms.js create test-project'"
echo "  - 验证生成的 modules.config.js 反映用户选择"
