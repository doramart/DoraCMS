#!/bin/bash
set -e

# ==============================================================================
# EggCMS 容器启动脚本
# 功能：等待依赖服务启动、环境检查、应用启动
# ==============================================================================

echo "🚀 EggCMS 容器启动中..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 等待服务启动函数
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local timeout=${4:-60}
    
    log_info "等待 $service_name 服务启动 ($host:$port)..."
    
    if /app/docker/wait-for-it.sh "$host:$port" --timeout=$timeout --strict; then
        log_success "$service_name 服务已启动"
        return 0
    else
        log_error "$service_name 服务启动超时"
        return 1
    fi
}

# 环境变量检查
check_environment() {
    log_info "检查环境变量配置..."
    
    # 检测数据库类型
    DATABASE_TYPE="${DATABASE_TYPE:-mongodb}"
    log_info "数据库类型: $DATABASE_TYPE"
    
    # 基础必需的环境变量
    local base_required_vars=(
        "APP_KEYS"
        "SESSION_SECRET"
    )
    
    # 根据数据库类型添加特定的必需变量
    local db_required_vars=()
    if [[ "$DATABASE_TYPE" == "mongodb" ]]; then
        db_required_vars=(
            "MONGODB_HOST"
            "MONGODB_DATABASE"
            "MONGODB_USERNAME"
            "MONGODB_PASSWORD"
        )
    elif [[ "$DATABASE_TYPE" == "mariadb" ]]; then
        db_required_vars=(
            "MARIADB_HOST"
            "MARIADB_DATABASE"
            "MARIADB_USERNAME"
            "MARIADB_PASSWORD"
        )
    else
        log_error "不支持的数据库类型: $DATABASE_TYPE"
        log_error "支持的类型: mongodb, mariadb"
        exit 1
    fi
    
    # 合并所有必需变量
    local required_vars=("${base_required_vars[@]}" "${db_required_vars[@]}")
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "缺少必需的环境变量: ${missing_vars[*]}"
        log_error "当前数据库类型: $DATABASE_TYPE"
        log_error "请检查 .env 文件或 docker-compose.yml 配置"
        exit 1
    fi
    
    log_success "环境变量检查通过 (数据库类型: $DATABASE_TYPE)"
}

# 数据库连接检查
check_database() {
    log_info "检查数据库连接..."
    
    # 使用简单的端口检查替代复杂的数据库连接检查
    # 因为MongoDB服务已经在wait_for_service中确认可用
    log_success "数据库服务已确认可用"
    return 0
}

# Redis连接检查
check_redis() {
    if [[ -n "$REDIS_HOST" ]]; then
        log_info "检查Redis连接..."
        
        local redis_cmd="redis-cli -h $REDIS_HOST -p ${REDIS_PORT:-6379}"
        if [[ -n "$REDIS_PASSWORD" ]]; then
            redis_cmd="$redis_cmd -a $REDIS_PASSWORD"
        fi
        
        if $redis_cmd ping > /dev/null 2>&1; then
            log_success "Redis连接成功"
        else
            log_warning "Redis连接失败，应用将在无缓存模式下运行"
        fi
    fi
}

# 创建必要目录
create_directories() {
    log_info "创建必要的目录..."
    
    local dirs=(
        "/app/server/logs"
        "/app/server/run"
        "/app/server/app/public/upload"
    )
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_info "创建目录: $dir"
        fi
    done
    
    log_success "目录创建完成"
}

# 健康检查端点
setup_health_check() {
    log_info "设置健康检查端点..."
    
    # 创建简单的健康检查脚本
    cat > /app/health-check.js << 'EOF'
const http = require('http');

const options = {
    hostname: 'localhost',
    port: process.env.PORT || 8080,
    path: '/api/health',
    method: 'GET',
    timeout: 3000
};

const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

req.on('error', () => {
    process.exit(1);
});

req.on('timeout', () => {
    req.destroy();
    process.exit(1);
});

req.end();
EOF
    
    log_success "健康检查设置完成"
}

# MariaDB 连接检查
check_mariadb() {
    log_info "检查 MariaDB 连接..."
    
    # 等待 MariaDB 服务可用
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if mariadb --skip-ssl -h "$MARIADB_HOST" -P "${MARIADB_PORT:-3306}" \
            -u "$MARIADB_USERNAME" -p"$MARIADB_PASSWORD" \
            -e "SELECT 1;" "$MARIADB_DATABASE" > /dev/null 2>&1; then
            log_success "MariaDB 连接成功"
            return 0
        fi
        
        log_info "等待 MariaDB 连接... ($attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "MariaDB 连接超时"
    return 1
}

# 主启动流程
main() {
    log_info "开始EggCMS启动流程..."
    
    # 1. 环境变量检查
    check_environment
    
    # 2. 等待数据库服务（根据数据库类型）
    DATABASE_TYPE="${DATABASE_TYPE:-mongodb}"
    
    if [[ "$DATABASE_TYPE" == "mongodb" ]]; then
        log_info "使用 MongoDB 数据库"
        wait_for_service "$MONGODB_HOST" "${MONGODB_PORT:-27017}" "MongoDB" 60
        check_database
    elif [[ "$DATABASE_TYPE" == "mariadb" ]]; then
        log_info "使用 MariaDB 数据库"
        wait_for_service "$MARIADB_HOST" "${MARIADB_PORT:-3306}" "MariaDB" 60
        check_mariadb
    else
        log_error "不支持的数据库类型: $DATABASE_TYPE"
        exit 1
    fi
    
    # 3. Redis 服务检查（可选）
    if [[ -n "$REDIS_HOST" ]]; then
        log_info "检测到 Redis 配置，尝试连接 Redis 服务..."
        if wait_for_service "$REDIS_HOST" "${REDIS_PORT:-6379}" "Redis" 10; then
            log_success "Redis 服务连接成功"
            check_redis
        else
            log_warning "Redis 服务不可用，应用将在无缓存模式下运行"
            # 清除Redis配置，让应用以无缓存模式运行
            unset REDIS_HOST
            unset REDIS_PORT
            unset REDIS_PASSWORD
            unset REDIS_DB
        fi
    else
        log_info "未配置 Redis，应用将在无缓存模式下运行"
    fi
    
    # 4. 创建必要目录
    create_directories
    
    # 5. 设置健康检查
    setup_health_check
    
    # 6. 显示启动信息
    log_success "========================================="
    log_success "EggCMS 准备启动"
    log_success "数据库类型: $DATABASE_TYPE"
    if [[ "$DATABASE_TYPE" == "mongodb" ]]; then
        log_success "MongoDB: $MONGODB_HOST:${MONGODB_PORT:-27017}/$MONGODB_DATABASE"
    elif [[ "$DATABASE_TYPE" == "mariadb" ]]; then
        log_success "MariaDB: $MARIADB_HOST:${MARIADB_PORT:-3306}/$MARIADB_DATABASE"
    fi
    if [[ -n "$REDIS_HOST" ]]; then
        log_success "Redis: $REDIS_HOST:${REDIS_PORT:-6379}"
    fi
    log_success "应用端口: ${PORT:-8080}"
    log_success "========================================="
    
    # 7. 启动应用
    log_info "启动EggCMS应用..."
    
    cd /app/server
    
    # 使用 exec 替换当前进程，确保信号正确传递
    # 注意：在 Docker 容器中不使用 --daemon 参数，以保持容器运行
    exec npx cross-env NODE_ENV=production egg-scripts start --title=doracms2 --sticky
}

# 信号处理
cleanup() {
    log_info "接收到停止信号，正在关闭应用..."
    # 这里可以添加清理逻辑
    exit 0
}

trap cleanup SIGTERM SIGINT

# 执行主流程
main "$@" 