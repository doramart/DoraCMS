<template>
    <div class="adminSystemConfig">
        <el-row class="dr-datatable">
            <el-col :span="24">
                <el-form :model="systemConfig.configs" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
                    <el-form-item label="站点名称" prop="siteName">
                        <el-input size="small" v-model="systemConfig.configs.siteName"></el-input>
                    </el-form-item>
                    <el-form-item label="站点域名" prop="siteDomain">
                        <el-input size="small" placeholder="请输入内容" v-model="systemConfig.configs.siteDomain">
                        </el-input>
                    </el-form-item>
                    <el-form-item label="站点描述" prop="siteDiscription">
                        <el-input size="small" v-model="systemConfig.configs.siteDiscription"></el-input>
                    </el-form-item>
                    <el-form-item label="站点关键字" prop="siteKeywords">
                        <el-input size="small" v-model="systemConfig.configs.siteKeywords"></el-input>
                    </el-form-item>
                    <el-form-item label="系统邮箱服务器" prop="siteEmailServer">
                        <el-select size="small" v-model="systemConfig.configs.siteEmailServer" placeholder="请选择服务器">
                            <el-option v-for="item in serverOptions" :key="item.value" :label="item.label" :value="item.value">
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="系统邮箱" prop="siteEmail">
                        <el-input size="small" v-model="systemConfig.configs.siteEmail"></el-input>
                    </el-form-item>
                    <el-form-item label="邮箱密码" prop="siteEmailPwd">
                        <el-input size="small" type="password" v-model="systemConfig.configs.siteEmailPwd"></el-input>
                    </el-form-item>
                    <el-form-item label="备案号" prop="registrationNo">
                        <el-input size="small" v-model="systemConfig.configs.registrationNo"></el-input>
                    </el-form-item>
                    <el-form-item label="mongoDBPath" prop="mongodbInstallPath">
                        <el-input size="small" v-model="systemConfig.configs.mongodbInstallPath"></el-input>
                    </el-form-item>
                    <el-form-item label="数据备份目录" prop="databackForderPath">
                        <el-input size="small" v-model="systemConfig.configs.databackForderPath"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button size="medium" type="primary" @click="submitForm('ruleForm')">保存</el-button>
                        <el-button size="medium" @click="resetForm('ruleForm')">重置</el-button>
                    </el-form-item>
                </el-form>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import services from "../../store/services.js";
const validatorUtil = require("../../../../utils/validatorUtil.js");

import { mapGetters, mapActions } from "vuex";

export default {
  name: "index",
  data() {
    return {
      serverOptions: [
        {
          value: "QQ",
          label: "QQ"
        },
        {
          value: "163",
          label: "163"
        }
      ],
      rules: {
        siteEmailServer: [
          {
            required: true,
            message: "请选择系统邮箱服务器",
            trigger: "blur"
          }
        ],
        siteDomain: [
          {
            required: true,
            message: "请填写系统域名",
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkUrl(value)) {
                callback(new Error("请填写正确的域名!"));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        siteEmail: [
          {
            required: true,
            message: "请填写系统邮箱",
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkEmail(value)) {
                callback(new Error("请填写正确的邮箱!"));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        siteEmailPwd: [
          {
            required: true,
            message: "请输入系统邮箱密码",
            trigger: "blur"
          },
          {
            min: 6,
            max: 20,
            message: "请输入6-20个字符",
            trigger: "blur"
          }
        ],
        siteName: [
          {
            required: true,
            message: "请输入站点名称",
            trigger: "blur"
          },
          {
            min: 5,
            max: 30,
            message: "请输入5-30个字符",
            trigger: "blur"
          }
        ],
        siteDiscription: [
          {
            required: true,
            message: "请输入站点描述",
            trigger: "blur"
          },
          {
            min: 5,
            max: 200,
            message: "请输入5-200个字符",
            trigger: "blur"
          }
        ],
        siteKeywords: [
          {
            required: true,
            message: "请输入站点关键字",
            trigger: "blur"
          },
          {
            min: 5,
            max: 100,
            message: "请输入5-100个字符",
            trigger: "blur"
          }
        ],
        registrationNo: [
          {
            required: true,
            message: "请输入站点备案号",
            trigger: "blur"
          },
          {
            min: 5,
            max: 30,
            message: "请输入5-30个字符",
            trigger: "blur"
          }
        ],
        mongodbInstallPath: [
          {
            required: true,
            message: "请输入mongodb的bin目录",
            trigger: "blur"
          },
          {
            min: 5,
            max: 100,
            message: "请输入5-100个字符",
            trigger: "blur"
          }
        ],
        databackForderPath: [
          {
            required: true,
            message: "请输入数据备份路径",
            trigger: "blur"
          },
          {
            min: 5,
            max: 100,
            message: "请输入5-100个字符",
            trigger: "blur"
          }
        ]
      }
    };
  },
  components: {},
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.systemConfig.configs;
          // 更新
          services.updateSystemConfigs(params).then(result => {
            if (result.data.state === "success") {
              this.$store.dispatch("getSystemConfig");
              this.$message({
                message: "更新成功",
                type: "success"
              });
            } else {
              this.$message.error(result.data.message, result.message);
            }
          });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    }
  },
  computed: {
    ...mapGetters(["systemConfig"])
  },
  mounted() {
    this.$store.dispatch("getSystemConfig");
  }
};
</script>

<style lang="scss">
.adminSystemConfig {
  margin-top: 25px;
}
</style>