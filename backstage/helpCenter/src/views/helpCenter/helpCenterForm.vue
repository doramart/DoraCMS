<template>
  <div class="dr-HelpCenterForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      width="70%"
      title="编辑帮助"
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
        <el-form-item :label="$t('helpCenter.name')" prop="name">
          <el-input size="small" v-model="dialogState.formData.name"></el-input>
        </el-form-item>
        <el-form-item label="帮助类型" prop="type">
          <el-select v-model="dialogState.formData.type" placeholder="请选择类别">
            <el-option
              v-for="item in helpCate"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('helpCenter.lang')" prop="lang">
          <el-radio class="radio" v-model="dialogState.formData.lang" label="1">简体中文</el-radio>
          <!-- <el-radio class="radio" v-model="dialogState.formData.lang" label="2">EN</el-radio> -->
          <el-radio class="radio" v-model="dialogState.formData.lang" label="3">繁体中文</el-radio>
        </el-form-item>
        <el-form-item :label="$t('helpCenter.state')" prop="state">
          <el-switch
            :on-text="$t('main.radioOn')"
            :off-text="$t('main.radioOff')"
            v-model="dialogState.formData.state"
          ></el-switch>
        </el-form-item>
        <el-form-item :label="$t('helpCenter.comments')" prop="comments">
          <vue-ueditor-wrap
            class="editorForm"
            @ready="editorReady"
            v-model="dialogState.formData.comments"
            :config="editorConfig"
          ></vue-ueditor-wrap>
        </el-form-item>
        <el-form-item>
          <el-button
            size="medium"
            type="primary"
            @click="submitForm('ruleForm')"
          >{{dialogState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import VueUeditorWrap from "vue-ueditor-wrap";
import { addHelpCenter, updateHelpCenter } from "@/api/helpCenter";

import _ from "lodash";
export default {
  props: {
    dialogState: Object,
    groups: Array,
    device: String
  },
  data() {
    return {
      helpCate: [{ value: "0", label: "普通" }, { value: "1", label: "其它" }],
      rules: {
        name: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("HelpCenter.name")
            }),
            trigger: "blur"
          },
          {
            min: 1,
            max: 50,
            message: this.$t("validate.rangelength", { min: 1, max: 50 }),
            trigger: "blur"
          }
        ]
      },
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
        UEDITOR_HOME_URL: this.$root.staticRootPath + "/plugins/ueditor/"
      }
    };
  },
  components: {
    VueUeditorWrap
  },
  methods: {
    setContents(contents) {
      if (this.editorInstance) {
        this.editorInstance.setContent(contents);
      }
    },
    editorReady(instance) {
      this.editorInstance = instance;
      // if (this.dialogState.edit) {
      //   instance.setContent(this.dialogState.formData.comments);
      // } else {
      //   instance.setContent("");
      // }
      // instance.addListener("contentChange", () => {
      //   this.content = instance.getContent();
      //   this.$store.dispatch("helpCenter/showHelpCenterForm", {
      //     edit: this.dialogState.edit,
      //     formData: Object.assign({}, this.dialogState.formData, {
      //       comments: this.content
      //     })
      //   });
      // });
    },
    confirm() {
      this.$store.dispatch("helpCenter/hideHelpCenterForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            updateHelpCenter(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("helpCenter/hideHelpCenterForm");
                this.$store.dispatch("helpCenter/getHelpCenterList");
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
            addHelpCenter(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("helpCenter/hideHelpCenterForm");
                this.$store.dispatch("helpCenter/getHelpCenterList");
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
</style>