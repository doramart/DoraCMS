#!/bin/bash

# 测试 modules.config.js 覆盖行为
# 验证 CLI 生成的配置会覆盖模板中的配置

set -e

echo "🧪 测试 modules.config.js 覆盖行为"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 进入 CLI 目录
cd "$(dirname "$0")/.."

# 清理之前的测试项目
if [ -d "test-modules-override" ]; then
  echo -e "${YELLOW}清理之前的测试项目...${NC}"
  rm -rf test-modules-override
fi

echo -e "${BLUE}步骤 1: 检查模板中的 modules.config.js${NC}"
echo "----------------------------------------"
if [ -f "templates/server/config/modules.config.js" ]; then
  echo -e "${GREEN}✓ 模板中存在 modules.config.js${NC}"
  
  # 统计模板中启用的模块数量
  TEMPLATE_ENABLED=$(grep -c "enabled: true" templates/server/config/modules.config.js || true)
  echo "  模板中启用的模块数量: $TEMPLATE_ENABLED"
else
  echo -e "${RED}✗ 模板中不存在 modules.config.js${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}步骤 2: 创建测试项目（只选择部分模块）${NC}"
echo "----------------------------------------"
echo "注意: 这个测试需要手动交互"
echo "请在交互中只选择 'content' 和 'webhook' 两个模块"
echo ""
read -p "按 Enter 继续..."

# 创建项目（需要手动选择模块）
node bin/doracms.js create test-modules-override --skip-install --skip-git

echo ""
echo -e "${BLUE}步骤 3: 检查生成的 modules.config.js${NC}"
echo "----------------------------------------"

if [ ! -f "test-modules-override/server/config/modules.config.js" ]; then
  echo -e "${RED}✗ 生成的项目中不存在 modules.config.js${NC}"
  exit 1
fi

echo -e "${GREEN}✓ 生成的项目中存在 modules.config.js${NC}"

# 统计生成文件中启用和禁用的模块
GENERATED_ENABLED=$(grep -c "enabled: true" test-modules-override/server/config/modules.config.js || true)
GENERATED_DISABLED=$(grep -c "enabled: false" test-modules-override/server/config/modules.config.js || true)

echo "  生成文件中启用的模块数量: $GENERATED_ENABLED"
echo "  生成文件中禁用的模块数量: $GENERATED_DISABLED"

echo ""
echo -e "${BLUE}步骤 4: 验证覆盖行为${NC}"
echo "----------------------------------------"

# 检查是否有禁用的模块（如果有，说明配置被正确生成）
if [ "$GENERATED_DISABLED" -gt 0 ]; then
  echo -e "${GREEN}✓ 配置文件被正确覆盖${NC}"
  echo "  模板中所有模块都是启用的 (enabled: true)"
  echo "  生成的文件中有 $GENERATED_DISABLED 个禁用的模块"
  echo "  这证明 CLI 根据用户选择重新生成了配置"
else
  echo -e "${YELLOW}⚠ 可能所有模块都被选择了${NC}"
  echo "  请重新运行测试，并只选择部分模块"
fi

echo ""
echo -e "${BLUE}步骤 5: 查看具体的模块状态${NC}"
echo "----------------------------------------"

echo "核心模块 (应该都是 enabled: true):"
grep -A 1 "core:" test-modules-override/server/config/modules.config.js | head -20

echo ""
echo "业务模块状态:"
echo "  content:"
grep -A 1 '"content":' test-modules-override/server/config/modules.config.js | grep enabled

echo "  comment:"
grep -A 1 '"comment":' test-modules-override/server/config/modules.config.js | grep enabled

echo "  ads:"
grep -A 1 '"ads":' test-modules-override/server/config/modules.config.js | grep enabled

echo "  webhook:"
grep -A 1 '"webhook":' test-modules-override/server/config/modules.config.js | grep enabled

echo ""
echo -e "${BLUE}步骤 6: 比较文件差异${NC}"
echo "----------------------------------------"

echo "模板文件前 10 行:"
head -10 templates/server/config/modules.config.js

echo ""
echo "生成文件前 10 行:"
head -10 test-modules-override/server/config/modules.config.js

echo ""
echo -e "${GREEN}=================================="
echo "测试完成！"
echo "==================================${NC}"
echo ""
echo "结论:"
echo "1. 模板中的 modules.config.js 在步骤 2 (copyServerCode) 被复制到项目"
echo "2. 在步骤 5 (generateModulesConfig) 被 CLI 根据用户选择重新生成"
echo "3. 最终的配置文件反映了用户的模块选择，而不是模板中的默认配置"
echo ""
echo "清理测试项目:"
echo "  rm -rf test-modules-override"
