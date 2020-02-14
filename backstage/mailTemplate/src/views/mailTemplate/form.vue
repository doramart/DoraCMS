<template>
  <div class="dr-MailTemplateForm email-temp">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      width="60%"
      title="邮件模板"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      <div class="tip">
        <div>邮件模板中的一些动态标签：</div>
        <ul>
          <el-divider content-position="left">通用标签</el-divider>
          <li>
            <el-tag size="small" type="warning">[站点名称]tempkey_siteName</el-tag>
          </li>
          <li>
            <el-tag size="small" type="warning">[站点域名]tempkey_siteDomain</el-tag>
          </li>
          <li>
            <el-tag size="small" type="warning">[用户邮箱]tempkey_email</el-tag>
          </li>
          <div v-if="dialogState.formData.type == '6'">
            <el-divider content-position="left">留言通知</el-divider>
            <li>
              <el-tag size="small" type="warning">[留言作者]tempkey_message_author_userName</el-tag>
            </li>
            <li>
              <el-tag size="small" type="warning">[创建留言时间]tempkey_message_sendDate</el-tag>
            </li>
            <li>
              <el-tag size="small" type="warning">[留言关联文档标题]tempkey_message_content_title</el-tag>
            </li>
            <li>
              <el-tag size="small" type="warning">[留言关联文档ID]tempkey_message_content_id</el-tag>
            </li>
          </div>
          <div v-if="dialogState.formData.type == '8'">
            <el-divider content-position="left">邮箱验证码</el-divider>
            <li>
              <el-tag size="small" type="warning">[邮件验证码]tempkey_msgCode</el-tag>
            </li>
          </div>
          <div v-if="dialogState.formData.type == '0'">
            <el-divider content-position="left">找回密码</el-divider>
            <li>
              <el-tag size="small" type="warning">[找回密码的token]tempkey_token</el-tag>
            </li>
          </div>
        </ul>
      </div>
      <el-form
        :model="dialogState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="120px"
        class="demo-ruleForm"
        :label-position="device == 'mobile' ? 'top' : 'right'"
      >
        <el-form-item :label="$t('mailTemplate.type')" prop="type">
          <el-select size="small" v-model="dialogState.formData.type" placeholder="请选择模板类别">
            <el-option
              v-for="item in templateSelectOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('mailTemplate.comment')" prop="comment">
          <el-input size="small" v-model="dialogState.formData.comment"></el-input>
        </el-form-item>

        <el-form-item :label="$t('mailTemplate.title')" prop="title">
          <el-input size="small" v-model="dialogState.formData.title"></el-input>
        </el-form-item>

        <el-form-item :label="$t('mailTemplate.subTitle')" prop="subTitle">
          <el-input size="small" v-model="dialogState.formData.subTitle"></el-input>
        </el-form-item>

        <el-form-item :label="$t('mailTemplate.content')" prop="content">
          <vue-ueditor-wrap
            class="editorForm"
            @ready="editorReady"
            v-model="dialogState.formData.content"
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
import { addMailTemplate, updateMailTemplate } from "@/api/mailTemplate";
import VueUeditorWrap from "vue-ueditor-wrap";
import _ from "lodash";
export default {
  props: {
    templateSelectOption: Array,
    dialogState: Object,
    groups: Array,
    device: String
  },
  data() {
    return {
      tempType: [
        { value: "0", label: "校验码" },
        { value: "1", label: "注册成功" },
        { value: "2", label: "找回密码" }
      ],
      rules: {
        comment: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        title: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        subTitle: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        content: [
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
      }
    };
  },
  components: {
    VueUeditorWrap
  },
  methods: {
    editorReady(instance) {
      this.editorInstance = instance;
    },
    confirm() {
      this.$store.dispatch("mailTemplate/hideMailTemplateForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            updateMailTemplate(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("mailTemplate/hideMailTemplateForm");
                this.$store.dispatch("mailTemplate/getMailTemplateList");
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
            addMailTemplate(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("mailTemplate/hideMailTemplateForm");
                this.$store.dispatch("mailTemplate/getMailTemplateList");
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
.email-temp {
  .tip {
    padding: 10px 16px;
    background-color: #fff;
    border-radius: 4px;
    border-left: 5px solid #50bfff;
    margin: 0px 0 20px;
    color: #303133;
    ul {
      margin: 5px;
      padding: 0;
      li {
        display: inline-block;
        margin: 0 20px;
        height: 30px;
        line-height: 30px;
      }
    }
  }
}
</style>