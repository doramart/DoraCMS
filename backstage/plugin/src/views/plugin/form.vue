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
      <el-form
        :model="dialogState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="120px"
        class="demo-ruleForm"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="grid-content bg-purple">
              <el-form-item :label="$t('plugin.alias')" prop="alias">
                <div class="pluginLabel">{{dialogState.formData.alias}}</div>
              </el-form-item>

              <el-form-item :label="$t('plugin.pkgName')" prop="pkgName">
                <div class="pluginLabel">{{dialogState.formData.pkgName}}</div>
              </el-form-item>

              <el-form-item :label="$t('plugin.enName')" prop="enName">
                <div class="pluginLabel">{{dialogState.formData.enName}}</div>
              </el-form-item>

              <el-form-item :label="$t('plugin.name')" prop="name">
                <div class="pluginLabel">{{dialogState.formData.name}}</div>
              </el-form-item>
              <el-form-item :label="$t('plugin.iconName')" prop="iconName">
                <div class="pluginLabel">{{dialogState.formData.iconName}}</div>
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="grid-content bg-purple">
              <el-form-item :label="$t('plugin.description')" prop="description">
                <div class="pluginLabel">{{dialogState.formData.description}}</div>
              </el-form-item>

              <el-form-item :label="$t('plugin.isadm')" prop="isadm">
                <template>
                  <svg-icon
                    v-show="dialogState.formData.isadm=='1'"
                    :style="green"
                    icon-class="check-circle-fill"
                  />
                  <svg-icon
                    v-show="dialogState.formData.isadm!='1'"
                    :style="red"
                    icon-class="minus-circle-fill"
                  />
                </template>
              </el-form-item>

              <el-form-item :label="$t('plugin.isindex')" prop="isindex">
                <template>
                  <svg-icon
                    v-show="dialogState.formData.isindex=='1'"
                    :style="green"
                    icon-class="check-circle-fill"
                  />
                  <svg-icon
                    v-show="dialogState.formData.isindex!='1'"
                    :style="red"
                    icon-class="minus-circle-fill"
                  />
                </template>
              </el-form-item>

              <el-form-item :label="$t('plugin.version')" prop="version">
                <div class="pluginLabel">{{dialogState.formData.version}}</div>
              </el-form-item>
              <el-form-item :label="$t('plugin.initData')" prop="initData">
                <div class="pluginLabel">{{dialogState.formData.initData}}</div>
              </el-form-item>
            </div>
          </el-col>
        </el-row>

        <el-form-item :label="$t('plugin.adminUrl')" prop="adminUrl">
          <div class="pluginLabel">{{dialogState.formData.adminUrl}}</div>
        </el-form-item>

        <el-form-item :label="$t('plugin.adminApi')" prop="adminApi">
          <!-- <template> -->
          <ul>
            <li v-for="(apiItem,index) in dialogState.formData.adminApi" :key="'adminApi_'+index">
              <ul>
                <li>
                  <label>url:</label>
                  {{apiItem.url}}
                </li>
                <li>
                  <label>method:</label>
                  {{apiItem.method.toUpperCase()}}
                </li>
                <li>
                  <label>controllerName:</label>
                  {{apiItem.controllerName}}
                </li>
                <li>
                  <label>details:</label>
                  {{apiItem.details}}
                </li>
              </ul>
            </li>
          </ul>
          <!-- </template> -->
        </el-form-item>

        <el-form-item :label="$t('plugin.fontApi')" prop="fontApi">
          <template>
            <ul>
              <li v-for="(apiItem,index) in dialogState.formData.fontApi" :key="'fontApi_'+index">
                <ul>
                  <li>
                    <label>url:</label>
                    {{apiItem.url}}
                  </li>
                  <li>
                    <label>method:</label>
                    {{apiItem.method.toUpperCase()}}
                  </li>
                  <li>
                    <label>controllerName:</label>
                    {{apiItem.controllerName}}
                  </li>
                  <li>
                    <label>details:</label>
                    {{apiItem.details}}
                  </li>
                </ul>
              </li>
            </ul>
          </template>
        </el-form-item>

        <el-form-item :label="$t('plugin.pluginsConfig')" prop="pluginsConfig">
          <div class="pluginLabel" v-html="dialogState.formData.pluginsConfig"></div>
        </el-form-item>

        <el-form-item :label="$t('plugin.defaultConfig')" prop="defaultConfig">
          <div class="pluginLabel" v-html="dialogState.formData.defaultConfig"></div>
        </el-form-item>

        <!-- <el-form-item>
          <el-button
            size="medium"
            type="primary"
            @click="submitForm('ruleForm')"
          >{{dialogState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
        </el-form-item>-->
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import { addPlugin, updatePlugin } from "@/api/plugin";

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
</style>