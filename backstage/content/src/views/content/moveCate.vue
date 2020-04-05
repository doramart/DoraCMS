<template>
  <div class="dr-moveCateForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="4"
      :lg="4"
      :xl="4"
      title="选择分类"
      width="30%"
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
        <p class="notice-tip">
          您当前选择了
          <span style="color:red;font-weight:bold">{{ids.length}}</span> 篇文章
        </p>
        <el-form-item :label="$t('contents.categories')" prop="categories">
          <el-cascader
            size="small"
            expandTrigger="hover"
            :options="contentCategoryList.docs"
            v-model="dialogState.formData.categories"
            @change="handleChangeCategory"
            :props="categoryProps"
          ></el-cascader>
        </el-form-item>
        <el-form-item>
          <el-button size="medium" type="primary" @click="submitForm('ruleForm')">确定</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import { moveContentCate } from "@/api/content";
import _ from "lodash";
export default {
  props: {
    dialogState: Object,
    groups: Array,
    ids: Array,
    targetEditor: Object
  },
  data() {
    return {
      categoryProps: {
        value: "_id",
        label: "name",
        children: "children"
      },
      categories: [],
      selectUserList: [],
      loading: false,
      rules: {
        categories: [
          {
            required: true,
            message: "指定分类不能为空",
            trigger: "blur"
          }
        ]
      }
    };
  },
  computed: {
    ...mapGetters(["contentCategoryList"])
  },
  methods: {
    handleChangeCategory(value) {
      console.log(value);
    },
    confirm() {
      this.$store.dispatch("content/hideDirectUserForm");
    },
    submitForm(formName) {
      let _this = this;
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          let currentParams = {
            ids: this.ids ? this.ids.join() : "",
            categories: params.categories
          };

          if (!_this.ids || _.isEmpty(_this.ids)) {
            this.$message.warning("请选择至少一篇文章！");
            return;
          }
          moveContentCate(currentParams)
            .then(result => {
              if (result.status === 200) {
                this.$message({
                  message: this.$t("main.addSuccess"),
                  type: "success"
                });
                this.$store.dispatch("content/hideMoveCateForm");
                this.$store.dispatch("content/getContentList");
              } else {
                this.$message.error(result.message);
              }
            })
            .catch(err => {
              this.$message.error(err.message);
            });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    }
  },
  mounted() {
    this.$store.dispatch("contentCategory/getContentCategoryList");
  }
};
</script>
<style lang="scss" scoped>
.notice-tip {
  padding: 8px 16px;
  background-color: #ecf8ff;
  border-radius: 4px;
  border-left: 5px solid #50bfff;
  margin: 0 0 25px;
}
</style>
