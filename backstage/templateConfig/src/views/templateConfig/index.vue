<template>
  <div :class="classObj" class="templateConfig">
    <div class="main-container">
      <BuyTipsForm
        :taskId="checkPaymentStateTask"
        :buyTipsDialogState="buyTipsDialogState"
      ></BuyTipsForm>
      <el-row class="dr-datatable">
        <el-col
          :span="24"
          v-loading="loadingPage"
          element-loading-text="模板上传中，请勿切换页面！"
          element-loading-spinner="el-icon-loading"
          element-loading-background="rgba(0, 0, 0, 0.8)"
        >
          <ConfigForm
            :dialogState="formState"
            :forderlist="templateItemForderList"
          ></ConfigForm>
          <div class="temp-dashboard">
            <el-row :gutter="20">
              <template>
                <el-tabs v-model="activeName" @tab-click="handleClick">
                  <el-tab-pane label="模板配置" name="tempConfig">
                    <el-row :gutter="20">
                      <el-col :xs="24" :md="12">
                        <div class="mytheme">
                          <el-row :gutter="20">
                            <el-col :xs="24" :md="10">
                              <div class="theme-image">
                                <img :src="currentTheme.sImg" />
                              </div>
                            </el-col>
                            <el-col :xs="24" :md="14">
                              <div class="theme-info">
                                <ul>
                                  <li>
                                    <label>名称:</label>
                                    {{ currentTheme.name }}&nbsp;
                                    <el-tag type="success" size="mini"
                                      >当前主题</el-tag
                                    >
                                  </li>
                                  <li>
                                    <label>作者:</label>
                                    {{ currentTheme.author }}
                                  </li>
                                  <li>
                                    <label>适用版本:</label>
                                    <el-tag
                                      type="info"
                                      size="mini"
                                      v-for="versionItem in currentTheme.version"
                                      style="marginRight:10px;"
                                      :key="versionItem"
                                      >{{ versionItem }}</el-tag
                                    >
                                  </li>
                                  <li>
                                    <label>介绍:</label>
                                    {{ currentTheme.comment }}
                                  </li>
                                </ul>
                              </div>
                            </el-col>
                          </el-row>
                        </div>
                      </el-col>
                      <el-col :xs="24" :md="12">
                        <div class="grid-content bg-purple">
                          <el-button
                            size="mini"
                            type="primary"
                            icon="el-icon-plus"
                            @click="addNewTemp"
                            >模板配置</el-button
                          >
                          <el-table
                            :data="currentTheme.items"
                            style="width: 100%"
                          >
                            <el-table-column
                              prop="name"
                              label="标题"
                              width="180"
                            ></el-table-column>
                            <el-table-column
                              prop="forder"
                              label="关键字"
                              width="180"
                            ></el-table-column>
                            <el-table-column
                              prop="comment"
                              label="备注"
                            ></el-table-column>
                            <el-table-column
                              :label="$t('main.dataTableOptions')"
                              width="150"
                              fixed="right"
                            >
                              <template slot-scope="scope">
                                <span v-if="!scope.row.isDefault">
                                  <el-button
                                    size="mini"
                                    type="danger"
                                    plain
                                    icon="el-icon-delete"
                                    @click="
                                      deleteTemplateItem(
                                        scope.$index,
                                        currentTheme.items
                                      )
                                    "
                                  ></el-button>
                                </span>
                              </template>
                            </el-table-column>
                          </el-table>
                        </div>
                      </el-col>
                    </el-row>
                    <h2 class="line-gate">可用模板</h2>
                    <el-row :gutter="20">
                      <el-col
                        :xs="12"
                        :sm="8"
                        :md="4"
                        v-for="item in renderMyThemes"
                        :key="item._id"
                      >
                        <div class="myTemplist">
                          <div
                            v-if="item.shoudUpdate"
                            @click="askVipLogin(item, 'update')"
                            style="cursor: pointer;"
                          >
                            <UpdateCorner
                              style="position: absolute; top: 5px; border: 0; right: 5px;"
                            />
                          </div>
                          <img :src="item.sImg" />
                        </div>
                        <div class="theme-info temp-info">
                          <ul>
                            <li>{{ item.name }}</li>
                            <li>
                              <label>作者:</label>
                              {{ item.author }}
                            </li>
                            <li>
                              <label>适用版本:</label>
                              <el-tag
                                type="info"
                                size="mini"
                                v-for="versionItem in item.version"
                                style="marginRight:10px;"
                                :key="versionItem"
                                >{{ versionItem }}</el-tag
                              >
                            </li>
                            <li class="opt" v-if="!item.using">
                              <el-button
                                size="mini"
                                @click="askVipLogin(item, 'enable')"
                                >启用</el-button
                              >
                              <el-button
                                size="mini"
                                type="danger"
                                @click="askVipLogin(item, 'uninstall')"
                                >卸载</el-button
                              >
                            </li>
                          </ul>
                        </div>
                      </el-col>
                    </el-row>
                  </el-tab-pane>
                  <el-tab-pane label="模板市场" name="tempShop">
                    <el-row :gutter="20">
                      <el-col
                        :xs="24"
                        :md="4"
                        v-for="item in tempShoplist.docs"
                        :key="item._id"
                      >
                        <div class="myTemplist">
                          <img :src="item.sImg" />
                        </div>
                        <div class="theme-info temp-info">
                          <ul>
                            <li>
                              <label>名称:</label>
                              {{ item.name }}
                            </li>
                            <li>
                              <label>作者:</label>
                              {{ item.author }}
                            </li>
                            <li>
                              <label>适用版本:</label>
                              <el-tag
                                type="info"
                                size="mini"
                                v-for="versionItem in item.version"
                                style="marginRight:10px;"
                                :key="versionItem"
                                >{{ versionItem }}</el-tag
                              >
                            </li>
                            <li>
                              <label>摘要:</label>
                              {{ item.comment }}
                            </li>
                            <li>
                              <label>价格:</label>
                              <span
                                v-if="item.amount && Number(item.amount) > 0"
                                style="color:red"
                              >
                                ￥ {{ item.amount }}&nbsp;
                                <span
                                  class="price-help"
                                  @click="showPriceHelp(item)"
                                >
                                  <svg-icon icon-class="icon_help" />
                                </span>
                              </span>
                              <span style="color:#67C23A" v-else>免费</span>
                            </li>
                            <li class="opt">
                              <el-button
                                size="mini"
                                type="primary"
                                @click="askVipLogin(item, 'install')"
                              >
                                <svg-icon
                                  v-if="item.amount && Number(item.amount) > 0"
                                  icon-class="icon_alipay"
                                />&nbsp;安装
                              </el-button>
                              <el-button
                                size="mini"
                                :disabled="!item.preview"
                                @click="previewTemp(item.preview)"
                                >预览</el-button
                              >
                            </li>
                          </ul>
                        </div>
                      </el-col>
                    </el-row>
                    <!-- <Pagination :device="device" :pageInfo="tempShoplist.pageInfo" pageType="tempShop"></Pagination> -->
                  </el-tab-pane>
                  <el-tab-pane label="模板导入" name="tempImport">
                    <el-row>
                      <el-upload
                        class="upload-demo"
                        action="/manage/template/uploadCMSTemplate"
                        :on-preview="handlePreview"
                        :on-remove="handleRemove"
                        :before-upload="beforeUpload"
                        :before-remove="beforeRemove"
                        :on-success="uploadSuccess"
                        multiple
                        :limit="1"
                        accept=".zip"
                        :on-exceed="handleExceed"
                        :file-list="fileList"
                      >
                        <el-button size="small" type="primary"
                          >点击上传</el-button
                        >
                        <div slot="tip" class="el-upload__tip">
                          只能上传zip文件，且不超过5MB
                        </div>
                      </el-upload>
                    </el-row>
                    <hr style="margin:20px 0;" />
                    <el-row>
                      <el-link
                        href="http://cdn.html-js.cn/cms/templates/2.1.7/tempdemo.zip"
                        target="_blank"
                      >
                        <i class="el-icon-s-cooperation"></i>下载示例模板
                      </el-link>
                    </el-row>
                  </el-tab-pane>
                </el-tabs>
              </template>
            </el-row>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import UpdateCorner from "./updateCorner";
import ConfigForm from "./configForm";
import BuyTipsForm from "./buyTipsForm";
import { getToken } from "@root/publicMethods/auth";
import { mapGetters, mapActions } from "vuex";
import {
  delTemplateItem,
  uninstallTemp,
  enableTemp,
  installTemp,
  updateTemp,
  createInvoice,
  checkInvoice,
} from "@/api/templateConfig";

import { initEvent } from "@root/publicMethods/events";
import _ from "lodash";
export default {
  name: "index",
  data() {
    return {
      checkPaymentStateTask: "",
      sidebarOpened: true,
      device: "desktop",
      fileList: [],
      loadingObj: "",
      loadingPage: false,
      buyTipsDialogState: {
        show: false,
        info: {},
        buyQr: "",
      },
      activeName: "tempConfig",
    };
  },
  components: {
    ConfigForm,
    BuyTipsForm,
    UpdateCorner,
    // Pagination
  },
  methods: {
    previewTemp(previewlink) {
      window.open(previewlink);
    },
    showPriceHelp(item) {
      this.$alert(item.buy_tips, "提示", {
        dangerouslyUseHTMLString: true,
      });
    },
    hideTips() {
      if (this.buyTipsDialogState.show) {
        this.buyTipsDialogState.show = false;
      }
    },
    showBuyTips(item) {
      this.buyTipsDialogState.show = true;
      createInvoice({
        tempId: item._id,
        singleUserToken: getToken("1"),
      })
        .then((result) => {
          if (result.status === 200) {
            let qrlink = result.data.qrCode;
            let noInvoice = result.data.noInvoice;
            this.buyTipsDialogState.buyQr = `/api/createQRCode?text=${encodeURIComponent(
              qrlink
            )}`;
            this.buyTipsDialogState.info = item;
            this.checkPaymentStateTask = setInterval(() => {
              this.checkTradeState(item, noInvoice);
            }, 5000);
          } else {
            this.hideTips();
            this.$message.error(result.message);
          }
        })
        .catch(() => {
          this.hideTips();
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info"),
          });
        });
    },
    checkTradeState(item, noInvoice) {
      let _this = this;
      checkInvoice({
        noInvoice: noInvoice,
        singleUserToken: getToken("1"),
        itemId: item._id,
      }).then((result) => {
        if (result.status === 200 && result.data.checkState) {
          clearInterval(this.checkPaymentStateTask);
          _this.hideTips();
          _this.installTempOption(item._id, "install");
        }
      });
    },
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePreview(file) {
      console.log(file);
    },
    beforeUpload(file) {
      this.loadingPage = true;
      const isZIP =
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed";
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isZIP) {
        this.loadingPage = false;
        this.$message.error(this.$t("validate.limitUploadFileType"));
      }
      if (!isLt5M) {
        this.loadingPage = false;
        this.$message.error(
          this.$t("validate.limitUploadFileSize", { size: 5 })
        );
      }
      return isZIP && isLt5M;
    },
    handleExceed(files, fileList) {
      this.$message.warning(
        `当前限制选择 1 个文件，本次选择了 ${
          files.length
        } 个文件，共选择了 ${files.length + fileList.length} 个文件`
      );
    },
    uploadSuccess(res, file) {
      // console.log("---", res);
      this.loadingPage = false;
      this.$store.dispatch("templateConfig/getMyTemplateList");
      if (res.status == 200) {
        this.$message({
          message: "模板导入成功",
          type: "success",
        });
      } else {
        this.$message.error(res.message);
      }
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`确定移除 ${file.name}？`);
    },
    handleClick(tab, event) {
      console.log(tab, event);
    },
    askVipLogin(item, action) {
      let cmsVersion = this.$root.appVersion;
      // let currentVersion = cmsVersion.split(".").join("");

      if (action == "update") {
        let currentItem = _.filter(this.tempShoplist.docs, (temp) => {
          return (temp.alias = item.alias);
        });
        if (!_.isEmpty(currentItem) && currentItem.length == 1) {
          item.amount = currentItem[0].amount;
          item.hadPayed = currentItem[0].hadPayed;
        }
      }
      // 安装或启用时校验版本
      if (action == "install" || action == "update" || action == "enable") {
        if (item.version.indexOf(cmsVersion) < 0) {
          this.$message({
            message: "该模板和当前系统版本不匹配，请确认后再试！",
            type: "warning",
          });
          return;
        }
      }
      // console.log("--item--", item);
      // 非免费安装或更新需要登录VIP
      if ((action == "install" || action == "update") && item.amount != "0") {
        if (!getToken("1")) {
          this.$root.eventBus.$emit("toggleVipLogin", {
            item,
            action,
          });
        } else {
          if (item.hadPayed) {
            this.installTempOption(item._id, action);
          } else {
            this.showBuyTips(item);
          }
        }
      } else {
        this.installTempOption(item._id, action);
      }
    },
    installTempOption(tempId, option) {
      let askTips = "";
      if (option == "install") {
        askTips = this.$t("templateConfig.ask_ifinstall");
      } else if (option == "update") {
        askTips = this.$t("templateConfig.ask_ifupdate");
      } else if (option == "enable") {
        askTips = this.$t("templateConfig.ask_ifenable");
      } else if (option == "uninstall") {
        askTips = this.$t("templateConfig.ask_ifuninstall");
      }
      this.$confirm(askTips, this.$t("main.scr_modal_title"), {
        confirmButtonText: this.$t("main.confirmBtnText"),
        cancelButtonText: this.$t("main.cancelBtnText"),
        type: "warning",
      })
        .then(() => {
          this.loadingObj = this.$loading({
            lock: true,
            text: "处理中，请勿手动刷新页面...",
            spinner: "el-icon-loading",
            background: "rgba(0, 0, 0, 0.7)",
          });
          if (option == "install") {
            return installTemp({
              tempId: tempId,
              singleUserToken: getToken("1"),
            });
          } else if (option == "update") {
            return updateTemp({
              localTempId: tempId,
              singleUserToken: getToken("1"),
            });
          } else if (option == "enable") {
            return enableTemp({
              tempId: tempId,
            });
          } else if (option == "uninstall") {
            return uninstallTemp({
              tempId: tempId,
            });
          }
        })
        .then((result) => {
          this.loadingObj.close();
          if (result.status === 200) {
            this.$store.dispatch("templateConfig/getMyTemplateList");
            this.$store.dispatch("templateConfig/getTemplateItemForderList");
            this.$message({
              message: this.$t("main.updateSuccess"),
              type: "success",
            });
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: this.$t("templateConfig.install_failed"),
          });
        });
    },
    deleteTemplateItem(index, rows) {
      this.$confirm(
        this.$t("main.del_notice"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning",
        }
      )
        .then(() => {
          return delTemplateItem({
            ids: rows[index]._id,
          });
        })
        .then((result) => {
          if (result.status === 200) {
            this.$store.dispatch("templateConfig/getMyTemplateList");
            this.$message({
              message: this.$t("main.scr_modal_del_succes_info"),
              type: "success",
            });
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info"),
          });
        });
    },
    addNewTemp() {
      this.$store.dispatch("templateConfig/showTemplateConfigForm");
    },
  },
  computed: {
    ...mapGetters([
      "templateConfigList",
      "templateItemForderList",
      "tempShoplist",
    ]),
    formState() {
      return this.$store.getters.templateConfigFormState;
    },
    currentTheme() {
      let myThemes = this.templateConfigList;
      let currentlist = _.filter(myThemes, (doc) => {
        return doc.using;
      });
      return currentlist && currentlist.length > 0 ? currentlist[0] : [];
    },
    classObj() {
      return {
        hideSidebar: !this.sidebarOpened,
        openSidebar: this.sidebarOpened,
        withoutAnimation: "false",
        mobile: this.device === "mobile",
      };
    },
    renderMyThemes() {
      let myThemes = this.templateConfigList;
      let shopThemes = this.tempShoplist.docs;
      if (!_.isEmpty(myThemes) && !_.isEmpty(shopThemes)) {
        for (const themeItem of myThemes) {
          let compareShop = _.filter(shopThemes, (t) => {
            return t.alias == themeItem.alias;
          });
          if (!_.isEmpty(compareShop)) {
            let oldVersion = themeItem.version[themeItem.version.length - 1];
            let shopVersion =
              compareShop[0].version[compareShop[0].version.length - 1];
            if (oldVersion && shopVersion) {
              if (
                Number(oldVersion.split(".").join("")) <
                Number(shopVersion.split(".").join(""))
              ) {
                themeItem.shoudUpdate = true;
              }
            }
          }
        }
      }
      console.log("--myThemes--", myThemes);
      return myThemes;
    },
  },
  mounted() {
    initEvent(this);
    this.$store.dispatch("templateConfig/getMyTemplateList");
    this.$store.dispatch("templateConfig/getTemplateItemForderList");
    this.$store.dispatch("templateConfig/getTempsFromShop", {
      singleUserToken: getToken("1"),
    });
    // 监听是否登录成功
    this.$root.eventBus.$on("notifyVipLoginSuccess", (messageInfo) => {
      if (messageInfo && messageInfo.action == "install") {
        this.$store.dispatch("templateConfig/getTempsFromShop", {
          singleUserToken: getToken("1"),
        });
      }
    });
  },
};
</script>

<style lang="scss">
.temp-dashboard {
  padding: 15px;
  .mytheme {
    padding: 15px 0;
    .theme-image {
      height: 200px;
      border-radius: 4px;
      border: 1px solid #ebeef5;
      background-color: #fff;
      overflow: hidden;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      img {
        width: 100%;
        height: 100%;
      }
    }
  }

  .theme-info {
    font-size: 14px;
    ul {
      margin: 0;
      padding: 0;
      li {
        list-style-type: none;
        line-height: 30px;
        color: #606266;
        label {
          margin-right: 5px;
        }
      }
      li.fullwidth {
        width: 100%;
      }
      li.opt {
        margin-top: 10px;
      }
    }
  }

  .myTemplist {
    width: 100%;
    position: relative;
    margin-top: 30px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    border: 1px solid #ebeef5;
    overflow: hidden;
    height: 150px;
    img {
      width: 100%;
      height: 100%;
    }
  }
  .temp-info {
    margin-top: 10px;
    min-height: 225px;
    ul {
      li {
        .buy_tips {
          margin-left: 10px;
        }
      }
    }
  }
  .line-gate {
    overflow: hidden;
    color: #606266;
    transition: height 0.2s;
    font-size: 15px;
    padding: 10px 0;
    border-bottom: 1px solid #e4e7ed;
  }
}

.price-help {
  color: #e6a23c;
  font-size: 20px;
  cursor: pointer;
}
</style>
