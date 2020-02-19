<template>
  <div class="dr-MailDeliveryForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      width="60%"
      title="创建邮件任务"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      <el-form
        :model="dialogState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="120px"
        class="demo-ruleForm"
        :label-position="device == 'mobile' ? 'top' : 'right'"
      >
        <el-form-item :label="$t('mailDelivery.type')" prop="type">
          <el-radio :disabled="dialogState.edit" v-model="dialogState.formData.type" label="0">立即</el-radio>
          <el-radio :disabled="dialogState.edit" v-model="dialogState.formData.type" label="1">定时</el-radio>
        </el-form-item>

        <el-form-item
          v-if="dialogState.formData.type == '1'"
          :label="$t('mailDelivery.timing')"
          prop="timing"
        >
          <el-date-picker
            :picker-options="expireTimeOption"
            v-model="dialogState.formData.timing"
            type="datetime"
            placeholder="请选择时间"
          ></el-date-picker>
        </el-form-item>

        <el-form-item :label="$t('mailDelivery.comments')" prop="comments">
          <el-input size="small" v-model="dialogState.formData.comments"></el-input>
        </el-form-item>

        <el-form-item :label="$t('mailDelivery.targetType')" prop="type">
          <el-radio
            :disabled="dialogState.edit"
            v-model="dialogState.formData.targetType"
            label="0"
          >全部</el-radio>
          <el-radio
            :disabled="dialogState.edit"
            v-model="dialogState.formData.targetType"
            label="1"
          >指定</el-radio>
        </el-form-item>

        <el-form-item
          v-if="dialogState.formData.targetType == '1'"
          :label="$t('mailDelivery.targets')"
          prop="targets"
        >
          <el-select
            :disabled="dialogState.edit"
            class="targetsSelect"
            v-model="dialogState.formData.targets"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="搜索用户名"
            :remote-method="remoteMethod"
            :loading="loading"
          >
            <el-option
              v-for="item in selectUserList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('mailDelivery.emailType')" prop="emailType">
          <el-select
            @change="changeEmailTemplate"
            :disabled="dialogState.edit"
            size="small"
            v-model="dialogState.formData.emailType"
            placeholder="请选择模板类别"
          >
            <el-option
              v-for="item in templateSelectOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('mailDelivery.content')" prop="content">
          <vue-ueditor-wrap
            class="editorForm"
            @ready="editorReady"
            v-model="dialogState.formData.content"
            :config="editorConfig"
          ></vue-ueditor-wrap>
        </el-form-item>
        <el-form-item>
          <el-button
            :disabled="dialogState.formData.state == '2'"
            size="medium"
            type="primary"
            @click="submitForm('ruleForm')"
          >{{dialogState.edit ? "确定" : $t('main.form_btnText_save')}}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import {
  addMailDelivery,
  updateMailDelivery,
  regUserList
} from "@/api/mailDelivery";
import {
  showFullScreenLoading,
  tryHideFullScreenLoading
} from "@root/publicMethods/axiosLoading";
import VueUeditorWrap from "vue-ueditor-wrap";
import _ from "lodash";
export default {
  props: {
    dialogState: Object,
    groups: Array,
    // templateSelectOption: Array,
    device: String,
    mailTemplateList: Object
  },
  data() {
    return {
      editorConfig: {
        // 编辑器不自动被内容撑高
        autoHeightEnabled: false,
        // 初始容器高度
        initialFrameHeight: 240,
        // 初始容器宽度
        initialFrameWidth: "100%",
        // 上传文件接口（这个地址是我为了方便各位体验文件上传功能搭建的临时接口，请勿在生产环境使用！！！）
        serverUrl: "/api/upload/ueditor",
        // UEditor 资源文件的存放路径，如果你使用的是 vue-cli 生成的项目，通常不需要设置该选项，vue-ueditor-wrap 会自动处理常见的情况，如果需要特殊配置，参考下方的常见问题2
        UEDITOR_HOME_URL: this.$root.staticRootPath + "/plugins/ueditor/",
        toolbars: [
          [
            "source",
            "undo",
            "redo",
            "bold",
            "preview",
            "horizontal",
            "removeformat",
            "fontfamily", //字体
            "fontsize", //字号
            "paragraph",
            "justifyleft", //居左对齐
            "justifyright", //居右对齐
            "justifycenter", //居中对齐
            "justifyjustify", //两端对齐
            "forecolor", //字体颜色
            "backcolor", //背景色
            "simpleupload",
            "link",
            "unlink"
          ]
        ]
      },
      selectUserList: [],
      loading: false,
      expireTimeOption: {
        disabledDate(date) {
          return date.getTime() <= new Date().getTime() - 1000 * 60 * 60 * 24;
        }
      },
      rules: {
        emailType: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        comments: [
          {
            required: true,

            trigger: "blur"
          }
        ],
        type: [
          {
            required: true,

            trigger: "blur"
          }
        ],
        targetType: [
          {
            required: true,

            trigger: "blur"
          }
        ]
      }
    };
  },
  components: {
    VueUeditorWrap
  },
  computed: {
    templateSelectOption() {
      let templist = this.mailTemplateList;
      if (!_.isEmpty(templist) && !_.isEmpty(templist.docs)) {
        let tempTypeArr = [];
        for (const tempItem of templist.docs) {
          tempTypeArr.push({
            label: tempItem.title,
            value: tempItem._id
          });
        }
        return tempTypeArr;
      } else {
        return [];
      }
    }
  },
  methods: {
    changeEmailTemplate(value) {
      console.log("----", value);
      this.$confirm("确认要载入该模板?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          let templist = this.mailTemplateList;
          if (!_.isEmpty(templist.docs)) {
            let targetTemps = _.filter(templist.docs, item => {
              return item._id == value;
            });
            if (targetTemps) {
              this.ueditorObj.setContent(targetTemps[0].content);
              this.$message({
                type: "success",
                message: "载入成功!"
              });
            }
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消载入"
          });
        });
    },
    editorReady(instance) {
      this.ueditorObj = instance;
    },
    remoteMethod(query) {
      if (query !== "") {
        this.loading = true;
        let _this = this;
        this.queryUserListByParams({ searchkey: query });
      } else {
        this.selectUserList = [];
      }
    },
    queryUserListByParams(params = {}) {
      let _this = this;
      regUserList(params)
        .then(result => {
          let specialList = result.data.docs;
          if (specialList) {
            for (const userItem of specialList) {
              _this.selectUserList.push({
                value: userItem._id,
                label: userItem.userName
              });
            }
            _this.loading = false;
          } else {
            _this.selectUserList = [];
          }
        })
        .catch(err => {
          console.log(err);
          _this.selectUserList = [];
        });
    },
    confirm() {
      this.$store.dispatch("mailDelivery/hideMailDeliveryForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          showFullScreenLoading();
          let params = this.dialogState.formData;
          if (!params.timing) {
            params.timing = new Date();
          }
          // 更新
          if (this.dialogState.edit) {
            updateMailDelivery(params).then(result => {
              tryHideFullScreenLoading();
              if (result.status === 200) {
                this.$store.dispatch("mailDelivery/hideMailDeliveryForm");
                this.$store.dispatch("mailDelivery/getMailDeliveryList");
                this.$message({
                  message: this.$t("main.updateSuccess"),
                  type: "success"
                });
              } else {
                this.$message.error(result.message);
              }
            });
          } else {
            // 新增
            addMailDelivery(params).then(result => {
              tryHideFullScreenLoading();
              if (result.status === 200) {
                this.$store.dispatch("mailDelivery/hideMailDeliveryForm");
                this.$store.dispatch("mailDelivery/getMailDeliveryList");
                this.$message({
                  message: this.$t("main.addSuccess"),
                  type: "success"
                });
              } else {
                this.$message.error(result.message);
              }
            });
          }
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    }
  }
};
</script>
<style lang="scss">
.edui-default .edui-toolbar {
  line-height: 20px !important;
}
.targetsSelect {
  width: 90%;
}
</style>