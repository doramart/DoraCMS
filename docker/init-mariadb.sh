#!/bin/bash
set -e

# ==============================================================================
# MariaDB 数据初始化脚本
# 功能：验证数据库连接、创建必要的数据库结构
# ==============================================================================

echo "🔧 MariaDB 数据初始化开始..."

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

# 等待 MariaDB 服务启动
wait_for_mariadb() {
    log_info "等待 MariaDB 服务启动..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" -u root -p"$MARIADB_ROOT_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
            log_success "MariaDB 服务已启动"
            return 0
        fi
        
        log_info "等待 MariaDB 启动... ($attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "MariaDB 服务启动超时"
    exit 1
}

# 验证数据库连接
verify_database_connection() {
    log_info "验证数据库连接..."
    
    if mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" -u "$MARIADB_USERNAME" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" -e "SELECT 1;" > /dev/null 2>&1; then
        log_success "数据库连接成功"
        return 0
    else
        log_error "数据库连接失败"
        return 1
    fi
}

# 检查数据库是否已初始化
check_database_initialized() {
    log_info "检查数据库是否已初始化..."
    
    local table_count=$(mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" \
        -u "$MARIADB_USERNAME" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" \
        -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$MARIADB_DATABASE';")
    
    if [ "$table_count" -gt "0" ]; then
        log_warning "数据库中已存在 $table_count 个表"
        log_warning "跳过初始化以避免数据覆盖"
        return 1
    fi
    
    log_info "数据库为空，准备初始化"
    return 0
}

# 创建基础表结构
create_basic_schema() {
    log_info "创建基础表结构..."
    
    # 注意：实际的表结构将由应用程序的 Sequelize sync 创建
    # 这里只做基本的数据库准备工作
    
    mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" \
        -u "$MARIADB_USERNAME" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" <<-EOSQL
        -- 设置字符集
        SET NAMES utf8mb4;
        SET CHARACTER SET utf8mb4;
        
        -- 确保数据库使用正确的字符集
        ALTER DATABASE \`$MARIADB_DATABASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        
        -- 记录初始化信息
        CREATE TABLE IF NOT EXISTS \`_migrations\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`version\` VARCHAR(50) NOT NULL,
            \`description\` VARCHAR(255),
            \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY \`unique_version\` (\`version\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        
        INSERT INTO \`_migrations\` (\`version\`, \`description\`) 
        VALUES ('1.0.0', 'Initial database setup')
        ON DUPLICATE KEY UPDATE \`description\` = VALUES(\`description\`);
EOSQL
    
    log_success "基础表结构创建完成"
}

# 设置数据库优化参数
optimize_database() {
    log_info "设置数据库优化参数..."
    
    mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" \
        -u root -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE" <<-EOSQL
        -- 性能优化设置（会话级别）
        SET GLOBAL max_allowed_packet = 268435456;  -- 256MB
        SET GLOBAL innodb_buffer_pool_size = 268435456;  -- 256MB
        SET GLOBAL innodb_log_file_size = 268435456;  -- 256MB
        SET GLOBAL innodb_flush_log_at_trx_commit = 2;
        SET GLOBAL query_cache_size = 0;
        SET GLOBAL query_cache_type = 0;
EOSQL
    
    log_success "数据库优化参数设置完成"
}

# 导入初始数据
import_initial_data() {
    local data_dir="${MARIADB_INIT_DIR:-/data/init}"
    log_info "检查初始数据目录: $data_dir"
    
    if [ ! -d "$data_dir" ]; then
        log_warning "初始数据目录不存在，跳过导入"
        return
    fi
    
    local sql_files=$(find "$data_dir" -type f \( -name "*.sql" -o -name "*.sql.gz" \) | sort)
    if [ -z "$sql_files" ]; then
        log_warning "未找到 SQL 初始化文件，跳过导入"
        return
    fi
    
    for sql_file in $sql_files; do
        log_info "执行初始化脚本: $(basename "$sql_file")"
        if [[ "$sql_file" == *.gz ]]; then
            if gunzip -c "$sql_file" | mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" \
                -u "$MARIADB_USERNAME" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"; then
                log_success "导入 $(basename "$sql_file") 成功"
            else
                log_error "导入 $(basename "$sql_file") 失败"
            fi
        else
            if mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" \
                -u "$MARIADB_USERNAME" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" < "$sql_file"; then
                log_success "导入 $(basename "$sql_file") 成功"
            else
                log_error "导入 $(basename "$sql_file") 失败"
            fi
        fi
    done
}

# 清理管理员数据以便首登提示创建
cleanup_admin_tables() {
    log_info "清理管理员及内容相关表数据..."
    
    local tables=$(mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" \
        -u "$MARIADB_USERNAME" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" \
        -Nse "SELECT table_name FROM information_schema.tables WHERE table_schema='$MARIADB_DATABASE' AND table_name IN ('admins','admin_roles','contents','content_category_relations','content_tag_relations','upload_files','messages','ai_usage_logs','api_keys','system_option_logs','plugins','ai_models','users');")
    
    if [ -z "$tables" ]; then
        log_warning "未找到管理员/内容相关表，跳过清理"
        return
    fi
    
    for tbl in $tables; do
        mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" \
            -u "$MARIADB_USERNAME" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" \
            -e "DELETE FROM \`$tbl\`;"
        log_info "表 $tbl 数据已清空"
    done
    
    log_success "管理员数据清理完成，系统将引导创建新管理员"
}

# 显示数据库信息
display_database_info() {
    log_info "数据库信息："
    
    mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" \
        -u "$MARIADB_USERNAME" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" <<-EOSQL
        SELECT 
            '数据库名称' AS 'Info', 
            DATABASE() AS 'Value'
        UNION ALL
        SELECT 
            '字符集', 
            @@character_set_database
        UNION ALL
        SELECT 
            '排序规则', 
            @@collation_database
        UNION ALL
        SELECT 
            '当前用户', 
            CURRENT_USER()
        UNION ALL
        SELECT 
            '表数量', 
            CAST(COUNT(*) AS CHAR)
        FROM information_schema.tables 
        WHERE table_schema = '$MARIADB_DATABASE';
EOSQL
}

# 主执行流程
main() {
    log_info "开始 MariaDB 初始化流程..."
    
    # 检查必需的环境变量
    if [[ -z "$MARIADB_HOST" || -z "$MARIADB_ROOT_PASSWORD" || -z "$MARIADB_USERNAME" || -z "$MARIADB_PASSWORD" || -z "$MARIADB_DATABASE" ]]; then
        log_error "缺少必需的环境变量"
        log_error "需要: MARIADB_HOST, MARIADB_ROOT_PASSWORD, MARIADB_USERNAME, MARIADB_PASSWORD, MARIADB_DATABASE"
        exit 1
    fi
    
    # 1. 等待 MariaDB 启动
    wait_for_mariadb
    
    # 2. 验证数据库连接
    verify_database_connection
    
    # 3. 检查数据库是否已初始化
    if check_database_initialized; then
        # 4. 创建基础表结构
        create_basic_schema
        
        # 5. 导入初始数据
        import_initial_data
    else
        log_warning "检测到已有表结构，跳过初始化和导入，但仍会执行管理员/内容表清理和优化"
    fi
    
    # 6. 清理默认管理员数据（无论是否已有数据都清理）
    cleanup_admin_tables
    
    # 7. 设置数据库优化参数
    optimize_database
    
    # 8. 显示数据库信息
    display_database_info
    
    log_success "🎉 MariaDB 初始化完成！"
    log_info "应用程序启动时将自动创建完整的表结构（通过 Sequelize sync）"
}

# 执行主流程
main "$@"
