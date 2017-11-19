<template>
    <div class="dr-toolbar">
        <div class="option-button">
            <div v-if="type === 'adminGroup'">
                <el-button size="small" type="primary" plain @click="addRole" round><i class="fa fa-fw fa-plus" aria-hidden="true"></i></el-button>
            </div>
            <div v-else-if="type === 'adminUser'">
                <el-button size="small" type="primary" plain @click="addUser" round><i class="fa fa-fw fa-plus"></i></el-button>
            </div>
            <div v-else-if="type === 'adminResource'">
                <el-button size="small" type="primary" plain @click="addResource" round><i class="fa fa-fw fa-plus" aria-hidden="true"></i></el-button>
            </div>
            <div v-else-if="type === 'content'">
                <el-button size="small" type="primary" plain @click="addContent" round><i class="fa fa-fw fa-plus" aria-hidden="true"></i></el-button>
            </div>
            <div v-else-if="type === 'contentCategory'">
                <el-button size="small" type="primary" plain @click="addTopCates" round><i class="fa fa-fw fa-plus" aria-hidden="true"></i></el-button>
            </div>
            <div v-else-if="type === 'contentMessage'">
                <el-button size="small" type="danger" plain round @click="branchDelete('msg')"><i class="fa fa-fw fa-trash-o"></i></el-button>
            </div>
            <div v-else-if="type === 'contentTag'">
                <el-button size="small" type="primary" plain round @click="addTag"><i class="fa fa-fw fa-plus" aria-hidden="true"></i></el-button>
            </div>
            <div v-else-if="type === 'regUser'">
                <el-button size="small" type="danger" plain round @click="branchDelete('user')"><i class="fa fa-fw fa-trash-o"></i></el-button>
            </div>
            <div v-else-if="type === 'backUpData'">
                <el-button size="small" type="primary" plain round @click="bakUpData" :loading="loadingState"><i class="fa fa-fw fa-cloud-download" aria-hidden="true"></i></el-button>
            </div>
            <div v-else-if="type === 'systemOptionLogs'">
                <el-button size="small" type="danger" plain round @click="branchDelete('systemlogs')"><i class="fa fa-fw fa-trash-o"></i></el-button>
                <el-tooltip class="item" effect="dark" content="清空所有日志" placement="right-start">
                    <el-button size="small" type="warning" plain round @click="clearSystemOptionLogs"><i class="fa fa-fw fa-window-restore"></i></el-button>
                </el-tooltip>
            </div>
            <div v-else-if="type === 'systemNotify'">
                <el-button size="small" type="primary" plain round @click="setHasRead()"><i class="fa fa-fw fa-eye" aria-hidden="true"></i></el-button>
                <el-button size="small" type="danger" plain round @click="branchDelete('systemnotify')"><i class="fa fa-fw fa-trash-o"></i></el-button>
            </div>
            <div v-else-if="type === 'systemAnnounce'">
                <el-button type="primary" size="small" plain round @click="addSysAnnounce"><i class="fa fa-fw fa-plus"></i></el-button>
            </div>
            <div v-else-if="type === 'ads'">
                <el-button type="primary" size="small" plain round @click="addAds"><i class="fa fa-fw fa-plus"></i></el-button>
            </div>
        </div>
        <div class="dr-searchInput">
           <!-- <el-form>
            <el-form-item > -->
            <div v-if="type === 'content'">
                <el-input size="small" placeholder="请输入关键字" v-model="pageInfo.searchkey" suffix-icon="el-icon-search" @keyup.enter.native="searchResult" :on-icon-click="searchResult">
                </el-input>
            </div>
            <div v-else-if="type === 'contentTag'">
                <el-input size="small" placeholder="标签名称" v-model="pageInfo.searchkey" suffix-icon="el-icon-search" @keyup.enter.native="searchResult" :on-icon-click="searchResult">
                </el-input>
            </div>
            <div v-else-if="type === 'contentMessage'">
                <el-input size="small" placeholder="留言内容" v-model="pageInfo.searchkey" suffix-icon="el-icon-search" @keyup.enter.native="searchResult" :on-icon-click="searchResult">
                </el-input>
            </div>
            <div v-else-if="type === 'regUser'">
                <el-input size="small" placeholder="请输入用户名" v-model="pageInfo.searchkey" suffix-icon="el-icon-search" @keyup.enter.native="searchResult" :on-icon-click="searchResult">
                </el-input>
            </div>
            <div v-else-if="type === 'systemOptionLogs'">
                <el-select size="small" v-model="targetSysLogType" placeholder="请选择日志类别" @change="selectSysLogType">
                    <el-option v-for="item in systemModelTypes" :key="item.value" :label="item.label" :value="item.value">
                    </el-option>
                </el-select>
            </div>
            <!-- </el-form-item>
        </el-form> -->
        </div>
    </div>
</template>
<script>
import services from "../../store/services.js";
import _ from "lodash";
export default {
  props: {
    pageInfo: Object,
    type: String,
    ids: Array
  },
  data() {
    return {
      systemModelTypes: [
        {
          value: "all",
          label: "全部"
        },
        {
          value: "h5-exception",
          label: "h5异常"
        },
        {
          value: "node-exception",
          label: "nodejs异常"
        },
        {
          value: "login",
          label: "系统登录"
        }
      ],
      targetSysLogType: "all",
      loadingState: false,
      formState: {
        show: false
      },
      searchkey: ""
    };
  },
  methods: {
    selectSysLogType(type) {
      this.targetSysLogType = type;
      if (type == "all") {
        this.$store.dispatch("getSystemLogsList");
      } else {
        this.$store.dispatch("getSystemLogsList", { type });
      }
    },
    searchResult(ev) {
      let searchkey = this.pageInfo.searchkey;
      if (this.type == "content") {
        this.$store.dispatch("getContentList", {
          searchkey
        });
      } else if (this.type == "contentTag") {
        this.$store.dispatch("getContentTagList", {
          searchkey
        });
      } else if (this.type == "contentMessage") {
        this.$store.dispatch("getContentMessageList", {
          searchkey
        });
      } else if (this.type == "regUser") {
        this.$store.dispatch("getRegUserList", {
          searchkey
        });
      }
    },
    addUser() {
      this.$store.dispatch("showAdminUserForm");
    },
    addRole() {
      this.$store.dispatch("showAdminGroupForm");
    },
    addResource() {
      this.$store.dispatch("showAdminResourceForm", {
        type: "root",
        formData: {
          parentId: "0"
        }
      });
    },
    addContent() {
      this.$store.dispatch("showContentForm");
      this.$router.push("/addContent");
    },
    addAds() {
      this.$store.dispatch("adsInfoForm", {
        edit: false,
        formData: {}
      });
      this.$router.push("/addAds");
    },
    addSysAnnounce() {
      this.$store.dispatch("showContentForm");
      this.$router.push("/addSysAnnounce");
    },
    addTopCates() {
      this.$store.dispatch("showContentCategoryForm", {
        type: "root",
        formData: {
          parentId: "0"
        }
      });
    },
    clearSystemOptionLogs() {
      this.$confirm(`此操作将清空所有日志, 是否继续?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          return services.clearSystemOptionLogs();
        })
        .then(result => {
          if (result.data.state === "success") {
            this.$store.dispatch("getSystemLogsList");
            this.$message({
              message: `清空日志成功`,
              type: "success"
            });
          } else {
            this.$message.error(result.data.message);
          }
        })
        .catch(err => {
          this.$message({
            type: "info",
            message: "已取消删除"
          });
        });
    },
    branchDelete(target) {
      let _this = this,
        targetName;
      if (target === "msg") {
        targetName = "留言";
      } else if (target === "user") {
        targetName = "用户";
      } else if (target === "systemlogs") {
        targetName = "系统操作日志";
      } else if (target === "systemnotify") {
        targetName = "系统消息";
      }
      if (_.isEmpty(_this.ids)) {
        this.$message({
          type: "info",
          message: "请选择指定目标！"
        });
        return false;
      }
      this.$confirm(`此操作将永久删除这些${targetName}, 是否继续?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          let ids = _this.ids.join();
          if (target === "msg") {
            return services.deleteContentMessage({
              ids
            });
          } else if (target === "user") {
            return services.deleteRegUser({
              ids
            });
          } else if (target === "systemlogs") {
            return services.deleteSystemOptionLogs({
              ids
            });
          } else if (target === "systemnotify") {
            return services.deleteSystemNotify({
              ids
            });
          }
        })
        .then(result => {
          if (result.data.state === "success") {
            if (target === "msg") {
              this.$store.dispatch("getContentMessageList");
            } else if (target === "user") {
              this.$store.dispatch("getRegUserList");
            } else if (target === "systemlogs") {
              this.$store.dispatch("getSystemLogsList");
            } else if (target === "systemnotify") {
              this.$store.dispatch("getSystemNotifyList");
            }
            this.$message({
              message: `${targetName}删除成功`,
              type: "success"
            });
          } else {
            this.$message.error(result.data.message);
          }
        })
        .catch(err => {
          this.$message({
            type: "info",
            message: "已取消删除"
          });
        });
    },
    addTag() {
      this.$store.dispatch("showContentTagForm");
    },
    delUser() {
      // this.$store.dispatch('showAdminUserForm')
    },
    bakUpData() {
      this.$confirm(`您即将执行数据备份操作, 是否继续?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.loadingState = true;
          return services.bakUpData();
        })
        .then(result => {
          if (result.data.state === "success") {
            this.loadingState = false;
            this.$store.dispatch("getBakDateList");
            this.$message({
              message: `数据备份成功`,
              type: "success"
            });
          } else {
            this.$message.error(result.data.message);
          }
        })
        .catch(err => {
          this.$message({
            type: "info",
            message: "数据备份失败:" + err
          });
        });
    },
    setHasRead() {
      if (_.isEmpty(this.ids)) {
        this.$message({
          type: "info",
          message: "请选择指定目标！"
        });
        return false;
      }
      let ids = this.ids.join();
      services.setNoticeRead({ ids }).then(result => {
        if (result.data.state === "success") {
          this.$store.dispatch("getSystemNotifyList");
          let oldNoticeCounts = this.$store.getters.loginState.noticeCounts;
          this.$store.dispatch("loginState", {
            noticeCounts: oldNoticeCounts - this.ids.length
          });
        } else {
          this.$message.error(result.data.message);
        }
      });
    }
  },
  components: {}
};
</script>
<style lang="scss">
.option-button {
  display: inline-block;
}
</style>
