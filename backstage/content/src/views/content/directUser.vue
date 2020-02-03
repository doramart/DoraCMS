<template>
  <div class="dr-contentTagForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="4"
      :lg="4"
      :xl="4"
      title="绑定编辑"
      width="40%"
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
          在添加文档之前，您需要绑定一个默认编辑
          <span v-if="targetEditor">
            （当前编辑：
            <span style="color:red;font-weight:bold">{{targetEditor.userName}}</span>）
          </span>
        </p>
        <el-form-item label="绑定编辑" prop="targetUser">
          <el-select
            v-model="dialogState.formData.targetUser"
            filterable
            remote
            reserve-keyword
            placeholder="搜索编辑的用户名"
            :remote-method="remoteMethod"
            :loading="loading"
          >
            <el-option
              v-for="item in selectUserList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button size="medium" type="primary" @click="submitForm('ruleForm')">绑定</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import { updateContentEditor, regUserList } from "@/api/content";
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
      selectUserList: [],
      loading: false,
      rules: {
        targetUser: [
          {
            required: true,
            message: "指定用户不能为空",
            trigger: "blur"
          }
        ]
      }
    };
  },
  computed: {},
  methods: {
    remoteMethod(query) {
      if (query !== "") {
        this.loading = true;
        let _this = this;
        this.queryUserListByParams({ searchkey: query });
      } else {
        this.selectUserList = [];
      }
    },
    queryUserListByParams(params = {}) {
      let _this = this;
      regUserList(params)
        .then(result => {
          let specialList = result.data.docs;
          if (specialList) {
            _this.selectUserList = specialList.map(item => {
              return {
                value: item._id,
                label: item.userName
              };
            });
            _this.loading = false;
          } else {
            _this.selectUserList = [];
          }
        })
        .catch(err => {
          console.log(err);
          _this.selectUserList = [];
        });
    },
    confirm() {
      this.$store.dispatch("content/hideDirectUserForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          let currentParams = {
            ids: this.ids ? this.ids.join() : "",
            targetUser: params.targetUser
          };
          updateContentEditor(currentParams)
            .then(result => {
              if (result.status === 200) {
                this.$message({
                  message: this.$t("main.addSuccess"),
                  type: "success"
                });
                this.$store.dispatch("content/hideDirectUserForm");
                this.$store.dispatch("content/getContentList");
                this.$store.dispatch("adminUser/getUserInfo");
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
