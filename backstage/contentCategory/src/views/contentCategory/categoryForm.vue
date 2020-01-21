<template>
  <div class="dr-AdminResourceForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      :title="$t('contentCategory.form_title')"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      <el-form
        :model="dialogState.formData"
        :rules="cateRules"
        ref="cateRuleForm"
        label-width="120px"
        class="demo-ruleForm"
      >
        <el-form-item
          v-show="dialogState.type==='children' && !dialogState.edit"
          :label="$t('contentCategory.parentType')"
          prop="label"
        >
          <el-input size="small" :disabled="true" v-model="dialogState.formData.parentObj.name"></el-input>
        </el-form-item>
        <el-form-item :label="$t('contentCategory.cate_name')" prop="name">
          <el-input size="small" v-model="dialogState.formData.name"></el-input>
        </el-form-item>
        <el-form-item :label="$t('contentCategory.enabel')" prop="enable">
          <el-switch
            :on-text="$t('main.radioOn')"
            :off-text="$t('main.radioOff')"
            v-model="dialogState.formData.enable"
          ></el-switch>
        </el-form-item>
        <el-form-item :label="$t('contentCategory.type')" prop="type">
          <el-radio
            class="radio"
            v-model="dialogState.formData.type"
            label="1"
          >{{$t('contentCategory.typeNormal')}}</el-radio>
          <el-radio
            class="radio"
            v-model="dialogState.formData.type"
            label="2"
          >{{$t('contentCategory.typeSinger')}}</el-radio>
        </el-form-item>
        <el-form-item label="图标" prop="sImg" v-show="dialogState.formData.parentId == '0'">
          <el-upload
            class="avatar-uploader"
            action="/api/upload/files"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :data="{action:'uploadimage'}"
          >
            <img v-if="dialogState.formData.sImg" :src="dialogState.formData.sImg" class="avatar" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item
          v-show="dialogState.formData.parentId == '0'"
          :label="$t('contentCategory.temp')"
          prop="contentTemp"
        >
          <el-select size="small" v-model="dialogState.formData.contentTemp" placeholder="请选择">
            <el-option
              v-for="item in forderlist"
              :key="item._id"
              :label="item.name"
              :value="item._id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('contentCategory.seoUrl')" prop="defaultUrl">
          <el-input size="small" v-model="dialogState.formData.defaultUrl"></el-input>
        </el-form-item>
        <el-form-item :label="$t('contentCategory.sort')" prop="sortId">
          <el-input-number
            size="small"
            v-model="dialogState.formData.sortId"
            @change="handleChange"
            :min="1"
            :max="50"
          ></el-input-number>
        </el-form-item>
        <el-form-item :label="$t('contentCategory.keywords')" prop="keywords">
          <el-input type="textarea" :rows="2" v-model="dialogState.formData.keywords"></el-input>
        </el-form-item>
        <el-form-item :label="$t('contentCategory.comments')" prop="comments">
          <el-input size="small" type="texarea" v-model="dialogState.formData.comments"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            size="medium"
            type="primary"
            @click="submitForm('cateRuleForm')"
          >{{dialogState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import {
  addContentCategory,
  updateContentCategory
} from "@/api/contentCategory";
import settings from "@root/publicMethods/settings";
import _ from "lodash";
export default {
  props: ["dialogState", "forderlist"],
  data() {
    return {
      server_api: settings.server_api,
      cateRules: {
        name: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contentCategory.cate_name")
            }),
            trigger: "blur"
          },
          {
            min: 2,
            max: 20,
            message: this.$t("validate.rangelength", { min: 2, max: 20 }),
            trigger: "blur"
          }
        ],
        defaultUrl: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contentCategory.seoUrl")
            }),
            trigger: "blur"
          }
        ],
        comments: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("main.comments_label")
            }),
            trigger: "blur"
          },
          {
            min: 4,
            max: 100,
            message: this.$t("validate.ranglengthandnormal", {
              min: 4,
              max: 100
            }),
            trigger: "blur"
          }
        ]
      }
    };
  },
  methods: {
    handleAvatarSuccess(res, file) {
      let imageUrl = res.data.path;
      this.$store.dispatch("contentCategory/showContentCategoryForm", {
        edit: this.dialogState.edit,
        formData: Object.assign({}, this.dialogState.formData, {
          sImg: imageUrl
        })
      });
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
    handleChange(value) {
      console.log(value);
    },
    confirm() {
      this.$store.dispatch("contentCategory/hideContentCategoryForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          // console.log("---formdatas--", this);
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            updateContentCategory(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("contentCategory/hideContentCategoryForm");
                this.$store.dispatch("contentCategory/getContentCategoryList");
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
            addContentCategory(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("contentCategory/hideContentCategoryForm");
                this.$store.dispatch("contentCategory/getContentCategoryList");
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
  },
  computed: {}
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
  width: 150px;
  height: 150px;
  line-height: 150px !important;
  text-align: center;
}
.avatar {
  width: 150px;
  height: 158px;
  display: block;
}
</style>