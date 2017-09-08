<template>
    <div class="content-message">
        <h3 class="pannel-title">
            <span>评论</span>
        </h3>
        <div>
            <el-row :gutter="10">
                <el-col :xs="24" :sm="24" :md="24" :lg="24">
                    <div class="give-message">
                        <el-form :model="msgFormState.formData" :rules="rules" ref="ruleForm" label-width="0px" class="demo-ruleForm">
                            <el-form-item class="send-content" prop="content">
                                <el-input type="textarea" :autosize="{ minRows: 2, maxRows: 4}" placeholder="请输入内容" v-model="msgFormState.formData.content">
                                </el-input>
                            </el-form-item>
                            <el-form-item class="send-button">
                                <div class="user-notice">
                                    <div v-if="loginState.logined">
                                        你好,
                                        <span style="color: #20A0FF">{{loginState.userInfo.userName}} !</span>
                                    </div>
                                    <div v-else>
                                        <router-link to="/users/login">登录</router-link>&nbsp;后参与评论
                                    </div>
                                </div>
                                <el-button type="primary" @click="submitForm('ruleForm')" size="small">提交评论</el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                </el-col>
            </el-row>
        </div>
        <ul>
            <li v-for="(item,index) in userMessageList" :key="index">
                <el-row :gutter="15">
                    <el-col :xs="3" :sm="3" :md="2" :lg="1">
                        <div class="user-logo">
                            <div v-if="item.utype == '1'">
                                <img :src="item.adminAuthor.logo" />
                            </div>
                            <div v-else>
                                <img :src="item.author.logo" />
                            </div>
                        </div>
                    </el-col>
                    <el-col :xs="21" :sm="21" :md="22" :lg="23">
                        <div class="user-name">
                            <div class="name" v-if="item.utype == '1'">
                                {{item.adminAuthor.userName}}
                                <span title="管理员" style="color: #20A0FF;font-size: 12px;">[
                                    <i class="el-icon-star-on"></i>&nbsp;管理员]</span>
                            </div>
                            <div class="name" v-else>{{item.author.userName}}</div>
                            <span class="time">{{item.date}}</span>
                        </div>
                        <div class="user-content">
                            <div v-if="item.replyAuthor">
                                <span style="color: #20A0FF">{{'@'+item.replyAuthor.userName}}</span>&nbsp; {{item.content}}
                            </div>
                            <div v-else>
                                {{item.content}}
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </li>
        </ul>
    </div>
</template>
<script>
import {
    mapGetters
} from 'vuex'
import api from '~api'
export default {
    name: 'Message',
    data() {
        return {
            rules: {
                content: [{
                    required: true,
                    message: '请填写评论',
                    trigger: 'blur'
                }, {
                    min: 5,
                    max: 200,
                    message: '请输入5-200个字符',
                    trigger: 'blur'
                }]
            }
        }
    },
    props: {
        userMessageList: Array,
        contentId: String
    },
    computed: {
        ...mapGetters({
            msgFormState: 'global/message/getMessageForm',
            loginState: 'frontend/user/getSessionState'
        })
    },
    methods: {
        submitForm(formName) {
            if (!this.loginState.logined) {
                this.$router.push('/users/login');
            } else {
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        console.log('---formdatas--', this.msgFormState);
                        if (this.msgFormState.reply) {

                        } else {

                        }
                        let params = this.msgFormState.formData;
                        params.contentId = this.contentId;
                        api.post('message/post', params).then((result) => {
                            if (result.data.state === 'success') {
                                this.$store.dispatch('global/message/getUserMessageList', {
                                    contentId: this.contentId
                                })
                                this.$message({
                                    message: '发布成功',
                                    type: 'success'
                                });
                                this.msgFormState.formData.content = '';
                            } else {
                                this.$message({
                                    message: result.data.message,
                                    type: 'error'
                                });
                            }
                        }).catch((err) => {
                            this.$message.error(err.response.data.error)
                        })
                    } else {
                        console.log('error submit!!');
                        return false;
                    }
                });
            }
        }
    }

}
</script>

<style lang="scss">
.content-message {

    ul {
        li {
            margin: 15px 0;
            border-top: 1px dashed #e8e8e8;
            padding-top: 15px;
            font-size: 14px;
            .user-logo {

                img {
                    width: 100%;
                    border-radius: 50%
                }
            }
            .user-content {
                color: #666666;
            }
            .user-name {
                margin: 0 0 5px 0;
                color: #20A0FF;

                .name {
                    display: inline-block;
                }
                .time {
                    font-size: 11px;
                    display: inline-block;
                    color: #777;
                }
            }
        }
    }
    .give-message {
        .el-form-item__content {
            margin-left: 0 !important;
        }
        .user-notice {
            float: left;
            a:link,
            a:visited {
                color: #20A0FF
            }
        }
        .send-content {
            margin-bottom: 10px;
        }
        .send-button {
            margin-top: 5px;
            text-align: right;
        }
    }
}
</style>