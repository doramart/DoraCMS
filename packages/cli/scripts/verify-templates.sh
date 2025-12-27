#!/bin/bash

# 模板验证脚本
# 用于验证构建的模板是否完整和正确

set -e

echo "🔍 开始验证模板..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
PASS=0
FAIL=0

# 检查函数
check_exists() {
  if [ -e "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $2 (文件不存在: $1)"
    ((FAIL++))
  fi
}

check_not_exists() {
  if [ ! -e "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $2 (文件不应该存在: $1)"
    ((FAIL++))
  fi
}

# 检查模板目录
TEMPLATES_DIR="templates"

if [ ! -d "$TEMPLATES_DIR" ]; then
  echo -e "${RED}❌ 模板目录不存在！${NC}"
  echo "请先运行: npm run build:templates"
  exit 1
fi

echo "📁 检查模板目录结构..."
echo ""

# 1. 检查必需的目录
echo "1️⃣  检查必需的目录:"
check_exists "$TEMPLATES_DIR/server" "server 目录"
check_exists "$TEMPLATES_DIR/client" "client 目录"
check_exists "$TEMPLATES_DIR/scripts" "scripts 目录"
check_exists "$TEMPLATES_DIR/docker" "docker 目录"
echo ""

# 2. 检查必需的文件
echo "2️⃣  检查必需的文件:"
check_exists "$TEMPLATES_DIR/server/package.json" "server/package.json"
check_exists "$TEMPLATES_DIR/server/app.js" "server/app.js"
check_exists "$TEMPLATES_DIR/server/config/config.default.js" "server/config/config.default.js"
check_exists "$TEMPLATES_DIR/server/config/modules.config.js" "server/config/modules.config.js"
check_exists "$TEMPLATES_DIR/client/admin-center/package.json" "client/admin-center/package.json"
check_exists "$TEMPLATES_DIR/client/user-center/package.json" "client/user-center/package.json"
check_exists "$TEMPLATES_DIR/README.md" "README.md"
check_exists "$TEMPLATES_DIR/LICENSE" "LICENSE"
check_exists "$TEMPLATES_DIR/.gitignore" ".gitignore"
check_exists "$TEMPLATES_DIR/pnpm-workspace.yaml" "pnpm-workspace.yaml"
check_exists "$TEMPLATES_DIR/Dockerfile" "Dockerfile"
check_exists "$TEMPLATES_DIR/docker-compose.yml" "docker-compose.yml"
echo ""

# 3. 检查环境配置示例
echo "3️⃣  检查环境配置示例:"
check_exists "$TEMPLATES_DIR/server/env.example" "server/env.example"
check_exists "$TEMPLATES_DIR/docker.env.example" "docker.env.example"
echo ""

# 4. 检查不应该存在的文件
echo "4️⃣  检查不应该存在的文件:"
check_not_exists "$TEMPLATES_DIR/server/node_modules" "server/node_modules (应该被排除)"
check_not_exists "$TEMPLATES_DIR/server/logs" "server/logs (应该被排除)"
check_not_exists "$TEMPLATES_DIR/server/run" "server/run (应该被排除)"
check_not_exists "$TEMPLATES_DIR/server/.env" "server/.env (应该被排除)"
check_not_exists "$TEMPLATES_DIR/client/admin-center/node_modules" "client/admin-center/node_modules (应该被排除)"
check_not_exists "$TEMPLATES_DIR/client/admin-center/dist" "client/admin-center/dist (应该被排除)"
check_not_exists "$TEMPLATES_DIR/.git" ".git (应该被排除)"
check_not_exists "$TEMPLATES_DIR/.github" ".github (应该被排除)"
check_not_exists "$TEMPLATES_DIR/.vscode" ".vscode (应该被排除)"
check_not_exists "$TEMPLATES_DIR/.DS_Store" ".DS_Store (应该被排除)"
check_not_exists "$TEMPLATES_DIR/.kiro" ".kiro (应该被排除)"
check_not_exists "$TEMPLATES_DIR/.husky" ".husky (应该被排除)"
echo ""

# 5. 检查模板大小
echo "5️⃣  检查模板大小:"
TEMPLATE_SIZE=$(du -sh "$TEMPLATES_DIR" | cut -f1)
TEMPLATE_SIZE_MB=$(du -sm "$TEMPLATES_DIR" | cut -f1)

echo "   模板总大小: $TEMPLATE_SIZE"

if [ "$TEMPLATE_SIZE_MB" -lt 50 ]; then
  echo -e "${GREEN}✓${NC} 模板大小合理 (< 50MB)"
  ((PASS++))
elif [ "$TEMPLATE_SIZE_MB" -lt 100 ]; then
  echo -e "${YELLOW}⚠${NC} 模板大小较大 (50-100MB)，建议优化"
  ((PASS++))
else
  echo -e "${RED}✗${NC} 模板大小过大 (> 100MB)，需要优化"
  ((FAIL++))
fi
echo ""

# 6. 检查元数据
echo "6️⃣  检查模板元数据:"
if [ -f "$TEMPLATES_DIR/.template-metadata.json" ]; then
  echo -e "${GREEN}✓${NC} 元数据文件存在"
  ((PASS++))
  
  # 显示元数据内容
  if command -v jq &> /dev/null; then
    echo ""
    echo "   元数据内容:"
    cat "$TEMPLATES_DIR/.template-metadata.json" | jq '.'
  fi
else
  echo -e "${RED}✗${NC} 元数据文件不存在"
  ((FAIL++))
fi
echo ""

# 7. 统计文件数量
echo "7️⃣  统计文件数量:"
FILE_COUNT=$(find "$TEMPLATES_DIR" -type f | wc -l | tr -d ' ')
DIR_COUNT=$(find "$TEMPLATES_DIR" -type d | wc -l | tr -d ' ')

echo "   文件数量: $FILE_COUNT"
echo "   目录数量: $DIR_COUNT"

if [ "$FILE_COUNT" -gt 100 ] && [ "$FILE_COUNT" -lt 5000 ]; then
  echo -e "${GREEN}✓${NC} 文件数量合理"
  ((PASS++))
else
  echo -e "${YELLOW}⚠${NC} 文件数量异常，请检查"
fi
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 验证总结:"
echo ""
echo -e "   通过: ${GREEN}$PASS${NC}"
echo -e "   失败: ${RED}$FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}✅ 所有检查通过！模板构建正确。${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ 有 $FAIL 项检查失败，请修复后重试。${NC}"
  echo ""
  exit 1
fi
