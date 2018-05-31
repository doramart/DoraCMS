<template>
    <div class="dr-AdminResourceForm">
        <el-dialog width="35%" size="small" :title="$t('contentCategory.form_title')" :visible.sync="dialogState.show" :close-on-click-modal="false">
            <el-form :model="dialogState.formData" :rules="cateRules" ref="cateRuleForm" label-width="120px" class="demo-ruleForm">
                <el-form-item v-show="dialogState.type==='children' && !dialogState.edit" :label="$t('adminResource.lb_parentType')" prop="label">
                    <el-input size="small" :disabled="true" v-model="dialogState.formData.parentObj.name"></el-input>
                </el-form-item>
                <el-form-item :label="$t('contentCategory.cate_name')" prop="name">
                    <el-input size="small" v-model="dialogState.formData.name"></el-input>
                </el-form-item>
                <el-form-item :label="$t('contentCategory.enabel')" prop="enable">
                    <el-switch :on-text="$t('main.radioOn')" :off-text="$t('main.radioOff')" v-model="dialogState.formData.enable"></el-switch>
                </el-form-item>
                <el-form-item :label="$t('contentCategory.type')" prop="type">
                  <el-radio class="radio" v-model="dialogState.formData.type" label="1">{{$t('contentCategory.typeNormal')}}</el-radio>
              </el-form-item>
              <el-form-item v-show="dialogState.formData.parentId == '0'" :label="$t('templateConfig.temp')" prop="contentTemp">
                    <el-select size="small" v-model="dialogState.formData.contentTemp" placeholder="请选择">
                      <el-option
                        v-for="item in forderlist"
                        :key="item._id"
                        :label="item.name"
                        :value="item._id">
                      </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('contentCategory.seoUrl')" prop="defaultUrl">
                    <el-input size="small" v-model="dialogState.formData.defaultUrl"></el-input>
                </el-form-item>
                <el-form-item :label="$t('contentCategory.sort')" prop="sortId">
                    <el-input-number size="small" v-model="dialogState.formData.sortId" @change="handleChange" :min="1" :max="50"></el-input-number>
                </el-form-item>
                <el-form-item :label="$t('contentCategory.keywords')" prop="keywords">
                    <el-input type="textarea" :rows="2"  v-model="dialogState.formData.keywords"> </el-input>
                </el-form-item>
                <el-form-item :label="$t('contentCategory.comments')" prop="comments">
                    <el-input size="small" type="texarea" v-model="dialogState.formData.comments"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button size="medium" type="primary" @click="submitForm('cateRuleForm')">{{dialogState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>
    </div>
</template>
<script>
import services from "../../store/services.js";
import _ from "lodash";
export default {
  props: ["dialogState", "forderlist"],
  data() {
    return {
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
    handleChange(value) {
      console.log(value);
    },
    confirm() {
      this.$store.dispatch("hideContentCategoryForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          // console.log("---formdatas--", this);
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            services.updateContentCategory(params).then(result => {
              if (result.data.status === 200) {
                this.$store.dispatch("hideContentCategoryForm");
                this.$store.dispatch("getContentCategoryList");
                this.$message({
                  message: this.$t("main.updateSuccess"),
                  type: "success"
                });
              } else {
                this.$message.error(result.data.message);
              }
            });
          } else {
            // 新增
            services.addContentCategory(params).then(result => {
              if (result.data.status === 200) {
                this.$store.dispatch("hideContentCategoryForm");
                this.$store.dispatch("getContentCategoryList");
                this.$message({
                  message: this.$t("main.addSuccess"),
                  type: "success"
                });
              } else {
                this.$message.error(result.data.message);
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