<template>
    <div class="dr-AdminResourceForm">
        <el-dialog width="35%" size="small" title="填写分类信息" :visible.sync="dialogState.show" :close-on-click-modal="false">
            <el-form :model="dialogState.formData" :rules="cateRules" ref="cateRuleForm" label-width="120px" class="demo-ruleForm">
                <el-form-item v-show="dialogState.type==='children' && !dialogState.edit" label="父对象" prop="label">
                    <el-input size="small" :disabled="true" v-model="dialogState.formData.parentObj.name"></el-input>
                </el-form-item>
                <el-form-item label="类别名称" prop="name">
                    <el-input size="small" v-model="dialogState.formData.name"></el-input>
                </el-form-item>
                <el-form-item label="显示" prop="enable">
                    <el-switch on-text="是" off-text="否" v-model="dialogState.formData.enable"></el-switch>
                </el-form-item>
                <el-form-item label="SeoUrl" prop="defaultUrl">
                    <el-input size="small" v-model="dialogState.formData.defaultUrl"></el-input>
                </el-form-item>
                <el-form-item label="排序" prop="sortId">
                    <el-input-number size="small" v-model="dialogState.formData.sortId" @change="handleChange" :min="1" :max="50"></el-input-number>
                </el-form-item>
                <el-form-item label="关键字" prop="keywords">
                    <el-input type="textarea" :rows="2" placeholder="请输入内容" v-model="dialogState.formData.keywords"> </el-input>
                </el-form-item>
                <el-form-item label="描述" prop="comments">
                    <el-input size="small" type="texarea" v-model="dialogState.formData.comments"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button size="medium" type="primary" @click="submitForm('cateRuleForm')">{{dialogState.edit ? '更新' : '保存'}}</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>
    </div>
</template>
<script>
import services from "../../store/services.js";
import _ from "lodash";
export default {
  props: {
    dialogState: Object
  },
  data() {
    return {
      cateRules: {
        name: [
          {
            required: true,
            message: "请输入类别名称",
            trigger: "blur"
          },
          {
            min: 2,
            max: 20,
            message: "2-20个非特殊字符",
            trigger: "blur"
          }
        ],
        defaultUrl: [
          {
            required: true,
            message: "请输入seoUrl",
            trigger: "blur"
          }
        ],
        comments: [
          {
            message: "请填写备注",
            trigger: "blur"
          },
          {
            min: 4,
            max: 100,
            message: "请输入4-100个字符",
            trigger: "blur"
          }
        ]
      },
      options: [
        {
          value: "0",
          label: "基础菜单"
        },
        {
          value: "1",
          label: "操作和功能"
        }
      ]
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
          console.log("---formdatas--", this);
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            services.updateContentCategory(params).then(result => {
              if (result.data.state === "success") {
                this.$store.dispatch("hideContentCategoryForm");
                this.$store.dispatch("getContentCategoryList");
                this.$message({
                  message: "更新成功",
                  type: "success"
                });
              } else {
                this.$message.error(result.data.message);
              }
            });
          } else {
            // 新增
            services.addContentCategory(params).then(result => {
              if (result.data.state === "success") {
                this.$store.dispatch("hideContentCategoryForm");
                this.$store.dispatch("getContentCategoryList");
                this.$message({
                  message: "添加成功",
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