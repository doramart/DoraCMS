<template>
  <div class="dr-AdminResourceForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      :title="$t('adminResource.lb_resourceForm_title')"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      <el-form
        :model="dialogState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="120px"
        class="demo-ruleForm"
      >
        <el-form-item
          v-show="dialogState.type==='children' && !dialogState.edit"
          :label="$t('adminResource.lb_parentType')"
          prop="label"
        >
          <el-input size="small" :disabled="true" v-model="dialogState.formData.parent.label"></el-input>
        </el-form-item>
        <el-form-item :label="$t('adminResource.lb_resource_dis')" prop="comments">
          <el-input size="small" v-model="dialogState.formData.comments"></el-input>
        </el-form-item>
        <el-form-item :label="$t('adminResource.lb_name')" prop="label">
          <el-input size="small" v-model="dialogState.formData.label"></el-input>
        </el-form-item>
        <el-form-item :label="$t('adminResource.lb_type')" prop="type">
          <el-select
            size="small"
            v-model="dialogState.formData.type"
            :placeholder="$t('main.ask_select_label')"
            @change="changeType"
          >
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <div v-if="dialogState.formData.type === '0'">
          <el-form-item label="Icon" prop="componentPath">
            <el-input size="small" v-model="dialogState.formData.icon"></el-input>
          </el-form-item>
          <div v-if="dialogState.formData.parentId !== '0'">
            <el-form-item :label="$t('adminResource.lb_router')" prop="routePath">
              <el-input size="small" v-model="dialogState.formData.routePath"></el-input>
            </el-form-item>
            <el-form-item :label="$t('adminResource.lb_temp')" prop="componentPath">
              <el-input size="small" v-model="dialogState.formData.componentPath">
                <template slot="prepend">/component/</template>
              </el-input>
            </el-form-item>
            <el-form-item :label="$t('adminResource.lb_showon_meun')" prop="enable">
              <el-switch
                :on-text="$t('main.radioOn')"
                :off-text="$t('main.radioOff')"
                v-model="dialogState.formData.enable"
              ></el-switch>
            </el-form-item>
          </div>
        </div>
        <div v-else>
          <el-form-item :label="$t('adminResource.lb_resource_file_path')" prop="api">
            <el-input size="small" v-model="dialogState.formData.api">
              <template slot="prepend">/manage/</template>
            </el-input>
          </el-form-item>
        </div>
        <el-form-item :label="$t('main.sort_label')" prop="sortId">
          <el-input-number
            size="small"
            v-model="dialogState.formData.sortId"
            @change="handleChange"
            :min="1"
            :max="50"
          ></el-input-number>
        </el-form-item>

        <el-form-item>
          <el-button
            size="medium"
            type="primary"
            @click="submitForm('ruleForm')"
          >{{dialogState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
          <el-button size="medium" @click="resetForm('ruleForm')">{{$t('main.reSetBtnText')}}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import services from "../../store/services.js";
const validatorUtil = require("~server/lib/utils/validatorUtil.js");
export default {
  props: {
    dialogState: Object
  },
  data() {
    return {
      rules: {
        label: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("adminResource.lb_name")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkResourceName(value, 2, 30)) {
                callback(
                  new Error(
                    this.$t("validate.rangelength", { min: 2, max: 30 })
                  )
                );
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        type: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("adminResource.lb_type")
            }),
            trigger: "change"
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
            min: 2,
            max: 30,
            message: this.$t("validate.ranglengthandnormal", {
              min: 2,
              max: 30
            }),
            trigger: "blur"
          }
        ]
      },
      options: [
        {
          value: "0",
          label: this.$t("adminResource.lb_base_menu")
        },
        {
          value: "1",
          label: this.$t("adminResource.lb_options")
        }
      ]
    };
  },
  methods: {
    handleChange(value) {
      console.log(value);
    },
    changeType(value) {},
    confirm() {
      this.$store.dispatch("hideAdminResourceForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            services.updateAdminResource(params).then(result => {
              if (result.data.status === 200) {
                this.$store.dispatch("hideAdminResourceForm");
                this.$store.dispatch("getAdminResourceList");
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
            services.addAdminResource(params).then(result => {
              if (result.data.status === 200) {
                this.$store.dispatch("hideAdminResourceForm");
                this.$store.dispatch("getAdminResourceList");
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
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    }
  }
};
</script>