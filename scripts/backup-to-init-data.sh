#!/bin/bash
set -e

# ==============================================================================
# 备份现有数据库数据作为 Docker 初始化数据源
# 使用说明：
#   1. 配置下面的数据库连接信息
#   2. 运行脚本: ./scripts/backup-to-init-data.sh
#   3. 脚本会自动备份数据并放置到正确的初始化目录
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

# ==============================================================================
# 配置区域 - 请根据您的实际情况修改
# ==============================================================================

# MongoDB 连接信息（优先从环境变量/ .env.local 读取）
MONGODB_HOST=
MONGODB_PORT=
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_DATABASE=
MONGODB_AUTH_SOURCE=

# Mariadb 配置（优先从环境变量/ .env.local 读取）
MARIADB_HOST=
MARIADB_PORT=
# 源数据库（包含完整数据）
MARIADB_DATABASE=
# 备份文件中的库名（用于导出后重命名，将在 SQL 文件中替换为此名称）
MARIADB_BACKUP_DATABASE_NAME=
MARIADB_USERNAME=
MARIADB_PASSWORD=

# 备份目录（默认脱敏数据输出到 docker 目录）
MONGODB_INIT_DIR="./docker/mongodb/initdata"
MARIADB_INIT_DIR="./docker/mariadb/init"

# 全量数据输出目录（可通过参数覆盖）
FULL_BACKUP_DIR="./data/backups/full"
FULL_BACKUP_DIR_DEFAULT="./data/backups/full"

# 默认导出模式：sanitized（脱敏） | full（全量）
MODE="sanitized"
MODE_SET=0

# 需要清理的敏感表/集合
SENSITIVE_TABLES=(
    "admins"
    "admin_roles"
    "users"
    "contents"
    "upload_files"
    "messages"
    "ai_models"
    "ai_usage_logs"
    "api_keys"
    "system_option_logs"
)
SENSITIVE_COLLECTIONS=("${SENSITIVE_TABLES[@]}")

load_env() {
    local server_root="./server"
    local env_local="${server_root}/.env.local"
    local env_default="${server_root}/.env"

    if [ -f "$env_local" ]; then
        log_info "加载环境配置: $env_local"
        set -a
        # shellcheck disable=SC1090
        source "$env_local"
        set +a
    elif [ -f "$env_default" ]; then
        log_info "加载环境配置: $env_default"
        set -a
        # shellcheck disable=SC1090
        source "$env_default"
        set +a
    fi
}

apply_env_config() {
    # MongoDB
    MONGODB_HOST=${MONGODB_HOST:-127.0.0.1}
    MONGODB_PORT=${MONGODB_PORT:-27017}
    MONGODB_USERNAME=${MONGODB_USERNAME:-}
    MONGODB_PASSWORD=${MONGODB_PASSWORD:-}
    MONGODB_DATABASE=${MONGODB_DATABASE:-doracms3}
    MONGODB_AUTH_SOURCE=${MONGODB_AUTH_SOURCE:-admin}

    # MariaDB
    MARIADB_HOST=${MARIADB_HOST:-127.0.0.1}
    MARIADB_PORT=${MARIADB_PORT:-3307}
    MARIADB_DATABASE=${MARIADB_DATABASE:-doracms3}
    MARIADB_BACKUP_DATABASE_NAME=${MARIADB_BACKUP_DATABASE_NAME:-doracms3}
    MARIADB_USERNAME=${MARIADB_USERNAME:-root}
    MARIADB_PASSWORD=${MARIADB_PASSWORD:-}
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --mode)
                MODE="$2"
                MODE_SET=1
                shift 2
                ;;
            --full-dir)
                FULL_BACKUP_DIR="$2"
                shift 2
                ;;
            -h|--help)
                echo "用法: $0 [--mode sanitized|full] [--full-dir /path/to/full]"
                exit 0
                ;;
            *)
                echo "未知参数: $1"
                exit 1
                ;;
        esac
    done

    if [[ "$MODE" != "sanitized" && "$MODE" != "full" ]]; then
        echo "无效的 --mode 参数: $MODE（仅支持 sanitized 或 full）"
        exit 1
    fi

    if [[ "$MODE" == "full" ]]; then
        MONGODB_INIT_DIR="${FULL_BACKUP_DIR}/mongodb"
        MARIADB_INIT_DIR="${FULL_BACKUP_DIR}/mariadb"
    fi
}

sanitize_full_backup_dir() {
  # Detect non-printable characters in FULL_BACKUP_DIR
  if printf '%s' "$FULL_BACKUP_DIR" | LC_ALL=C grep -q '[^ -~]'; then
    log_warning "检测到 FULL_BACKUP_DIR 包含不可见字符，已回退为默认值"
    FULL_BACKUP_DIR="$FULL_BACKUP_DIR_DEFAULT"
  fi
}

ensure_full_backup_dir() {
  if [[ "$MODE" != "full" ]]; then
    return 0
  fi

  if [ ! -d "$FULL_BACKUP_DIR" ]; then
    log_info "全量目录不存在，创建: $FULL_BACKUP_DIR"
    if ! mkdir -p "$FULL_BACKUP_DIR"; then
      log_error "无法创建全量目录: $FULL_BACKUP_DIR"
      log_error "请检查权限或更换 --full-dir 路径"
      exit 1
    fi
  fi
}

# ==============================================================================
# 备份 MongoDB 数据
# ==============================================================================
backup_mongodb() {
    log_info "================================="
    log_info "备份 MongoDB 数据"
    log_info "================================="
    
    # 检查 mongodump 是否安装
    if ! command -v mongodump &> /dev/null; then
        log_error "未找到 mongodump 命令"
        log_error "请安装 MongoDB Database Tools:"
        log_error "  macOS: brew install mongodb-database-tools"
        log_error "  Ubuntu: sudo apt-get install mongodb-database-tools"
        log_error "  或访问: https://www.mongodb.com/try/download/database-tools"
        return 1
    fi
    
    # 创建初始化目录
    mkdir -p "$MONGODB_INIT_DIR"
    
    # 备份前先清空目录（可选）
    log_warning "即将清空目录: $MONGODB_INIT_DIR"
    read -p "继续? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$MONGODB_INIT_DIR"/*
        log_info "已清空旧数据"
    fi
    
    # 执行备份
    log_info "正在备份 MongoDB 数据..."
    log_info "连接: $MONGODB_HOST:$MONGODB_PORT/$MONGODB_DATABASE"
    
    # 创建临时目录
    local temp_dir=$(mktemp -d)
    
    # 备份到临时目录
    if mongodump \
        --host="$MONGODB_HOST" \
        --port="$MONGODB_PORT" \
        --username="$MONGODB_USERNAME" \
        --password="$MONGODB_PASSWORD" \
        --authenticationDatabase="$MONGODB_AUTH_SOURCE" \
        --db="$MONGODB_DATABASE" \
        --out="$temp_dir"; then
        
        # mongodump 会创建以数据库名命名的子目录，将其内容移动到目标目录
        if [ -d "$temp_dir/$MONGODB_DATABASE" ]; then
            mkdir -p "$MONGODB_INIT_DIR"
            mv "$temp_dir/$MONGODB_DATABASE"/* "$MONGODB_INIT_DIR/"
            log_success "数据已移动到目标目录"
        else
            log_error "未找到备份数据目录: $temp_dir/$MONGODB_DATABASE"
            rm -rf "$temp_dir"
            return 1
        fi
        
        # 清理临时目录
        rm -rf "$temp_dir"
    else
        log_error "mongodump 执行失败"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # 脱敏处理：移除敏感集合（仅在 sanitized 模式）
    if [[ "$MODE" == "sanitized" ]]; then
        for coll in "${SENSITIVE_COLLECTIONS[@]}"; do
            rm -f "$MONGODB_INIT_DIR/${coll}.bson" "$MONGODB_INIT_DIR/${coll}.metadata.json"
        done
        log_info "已移除敏感集合数据（脱敏模式）"
        local remaining_sensitive=()
        for coll in "${SENSITIVE_COLLECTIONS[@]}"; do
            if [ -f "$MONGODB_INIT_DIR/${coll}.bson" ]; then
                remaining_sensitive+=("$coll")
            fi
        done
        if [ ${#remaining_sensitive[@]} -gt 0 ]; then
            log_warning "仍检测到敏感集合文件: ${remaining_sensitive[*]}"
        fi
    fi

    # 检查备份结果
    if [ -d "$MONGODB_INIT_DIR" ] && [ "$(ls -A $MONGODB_INIT_DIR)" ]; then
        local file_count=$(find "$MONGODB_INIT_DIR" -name "*.bson" | wc -l)
        local metadata_count=$(find "$MONGODB_INIT_DIR" -name "*.json" | wc -l)
        
        log_success "MongoDB 备份完成！"
        log_info "数据文件: $file_count 个 BSON 文件"
        log_info "元数据: $metadata_count 个 JSON 文件"
        log_info "备份位置: $MONGODB_INIT_DIR"
        
        # 显示集合列表
        log_info ""
        log_info "备份的集合:"
        find "$MONGODB_INIT_DIR" -name "*.bson" -exec basename {} .bson \; | sort
        
        return 0
    else
        log_error "MongoDB 备份失败"
        return 1
    fi
}

# ==============================================================================
# 备份 MariaDB 数据
# ==============================================================================
backup_mariadb() {
    log_info ""
    log_info "================================="
    log_info "备份 MariaDB 数据"
    log_info "================================="
    
    # 检查 mariadb-dump 或 mysqldump 是否安装
    local dump_cmd=""
    if command -v mariadb-dump &> /dev/null; then
        dump_cmd="mariadb-dump"
    elif command -v mysqldump &> /dev/null; then
        dump_cmd="mysqldump"
    else
        log_error "未找到 mariadb-dump 或 mysqldump 命令"
        log_error "请安装 MariaDB 或 MySQL 客户端:"
        log_error "  macOS: brew install mariadb"
        log_error "  Ubuntu: sudo apt-get install mariadb-client"
        return 1
    fi
    
    log_info "使用命令: $dump_cmd"
    
    # 创建初始化目录
    mkdir -p "$MARIADB_INIT_DIR"

    # 备份文件名
    local backup_file="$MARIADB_INIT_DIR/01-init-data.sql"
    local source_db="$MARIADB_DATABASE"
    local target_db="${MARIADB_BACKUP_DATABASE_NAME:-$MARIADB_DATABASE}"
    
    # 备份前提示
    if [ -f "$backup_file" ]; then
        log_warning "备份文件已存在: $backup_file"
        read -p "覆盖? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "已取消 MariaDB 备份"
            return 0
        fi
    fi
    
    # 执行备份
    log_info "正在备份 MariaDB 数据..."
    log_info "连接: $MARIADB_HOST:$MARIADB_PORT/$MARIADB_DATABASE"

    local ignore_tables=()
    if [[ "$MODE" == "sanitized" ]]; then
        for table in "${SENSITIVE_TABLES[@]}"; do
            ignore_tables+=( "--ignore-table=${source_db}.${table}" )
        done
    fi

    $dump_cmd \
        --host="$MARIADB_HOST" \
        --port="$MARIADB_PORT" \
        --user="$MARIADB_USERNAME" \
        --password="$MARIADB_PASSWORD" \
        --databases "$source_db" \
        "${ignore_tables[@]}" \
        --single-transaction \
        --quick \
        --lock-tables=false \
        --routines \
        --triggers \
        --events \
        --default-character-set=utf8mb4 \
        --skip-ssl \
        --skip-extended-insert \
        --complete-insert \
        --result-file="$backup_file"

    # 脱敏处理：为敏感表追加仅结构（不包含数据）
    if [[ "$MODE" == "sanitized" ]]; then
        local schema_only_file
        schema_only_file="$(mktemp)"
        $dump_cmd \
            --host="$MARIADB_HOST" \
            --port="$MARIADB_PORT" \
            --user="$MARIADB_USERNAME" \
            --password="$MARIADB_PASSWORD" \
            --no-data \
            --no-create-db \
            --skip-extended-insert \
            --default-character-set=utf8mb4 \
            --skip-ssl \
            "$source_db" \
            "${SENSITIVE_TABLES[@]}" \
            > "$schema_only_file"

        cat "$schema_only_file" >> "$backup_file"
        rm -f "$schema_only_file"
        log_info "已追加敏感表结构（脱敏模式）"
    fi

    # 若需要更换备份文件中的库名，执行替换
    if [ "$source_db" != "$target_db" ]; then
        log_info "调整备份文件中的库名: $source_db -> $target_db"
        perl -pi -e "s/\\\`$source_db\\\`/\\\`$target_db\\\`/g" "$backup_file"
        perl -pi -e "s/Database: $source_db/Database: $target_db/" "$backup_file" || true
        log_success "备份文件中的库名已替换为 $target_db"
    fi
    
    # 检查备份结果
    if [ -f "$backup_file" ]; then
        local file_size=$(du -h "$backup_file" | cut -f1)
        local table_count=$(grep -c "CREATE TABLE" "$backup_file" || echo "0")
        local insert_count=$(grep -c "INSERT INTO" "$backup_file" || echo "0")
        
        log_success "MariaDB 备份完成！"
        log_info "文件大小: $file_size"
        log_info "表数量: $table_count"
        log_info "插入语句: $insert_count 条"
        log_info "备份位置: $backup_file"
        
        # 添加注释说明
        cat > "$MARIADB_INIT_DIR/00-readme.txt" << EOF
MariaDB 初始化数据说明
=====================

该目录下的 SQL 文件会在 MariaDB 容器首次启动时自动执行。

执行顺序：按文件名排序
- 00-readme.txt (本文件，不会执行)
- 01-init-data.sql (数据库初始化数据)

备份时间：$(date '+%Y-%m-%d %H:%M:%S')
源数据库：$source_db
备份文件中的库名：$target_db
主机：$MARIADB_HOST:$MARIADB_PORT

注意：
1. SQL 文件必须是 UTF-8 编码
2. 如果需要多个 SQL 文件，按 01-xxx.sql, 02-xxx.sql 命名
3. Docker 容器首次启动后不会再次执行这些脚本
EOF
        
        return 0
    else
        log_error "MariaDB 备份失败"
        return 1
    fi
}

# ==============================================================================
# 显示使用说明
# ==============================================================================
show_usage() {
    log_info ""
    log_info "================================="
    log_info "Docker 初始化数据配置完成"
    log_info "================================="
    log_info ""
    log_info "📁 数据位置:"
    log_info "  MongoDB: $MONGODB_INIT_DIR"
    log_info "  MariaDB: $MARIADB_INIT_DIR"
    log_info ""
    log_info "🚀 下一步:"
    log_info ""
    log_info "1. 验证备份数据"
    log_info "   MongoDB: ls -lh $MONGODB_INIT_DIR"
    log_info "   MariaDB: ls -lh $MARIADB_INIT_DIR"
    log_info ""
    log_info "2. 使用 Docker Compose 启动"
    log_info "   MongoDB 模式:"
    log_info "     docker compose up -d"
    log_info ""
    log_info "   MariaDB 模式:"
    log_info "     docker compose --profile mariadb up -d"
    log_info ""
    log_info "3. 查看初始化日志"
    log_info "   MongoDB: docker compose logs mongodb-init"
    log_info "   MariaDB: docker compose logs mariadb-init"
    log_info ""
    log_info "⚙️  当前模式: $MODE"
    if [[ "$MODE" == "full" ]]; then
        log_info "  全量输出目录: $FULL_BACKUP_DIR"
    fi
    log_info ""
    log_info "⚠️  注意事项:"
    log_info "  - 初始化脚本只在容器首次启动时执行"
    log_info "  - 如需重新初始化，请先删除数据卷:"
    log_info "    docker compose down -v"
    log_info "  - 确保数据库连接信息正确"
    log_info ""
}

# ==============================================================================
# 主函数
# ==============================================================================
main() {
  load_env
  apply_env_config
  parse_args "$@"
  sanitize_full_backup_dir
  ensure_full_backup_dir
    log_info "================================="
    log_info "EggCMS 数据备份工具"
    log_info "备份现有数据作为 Docker 初始化数据"
    log_info "================================="
    log_info ""
    
    # 显示配置
    log_info "当前配置:"
    log_info "  MongoDB: $MONGODB_HOST:$MONGODB_PORT/$MONGODB_DATABASE"
    log_info "  MariaDB: $MARIADB_HOST:$MARIADB_PORT/$MARIADB_DATABASE"
    log_info "  模式: $MODE"
    log_info "  MongoDB 输出: $MONGODB_INIT_DIR"
    log_info "  MariaDB 输出: $MARIADB_INIT_DIR"
    if [[ "$MODE" == "sanitized" ]]; then
        log_info "  脱敏表/集合: ${SENSITIVE_TABLES[*]}"
    fi
    log_info ""

    if [[ "$MODE" == "sanitized" ]]; then
        log_info "提示：当前为脱敏模式（默认）。敏感表/集合数据将被剔除。"
    else
        log_warning "当前为全量模式，敏感数据将被完整导出！"
    fi

    read -p "配置正确吗？继续? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "已取消"
        exit 0
    fi

    # 交互选择导出模式（仅在未显式传参时提示）
    if [[ "$MODE" == "sanitized" ]]; then
        log_info ""
        log_info "请选择导出模式（默认脱敏）："
        echo "1) 脱敏（默认）"
        echo "2) 全量（输出到: $FULL_BACKUP_DIR）"
        read -p "请选择 (1/2，默认 1): " -r mode_choice
        case "$mode_choice" in
            2)
                MODE="full"
                MONGODB_INIT_DIR="${FULL_BACKUP_DIR}/mongodb"
                MARIADB_INIT_DIR="${FULL_BACKUP_DIR}/mariadb"
                ;;
            ""|1)
                ;;
            *)
                log_error "无效的选择"
                exit 1
                ;;
        esac
    fi

    # 选择备份哪个数据库
    log_info ""
    log_info "请选择要备份的数据库:"
    echo "1) MongoDB"
    echo "2) MariaDB"
    echo "3) 两个都备份"
    read -p "请选择 (1/2/3): " -n 1 -r choice
    echo
    
    case $choice in
        1)
            backup_mongodb
            ;;
        2)
            backup_mariadb
            ;;
        3)
            backup_mongodb
            backup_mariadb
            ;;
        *)
            log_error "无效的选择"
            exit 1
            ;;
    esac
    
    # 显示使用说明
    show_usage
}

# 运行主函数
main "$@"
