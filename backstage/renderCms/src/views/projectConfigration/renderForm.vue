<template>
  <div id="renderApp" :class="classObj" style="margin-top:50px;">
    <div class="main-container">
      <el-row :gutter="20">
        <el-col :span="2">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :span="20">
          <el-form
            label-position="left"
            :rules="rules"
            ref="ruleForm"
            label-width="120px"
            :model="renderFormData"
          >
            <div class="pannelBox">
              <!-- <div class="title">
              <el-checkbox disabled v-model="renderFormData.localCodePath">指定数据库</el-checkbox>
              </div>-->
              <div class="body">
                <el-form-item label="选择项目">
                  <!-- <el-input v-model="renderFormData.profolder"></el-input> -->
                  <el-select
                    @change="changeDatabase"
                    value-key="id"
                    v-model="renderFormData.database"
                    placeholder="请选择项目"
                  >
                    <el-option
                      v-for="item in projectListOptions"
                      :key="item.id"
                      :label="item.tableName"
                      :value="item"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>

            <div class="pannelBox">
              <div class="title">
                <el-checkbox v-model="renderFormData.backPageCheck">后台界面配置(store)</el-checkbox>
              </div>

              <div class="body">
                <div class="prop">
                  <el-row :gutter="20" class="input-line">
                    <el-col :span="4">模块关键字</el-col>
                    <el-col :span="4">备注</el-col>
                    <el-col :span="4">繁体中文</el-col>
                    <el-col :span="8">EN</el-col>
                    <el-col :span="4">jp</el-col>
                  </el-row>
                </div>
                <div class="prop-detail">
                  <el-row :gutter="20" class="input-line">
                    <el-col :span="4">
                      <el-input v-model="renderFormData.modelName.name"></el-input>
                    </el-col>
                    <el-col :span="4">
                      <el-input @blur="changeModelName" v-model="renderFormData.modelName.zh"></el-input>
                    </el-col>
                    <el-col :span="4">
                      <el-input
                        :disabled="!renderFormData.modelName.zh"
                        v-model="renderFormData.modelName.tw"
                      ></el-input>
                    </el-col>
                    <el-col :span="8">
                      <el-input
                        :disabled="!renderFormData.modelName.zh"
                        v-model="renderFormData.modelName.en"
                      ></el-input>
                    </el-col>
                    <el-col :span="4">
                      <el-input
                        :disabled="!renderFormData.modelName.zh"
                        v-model="renderFormData.modelName.jp"
                      ></el-input>
                    </el-col>
                  </el-row>
                </div>
                <div class="prop">属性</div>
                <el-tag
                  :key="propItem.prop"
                  v-for="propItem in renderFormData.propsInfo"
                  closable
                  :disable-transitions="false"
                  @close="handleClose(propItem.prop)"
                >{{propItem.prop}}</el-tag>
                <el-input
                  class="input-new-tag"
                  v-if="inputVisible"
                  v-model="inputValue"
                  ref="saveTagInput"
                  size="small"
                  @keyup.enter.native="handleInputConfirm"
                  @blur="handleInputConfirm"
                ></el-input>
                <el-button v-else class="button-new-tag" size="small" @click="showInput">+ 新增属性</el-button>
                <div class="prop">属性备注</div>
                <div class="prop-detail">
                  <el-row :gutter="20" class="input-line">
                    <el-col :span="4">属性</el-col>
                    <el-col :span="4">备注</el-col>
                    <el-col :span="4">数据类型</el-col>
                    <el-col :span="4">繁体中文</el-col>
                    <el-col :span="4">EN</el-col>
                    <el-col :span="4">jp</el-col>
                  </el-row>
                  <el-row
                    :gutter="20"
                    class="input-line"
                    v-for="(propItem,index) in renderFormData.propsInfo"
                    :key="'item_'+index"
                  >
                    <el-col :span="4">
                      <el-input :disabled="true" :key="propItem.prop" :value="propItem.prop"></el-input>
                    </el-col>
                    <el-col :span="4">
                      <el-input
                        @blur="changePropComment($event,propItem,index)"
                        v-model="propItem.comment"
                      ></el-input>
                    </el-col>
                    <el-col :span="4">
                      <!-- <el-input @blur="changePropModelType($event,propItem,index)"
                                            v-model="propItem.modelType">
                      </el-input>-->
                      <el-select v-model="propItem.modelType" placeholder="请选择">
                        <el-option
                          v-for="item in modelTypeOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                          :disabled="item.disabled"
                        ></el-option>
                      </el-select>
                    </el-col>
                    <el-col :span="4">
                      <el-input :disabled="!propItem.comment" v-model="propItem.comment_tw"></el-input>
                    </el-col>
                    <el-col :span="4">
                      <el-input :disabled="!propItem.comment" v-model="propItem.comment_en"></el-input>
                    </el-col>
                    <el-col :span="4">
                      <el-input :disabled="!propItem.comment" v-model="propItem.comment_jp"></el-input>
                    </el-col>
                  </el-row>
                </div>
                <div class="prop">其它</div>
                <div class="prop-detail">
                  <el-checkbox v-model="renderFormData.addInfoCheck">新增</el-checkbox>
                  <el-checkbox v-model="renderFormData.searchModelCheck">搜索</el-checkbox>
                </div>
              </div>
            </div>

            <div class="pannelBox">
              <div class="title">
                <el-checkbox
                  v-model="renderFormData.serverControlCheck"
                >服务端配置(model,controller,server,router)</el-checkbox>
              </div>
            </div>
            <div class="pannelBox">
              <div class="title">
                <el-checkbox v-model="renderFormData.addResourceSite">选择插入节点</el-checkbox>
              </div>
              <div class="body">
                <el-form-item label="权限列表" prop="resources">
                  <el-cascader
                    style="width: 300px;"
                    change-on-select
                    size="small"
                    expand-trigger="hover"
                    :options="resourceList"
                    v-model="renderFormData.targetResource.parentId"
                    @change="handleResource"
                    :props="resourcesProps"
                  ></el-cascader>
                </el-form-item>
              </div>
            </div>

            <el-form-item>
              <el-button type="primary" @click="submitForm('ruleForm')">开始</el-button>
              <el-button @click="saveDraft('ruleForm')">保存草稿</el-button>
              <el-button @click="backToProConfigList">返回</el-button>
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="2">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import { databaseResouce, doRenderCms } from "@/api/renderCms";
import Axios from "axios";
import { mapGetters, mapActions } from "vuex";
import _ from "lodash";
import { renderTreeData } from "@/utils";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "renderCMS",
  data: function() {
    return {
      testselect: "",
      sidebarOpened: true,
      device: "desktop",
      modelTypeOptions: [
        {
          value: "String",
          label: "String"
        },
        {
          value: "Number",
          label: "Number"
        },
        {
          value: "Date",
          label: "Date"
        },
        {
          value: "Boolean",
          label: "Boolean"
        }
      ],
      visible: false,
      inputVisible: false,
      inputValue: "",
      resourcesProps: {
        value: "_id",
        label: "comments",
        children: "children"
      },
      resourceList: [],
      renderFormData: {
        database: {},
        serverControlCheck: true,
        backPageCheck: true,
        addResourceSite: true,
        localCodePath: true,
        searchModelCheck: true,
        addInfoCheck: true,
        // profolder: "/Users/dora/Documents/dora/gitee/doracms2-0",
        propsInfo: [],
        modelName: {
          name: "testComponent",
          zh: "",
          tw: "",
          en: "",
          jp: ""
        },
        targetResource: {
          parentId: [],
          sortId: 1
        }
      },
      rules: {
        profolder: [
          {
            required: true,
            trigger: "blur"
          }
        ],
        localCodePath: [
          {
            required: true,
            trigger: "blur"
          }
        ]
      }
    };
  },
  computed: {
    ...mapGetters(["projectConfigurationList"]),
    classObj() {
      return {
        hideSidebar: !this.sidebarOpened,
        openSidebar: this.sidebarOpened,
        withoutAnimation: "false",
        mobile: this.device === "mobile"
      };
    },
    projectListOptions() {
      let prjListObj = this.projectConfigurationList.docs;
      let targetPrjList = [];
      for (const prjItem of prjListObj) {
        targetPrjList.push({
          id: prjItem._id,
          tableName: prjItem.tableName,
          value: prjItem._id,
          localPath: prjItem.localPath
        });
      }
      return targetPrjList;
    }
  },
  methods: {
    backToProConfigList() {
      this.$router.push(this.$root.adminBasePath + "/renderCms");
    },
    async changeDatabase(value) {
      let resources = await this.getAdminResourceList({
        targetDB: value.tableName
      });
      if (resources) {
        this.resourceList = resources;
      }
    },
    askTranslate(targetWord, lang) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          Axios.get(
            `http://translate.google.cn/translate_a/single?client=gtx&dt=t&dj=1&ie=UTF-8&sl=zh-CN&tl=${lang}&q=${targetWord}`
          )
            .then(data => {
              if (data.data.sentences && data.data.sentences.length > 0) {
                resolve(data.data.sentences[0].trans);
              } else {
                resolve("");
              }
            })
            .catch(err => {
              resolve("");
            });
        }, 1000);
      });
    },
    getAdminResourceList(params = {}) {
      return new Promise((resolve, reject) => {
        databaseResouce(params).then(result => {
          if (result.status === 200) {
            let currentResult = renderTreeData({ docs: result.data });
            if (!_.isEmpty(currentResult.docs)) {
              resolve(currentResult.docs);
            } else {
              resolve([]);
            }
          } else {
            this.$message.error(result.data.message, result.message);
          }
        });
      });
    },
    handleResource(value) {
      let targetResource = "";
      for (const item of this.resourceList) {
        if (item._id == value[value.length - 1]) {
          targetResource = item.children;
          break;
        }
      }
      if (targetResource) {
        targetResource.sort(function(m, n) {
          if (m.sortId > n.sortId) return -1;
          else if (m.sortId < n.sortId) return 1;
          else return 0;
        });
        // console.log('-targetResource----', targetResource);
        this.renderFormData.targetResource.sortId =
          targetResource[0].sortId + 1;
      }
    },
    handleClose(tag) {
      this.renderFormData.propsInfo.splice(
        this.renderFormData.propsInfo.indexOf(tag),
        1
      );
    },

    showInput() {
      this.inputVisible = true;
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },

    handleInputConfirm() {
      let inputValue = this.inputValue;
      if (inputValue) {
        this.renderFormData.propsInfo.push({
          prop: inputValue,
          comment: "",
          modelType: "String",
          comment_tw: "",
          comment_en: "",
          comment_jp: ""
        });
      }
      this.inputVisible = false;
      this.inputValue = "";
    },
    submitForm(formName) {
      let _this = this;
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = _this.renderFormData;
          doRenderCms(params).then(result => {
            if (result.status === 200) {
              this.$message({
                message: this.$t("main.updateSuccess"),
                type: "success"
              });
              _this.resetForm();
            } else {
              this.$message.error(result.data.message, result.message);
            }
          });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    resetForm(formName) {
      localStorage.clear();
      // this.renderFormData = {};
    },
    async changeModelName(event) {
      console.log(event.target.value);
      let targetWords = event.target.value;

      if (targetWords) {
        try {
          let enStr = await this.askTranslate(targetWords, "en");
          let chtStr = await this.askTranslate(targetWords, "zh-TW");
          let jpStr = await this.askTranslate(targetWords, "ja");
          // console.log("--enStr--", enStr);
          this.renderFormData.modelName.zh = targetWords;
          this.renderFormData.modelName.en = enStr;
          this.renderFormData.modelName.tw = chtStr;
          this.renderFormData.modelName.jp = jpStr;
        } catch (error) {
          console.error("翻译失败", error.message);
        }
      }
    },
    async changePropComment(event, propItem, index) {
      console.log(event.target.value);
      let targetWords = event.target.value;
      if (targetWords) {
        try {
          let enStr = await this.askTranslate(targetWords, "en");
          let chtStr = await this.askTranslate(targetWords, "zh-TW");
          let jpStr = await this.askTranslate(targetWords, "ja");

          this.renderFormData.propsInfo.splice(index, 1, {
            prop: propItem.prop,
            comment: targetWords,
            modelType: "String",
            comment_en: enStr,
            comment_tw: chtStr,
            comment_jp: jpStr
          });
        } catch (error) {
          console.error("翻译失败", error.message);
        }
      }
    },
    async changePropModelType(event, propItem, index) {
      console.log(event.target.value);
      let targetType = event.target.value;
      if (targetType) {
        let oldRowFormData = this.renderFormData.propsInfo[index];
        let newParams = Object.assign({}, oldRowFormData, {
          modelType: targetType
        });
        this.renderFormData.propsInfo.splice(index, 1, newParams);
      }
    },
    saveDraft() {
      let oldData = JSON.stringify(this.renderFormData);
      localStorage.setItem("renderData", oldData);
      this.$message({
        message: "保存成功",
        type: "success"
      });
    },
    writeDraft() {
      let oldData = localStorage.getItem("renderData");
      if (oldData) {
        let dataObj = JSON.parse(oldData);
        this.renderFormData = dataObj;
        this.$message({
          message: "信息回填成功",
          type: "success"
        });
      }
    }
  },
  async mounted() {
    initEvent(this);
    this.$store.dispatch("renderCms/getProjectConfigurationList");
    this.writeDraft();
    try {
      let resources = await this.getAdminResourceList();
      if (resources) {
        this.resourceList = resources;
      }
    } catch (error) {
      console.log("获取权限列表失败");
    }
  }
};
</script>

<style lang="scss">
.pannelBox {
  margin: 15px 0;
  color: #aaa;
}

.pannelBox .title {
  padding: 15px 0;
  border-bottom: 1px solid #ccc;
  display: block;
  margin-bottom: 20px;
}

.pannelBox .body .prop,
.pannelBox .body .prop-detail {
  font-size: 13px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.pannelBox .body .prop-detail .input-line {
  margin-bottom: 10px;
}

.el-tag + .el-tag {
  margin-left: 10px;
}

.input-new-tag {
  width: 90px;
  margin-left: 10px;
  vertical-align: bottom;
}
</style>