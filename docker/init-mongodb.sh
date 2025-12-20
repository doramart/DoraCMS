#!/bin/bash
set -e

# ==============================================================================
# MongoDB 数据初始化脚本
# 功能：创建用户、导入初始数据
# ==============================================================================

echo "🔧 MongoDB 数据初始化开始..."

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

# 等待MongoDB服务启动
wait_for_mongodb() {
    log_info "等待MongoDB服务启动..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if mongosh --host $MONGODB_HOST --port $MONGODB_PORT --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
            log_success "MongoDB服务已启动"
            return 0
        fi
        
        log_info "等待MongoDB启动... ($attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "MongoDB服务启动超时"
    exit 1
}

# 创建数据库用户
create_database_user() {
    log_info "创建数据库用户..."
    
    # 连接到admin数据库创建用户
    mongosh --host $MONGODB_HOST --port $MONGODB_PORT \
        --username $MONGODB_ROOT_USERNAME \
        --password $MONGODB_ROOT_PASSWORD \
        --authenticationDatabase admin \
        --eval "
        try {
            use('$MONGODB_DATABASE');
            db.createUser({
                user: '$MONGODB_USERNAME',
                pwd: '$MONGODB_PASSWORD',
                roles: [
                    { role: 'readWrite', db: '$MONGODB_DATABASE' },
                    { role: 'dbAdmin', db: '$MONGODB_DATABASE' }
                ]
            });
            print('✅ 用户创建成功');
        } catch (e) {
            if (e.code === 51003) {
                print('⚠️  用户已存在，跳过创建');
            } else {
                print('❌ 用户创建失败: ' + e);
                throw e;
            }
        }
        " --quiet
    
    log_success "数据库用户配置完成"
}

# 检查数据是否已存在
check_existing_data() {
    log_info "检查现有数据..."
    
    local collection_count=$(mongosh --host $MONGODB_HOST --port $MONGODB_PORT \
        --username $MONGODB_USERNAME \
        --password $MONGODB_PASSWORD \
        --authenticationDatabase $MONGODB_DATABASE \
        --eval "
        use('$MONGODB_DATABASE');
        db.getCollectionNames().length;
        " --quiet)
    
    if [ "$collection_count" -gt "0" ]; then
        log_warning "数据库中已存在 $collection_count 个集合"
        log_warning "跳过数据导入以避免重复数据"
        return 1
    fi
    
    log_info "数据库为空，继续导入数据"
    return 0
}

# 导入初始数据
import_initial_data() {
    log_info "开始导入初始数据..."
    
    local data_dir="${MONGODB_INIT_DIR:-/data/initdata}"
    local success_count=0
    local error_count=0
    
    # 检查数据目录
    if [ ! -d "$data_dir" ]; then
        log_error "初始数据目录不存在: $data_dir"
        exit 1
    fi
    
    # 获取所有BSON文件
    local bson_files=$(find $data_dir -name "*.bson" | sort)
    local total_files=$(echo "$bson_files" | wc -l)
    
    if [ -z "$bson_files" ]; then
        log_warning "未找到BSON数据文件"
        return 0
    fi
    
    log_info "找到 $total_files 个数据文件"
    
    # 逐个导入BSON文件
    for bson_file in $bson_files; do
        local collection_name=$(basename "$bson_file" .bson)
        
        log_info "导入集合: $collection_name"
        
        if mongorestore \
            --host $MONGODB_HOST:$MONGODB_PORT \
            --username $MONGODB_USERNAME \
            --password $MONGODB_PASSWORD \
            --authenticationDatabase $MONGODB_DATABASE \
            --db $MONGODB_DATABASE \
            --collection $collection_name \
            --quiet \
            "$bson_file"; then
            
            success_count=$((success_count + 1))
            log_success "✅ $collection_name 导入成功"
        else
            error_count=$((error_count + 1))
            log_error "❌ $collection_name 导入失败"
        fi
    done
    
    log_info "数据导入完成: 成功 $success_count 个，失败 $error_count 个"
    
    if [ $error_count -gt 0 ]; then
        log_warning "部分数据导入失败，请检查日志"
    else
        log_success "所有数据导入成功"
    fi
}

# 清理管理员数据以便首登提示创建
cleanup_admin_data() {
    log_info "清理默认管理员及内容数据..."
    
    mongosh --host $MONGODB_HOST --port $MONGODB_PORT \
        --username $MONGODB_USERNAME \
        --password $MONGODB_PASSWORD \
        --authenticationDatabase $MONGODB_DATABASE \
        --eval "
        use('$MONGODB_DATABASE');
        const targets = ['admins','contents','upload_files','messages','ai_usage_logs','api_keys','system_option_logs','plugins','ai_models','users'];
        targets.forEach(name => {
            if (db.getCollectionNames().includes(name)) {
                const removed = db.getCollection(name).deleteMany({});
                print('✅ 已清理集合 ' + name + '，删除数量: ' + removed.deletedCount);
            } else {
                print('ℹ️  集合 ' + name + ' 不存在，跳过');
            }
        });
        " --quiet
    
    log_success "管理员数据清理完成，系统将引导创建新管理员"
}

# 验证数据导入
verify_data() {
    log_info "验证数据导入..."
    
    # 先获取集合数量
    local collection_count=$(mongosh --host $MONGODB_HOST --port $MONGODB_PORT \
        --username $MONGODB_USERNAME \
        --password $MONGODB_PASSWORD \
        --authenticationDatabase $MONGODB_DATABASE \
        --eval "
        use('$MONGODB_DATABASE');
        db.getCollectionNames().length;
        " --quiet)
    
    # 再输出详细信息
    mongosh --host $MONGODB_HOST --port $MONGODB_PORT \
        --username $MONGODB_USERNAME \
        --password $MONGODB_PASSWORD \
        --authenticationDatabase $MONGODB_DATABASE \
        --eval "
        use('$MONGODB_DATABASE');
        let collections = db.getCollectionNames();
        let totalDocs = 0;
        collections.forEach(function(collName) {
            let count = db[collName].countDocuments();
            totalDocs += count;
            print(collName + ': ' + count + ' documents');
        });
        print('Total collections: ' + collections.length);
        print('Total documents: ' + totalDocs);
        " --quiet
    
    if [ "$collection_count" -gt "0" ]; then
        log_success "数据验证通过，共 $collection_count 个集合"
    else
        log_warning "数据库为空（无集合），这是正常的全新安装状态"
        log_info "应用首次启动时会自动创建必要的集合"
    fi
}

# 创建索引
create_indexes() {
    log_info "创建必要的索引..."
    
    mongosh --host $MONGODB_HOST --port $MONGODB_PORT \
        --username $MONGODB_USERNAME \
        --password $MONGODB_PASSWORD \
        --authenticationDatabase $MONGODB_DATABASE \
        --eval "
        use('$MONGODB_DATABASE');
        
        // 用户集合索引
        try {
            db.users.createIndex({ 'userName': 1 }, { unique: true, background: true });
            db.users.createIndex({ 'email': 1 }, { unique: true, background: true });
            print('✅ 用户索引创建成功');
        } catch (e) {
            print('⚠️  用户索引可能已存在');
        }
        
        // 内容集合索引
        try {
            db.contents.createIndex({ 'title': 'text', 'stitle': 'text' }, { background: true });
            db.contents.createIndex({ 'createTime': -1 }, { background: true });
            db.contents.createIndex({ 'state': 1 }, { background: true });
            print('✅ 内容索引创建成功');
        } catch (e) {
            print('⚠️  内容索引可能已存在');
        }
        
        // 管理员集合索引
        try {
            db.adminusers.createIndex({ 'userName': 1 }, { unique: true, background: true });
            db.adminusers.createIndex({ 'email': 1 }, { unique: true, background: true });
            print('✅ 管理员索引创建成功');
        } catch (e) {
            print('⚠️  管理员索引可能已存在');
        }
        
        print('索引创建完成');
        " --quiet
    
    log_success "索引创建完成"
}

# 主执行流程
main() {
    log_info "开始MongoDB初始化流程..."
    
    # 检查必需的环境变量
    if [[ -z "$MONGODB_HOST" || -z "$MONGODB_ROOT_USERNAME" || -z "$MONGODB_ROOT_PASSWORD" || -z "$MONGODB_USERNAME" || -z "$MONGODB_PASSWORD" || -z "$MONGODB_DATABASE" ]]; then
        log_error "缺少必需的环境变量"
        log_error "需要: MONGODB_HOST, MONGODB_ROOT_USERNAME, MONGODB_ROOT_PASSWORD, MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_DATABASE"
        exit 1
    fi
    
    # 1. 等待MongoDB启动
    wait_for_mongodb
    
    # 2. 创建数据库用户
    create_database_user
    
    # 3. 检查现有数据
    if check_existing_data; then
        # 4. 导入初始数据
        import_initial_data
        
        # 5. 清理默认管理员数据
        cleanup_admin_data
        
        # 6. 验证数据导入（仅在有数据时）
        local collection_count=$(mongosh --host $MONGODB_HOST --port $MONGODB_PORT \
            --username $MONGODB_USERNAME \
            --password $MONGODB_PASSWORD \
            --authenticationDatabase $MONGODB_DATABASE \
            --eval "use('$MONGODB_DATABASE'); db.getCollectionNames().length;" --quiet)
        
        if [ "$collection_count" -gt "0" ]; then
            verify_data
            # 7. 创建索引（仅在有集合时）
            create_indexes
        else
            log_warning "数据库为空，跳过数据验证和索引创建"
            log_info "应用首次启动时会自动创建必要的集合和索引"
        fi
    fi
    
    log_success "🎉 MongoDB初始化完成！"
}

# 执行主流程
main "$@" 
