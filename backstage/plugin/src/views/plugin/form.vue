<template>
  <div class="dr-PluginForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      width="70%"
      title="插件详情"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      <div class="pluginLabel" v-highlight v-html="showOperationInstructions"></div>
    </el-dialog>
  </div>
</template>
<script>
import { addPlugin, updatePlugin } from "@/api/plugin";
import showdown from "showdown";
import _ from "lodash";
export default {
  props: {
    dialogState: Object,
    groups: Array
  },
  data() {
    return {
      yellow: {
        color: "#F7BA2A"
      },
      gray: {
        color: "#CCC"
      },
      green: { color: "#13CE66" },
      red: { color: "#FF4949" },
      rules: {
        alias: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        pkgName: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        enName: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        name: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        description: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        isadm: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        isindex: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        version: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        iconName: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        adminUrl: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        adminApi: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        fontApi: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        initData: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        pluginsConfig: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        defaultConfig: [
          {
            required: true,

            trigger: "blur"
          }
        ]
      }
    };
  },
  components: {},
  computed: {
    showOperationInstructions() {
      let converter = new showdown.Converter();
      let text = this.dialogState.formData.operationInstructions;
      if (text) {
        let html = converter.makeHtml(text);
        return html;
      } else {
        return "";
      }
    }
  },
  methods: {
    confirm() {
      this.$store.dispatch("plugin/hidePluginForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            updatePlugin(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("plugin/hidePluginForm");
                this.$store.dispatch("plugin/getPluginList");
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
            addPlugin(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("plugin/hidePluginForm");
                this.$store.dispatch("plugin/getPluginList");
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
  }
};
</script>
<style lang="scss">
.edui-default .edui-toolbar {
  line-height: 20px !important;
}
.pluginLabel img {
  width: 80% !important;
}
</style>