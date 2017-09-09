<template>
    <div class="dr-toolbar">
        <div class="option-button">
            <div v-if="type === 'adminGroup'">
                <el-button size="small" type="primary" icon="plus" @click="addRole">添加角色</el-button>
            </div>
            <div v-else-if="type === 'adminUser'">
                <el-button size="small" type="primary" icon="plus" @click="addUser">添加管理员</el-button>
            </div>
            <div v-else-if="type === 'adminResource'">
                <el-button size="small" type="primary" icon="plus" @click="addResource">添加主菜单</el-button>
            </div>
            <div v-else-if="type === 'content'">
                <el-button size="small" type="primary" icon="plus" @click="addContent">添加文档</el-button>
            </div>
            <div v-else-if="type === 'contentCategory'">
                <el-button size="small" type="primary" icon="plus" @click="addTopCates">添加主分类</el-button>
            </div>
            <div v-else-if="type === 'contentMessage'">
                <el-button size="small" type="danger" icon="delete" @click="branchDelete('msg')">批量删除</el-button>
            </div>
            <div v-else-if="type === 'contentTag'">
                <el-button size="small" type="primary" icon="plus" @click="addTag">添加新标签</el-button>
            </div>
            <div v-else-if="type === 'regUser'">
                <el-button size="small" type="danger" icon="delete" @click="branchDelete('user')">批量删除</el-button>
            </div>
            <div v-else-if="type === 'backUpData'">
                <el-button size="small" type="primary" @click="bakUpData" :loading="loadingState">
                    <i class="el-icon-upload"></i> &nbsp;备份数据库</el-button>
            </div>
            <div v-else-if="type === 'systemOptionLogs'">
                <el-button size="small" type="danger" icon="delete" @click="branchDelete('systemlogs')">批量删除</el-button>
                <el-button size="small" type="warning" icon="warning" @click="clearSystemOptionLogs">清空日志</el-button>
            </div>
            <div v-else-if="type === 'systemNotify'">
                <el-button size="small" @click="setHasRead()">标记为已读</el-button>
                <el-button size="small" type="danger" icon="delete" @click="branchDelete('systemnotify')">批量删除</el-button>
            </div>
            <div v-else-if="type === 'systemAnnounce'">
                <el-button type="primary" size="small" @click="addSysAnnounce">
                    <i class="fa fa-bullhorn"></i> &nbsp;新增系统公告</el-button>
            </div>
        </div>
        <div class="dr-searchInput">
            <div v-if="type === 'content'">
                <el-input size="small" placeholder="请输入关键字" icon="search" v-model="searchkey" :on-icon-click="searchResult">
                </el-input>
            </div>
            <div v-else-if="type === 'contentTag'">
                <el-input size="small" placeholder="标签名称" icon="search" v-model="searchkey" :on-icon-click="searchResult">
                </el-input>
            </div>
            <div v-else-if="type === 'contentMessage'">
                <el-input size="small" placeholder="留言内容" icon="search" v-model="searchkey" :on-icon-click="searchResult">
                </el-input>
            </div>
            <div v-else-if="type === 'regUser'">
                <el-input size="small" placeholder="请输入用户名" icon="search" v-model="searchkey" :on-icon-click="searchResult">
                </el-input>
            </div>
        </div>
    </div>
</template>
<script>
import services from '../../store/services.js';
import _ from 'lodash'
export default {
    props: {
        type: String,
        ids: Array
    },
    data() {
        return {
            loadingState: false,
            formState: {
                show: false
            },
            searchkey: ''
        }
    },
    methods: {
        searchResult(ev) {
            if (this.type == 'content') {
                this.$store.dispatch('getContentList', {
                    searchkey: this.searchkey
                });
            } else if (this.type == 'contentTag') {
                this.$store.dispatch('getContentTagList', {
                    searchkey: this.searchkey
                });
            } else if (this.type == 'contentMessage') {
                this.$store.dispatch('getContentMessageList', {
                    searchkey: this.searchkey
                });
            } else if (this.type == 'regUser') {
                this.$store.dispatch('getRegUserList', {
                    searchkey: this.searchkey
                });
            }
        },
        addUser() {
            this.$store.dispatch('showAdminUserForm')
        },
        addRole() {
            this.$store.dispatch('showAdminGroupForm')
        },
        addResource() {
            this.$store.dispatch('showAdminResourceForm', {
                type: 'root',
                formData: {
                    parentId: '0'
                }
            })
        },
        addContent() {
            this.$store.dispatch('showContentForm');
            this.$router.push('/addContent');
        },
        addSysAnnounce() {
            this.$store.dispatch('showContentForm');
            this.$router.push('/addSysAnnounce');
        },
        addTopCates() {
            this.$store.dispatch('showContentCategoryForm', {
                type: 'root',
                formData: {
                    parentId: '0'
                }
            })
        },
        clearSystemOptionLogs() {
            this.$confirm(`此操作将清空所有日志, 是否继续?`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                return services.clearSystemOptionLogs();
            }).then((result) => {
                if (result.data.state === 'success') {
                    this.$store.dispatch('getSystemLogsList');
                    this.$message({
                        message: `清空日志成功`,
                        type: 'success'
                    });
                } else {
                    this.$message.error(result.data.message);
                }
            }).catch((err) => {
                this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });
        },
        branchDelete(target) {
            let _this = this,
                targetName;
            if (target === 'msg') {
                targetName = '留言'
            } else if (target === 'user') {
                targetName = '用户'
            } else if (target === 'systemlogs') {
                targetName = '系统操作日志'
            } else if (target === 'systemnotify') {
                targetName = '系统消息'
            }
            if (_.isEmpty(_this.ids)) {
                this.$message({
                    type: 'info',
                    message: '请选择指定目标！'
                });
                return false
            }
            this.$confirm(`此操作将永久删除这些${targetName}, 是否继续?`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                let ids = (_this.ids).join();
                if (target === 'msg') {
                    return services.deleteContentMessage({
                        ids
                    });
                } else if (target === 'user') {
                    return services.deleteRegUser({
                        ids
                    });
                } else if (target === 'systemlogs') {
                    return services.deleteSystemOptionLogs({
                        ids
                    });
                } else if (target === 'systemnotify') {
                    return services.deleteSystemNotify({
                        ids
                    });
                }
            }).then((result) => {
                if (result.data.state === 'success') {
                    if (target === 'msg') {
                        this.$store.dispatch('getContentMessageList');
                    } else if (target === 'user') {
                        this.$store.dispatch('getRegUserList');
                    } else if (target === 'systemlogs') {
                        this.$store.dispatch('getSystemLogsList');
                    } else if (target === 'systemnotify') {
                        this.$store.dispatch('getSystemNotifyList');
                    }
                    this.$message({
                        message: `${targetName}删除成功`,
                        type: 'success'
                    });
                } else {
                    this.$message.error(result.data.message);
                }
            }).catch((err) => {
                this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });
        },
        addTag() {
            this.$store.dispatch('showContentTagForm')
        },
        delUser() {
            // this.$store.dispatch('showAdminUserForm')
        },
        bakUpData() {
            this.$confirm(`您即将执行数据备份操作, 是否继续?`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.loadingState = true;
                return services.bakUpData();
            }).then((result) => {
                if (result.data.state === 'success') {
                    this.loadingState = false;
                    this.$store.dispatch('getBakDateList');
                    this.$message({
                        message: `数据备份成功`,
                        type: 'success'
                    });
                } else {
                    this.$message.error(result.data.message);
                }
            }).catch((err) => {
                this.$message({
                    type: 'info',
                    message: '数据备份失败:' + err
                });
            });
        },
        setHasRead() {
            if (_.isEmpty(this.ids)) {
                this.$message({
                    type: 'info',
                    message: '请选择指定目标！'
                });
                return false
            }
            let ids = (this.ids).join();
            services.setNoticeRead({ ids }).then((result) => {
                if (result.data.state === 'success') {
                    this.$store.dispatch('getSystemNotifyList');
                    let oldNoticeCounts = this.$store.getters.loginState.noticeCounts
                    this.$store.dispatch('loginState', { noticeCounts :  oldNoticeCounts - this.ids.length })
                } else {
                    this.$message.error(result.data.message);
                }
            })
        }
    },
    components: {

    }

}

</script>
<style lang="scss">
.option-button {
    display: inline-block
}
</style>
