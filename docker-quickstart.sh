#!/bin/bash
set -e

# ==============================================================================
# EggCMS Docker 快速启动脚本
# 支持 MongoDB 和 MariaDB 两种部署模式
# ==============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
EggCMS Docker 快速启动脚本

用法:
    $0 [选项]

选项:
    -d, --database <type>   数据库类型: mongodb (默认) 或 mariadb
    -r, --redis            启用 Redis 缓存
    -n, --nginx            启用 Nginx 反向代理
    -f, --full             启用完整堆栈 (MongoDB + Redis + Nginx)
    --mariadb-full         启用完整堆栈 (MariaDB + Redis + Nginx)
    --stop                 停止所有服务
    --clean                停止服务并清理数据
    -h, --help             显示帮助信息

示例:
    # 使用 MongoDB（默认）
    $0

    # 使用 MariaDB
    $0 --database mariadb

    # 使用 MongoDB + Redis
    $0 --redis

    # 使用 MariaDB + Redis + Nginx
    $0 --database mariadb --redis --nginx

    # 完整堆栈 (MongoDB)
    $0 --full

    # 完整堆栈 (MariaDB)
    $0 --mariadb-full

    # 停止服务
    $0 --stop

    # 清理所有数据
    $0 --clean

更多信息:
    查看完整文档: ./DOCKER_DEPLOYMENT.md
EOF
}

# 检查 Docker 和 Docker Compose
check_requirements() {
    log_info "检查系统要求..."
    
    if ! command -v docker &> /dev/null; then
        log_error "未安装 Docker，请先安装 Docker"
        log_error "访问 https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        log_error "未安装 Docker Compose，请先安装 Docker Compose"
        log_error "访问 https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    log_success "系统要求检查通过"
    docker --version
    docker compose version
}

# 检查并创建环境配置
check_env_file() {
    log_info "检查环境配置..."
    
    if [ ! -f .env ]; then
        log_warning "未找到 .env 文件，从模板创建..."
        cp docker.env.example .env
        log_success "已创建 .env 文件"
        log_warning "⚠️  请编辑 .env 文件，修改安全相关配置："
        log_warning "   - APP_KEYS"
        log_warning "   - SESSION_SECRET"
        log_warning "   - 数据库密码"
        echo ""
        read -p "是否现在编辑 .env 文件？(y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-vim} .env
        else
            log_warning "请稍后手动编辑 .env 文件"
        fi
    else
        log_success "已存在 .env 文件"
    fi
}

# 生成随机密钥
generate_secrets() {
    log_info "是否生成新的安全密钥？"
    read -p "生成新密钥会覆盖现有配置 (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        APP_KEYS=$(openssl rand -hex 32)
        SESSION_SECRET=$(openssl rand -hex 32)
        
        log_success "已生成新密钥："
        echo "APP_KEYS=$APP_KEYS"
        echo "SESSION_SECRET=$SESSION_SECRET"
        
        # 更新 .env 文件
        if command -v sed &> /dev/null; then
            sed -i.bak "s/^APP_KEYS=.*/APP_KEYS=$APP_KEYS/" .env
            sed -i.bak "s/^SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
            rm .env.bak
            log_success "已更新 .env 文件"
        fi
    fi
}

# 启动服务
start_services() {
    local database_type="$1"
    local enable_redis="$2"
    local enable_nginx="$3"
    
    log_info "==================================="
    log_info "EggCMS Docker 部署配置"
    log_info "==================================="
    log_info "数据库类型: $database_type"
    log_info "Redis 缓存: $enable_redis"
    log_info "Nginx 代理: $enable_nginx"
    log_info "==================================="
    
    # 构建 docker compose 命令
    local compose_cmd="docker compose"
    local profiles=()
    
    if [ "$database_type" = "mariadb" ]; then
        profiles+=("--profile" "mariadb")
    fi
    
    if [ "$enable_redis" = "true" ]; then
        profiles+=("--profile" "redis")
    fi
    
    if [ "$enable_nginx" = "true" ]; then
        profiles+=("--profile" "nginx")
    fi
    
    # 启动服务
    log_info "启动 Docker 服务..."
    
    if [ ${#profiles[@]} -gt 0 ]; then
        $compose_cmd ${profiles[@]} up -d
    else
        $compose_cmd up -d
    fi
    
    log_success "服务启动成功！"
    
    # 等待服务就绪
    log_info "等待服务就绪..."
    sleep 5
    
    # 显示服务状态
    log_info "服务状态："
    docker compose ps
    
    # 显示访问信息
    echo ""
    log_success "==================================="
    log_success "EggCMS 已成功启动！"
    log_success "==================================="
    
    if [ "$enable_nginx" = "true" ]; then
        log_success "访问地址:"
        log_success "  - HTTP:  http://localhost"
        log_success "  - HTTPS: https://localhost (需配置SSL)"
        log_success "  - 管理后台: http://localhost/admin"
    else
        log_success "访问地址:"
        log_success "  - 应用: http://localhost:8080"
        log_success "  - 管理后台: http://localhost:8080/admin"
    fi
    
    log_success ""
    log_success "数据库信息:"
    if [ "$database_type" = "mongodb" ]; then
        log_success "  - MongoDB: localhost:27017"
    else
        log_success "  - MariaDB: localhost:3306"
    fi
    
    if [ "$enable_redis" = "true" ]; then
        log_success "  - Redis: localhost:6379"
    fi
    
    log_success "==================================="
    log_info ""
    log_info "查看日志: docker compose logs -f"
    log_info "停止服务: docker compose down"
    log_info "重启服务: docker compose restart"
    log_info ""
    log_info "详细文档: ./DOCKER_DEPLOYMENT.md"
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    docker compose --profile mariadb --profile redis --profile nginx down
    log_success "服务已停止"
}

# 清理数据
clean_all() {
    log_warning "⚠️  警告：这将删除所有容器、数据卷和网络！"
    log_warning "⚠️  所有数据将永久丢失！"
    read -p "确认要清理所有数据吗？(yes/no) " -r
    echo
    
    if [[ $REPLY == "yes" ]]; then
        log_info "清理所有 Docker 资源..."
        docker compose --profile mariadb --profile redis --profile nginx down -v
        log_success "清理完成"
    else
        log_info "已取消清理操作"
    fi
}

# 主函数
main() {
    local database_type="mongodb"
    local enable_redis="false"
    local enable_nginx="false"
    local action="start"
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--database)
                database_type="$2"
                shift 2
                ;;
            -r|--redis)
                enable_redis="true"
                shift
                ;;
            -n|--nginx)
                enable_nginx="true"
                shift
                ;;
            -f|--full)
                database_type="mongodb"
                enable_redis="true"
                enable_nginx="true"
                shift
                ;;
            --mariadb-full)
                database_type="mariadb"
                enable_redis="true"
                enable_nginx="true"
                shift
                ;;
            --stop)
                action="stop"
                shift
                ;;
            --clean)
                action="clean"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 验证数据库类型
    if [ "$database_type" != "mongodb" ] && [ "$database_type" != "mariadb" ]; then
        log_error "不支持的数据库类型: $database_type"
        log_error "支持的类型: mongodb, mariadb"
        exit 1
    fi
    
    # 执行操作
    case $action in
        start)
            check_requirements
            check_env_file
            start_services "$database_type" "$enable_redis" "$enable_nginx"
            ;;
        stop)
            stop_services
            ;;
        clean)
            clean_all
            ;;
    esac
}

# 运行主函数
main "$@"

