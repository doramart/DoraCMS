<template>
  <div class="dr-contentTagForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="4"
      :lg="4"
      :xl="4"
      title="分配用户"
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
          您已选中
          <span style="color:red">{{ids.length}}</span> 篇文章做指定用户操作。操作无法撤回，请谨慎操作
        </p>
        <el-form-item label="目标用户" prop="targetUser">
          <el-select
            v-model="dialogState.formData.targetUser"
            filterable
            remote
            reserve-keyword
            placeholder="请输入要分配的用户名"
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
import services from "../../store/services.js";
import _ from "lodash";
export default {
  props: {
    dialogState: Object,
    groups: Array,
    ids: Array
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
      services
        .regUserList(params)
        .then(result => {
          let specialList = result.data.data.docs;
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
      this.$store.dispatch("hideDirectUserForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          let currentParams = {
            ids: this.ids ? this.ids.join() : "",
            targetUser: params.targetUser
          };
          services
            .redictContentToUsers(currentParams)
            .then(result => {
              if (result.data.status === 200) {
                this.$message({
                  message: this.$t("main.addSuccess"),
                  type: "success"
                });
                this.$store.dispatch("hideDirectUserForm");
                this.$store.dispatch("getContentList");
              } else {
                this.$message.error(result.data.message);
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
