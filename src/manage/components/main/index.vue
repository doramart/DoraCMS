<template>
    <div class="admin-main">
        <el-dialog width="55%" size="small" title="我的权限" :visible.sync="resourceShow" :close-on-click-modal="false">
          <ResourceView :resource="newSourceData" />
        </el-dialog>
        <el-row :gutter="15">
            <el-col :span="8">
                <div class="user-basic-info">
                    <el-card class="box-card pannel-box" v-if="loginState && loginState.userInfo">
                        <div class="box-body">
                            <div class="logo-pannel">
                                <el-row :gutter="10">
                                    <el-col :xs="8" :sm="8" :md="8" :lg="8" :xl="8">
                                        <div class="logo">
                                            <img :src="loginState.userInfo.logo" />
                                        </div>
                                    </el-col>
                                    <el-col :xs="16" :sm="16" :md="16" :lg="16" :xl="16">
                                        <div class="name">
                                            <h3> {{loginState.userInfo.userName}}</h3>
                                            <span>{{loginState.userInfo.group.name}}</span>
                                        </div>
                                    </el-col>
                                </el-row>
                            </div>
                            <div class="info-pannel">
                                <ul>
                                    <li><label>{{$t('main.lastLoginTime')}}：</label>{{renderLogs.ip}}</li>
                                    <li><label>{{$t('main.lastLoginIp')}}：</label>{{renderLogs.date}}</li>
                                    <li><label>{{$t('main.myPower')}}：</label><el-button size="mini" type="text" @click="showMyResource">{{$t('main.seeDetails')}}</el-button></li>
                                </ul>
                            </div>
                            <div style="clear:both;"></div>
                        </div>
                    </el-card>
                </div>
            </el-col>
            <el-col :span="16">
                <div class="data-statistics">
                    <el-row :gutter="10">
                        <el-col :xs="6" :sm="6" :md="6" :lg="6" :xl="6">
                            <StaticPannel icon="fa-user" :num="basicInfo.adminUserCount" type="primary" :text="$t('main.adminUserTotalNum')"/>
                        </el-col>
                        <el-col :xs="6" :sm="6" :md="6" :lg="6" :xl="6">
                            <StaticPannel icon="fa-users" :num="basicInfo.regUserCount" type="success" :text="$t('main.regUserTotalNum')"/>
                        </el-col>
                        <el-col :xs="6" :sm="6" :md="6" :lg="6" :xl="6">
                            <StaticPannel icon="fa-file-text-o" :num="basicInfo.contentCount" type="warning" :text="$t('main.contentsTotalNum')"/>
                        </el-col>
                        <el-col :xs="6" :sm="6" :md="6" :lg="6" :xl="6">
                            <StaticPannel icon="fa-comments-o" :num="basicInfo.messageCount" type="danger" :text="$t('main.messagesTotalNum')"/>
                        </el-col>
                    </el-row>
                </div>
                <div class="grid-content bg-purple">
                    <el-card class="box-card pannel-box">
                        <div slot="header" class="clearfix">
                            <span>{{$t('main.shortcutOption')}}</span>
                        </div>
                        <div class="box-body">
                            <ul class="row quick-opt">
                                <li>
                                    <el-button size="small" type="primary" plain round @click="getToPage('adminUser')">
                                        <i class="fa fa-fw fa-user"></i> {{$t('main.addAdminUser')}}</el-button>
                                </li>
                                <li>
                                    <el-button size="small" type="success" plain round @click="getToPage('addContent')">
                                        <i class="fa fa-fw fa-file-text-o"></i> {{$t('main.addContents')}}</el-button>
                                </li>
                                <li>
                                    <el-button size="small" type="info" plain round @click="getToPage('adminResource')">
                                        <i class="fa fa-fw fa-th-list"></i> {{$t('main.sourceManage')}}</el-button>
                                </li>
                                <li>
                                    <el-button size="small" type="warning" plain round @click="getToPage('systemConfig')">
                                        <i class="fa fa-fw fa-cog"></i> {{$t('main.systemConfigs')}}</el-button>
                                </li>
                                <li>
                                    <el-button size="small" type="danger" plain round @click="getToPage('backUpData')">
                                        <i class="fa fa-fw fa-database"></i> {{$t('main.databak')}}</el-button>
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
                            <span>{{$t('main.nearMessages')}}</span>
                        </div>
                        <div class="box-body">
                            <div class="row user-messages">
                                <div v-if="basicInfo.messages && basicInfo.messages.length > 0">
                                    <div class="direct-chat-msg" v-for="msg in basicInfo.messages" :key="msg._id">
                                        <div class="direct-chat-info clearfix">
                                            <span class="direct-chat-name pull-left">
                                                <a href="#">{{msg.utype =='0'?msg.author.userName:msg.adminAuthor.userName}}</a>
                                                {{$t('main.messageIn')}}
                                                <a class="direct-chat-contentTitle" :href="'/details/'+msg.contentId._id+'.html'" target="_blank">{{msg.contentId.stitle | cutWords(25)}}</a> {{msg.utype =='0'?$t('main.messageSaid'):$t('main.messageReply')}}
                                                <a href="#">{{msg.utype =='1'?(msg.replyAuthor ? msg.replyAuthor.userName : (msg.adminReplyAuthor ? msg.adminReplyAuthor.userName : '')) : ''}}</a>
                                            </span>
                                            <span class="direct-chat-timestamp pull-right">
                                                <i class="fa fa-clock-o"></i>
                                                <span>{{msg.date}}</span>
                                            </span>
                                        </div>
                                        <img alt="message user image" :src="msg.utype =='0'?msg.author.logo:msg.adminAuthor.logo" class="direct-chat-img">
                                        <div class="direct-chat-text" v-html="msg.content"></div>
                                    </div>
                                </div>
                                <div v-else>{{$t('main.noMessages')}}</div>
                            </div>
                        </div>
                    </el-card>
                </div>
            </el-col>
            <el-col :span="12">
                <div class="grid-content bg-purple">
                    <el-card class="box-card pannel-box">
                        <div slot="header" class="clearfix">
                            <span>{{$t('main.nearNewUsers')}}</span>
                        </div>
                        <div class="box-body">
                            <ul class="row user-list">
                                <div v-if="basicInfo.regUsers && basicInfo.regUsers.length > 0">
                                    <li v-for="user in basicInfo.regUsers" :key="user._id">
                                        <img :src="user.logo" :alt="user.userName" :title="user.userName" />
                                        <span>{{user.userName | cutWords(8)}}</span>
                                    </li>
                                </div>
                                <div v-else>{{$t('main.noMessages')}}</div>
                            </ul>
                        </div>
                    </el-card>
                </div>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import StaticPannel from "../common/StaticPannel.vue";
import ResourceView from "./resourceView.vue";
import { renderTreeData } from "../../store/actions";
export default {
  name: "admin-main",
  data() {
    return {
      resourceShow: false
    };
  },
  components: {
    StaticPannel,
    ResourceView
  },
  methods: {
    showMyResource() {
      this.resourceShow = true;
    },
    getToPage(targetPage) {
      this.$router.push(targetPage);
    }
  },
  computed: {
    ...mapGetters(["basicInfo", "loginState"]),
    newSourceData() {
      return renderTreeData({ docs: this.basicInfo.resources });
    },
    renderLogs() {
      let logs = {
        ip: "127.0.0.1",
        date: "1970-01-01 00:00:00"
      };
      if (this.basicInfo.loginLogs && this.basicInfo.loginLogs[0]) {
        logs = {
          ip: this.basicInfo.loginLogs[0].date,
          date: this.basicInfo.loginLogs[0].logs.split(":")[1]
        };
      }
      return logs;
    }
  },
  mounted() {
    this.$store.dispatch("getSiteBasicInfo");
  }
};
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
  clear: both;
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
      color: #5a5e66;
      line-height: 25px;
      span {
        color: #409eff;
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
      color: #409eff;
    }
    .direct-chat-contentTitle {
      font-size: 12px;
    }
    .direct-chat-contentTitle:link,
    .direct-chat-contentTitle:visited {
      color: #878d99;
      font-style: italic;
    }
    .direct-chat-info {
      margin-bottom: 3px;
    }
    .direct-chat-timestamp {
      color: #b4bccc;
      font-size: 12px;
    }
    .direct-chat-img {
      border-radius: 50%;
      width: 35px;
      height: 35px;
      float: left;
    }
    .direct-chat-text {
      border-radius: 5px;
      position: relative;
      padding: 5px 10px;
      margin: 5px 0 0 50px;
      color: #5a5e66;
      background-color: #edf2fc;
      font-size: 13px;
    }
    .direct-chat-text:after,
    .direct-chat-text:before {
      position: absolute;
      right: 100%;
      top: 15px;
      border: solid transparent;
      border-right-color: #edf2fc;
      content: " ";
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

.data-statistics {
  margin-bottom: 8px;
}

.user-basic-info {
  .logo-pannel {
    border-bottom: 1px solid #edf2fc;
    padding-bottom: 12px;
    .logo {
      float: left;
      width: 100%;
      img {
        width: 50%;
        max-width: 60px;
        height: auto;
        border-radius: 50%;
      }
    }
    .name {
      float: right;
      width: 100%;
      h3 {
        font-size: 1.6em;
        color: #409eff;
        margin-top: 0.4rem;
        margin-bottom: 0.2rem;
      }
      span {
        color: #878d99;
        font-size: 13px;
      }
    }
  }
  .info-pannel {
    padding-top: 12px;
    ul {
      li {
        line-height: 25px;
        color: #5a5e66;
        font-size: 12px;
        label {
          display: inline-block;
          width: 33%;
          margin-right: 20px;
        }
        .el-button--text {
          padding: 0;
        }
      }
    }
  }
}
</style>