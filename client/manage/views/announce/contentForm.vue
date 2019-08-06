<template>
    <div class="dr-contentForm">
        <el-form :model="formState" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
            <el-form-item :label="$t('announce.title')" prop="title">
                <el-input size="small" v-model="formState.title"></el-input>
            </el-form-item>
            <el-form-item :label="$t('announce.content')" prop="content">
                <Ueditor @ready="editorReady"></Ueditor>
            </el-form-item>
            <el-form-item class="dr-submitContent">
                <el-button size="medium" type="primary" @click="submitForm('ruleForm')">{{$t('main.post')}}</el-button>
                <el-button size="medium" @click="backToList">{{$t('main.back')}}</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<style lang="scss">
.dr-contentForm {
  margin: 15px 0;
  width: 80%;
  padding-bottom: 50px;
  .dr-submitContent {
    position: fixed;
    z-index: 9999999;
    padding: 10px 30px;
    text-align: right;
    right: 0;
    bottom: 0;
    background: none;
    margin-bottom: 0;
  }

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
    line-height: 150px;
    text-align: center;
  }
  .avatar {
    width: 200px;
    height: 158px;
    display: block;
  }
}
</style>

<script>
import services from "../../store/services.js";
import Ueditor from "../common/Ueditor.vue";
import _ from "lodash";
import { mapGetters, mapActions } from "vuex";
export default {
  props: {
    groups: Array
  },
  data() {
    return {
      content: "",
      imageUrl: "",

      rules: {
        title: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("announce.title")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 50,
            message: this.$t("validate.rangelength", { min: 5, max: 50 }),
            trigger: "blur"
          }
        ],
        content: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("announce.content")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 500,
            message: this.$t("validate.rangelength", { min: 5, max: 500 }),
            trigger: "blur"
          }
        ]
      }
    };
  },
  components: {
    Ueditor
  },
  methods: {
    editorReady(instance) {
      instance.setContent("");
      instance.addListener("contentChange", () => {
        this.content = instance.getContent();
        this.$store.dispatch(
          "showSysAnnounceForm",
          Object.assign({}, this.formState, {
            content: this.content
          })
        );
      });
    },
    backToList() {
      this.$router.push("/announce");
    },
    submitForm(formName, type = "") {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.formState;
          services.addSystemAnnounce(params).then(result => {
            if (result.data.status === 200) {
              this.$router.push("/announce");
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
  },
  computed: {
    formState() {
      return this.$store.getters.systemAnnounceFormState;
    }
  },
  mounted() {}
};
</script>
