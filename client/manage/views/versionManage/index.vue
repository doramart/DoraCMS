<template>
  <div class="adminVersionConfig">
    <el-row class="dr-datatable">
      <h2 class="line-gate">Android</h2>

      <el-col>
        <el-form
          :model="versionManage.configs"
          :rules="rules"
          ref="ruleForm"
          label-width="120px"
          class="demo-ruleForm"
        >
          <el-form-item :label="$t('versionManage.title')" prop="title">
            <el-input size="small" v-model="versionManage.configs.title"></el-input>
          </el-form-item>
          <el-form-item :label="$t('versionManage.description')" prop="description">
            <el-input size="small" v-model="versionManage.configs.description"></el-input>
          </el-form-item>
          <el-form-item :label="$t('versionManage.version')" prop="version">
            <el-input size="small" v-model="versionManage.configs.version"></el-input>
          </el-form-item>
          <el-form-item :label="$t('versionManage.versionName')" prop="versionName">
            <el-input size="small" v-model="versionManage.configs.versionName"></el-input>
          </el-form-item>
          <el-form-item :label="$t('versionManage.forcibly')" prop="forcibly">
            <el-switch
              :on-text="$t('main.radioOn')"
              :off-text="$t('main.radioOff')"
              v-model="versionManage.configs.forcibly"
            ></el-switch>
          </el-form-item>
          <el-form-item :label="$t('versionManage.url')" prop="url">
            <el-upload
              class="upload-demo"
              action="/api/v0/upload/files?type=appPackage"
              :on-preview="handlePreview"
              :on-remove="handleRemove"
              :before-remove="beforeRemove"
              :on-success="uploadSuccess"
              multiple
              :limit="1"
              accept=".apk"
              :on-exceed="handleExceed"
              :file-list="fileList"
            >
              <el-button size="small" type="primary">点击上传</el-button>
              <div slot="tip" class="el-upload__tip">只能上传apk文件，且不超过20M</div>
            </el-upload>
          </el-form-item>
          <el-form-item>
            <el-button
              size="medium"
              type="primary"
              @click="submitForm('ruleForm')"
            >{{$t('main.form_btnText_save')}}</el-button>
            <el-button size="medium" @click="resetForm('ruleForm')">{{$t('main.reSetBtnText')}}</el-button>
          </el-form-item>
        </el-form>
      </el-col>
      <h2 class="line-gate">IOS</h2>
      <el-col>
        <el-form
          :model="versionManage.configs"
          :rules="rules1"
          ref="ruleIosForm"
          label-width="120px"
          class="demo-ruleIosForm"
        >
          <el-form-item :label="$t('versionManage.title')" prop="title">
            <el-input size="small" v-model="versionManageIos.configs.title"></el-input>
          </el-form-item>
          <el-form-item :label="$t('versionManage.description')" prop="description">
            <el-input size="small" v-model="versionManageIos.configs.description"></el-input>
          </el-form-item>
          <el-form-item :label="$t('versionManage.version')" prop="version">
            <el-input size="small" v-model="versionManageIos.configs.version"></el-input>
          </el-form-item>
          <el-form-item :label="$t('versionManage.versionName')" prop="versionName">
            <el-input size="small" v-model="versionManageIos.configs.versionName"></el-input>
          </el-form-item>
          <el-form-item :label="$t('versionManage.forcibly')" prop="forcibly">
            <el-switch
              :on-text="$t('main.radioOn')"
              :off-text="$t('main.radioOff')"
              v-model="versionManageIos.configs.forcibly"
            ></el-switch>
          </el-form-item>
          <el-form-item>
            <el-button
              size="medium"
              type="primary"
              @click="submitForm('ruleIosForm')"
            >{{$t('main.form_btnText_save')}}</el-button>
            <el-button size="medium" @click="resetForm('ruleIosForm')">{{$t('main.reSetBtnText')}}</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import services from "../../store/services.js";
const validatorUtil = require("~server/lib/utils/validatorUtil.js");

import { mapGetters, mapActions } from "vuex";

export default {
  name: "index",
  data() {
    return {
      fileList: [],
      appUrl: "",
      rules: {
        title: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("versionManage.title")
            }),
            trigger: "blur"
          }
        ],
        description: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("versionManage.description")
            }),
            trigger: "blur"
          }
        ],
        version: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("versionManage.version")
            }),
            trigger: "blur"
          }
        ],
        versionName: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("versionManage.versionName")
            }),
            trigger: "blur"
          }
        ]
      },
      rules1: {
        title: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("versionManage.title")
            }),
            trigger: "blur"
          }
        ],
        description: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("versionManage.description")
            }),
            trigger: "blur"
          }
        ],
        version: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("versionManage.version")
            }),
            trigger: "blur"
          }
        ],
        versionName: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("versionManage.versionName")
            }),
            trigger: "blur"
          }
        ]
      }
    };
  },
  components: {},
  methods: {
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePreview(file) {
      console.log(file);
    },
    handleExceed(files, fileList) {
      this.$message.warning(
        `当前限制选择 1 个文件，本次选择了 ${
          files.length
        } 个文件，共选择了 ${files.length + fileList.length} 个文件`
      );
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`确定移除 ${file.name}？`);
    },
    uploadSuccess(res, file) {
      this.appUrl = res.data ? res.data.path : "";
      this.$message({
        message: "文件上传成功！",
        type: "success"
      });
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.versionManage.configs;
          if (formName == "ruleIosForm") {
            params = this.versionManageIos.configs;
          }
          if (this.appUrl) {
            params = Object.assign({}, params, { url: this.appUrl });
          }
          // 更新
          services.updateVersionManage(params).then(result => {
            if (result.status === 200) {
              this.$store.dispatch("getVersionInfo");
              this.$message({
                message: this.$t("main.updateSuccess"),
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
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    }
  },
  computed: {
    ...mapGetters(["versionManage", "versionManageIos"])
  },
  mounted() {
    this.$store.dispatch("getVersionInfo");
    this.$store.dispatch("getIosVersionInfo");
    setTimeout(() => {
      let fileArr = [];
      fileArr.push({
        name: this.versionManage.configs.url,
        url: this.versionManage.configs.url
      });
      this.fileList = fileArr;
      this.appUrl = this.versionManage.configs.url;
    }, 1000);
  }
};
</script>

<style lang="scss">
.adminVersionConfig {
  margin-top: 25px;
  .line-gate {
    overflow: hidden;
    color: #606266;
    transition: height 0.2s;
    font-size: 16px;
    padding: 10px 0;
    width: 100%;
    border-bottom: 1px solid #eee;
  }
}
</style>