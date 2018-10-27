<template>
    <div class="templateConfig">
        <el-row class="dr-datatable">
            <el-col :span="24">
                <ConfigForm :dialogState="formState" :forderlist="templateItemForderList"></ConfigForm>
                <div class="temp-dashboard">
                   <el-row :gutter="20">
                    <template>
                    <el-tabs v-model="activeName" @tab-click="handleClick">
                      <el-tab-pane label="模板配置" name="tempConfig">
                        <el-row :gutter="20">
                          <el-col :span="12">
                            <div class="mytheme">  
                              <el-row :gutter="20">
                                <el-col :span="10">
                                  <div class="theme-image">
                                    <img :src="currentTheme.sImg" />
                                  </div>
                                  </el-col>
                                <el-col :span="14">
                                  <div class="theme-info">
                                    <ul>
                                      <li><label>名称:</label>{{currentTheme.name}}&nbsp;<el-tag type="success" size="mini">当前主题</el-tag></li>
                                      <li><label>作者:</label>{{currentTheme.author}}</li>
                                      <li><label>版本号:</label><el-tag type="info" size="mini">{{currentTheme.version}}</el-tag></li>
                                      <li><label>介绍:</label>{{currentTheme.comment}}</li>
                                    </ul>
                                  </div>
                                </el-col>
                              </el-row>
                            </div>
                          </el-col>
                          <el-col :span="12">
                            <div class="grid-content bg-purple">
                              <el-button size="mini" type="primary" icon="el-icon-plus" @click="addNewTemp">模板配置</el-button>
                              <el-table
                                :data="currentTheme.items"
                                style="width: 100%">
                                <el-table-column
                                  prop="name"
                                  label="标题"
                                  width="180">
                                </el-table-column>
                                <el-table-column
                                  prop="forder"
                                  label="关键字"
                                  width="180">
                                </el-table-column>
                                <el-table-column
                                  prop="comment"
                                  label="备注">
                                </el-table-column>
                                 <el-table-column :label="$t('main.dataTableOptions')" width="150" fixed="right">
                                    <template slot-scope="scope">
                                        <span v-if="!scope.row.isDefault">
                                            <el-button size="mini" type="danger" plain icon="el-icon-delete" @click="deleteTemplateItem(scope.$index, currentTheme.items)"></el-button>
                                        </span>
                                    </template>
                                </el-table-column>
                              </el-table>
                            </div>
                          </el-col>
                        </el-row>
                        <h2 class="line-gate">可用模板</h2>
                        <el-row :gutter="20">
                          <el-col :span="4" v-for="item in templateConfigList" :key="item._id">
                            <div class="myTemplist">
                              <img :src="item.sImg" />
                            </div>
                            <div class="theme-info temp-info">
                              <ul>
                                <li>{{item.name}}</li>
                                <li><label>作者:</label>{{item.author}}</li>
                                <li><label>版本号:</label><el-tag type="info" size="mini">{{item.version}}</el-tag></li>
                                <li class="opt" v-if="!item.using">
                                  <el-button size="mini" @click="installTempOption(item._id,'enable')">启用</el-button>
                                  <el-button size="mini" type="danger" @click="installTempOption(item._id,'uninstall')">卸载</el-button>
                                </li>
                              </ul>
                            </div>
                          </el-col>
                        </el-row>
                      </el-tab-pane>
                      <el-tab-pane label="模板市场" name="tempShop">
                        <el-row :gutter="20">
                          <el-col :span="4" v-for="item in tempShoplist.docs" :key="item._id">
                            <div class="myTemplist">
                              <img :src="item.sImg" />
                            </div>
                            <div class="theme-info temp-info">
                              <ul>
                                <li>{{item.name}}</li>
                                <li><label>作者:</label>{{item.author}}</li>
                                <li><label>版本号:</label><el-tag type="info" size="mini">{{item.version}}</el-tag></li>
                                <li class="opt" v-if="item.author == 'doracms'">
                                  <el-button size="mini" type="primary" @click="installTempOption(item._id,'install')">安装</el-button>
                                  <el-button size="mini"  @click="viewTheme(item._id)">预览</el-button>
                                </li>
                              </ul>
                            </div>
                          </el-col>
                        </el-row>
                        <!-- <Pagination :pageInfo="tempShoplist.pageInfo" pageType="tempShop"></Pagination> -->
                      </el-tab-pane>
                    </el-tabs>
                  </template>
                </el-row>
                </div>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import TopBar from "../common/TopBar.vue";
import ConfigForm from "./configForm";
import { mapGetters, mapActions } from "vuex";
import services from "../../store/services.js";
// import Pagination from "../common/Pagination.vue";
import _ from "lodash";
export default {
  name: "index",
  data() {
    return {
      loadingObj: "",
      loadingState: true,
      activeName: "tempConfig",
      tableData: [
        {
          title: "默认模板",
          name: "2-stage-default",
          comment: ""
        },
        {
          title: "默认模板",
          name: "2-stage-default",
          comment: ""
        }
      ]
    };
  },
  components: {
    TopBar,
    ConfigForm
    // Pagination
  },
  methods: {
    handleClick(tab, event) {
      console.log(tab, event);
    },
    installTempOption(tempId, option) {
      let askTips = "";
      if (option == "install") {
        askTips = this.$t("templateConfig.ask_ifinstall");
      } else if (option == "enable") {
        askTips = this.$t("templateConfig.ask_ifenable");
      } else if (option == "uninstall") {
        askTips = this.$t("templateConfig.ask_ifuninstall");
      }
      this.$confirm(askTips, this.$t("main.scr_modal_title"), {
        confirmButtonText: this.$t("main.confirmBtnText"),
        cancelButtonText: this.$t("main.cancelBtnText"),
        type: "warning"
      })
        .then(() => {
          this.loadingObj = this.$loading({
            lock: true,
            text: "installing",
            spinner: "el-icon-loading",
            background: "rgba(0, 0, 0, 0.7)"
          });
          if (option == "install") {
            return services.installTemp({
              tempId: tempId
            });
          } else if (option == "enable") {
            return services.enableTemp({
              tempId: tempId
            });
          } else if (option == "uninstall") {
            return services.uninstallTemp({
              tempId: tempId
            });
          }
        })
        .then(result => {
          this.loadingObj.close();
          if (result.data.status === 200) {
            this.$store.dispatch("getMyTemplateList");
            this.$message({
              message: this.$t("templateConfig.install_success"),
              type: "success"
            });
          } else {
            this.$message.error(result.data.message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: this.$t("templateConfig.install_failed")
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
          type: "warning"
        }
      )
        .then(() => {
          return services.delTemplateItem({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("getMyTemplateList");
            this.$message({
              message: this.$t("main.scr_modal_del_succes_info"),
              type: "success"
            });
          } else {
            this.$message.error(result.data.message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info")
          });
        });
    },
    addNewTemp() {
      this.$store.dispatch("showTemplateConfigForm");
    }
  },
  computed: {
    ...mapGetters([
      "templateConfigList",
      "templateItemForderList",
      "tempShoplist"
    ]),
    formState() {
      return this.$store.getters.templateConfigFormState;
    },
    currentTheme() {
      let myThemes = this.templateConfigList;
      let currentlist = _.filter(myThemes, doc => {
        return doc.using;
      });
      return currentlist && currentlist.length > 0 ? currentlist[0] : [];
    },
    cms2Themes() {
      let shopThems = this.tempShoplist.docs;
      let currentlist = _.filter(shopThems, doc => {
        return doc.author == "doracms";
      });
      return currentlist && currentlist.length > 0 ? currentlist : [];
      return {
        docs: currentlist && currentlist.length > 0 ? currentlist : []
      };
    }
  },
  mounted() {
    this.$store.dispatch("getMyTemplateList");
    this.$store.dispatch("getTemplateItemForderList");
    this.$store.dispatch("getTempsFromShop");
  }
};
</script>

<style lang="scss">
.temp-dashboard {
  padding: 15px;
  .mytheme {
    padding: 15px 0;
    .theme-image {
      border-radius: 4px;
      border: 1px solid #ebeef5;
      background-color: #fff;
      overflow: hidden;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      img {
        width: 100%;
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
      li.opt {
        margin-top: 10px;
      }
    }
  }

  .myTemplist {
    width: 100%;
    margin-top: 30px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    border: 1px solid #ebeef5;
    overflow: hidden;
    img {
      width: 100%;
    }
  }
  .temp-info {
    margin-top: 10px;
    ul {
      li {
        line-height: 22px;
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
</style>