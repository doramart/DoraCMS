<template>
  <div class="dr-adminGroupForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      :title="(formState.edit?$t('main.modify'):$t('main.addNew'))+(adsType == '1'?$t('ads.typePic'):$t('ads.textLink'))"
      :visible.sync="formState.show"
      :close-on-click-modal="false"
    >
      <el-form
        v-if="adsType == '1'"
        :model="formState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="80px"
        class="demo-ruleForm"
        :label-position="device == 'mobile' ? 'top' : 'right'"
      >
        <el-form-item :label="$t('ads.dis')" prop="alt">
          <el-input size="small" v-model="formState.formData.alt"></el-input>
        </el-form-item>
        <el-form-item :label="$t('ads.link')" prop="link">
          <el-input size="small" v-model="formState.formData.link"></el-input>
        </el-form-item>
        <el-form-item :label="$t('ads.appLink')" prop="appLink">
          <el-input size="small" v-model="formState.formData.appLink"></el-input>
        </el-form-item>
        <el-form-item :label="$t('ads.appLinkType')" prop="appLinkType">
          <el-select v-model="formState.formData.appLinkType" placeholder="请选择app链接类型">
            <el-option
              v-for="item in linkTypeOpts"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('ads.upload')" prop="sImg">
          <el-upload
            class="avatar-uploader"
            action="/api/upload/files"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :data="{action:'uploadimage'}"
          >
            <img v-if="formState.formData.sImg" :src="formState.formData.sImg" class="avatar" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button
            size="medium"
            type="primary"
            @click="submitForm('ruleForm')"
          >{{formState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
        </el-form-item>
      </el-form>
      <el-form
        v-if="adsType == '0'"
        :model="formState.formData"
        :rules="rules1"
        ref="ruleForm1"
        label-width="80px"
        class="demo-ruleForm"
      >
        <el-form-item :label="$t('ads.textContent')" prop="title">
          <el-input size="small" v-model="formState.formData.title"></el-input>
        </el-form-item>
        <el-form-item :label="$t('ads.link')" prop="link">
          <el-input size="small" v-model="formState.formData.link"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            size="smmediumall"
            type="primary"
            @click="submitForm('ruleForm1')"
          >{{formState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import _ from "lodash";
export default {
  props: {
    formState: Object,
    device: String
  },
  data() {
    return {
      linkTypeOpts: [
        { value: "0", label: "文章" },
        { value: "1", label: "链接" }
      ],
      rules1: {
        title: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("ads.textContent")
            }),
            trigger: "blur"
          },
          {
            min: 2,
            max: 15,
            message: this.$t("validate.ranglengthandnormal", {
              min: 2,
              max: 15
            }),
            trigger: "blur"
          }
        ],
        link: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("main.comments_label")
            }),
            trigger: "blur"
          }
        ]
      },
      rules: {
        alt: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("ads.dis")
            }),
            trigger: "blur"
          },
          {
            min: 2,
            max: 30,
            message: this.$t("validate.ranglengthandnormal", {
              min: 2,
              max: 30
            }),
            trigger: "blur"
          }
        ],
        link: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("main.comments_label")
            }),
            trigger: "blur"
          }
        ]
      }
    };
  },
  computed: {
    adsType() {
      return this.$store.getters.adsInfoForm.formData.type;
    }
  },
  methods: {
    handleAvatarSuccess(res, file) {
      this.formState.formData.sImg = res.data.path;
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === "image/jpeg";
      const isPNG = file.type === "image/png";
      const isGIF = file.type === "image/gif";
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJPG && !isPNG && !isGIF) {
        this.$message.error(this.$t("validate.limitUploadImgType"));
      }
      if (!isLt2M) {
        this.$message.error(
          this.$t("validate.limitUploadImgSize", { size: 2 })
        );
      }
      return (isJPG || isPNG || isGIF) && isLt2M;
    },
    submitForm(formName, type = "") {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.formState.formData;
          let oldFormState = this.$store.getters.adsInfoForm;
          let adsItems = oldFormState.formData.items;
          // 更新
          if (this.formState.edit) {
            for (let i = 0; i < adsItems.length; i++) {
              if (adsItems[i]._id == params._id) adsItems[i] = params;
            }
            this.$store.dispatch("ads/adsInfoForm", oldFormState);
          } else {
            // 新增
            adsItems.push(params);
            this.$store.dispatch("ads/adsInfoForm", oldFormState);
          }
          this.$store.dispatch("ads/hideAdsItemForm");
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
</style>

