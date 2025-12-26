#!/bin/bash

# Webhook 完整测试脚本
# 用于自动化测试 DoraCMS Webhook 功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_URL="${API_URL:-http://localhost:7001}"
TOKEN="${TOKEN:-}"
WEBHOOK_URL="${WEBHOOK_URL:-https://webhook.site/test}"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

# 检查依赖
check_dependencies() {
    print_header "检查依赖"
    
    if ! command -v curl &> /dev/null; then
        print_error "curl 未安装"
        exit 1
    fi
    print_success "curl 已安装"
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq 未安装，输出将不会格式化"
        JQ_AVAILABLE=false
    else
        print_success "jq 已安装"
        JQ_AVAILABLE=true
    fi
}

# 检查配置
check_config() {
    print_header "检查配置"
    
    if [ -z "$TOKEN" ]; then
        print_error "未设置 TOKEN 环境变量"
        echo ""
        echo "使用方法:"
        echo "  export TOKEN='your_jwt_token'"
        echo "  ./test-webhook.sh"
        echo ""
        echo "或者:"
        echo "  TOKEN='your_jwt_token' ./test-webhook.sh"
        exit 1
    fi
    
    print_info "API URL: $API_URL"
    print_info "Webhook URL: $WEBHOOK_URL"
    print_info "Token: ${TOKEN:0:20}..."
    print_success "配置检查完成"
}

# 格式化 JSON 输出
format_json() {
    if [ "$JQ_AVAILABLE" = true ]; then
        echo "$1" | jq '.'
    else
        echo "$1"
    fi
}

# 提取 JSON 字段
extract_field() {
    local json="$1"
    local field="$2"
    
    if [ "$JQ_AVAILABLE" = true ]; then
        echo "$json" | jq -r "$field"
    else
        # 简单的字段提取（不完美，但可用）
        echo "$json" | grep -o "\"$field\":\"[^\"]*\"" | cut -d'"' -f4
    fi
}

# 测试 1: 创建 Webhook
test_create_webhook() {
    print_header "测试 1: 创建 Webhook"
    
    print_info "创建 Webhook..."
    WEBHOOK_RESPONSE=$(curl -s -X POST "$API_URL/manage/v1/webhooks" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{
            \"name\": \"测试 Webhook - $(date +%s)\",
            \"url\": \"$WEBHOOK_URL\",
            \"events\": [\"content.created\", \"content.updated\", \"content.deleted\"],
            \"enabled\": true,
            \"description\": \"自动化测试创建的 Webhook\"
        }")
    
    # 检查响应
    if echo "$WEBHOOK_RESPONSE" | grep -q '"status":200'; then
        WEBHOOK_ID=$(extract_field "$WEBHOOK_RESPONSE" "_id")
        print_success "Webhook 创建成功"
        print_info "Webhook ID: $WEBHOOK_ID"
        format_json "$WEBHOOK_RESPONSE"
    else
        print_error "Webhook 创建失败"
        format_json "$WEBHOOK_RESPONSE"
        exit 1
    fi
}

# 测试 2: 获取 Webhook 列表
test_list_webhooks() {
    print_header "测试 2: 获取 Webhook 列表"
    
    print_info "获取 Webhook 列表..."
    LIST_RESPONSE=$(curl -s -X GET "$API_URL/manage/v1/webhooks" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$LIST_RESPONSE" | grep -q '"status":200'; then
        print_success "获取列表成功"
        format_json "$LIST_RESPONSE"
    else
        print_error "获取列表失败"
        format_json "$LIST_RESPONSE"
    fi
}

# 测试 3: 触发 content.created 事件
test_content_created() {
    print_header "测试 3: 触发 content.created 事件"
    
    print_info "创建内容..."
    CONTENT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/content" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{
            \"title\": \"测试文章 - $(date +%s)\",
            \"content\": \"这是一篇自动化测试创建的文章\",
            \"type\": \"article\"
        }")
    
    if echo "$CONTENT_RESPONSE" | grep -q '"status":200'; then
        CONTENT_ID=$(extract_field "$CONTENT_RESPONSE" "_id")
        print_success "内容创建成功，应该触发 content.created 事件"
        print_info "Content ID: $CONTENT_ID"
        format_json "$CONTENT_RESPONSE"
    else
        print_error "内容创建失败"
        format_json "$CONTENT_RESPONSE"
    fi
}

# 测试 4: 等待 Webhook 处理
test_wait_processing() {
    print_header "测试 4: 等待 Webhook 处理"
    
    print_info "等待 5 秒让 Webhook 队列处理..."
    for i in {5..1}; do
        echo -n "$i... "
        sleep 1
    done
    echo ""
    print_success "等待完成"
}

# 测试 5: 查看 Webhook 日志
test_view_logs() {
    print_header "测试 5: 查看 Webhook 日志"
    
    if [ -z "$WEBHOOK_ID" ]; then
        print_warning "未找到 Webhook ID，跳过日志查看"
        return
    fi
    
    print_info "获取 Webhook 日志..."
    LOGS_RESPONSE=$(curl -s -X GET "$API_URL/manage/v1/webhooks/$WEBHOOK_ID/logs" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$LOGS_RESPONSE" | grep -q '"status":200'; then
        print_success "日志获取成功"
        format_json "$LOGS_RESPONSE"
    else
        print_error "日志获取失败"
        format_json "$LOGS_RESPONSE"
    fi
}

# 测试 6: 查看统计信息
test_view_stats() {
    print_header "测试 6: 查看统计信息"
    
    if [ -z "$WEBHOOK_ID" ]; then
        print_warning "未找到 Webhook ID，跳过统计查看"
        return
    fi
    
    print_info "获取统计信息..."
    STATS_RESPONSE=$(curl -s -X GET "$API_URL/manage/v1/webhooks/$WEBHOOK_ID/stats" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$STATS_RESPONSE" | grep -q '"status":200'; then
        print_success "统计信息获取成功"
        format_json "$STATS_RESPONSE"
    else
        print_error "统计信息获取失败"
        format_json "$STATS_RESPONSE"
    fi
}

# 测试 7: 更新 Webhook
test_update_webhook() {
    print_header "测试 7: 更新 Webhook"
    
    if [ -z "$WEBHOOK_ID" ]; then
        print_warning "未找到 Webhook ID，跳过更新测试"
        return
    fi
    
    print_info "更新 Webhook..."
    UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/manage/v1/webhooks/$WEBHOOK_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{
            \"name\": \"更新后的测试 Webhook\",
            \"description\": \"已更新\"
        }")
    
    if echo "$UPDATE_RESPONSE" | grep -q '"status":200'; then
        print_success "Webhook 更新成功"
        format_json "$UPDATE_RESPONSE"
    else
        print_error "Webhook 更新失败"
        format_json "$UPDATE_RESPONSE"
    fi
}

# 测试 8: 禁用 Webhook
test_disable_webhook() {
    print_header "测试 8: 禁用 Webhook"
    
    if [ -z "$WEBHOOK_ID" ]; then
        print_warning "未找到 Webhook ID，跳过禁用测试"
        return
    fi
    
    print_info "禁用 Webhook..."
    DISABLE_RESPONSE=$(curl -s -X PUT "$API_URL/manage/v1/webhooks/$WEBHOOK_ID/disable" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$DISABLE_RESPONSE" | grep -q '"status":200'; then
        print_success "Webhook 禁用成功"
        format_json "$DISABLE_RESPONSE"
    else
        print_error "Webhook 禁用失败"
        format_json "$DISABLE_RESPONSE"
    fi
}

# 测试 9: 启用 Webhook
test_enable_webhook() {
    print_header "测试 9: 启用 Webhook"
    
    if [ -z "$WEBHOOK_ID" ]; then
        print_warning "未找到 Webhook ID，跳过启用测试"
        return
    fi
    
    print_info "启用 Webhook..."
    ENABLE_RESPONSE=$(curl -s -X PUT "$API_URL/manage/v1/webhooks/$WEBHOOK_ID/enable" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$ENABLE_RESPONSE" | grep -q '"status":200'; then
        print_success "Webhook 启用成功"
        format_json "$ENABLE_RESPONSE"
    else
        print_error "Webhook 启用失败"
        format_json "$ENABLE_RESPONSE"
    fi
}

# 测试 10: 删除 Webhook（可选）
test_delete_webhook() {
    print_header "测试 10: 删除 Webhook（可选）"
    
    if [ -z "$WEBHOOK_ID" ]; then
        print_warning "未找到 Webhook ID，跳过删除测试"
        return
    fi
    
    read -p "是否删除测试 Webhook? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "跳过删除"
        return
    fi
    
    print_info "删除 Webhook..."
    DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/manage/v1/webhooks" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"ids\": [\"$WEBHOOK_ID\"]}")
    
    if echo "$DELETE_RESPONSE" | grep -q '"status":200'; then
        print_success "Webhook 删除成功"
        format_json "$DELETE_RESPONSE"
    else
        print_error "Webhook 删除失败"
        format_json "$DELETE_RESPONSE"
    fi
}

# 主函数
main() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║   DoraCMS Webhook 自动化测试脚本      ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    
    check_dependencies
    check_config
    
    test_create_webhook
    test_list_webhooks
    test_content_created
    test_wait_processing
    test_view_logs
    test_view_stats
    test_update_webhook
    test_disable_webhook
    test_enable_webhook
    test_delete_webhook
    
    print_header "测试完成"
    print_success "所有测试执行完毕！"
    
    if [ -n "$WEBHOOK_ID" ]; then
        echo ""
        print_info "测试创建的 Webhook ID: $WEBHOOK_ID"
        print_info "你可以在管理后台查看或手动删除"
    fi
    
    echo ""
}

# 运行主函数
main
