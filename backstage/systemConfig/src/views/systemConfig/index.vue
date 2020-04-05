<template>
  <div :class="classObj" class="adminSystemConfig">
    <div class="main-container">
      <el-row class="dr-datatable">
        <el-col :span="24">
          <el-form
            :model="systemConfig.configs"
            :rules="rules"
            ref="ruleForm"
            label-width="120px"
            class="demo-ruleForm"
            :label-position="device == 'mobile' ? 'top' : 'right'"
          >
            <el-form-item :label="$t('sysTemConfigs.site_name')" prop="siteName">
              <el-input size="small" v-model="systemConfig.configs.siteName"></el-input>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.site_logo')" prop="siteLogo">
              <el-upload
                class="avatar-uploader"
                action="/api/upload/files"
                :show-file-list="false"
                :on-success="handleLogoSuccess"
                :before-upload="beforeLogoUpload"
                :data="{action:'uploadimage'}"
              >
                <img
                  v-if="systemConfig.configs.siteLogo"
                  :src="systemConfig.configs.siteLogo"
                  class="avatar"
                />
                <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              </el-upload>
            </el-form-item>
            <el-form-item label="详情标题" prop="ogTitle">
              <el-input size="small" v-model="systemConfig.configs.ogTitle"></el-input>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.site_domain')" prop="siteDomain">
              <el-input size="small" v-model="systemConfig.configs.siteDomain"></el-input>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.site_dis')" prop="siteDiscription">
              <el-input size="small" v-model="systemConfig.configs.siteDiscription"></el-input>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.site_keyWords')" prop="siteKeywords">
              <el-input size="small" v-model="systemConfig.configs.siteKeywords"></el-input>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.site_tags')" prop="siteAltKeywords">
              <el-input size="small" v-model="systemConfig.configs.siteAltKeywords"></el-input>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.site_verify_code')" prop="showImgCode">
              <el-switch
                :on-text="$t('main.radioOn')"
                :off-text="$t('main.radioOff')"
                v-model="systemConfig.configs.showImgCode"
              ></el-switch>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.email_server')" prop="siteEmailServer">
              <el-select
                size="small"
                v-model="systemConfig.configs.siteEmailServer"
                :placeholder="$t('main.ask_select_label')"
              >
                <el-option
                  v-for="item in serverOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.site_email')" prop="siteEmail">
              <el-input size="small" v-model="systemConfig.configs.siteEmail"></el-input>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.site_email_password')" prop="siteEmailPwd">
              <el-input
                size="small"
                :placeholder="$t('main.noModifyPasswordTips')"
                type="password"
                v-model="systemConfig.configs.siteEmailPwd"
              ></el-input>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.site_icp')" prop="registrationNo">
              <el-input size="small" v-model="systemConfig.configs.registrationNo"></el-input>
            </el-form-item>
            <el-form-item :label="$t('sysTemConfigs.statisticalCode')" prop="statisticalCode">
              <el-input size="small" v-model="systemConfig.configs.statisticalCode"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button
                size="medium"
                type="primary"
                @click="submitForm('ruleForm')"
              >{{$t('main.form_btnText_save')}}</el-button>
              <el-button size="medium" @click="resetForm('ruleForm')">{{$t('main.reSetBtnText')}}</el-button>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import { updateSystemConfigs } from "@/api/systemConfig";
import { checkUrl, checkEmail } from "@/utils/validate";
import { initEvent } from "@root/publicMethods/events";

import { mapGetters, mapActions } from "vuex";

export default {
  name: "index",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop",
      dateRateOpt: [
        {
          value: "1",
          label: this.$t("sysTemConfigs.perDate", { label: "1" })
        },
        {
          value: "3",
          label: this.$t("sysTemConfigs.perDate", { label: "3" })
        },
        {
          value: "5",
          label: this.$t("sysTemConfigs.perDate", { label: "5" })
        }
      ],
      serverOptions: [
        {
          value: "QQ",
          label: "QQ"
        },
        {
          value: "smtp.exmail.qq.com",
          label: "腾讯企业邮箱"
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
            message: this.$t("validate.selectNull", {
              label: this.$t("sysTemConfigs.email_server")
            }),
            trigger: "blur"
          }
        ],
        siteDomain: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("sysTemConfigs.site_domain")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!checkUrl(value)) {
                callback(
                  new Error(
                    this.$t("validate.inputCorrect", {
                      label: this.$t("sysTemConfigs.site_domain")
                    })
                  )
                );
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
            message: this.$t("validate.inputNull", {
              label: this.$t("sysTemConfigs.site_email")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!checkEmail(value)) {
                callback(
                  new Error(
                    this.$t("validate.inputCorrect", {
                      label: this.$t("sysTemConfigs.site_email")
                    })
                  )
                );
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        siteEmailPwd: [
          {
            min: 6,
            max: 100,
            message: this.$t("validate.ranglengthandnormal", {
              min: 6,
              max: 100
            }),
            trigger: "blur"
          }
        ],
        siteName: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("sysTemConfigs.site_name")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 100,
            message: this.$t("validate.ranglengthandnormal", {
              min: 5,
              max: 100
            }),
            trigger: "blur"
          }
        ],
        siteDiscription: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("sysTemConfigs.site_dis")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 200,
            message: this.$t("validate.ranglengthandnormal", {
              min: 5,
              max: 200
            }),
            trigger: "blur"
          }
        ],
        siteKeywords: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("sysTemConfigs.site_keyWords")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 100,
            message: this.$t("validate.ranglengthandnormal", {
              min: 5,
              max: 100
            }),
            trigger: "blur"
          }
        ],
        siteAltKeywords: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("sysTemConfigs.site_tags")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 100,
            message: this.$t("validate.ranglengthandnormal", {
              min: 5,
              max: 100
            }),
            trigger: "blur"
          }
        ],
        registrationNo: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("sysTemConfigs.site_icp")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 30,
            message: this.$t("validate.ranglengthandnormal", {
              min: 5,
              max: 30
            }),
            trigger: "blur"
          }
        ]
      }
    };
  },
  components: {},
  methods: {
    handleLogoSuccess(res, file) {
      let imageUrl = res.data.path;
      this.systemConfig.configs.siteLogo = imageUrl;
    },
    beforeLogoUpload(file) {
      const isJPG = file.type === "image/jpeg";
      const isPNG = file.type === "image/png";
      const isGIF = file.type === "image/gif";
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJPG && !isPNG && !isGIF) {
        this.$message.error(this.$t("validate.limitUploadImgType"));
      }
      if (!isLt2M) {
        this.$message.error(
          this.$t("validate.limitUploadImgSize", { size: 2 })
        );
      }
      return (isJPG || isPNG || isGIF) && isLt2M;
    },
    handleArticlScoreChange(value) {
      console.log(value);
    },
    handlePostMessageScoreChange(value) {
      console.log(value);
    },
    handleShareArticlScoreChange(value) {
      console.log(value);
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.systemConfig.configs;
          // 更新
          updateSystemConfigs(params).then(result => {
            if (result.status === 200) {
              this.$store.dispatch("getSystemConfig");
              this.$message({
                message: this.$t("main.updateSuccess"),
                type: "success"
              });
            } else {
              this.$message.error(result.message, result.message);
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
    ...mapGetters(["systemConfig"]),
    classObj() {
      return {
        hideSidebar: !this.sidebarOpened,
        openSidebar: this.sidebarOpened,
        withoutAnimation: "false",
        mobile: this.device === "mobile"
      };
    }
  },
  mounted() {
    initEvent(this);
    this.$store.dispatch("systemConfig/getSystemConfig");
  }
};
</script>

<style lang="scss">
.adminSystemConfig {
  margin-top: 25px;
  .line-gate {
    overflow: hidden;
    color: #606266;
    transition: height 0.2s;
    font-size: 14px;
    padding: 10px 0;
  }
  .el-tag + .el-tag {
    margin-left: 10px;
  }
  .button-new-tag {
    margin-left: 10px;
    height: 32px;
    padding-top: 0;
    padding-bottom: 0;
  }
  .input-new-tag {
    width: 90px;
    margin-left: 10px;
    vertical-align: bottom;
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
    width: 150px;
    height: 30px;
    line-height: 30px !important;
    text-align: center;
  }
  .avatar {
    width: 150px;
    height: 36px;
    display: block;
  }
}
</style>