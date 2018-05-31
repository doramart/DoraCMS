<template>
    <div class="dr-contentMessageForm">
        <el-dialog width="35%" size="small" :title="$t('contentMessage.replyUser')" :visible.sync="dialogState.show" :close-on-click-modal="false">
            <el-form :model="dialogState.formData" :rules="rules" ref="ruleForm" label-width="90px" class="demo-ruleForm">
                <el-form-item :label="$t('contentMessage.userSaid')">
                    {{dialogState.parentformData.content}}
                </el-form-item>
                <el-form-item :label="$t('contentMessage.reply')" prop="content">
                    <el-input size="small" type="textarea" v-model="dialogState.formData.content"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button size="medium" type="primary" @click="submitForm('ruleForm')">{{$t('contentMessage.reply')}}</el-button>
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
    groups: Array
  },
  data() {
    return {
      rules: {
        content: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contentMessage.content")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 200,
            message: this.$t("validate.ranglengthandnormal", {
              min: 2,
              max: 200
            }),
            trigger: "blur"
          }
        ]
      }
    };
  },
  methods: {
    confirm() {
      this.$store.dispatch("hideContentMessageForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let parentParams = this.dialogState.parentformData,
            repFormData = {};
          repFormData.relationMsgId = parentParams._id;
          repFormData.contentId = parentParams.contentId._id;
          repFormData.utype = "1";
          if (parentParams.author) {
            repFormData.replyAuthor = parentParams.author._id;
          } else if (parentParams.adminAuthor) {
            repFormData.adminReplyAuthor = parentParams.adminAuthor._id;
          }

          repFormData.content = this.dialogState.formData.content;
          // 新增
          services.addContentMessage(repFormData).then(result => {
            if (result.data.status === 200) {
              this.$store.dispatch("hideContentMessageForm");
              this.$store.dispatch("getContentMessageList");
              this.$message({
                message: this.$t("main.addSuccess"),
                type: "success"
              });
            } else {
              this.$message.error(result.data.message);
            }
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