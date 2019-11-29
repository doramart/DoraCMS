<template>
  <div :class="classObj" class="dr-contentForm">
    <div class="main-container">
      <el-form
        :model="formState"
        :rules="rules"
        ref="ruleForm"
        label-width="120px"
        class="demo-ruleForm"
        :label-position="device == 'mobile' ? 'top' : 'right'"
      >
        <el-form-item :label="$t('announce.title')" prop="title">
          <el-input size="small" v-model="formState.title"></el-input>
        </el-form-item>
        <el-form-item :label="$t('announce.content')" prop="content">
          <vue-ueditor-wrap
            class="editorForm"
            @ready="editorReady"
            v-model="formState.content"
            :config="myConfig"
          ></vue-ueditor-wrap>
        </el-form-item>
        <el-form-item class="dr-submitContent">
          <el-button
            size="medium"
            type="primary"
            @click="submitForm('ruleForm')"
          >{{$t('main.post')}}</el-button>
          <el-button size="medium" @click="backToList">{{$t('main.back')}}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss">
.edui-default .edui-toolbar {
  line-height: 20px !important;
}
.dr-contentForm {
  margin: 15px 0;
  width: 80%;
  padding-bottom: 50px;
  .dr-submitContent {
    position: fixed;
    z-index: 9999999;
    padding: 10px 30px;
    text-align: right;
    right: 0;
    bottom: 0;
    background: none;
    margin-bottom: 0;
  }

  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .avatar-uploader .el-upload:hover {
    border-color: #409eff;
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 200px;
    height: 150px;
    line-height: 150px !important;
    text-align: center;
  }
  .avatar {
    width: 200px;
    height: 158px;
    display: block;
  }
}
</style>

<script>
import _ from "lodash";
import { mapGetters, mapActions } from "vuex";
import { addSystemAnnounce } from "@/api/announce";
import VueUeditorWrap from "vue-ueditor-wrap";
import { initEvent } from "@root/publicMethods/events";

export default {
  props: {
    groups: Array
  },
  data() {
    return {
      sidebarOpened: true,
      device: "desktop",
      content: "",
      myConfig: {
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
      },
      rules: {
        title: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("announce.title")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 50,
            message: this.$t("validate.rangelength", { min: 5, max: 50 }),
            trigger: "blur"
          }
        ],
        content: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("announce.content")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 500,
            message: this.$t("validate.rangelength", { min: 5, max: 500 }),
            trigger: "blur"
          }
        ]
      }
    };
  },
  components: {
    VueUeditorWrap
  },
  methods: {
    editorReady(instance) {
      instance.setContent("");
    },
    backToList() {
      this.$router.push(this.$root.adminBasePath + "/announce");
    },
    submitForm(formName, type = "") {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.formState;
          addSystemAnnounce(params).then(result => {
            if (result.status === 200) {
              this.$router.push(this.$root.adminBasePath + "/announce");
              this.$message({
                message: this.$t("main.addSuccess"),
                type: "success"
              });
            } else {
              this.$message.error(result.message);
            }
          });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    }
  },
  computed: {
    formState() {
      return this.$store.getters.systemAnnounceFormState;
    },
    classObj() {
      return {
        hideSidebar: !this.sidebarOpened,
        openSidebar: this.sidebarOpened,
        withoutAnimation: "false",
        mobile: this.device === "mobile"
      };
    }
  },
  mounted() {
    initEvent(this);
  }
};
</script>
