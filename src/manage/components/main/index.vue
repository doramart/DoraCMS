<template>
    <div class="admin-main">
        <el-row :gutter="15">
            <el-col :span="12">
                <div class="grid-content bg-purple">
                    <el-card class="box-card pannel-box">
                        <div slot="header" class="clearfix">
                            <span>统计</span>
                        </div>
                        <div class="box-body">
                            <ul class="row basic-count">
                                <li>
                                    <i class="fa fa-fw fa-user"></i> 管理员: <span>{{basicInfo.adminUserCount}}</span>
                                </li>
                                <li>
                                    <i class="fa fa-fw fa-users"></i> 用户: <span>{{basicInfo.regUserCount}}</span>
                                </li>
                                <li>
                                    <i class="fa fa-fw fa-file-text-o"></i> 文档: <span>{{basicInfo.contentCount}}</span>
                                </li>
                                <li>
                                    <i class="fa fa-fw fa-comments-o"></i> 留言: <span>{{basicInfo.messageCount}}</span>
                                </li>
                            </ul>
                        </div>
                    </el-card>
                </div>
            </el-col>
            <el-col :span="12">
                <div class="grid-content bg-purple-light">
                    <el-card class="box-card pannel-box">
                        <div slot="header" class="clearfix">
                            <span>快捷操作</span>
                        </div>
                        <div class="box-body">
                            <ul class="row quick-opt">
                                <li>
                                    <el-button size="small" type="primary" plain round @click="getToPage('adminUser')">
                                        <i class="fa fa-fw fa-user"></i> 添加管理员</el-button>
                                </li>
                                <li>
                                    <el-button size="small" type="success" plain round @click="getToPage('addContent')">
                                        <i class="fa fa-fw fa-file-text-o"></i> 添加文档</el-button>
                                </li>
                                <li>
                                    <el-button size="small" type="info" plain round @click="getToPage('adminResource')">
                                        <i class="fa fa-fw fa-th-list"></i> 资源管理</el-button>
                                </li>
                                <li>
                                    <el-button size="small" type="warning" plain round @click="getToPage('systemConfig')">
                                        <i class="fa fa-fw fa-cog"></i> 系统配置</el-button>
                                </li>
                            </ul>
                        </div>
                    </el-card>
                </div>
            </el-col>
        </el-row>
        <el-row :gutter="15">
            <el-col :span="12">
                <div class="grid-content bg-purple-light">
                    <el-card class="box-card pannel-box">
                        <div slot="header" class="clearfix">
                            <span>近期评论</span>
                        </div>
                        <div class="box-body">
                            <div class="row user-messages">
                                <div v-if="basicInfo.messages && basicInfo.messages.length > 0">
                                    <div class="direct-chat-msg" v-for="msg in basicInfo.messages" :key="msg._id">
                                        <div class="direct-chat-info clearfix">
                                            <span class="direct-chat-name pull-left">
                                                    <a href="#">{{msg.utype =='0'?msg.author.userName:msg.adminAuthor.userName}}</a>
                                                在 <a class="direct-chat-contentTitle" :href="'/details/'+msg.contentId._id+'.html'" target="_blank">{{msg.contentId.stitle}}</a> 中{{msg.utype =='0'?'说':`回复 `}} <a href="#">{{msg.utype =='1'?msg.replyAuthor.userName:''}}</a>
                                            </span>
                                            <span class="direct-chat-timestamp pull-right"><i class="fa fa-clock-o"></i> <span>{{msg.date}}</span></span>
                                        </div>
                                        <img alt="message user image" :src="msg.utype =='0'?msg.author.logo:msg.adminAuthor.logo" class="direct-chat-img">
                                        <div class="direct-chat-text" v-html="msg.content"></div>
                                    </div>
                                </div>
                                <div v-else>暂无数据</div>
                            </div>
                        </div>
                    </el-card>
                </div>
            </el-col>
            <el-col :span="12">
                <div class="grid-content bg-purple">
                    <el-card class="box-card pannel-box">
                        <div slot="header" class="clearfix">
                            <span>新注册用户</span>
                        </div>
                        <div class="box-body">
                            <ul class="row user-list">
                                <div v-if="basicInfo.regUsers && basicInfo.regUsers.length > 0">
                                    <li v-for="user in basicInfo.regUsers" :key="user._id">
                                        <img :src="user.logo" :alt="user.userName" :title="user.userName" /><span>{{user.userName | cutWords(8)}}</span>
                                    </li>
                                </div>
                                <div v-else>暂无数据</div>
                            </ul>
                        </div>
                    </el-card>
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
            ]),
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

    .text {
        font-size: 14px;
    }

    .item {
        margin-bottom: 15px;
    }

    .clearfix:before,
    .clearfix:after {
        display: table;
        content: "";
    }

    .clearfix:after {
        clear: both
    }

    .pannel-box {
        margin-bottom: 10px;
        ul {
            margin: 0;
            padding: 0;
            li {
                list-style-type: none;
            }
        }
        .quick-opt {
            li {
                display: inline-block;
                margin: 5px 2px;
            }
        }

        .basic-count {
            li {
                color: #5A5E66;
                line-height: 25px;
                span {
                    color: #409EFF;
                    font-style: oblique;
                }
            }
        }
        .user-list {
            li {
                display: inline-block;
                margin-bottom: 10px;
                position: relative;
                width: 100px;
                img {
                    border-radius: 50%;
                    max-width: 75%;
                    height: auto;
                    width: 26px;
                    position: absolute;
                }
                span {
                    height: 26px;
                    line-height: 26px;
                    margin-left: 30px;
                }
            }
        }
        .direct-chat-msg {
            margin-bottom: 8px;
            a:link,
            a:visited {
                color: #409EFF;
            }
            .direct-chat-contentTitle:link,
            .direct-chat-contentTitle:visited {
                color: #5A5E66;
                font-style: italic;
            }
            .direct-chat-info {
                margin-bottom: 3px;
            }
            .direct-chat-timestamp {
                color: #B4BCCC;
                font-size: 12px;
            }
            .direct-chat-img {
                border-radius: 50%;
                width: 35px;
                float: left;
            }
            .direct-chat-text {
                border-radius: 5px;
                position: relative;
                padding: 5px 10px;
                margin: 5px 0 0 50px;
                color: #444;
                background-color: #EDF2FC;
                color: #878d99;
                font-size: 13px;
            }
            .direct-chat-text:after,
            .direct-chat-text:before {
                position: absolute;
                right: 100%;
                top: 15px;
                border: solid transparent;
                border-right-color: #EDF2FC;
                content: ' ';
                height: 0;
                width: 0;
                pointer-events: none;
                box-sizing: border-box;
            }
            .direct-chat-text:before {
                border-width: 6px;
                margin-top: -6px;
            }
            .direct-chat-text:after {
                border-width: 5px;
                margin-top: -5px;
            }
        }
    }
</style>