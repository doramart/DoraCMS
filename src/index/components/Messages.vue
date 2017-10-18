<template>
    <PannelBox title="评论" className="content-message">
        <div>
            <el-row :gutter="10">
                <el-col :xs="24" :sm="24" :md="24" :lg="24">
                    <div class="give-message">
                        <el-form :model="msgFormState.formData" :rules="rules" ref="ruleForm" label-width="0px" class="demo-ruleForm">
                            <el-form-item class="send-content" prop="content">
                                <el-input @focus="changeReplyState(false)" type="textarea" :autosize="{ minRows: 2, maxRows: 4}" placeholder="请输入内容" v-model="msgFormState.formData.content">
                                </el-input>
                            </el-form-item>
                            <el-form-item class="send-button">
                                <div class="user-notice">
                                    <div v-if="loginState.logined">
                                        你好,
                                        <span style="color: #409EFF">{{loginState.userInfo.userName}} !</span>
                                    </div>
                                    <div v-else>
                                        <router-link to="/users/login">登录</router-link>&nbsp;后参与评论
                                    </div>
                                </div>
                                <el-button type="primary" round @click="submitForm('ruleForm')">提交评论</el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                </el-col>
            </el-row>
        </div>
        <ul>
            <li v-for="(item,index) in userMessageList" :key="index">
                <el-row>
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
                                <span title="管理员" style="color: #409EFF;font-size: 12px;">[
                                    <i class="el-icon-star-on"></i>&nbsp;管理员]</span>
                            </div>
                            <div class="name" v-else>{{item.author.userName}}</div>
                            <span class="time">{{item.date}}</span>
                            <i @click="replyMsg(item)" class="fa fa-reply"></i>
                        </div>
                        <div class="user-content">
                            <div v-if="item.replyAuthor">
                                <span style="color: #409EFF">{{'@'+item.replyAuthor.userName}}</span>&nbsp; {{item.content}}
                            </div>
                            <div v-else>
                                {{item.content}}
                            </div>
                            <el-collapse-transition>
                                <div class="reply-message" v-if="msgFormState.reply && replyObj._id == item._id">
                                    <el-form :model="msgFormState.formData" :rules="replyRules" ref="replyRuleForm" label-width="0px" class="demo-ruleForm">
                                        <el-form-item class="send-content" prop="replyContent">
                                            <el-input @focus="changeReplyState(true)" :autofocus="true" type="textarea" :autosize="{ minRows: 2, maxRows: 4}" placeholder="请输入内容" v-model="msgFormState.formData.replyContent">
                                            </el-input>
                                        </el-form-item>
                                        <el-form-item class="send-button">
                                            <el-button type="primary" round @click="submitForm('replyRuleForm')" size="small">回复</el-button>
                                        </el-form-item>
                                    </el-form>
                                </div>
                            </el-collapse-transition>
                        </div>
                    </el-col>
                </el-row>
            </li>
        </ul>
    </PannelBox>
</template>
<script>
import {
    mapGetters
} from 'vuex'
import api from '~api'
import _ from 'lodash'
import PannelBox from './PannelBox.vue'
export default {
    name: 'Message',
    data() {
        return {
            replyObj: {},
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
            },
            replyRules: {
                replyContent: [{
                    required: true,
                    message: '请填写回复',
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
    components: {
            PannelBox
    },
    methods: {
        changeReplyState(state) {
            if (!state) this.replyObj = {};
            this.$store.dispatch('global/message/messageform', { reply: state })
        },
        replyMsg(item) {
            this.replyObj = item;
            let currentMsgAuthor = !_.isEmpty(item.author) ? item.author : item.adminAuthor;
            this.$store.dispatch('global/message/messageform', { reply: true, formData: { replyAuthor: currentMsgAuthor._id, relationMsgId: item._id, replyContent: "@" + currentMsgAuthor.userName + " " } })
        },
        submitForm(formName) {
            if (!this.loginState.logined) {
                this.$router.push('/users/login');
            } else {
                let targetForm = this.msgFormState.reply ? this.$refs[formName][0] : this.$refs[formName];
                targetForm.validate((valid) => {
                    if (valid) {
                        let params = this.msgFormState.formData;
                        if (this.msgFormState.formData.replyContent) {
                            let currentMsgAuthor = !_.isEmpty(this.replyObj.author) ? this.replyObj.author : this.replyObj.adminAuthor;
                            let oldContent = this.msgFormState.formData.replyContent;
                            params.content = oldContent.replace("@" + currentMsgAuthor.userName + " ", "");
                        } else {
                            params['replyAuthor'] = '';
                            params['relationMsgId'] = '';
                            params['replyContent'] = '';
                        }
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
                                this.$store.dispatch('global/message/messageform', {
                                    reply: false,
                                    formData: {
                                        content: '',
                                        replyContent: ''
                                    }
                                })

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
            border-top: 1px solid #f0f0f0;
            padding: 24px 0;
            font-size: 15px;
            .user-logo {

                img {
                    width: 100%;
                    border-radius: 50%
                }
            }
            .user-content {
                color: #666666;
                padding-left: 15px;
            }
            .user-name {
                margin: 5px 0 15px 15px;
                color: #409EFF;

                .name {
                    display: inline-block;
                }
                .time {
                    font-size: 11px;
                    display: inline-block;
                    color: #777;
                }
                .fa-reply {
                    float: right;
                    color: #D3DCE6;
                    display: block;
                }
            }
        }
    }
    .give-message {
        padding-top: 15px;
        .el-form-item__content {
            margin-left: 0 !important;
        }
        .user-notice {
            float: left;
            a:link,
            a:visited {
                color: #409EFF
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

    .reply-message {
        margin-top: 15px;
        padding-left: 25px;
        .el-form-item {
            margin-bottom: 20px;
        }
    }
}
</style>