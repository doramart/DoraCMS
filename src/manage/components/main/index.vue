<template>
    <div class="admin-main">
        <el-row :gutter="15">
            <el-col :span="12">
                <div class="grid-content bg-purple">
                    <div class="pannel-box box-solid">
                        <div class="box-header with-border">
                            <h5 class="box-title">概况</h5>
                        </div>
                        <!-- /.box-header -->
                        <div class="box-body">
                            <ul class="row basic-count">
                                <li>
                                    <i class="fa fa-fw fa-user"></i> 管理员: {{basicInfo.adminUserCount}}
                                </li>
                                <li>
                                    <i class="fa fa-fw fa-users"></i> 用户: {{basicInfo.regUserCount}}
                                </li>
                                <li>
                                    <i class="fa fa-fw fa-file-text-o"></i> 文档: {{basicInfo.contentCount}}
                                </li>
                                <li>
                                    <i class="fa fa-fw fa-comments-o"></i> 留言: {{basicInfo.messageCount}}
                                </li>
                            </ul>
                        </div>
                        <!-- /.box-body -->
                    </div>
                </div>
            </el-col>
            <el-col :span="12">
                <div class="grid-content bg-purple-light">
                    <div class="pannel-box box-solid">
                        <div class="box-header with-border">
                            <h5 class="box-title">快捷操作</h5>
                        </div>
                        <!-- /.box-header -->
                        <div class="box-body">
                            <ul class="row quick-opt">
                                <li>
                                    <el-button size="small" @click="getToPage('adminUser')">
                                        <i class="fa fa-fw fa-user"></i> 添加管理员</el-button>
                                </li>
                                <li>
                                    <el-button size="small" @click="getToPage('addContent')">
                                        <i class="fa fa-fw fa-file-text-o"></i> 添加文档</el-button>
                                </li>
                                <li>
                                    <el-button size="small" @click="getToPage('adminResource')">
                                        <i class="fa fa-fw fa-th-list"></i> 资源管理</el-button>
                                </li>
                                <li>
                                    <el-button size="small" @click="getToPage('systemConfig')">
                                        <i class="fa fa-fw fa-cog"></i> 系统配置</el-button>
                                </li>
                            </ul>
                        </div>
                        <!-- /.box-body -->
                    </div>
                </div>
            </el-col>
        </el-row>

    </div>
</template>
<script>

import {
    mapGetters,
    mapActions
} from 'vuex'

export default {
    name: 'admin-main',
    data() {
        return {

        }
    },

    methods: {
        getToPage(targetPage) {
            this.$router.push(targetPage);
        }
    },
    computed: {
        ...mapGetters([
            'basicInfo'
        ])
    },
    mounted() {
        this.$store.dispatch('getSiteBasicInfo');
    }
}
</script>

<style lang="scss">
.admin-main {
    margin-top: 20px;
}

.pannel-box {
    position: relative;
    background: #ffffff;
    margin-bottom: 20px;
    width: 100%;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
    border-top: 1px solid #eaeefb;
    border-radius: 3px;
    .box-header.with-border {
        border-bottom: 1px solid #eaeefb;
    }
    .box-header {
        color: #444;
        display: block;
        padding: 6px 10px;
        position: relative;
    }
    .box-body {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        border-bottom-right-radius: 3px;
        border-bottom-left-radius: 3px;
        padding: 10px;
    }
    .box-title {
        display: inline-block;
        font-size: 16px;
        margin: 0;
        line-height: 25px;
    }

    .quick-opt {
        li {
            list-style-type: none;
            display: inline-block;

            i {
                color: #8492a6;
            }
        }
    }

    .basic-count {
        li {
            list-style-type: none;
            line-height: 25px;
            color: #324057;
        }
    }
}
</style>