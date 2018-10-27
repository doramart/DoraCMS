<template>
    <div class="dr-adsInfoForm">
        <ItemForm :formState="adsItemForm" />
        <el-form :model="formState.formData" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
            <el-form-item :label="$t('ads.name')" prop="name">
                <el-input size="small" v-model="formState.formData.name"></el-input>
            </el-form-item>
            <el-form-item v-if="!formState.edit" :label="$t('ads.type')" prop="type">
                <el-radio-group v-model="formState.formData.type" @change="changeType">
                    <el-radio class="radio" label="0">{{$t('ads.typeText')}}</el-radio>
                    <el-radio class="radio" label="1">{{$t('ads.typePic')}}</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item :label="$t('ads.enable')" prop="state">
                <el-switch :on-text="$t('main.radioOn')" :off-text="$t('main.radioOff')" v-model="formState.formData.state"></el-switch>
            </el-form-item>
            <el-form-item :label="$t('ads.comments')" prop="comments">
                <el-input size="small" v-model="formState.formData.comments"></el-input>
            </el-form-item>
            <div v-if="formState.formData.type == '1'">
                <el-form-item :label="$t('ads.slider')" prop="carousel">
                    <el-switch :on-text="$t('main.radioOn')" :off-text="$t('main.radioOff')" v-model="formState.formData.carousel"></el-switch>
                </el-form-item>
                <el-form-item :label="$t('ads.showHeight')" prop="height">
                    <el-input size="small" type="number" min="0" max="10" style="width:150px;" :placeholder="$t('ads.showHeight')" v-model="formState.formData.height">
                        <template slot="append">px</template>
                    </el-input>
                </el-form-item>
                <el-form-item :label="$t('ads.imglist')" prop="items">
                    <el-button size="small" type="primary" plain round @click="showAdsItemForm">{{$t('ads.addImgItem')}}</el-button>
                    <div class="dr-ads-item" v-for="item in formState.formData.items" :key="item._id">
                        <div class="img">
                            <img :src="item.sImg" />
                        </div>
                        <div class="details">
                            <ul>
                                <li>{{$t('ads.imgAlt')}}：{{item.alt}}</li>
                                <li>{{$t('ads.imgLink')}}：{{item.link}}</li>
                            </ul>
                        </div>
                        <div class="options">
                            <el-button size="mini" type="primary" plain round @click="editAdsItemInfo(item)">
                                <i class="fa fa-edit"></i>
                            </el-button>
                        </div>
                        <i class="el-icon-close" @click="deleteAdsItem(item)"></i>
                    </div>
                </el-form-item>
            </div>
            <div v-if="formState.formData.type == '0'">
                <el-form-item :label="$t('ads.textList')" prop="items">
                    <el-button size="small" type="primary" plain round @click="showAdsItemForm">{{$t('ads.addTextLink')}}</el-button>
                    <div v-if="formState.formData.items.length > 0">
                        <el-tag v-for="tag in formState.formData.items" :key="tag.title" type='gray' :closable="true" @close="deleteAdsItem(tag)">
                            <span @click="editAdsItemInfo(tag)">{{tag.title}}</span>
                        </el-tag>
                    </div>
                </el-form-item>
            </div>
            <el-form-item>
                <el-button size="medium" type="primary" @click="submitForm('ruleForm')">{{formState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
                <el-button size="medium" @click="backToList">{{$t('main.back')}}</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
import services from "../../store/services.js";
const validatorUtil = require("../../../../utils/validatorUtil.js");
import ItemForm from "./itemForm";
import _ from "lodash";
import { mapGetters, mapActions } from "vuex";
export default {
  data() {
    return {
      rules: {
        name: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("ads.name")
            }),
            trigger: "blur"
          },
          {
            min: 2,
            max: 15,
            message: this.$t("validate.ranglengthandnormal", {
              min: 2,
              max: 15
            }),
            trigger: "blur"
          }
        ],
        comments: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("main.comments_label")
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
  components: {
    ItemForm
  },
  methods: {
    backToList() {
      this.$router.push("/ads");
    },
    changeType(type) {},
    showAdsItemForm() {
      this.$store.dispatch("showAdsItemForm", { edit: false });
    },
    editAdsItemInfo(item) {
      this.$store.dispatch("showAdsItemForm", {
        edit: true,
        formData: item
      });
    },
    deleteAdsItem(item) {
      let oldFormState = this.$store.getters.adsInfoForm;
      let adsItems = oldFormState.formData.items;
      let newItems = _.filter(adsItems, doc => {
        return doc._id != item._id;
      });
      oldFormState.formData.items = newItems;
      this.$store.dispatch("adsInfoForm", oldFormState);
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.formState.formData;
          // 更新
          if (this.formState.edit) {
            services.updateAds(params).then(result => {
              if (result.data.status === 200) {
                this.$store.dispatch("hideAdsItemForm");
                this.$message({
                  message: this.$t("main.updateSuccess"),
                  type: "success"
                });
                this.$router.push("/ads");
              } else {
                this.$message.error(result.data.message);
              }
            });
          } else {
            // 新增
            services.addOneAd(params).then(result => {
              if (result.data.status === 200) {
                this.$message({
                  message: this.$t("main.addSuccess"),
                  type: "success"
                });
                this.$router.push("/ads");
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
  },
  computed: {
    ...mapGetters(["adsItemForm"]),
    formState() {
      return this.$store.getters.adsInfoForm;
    }
  },
  mounted() {
    // 针对手动页面刷新
    if (this.$route.params.id) {
      services.getOneAd(this.$route.params).then(result => {
        if (result.data.status === 200) {
          if (result.data.data.doc) {
            this.$store.dispatch("adsInfoForm", {
              edit: true,
              formData: result.data.data.doc
            });
          } else {
            this.$message({
              message: this.$t("validate.error_params"),
              type: "warning",
              onClose: () => {
                this.$router.push("/ads");
              }
            });
          }
        } else {
          this.$message.error(result.data.message);
        }
      });
    }
  }
};
</script>
<style lang="scss">
.dr-adsInfoForm {
  margin-top: 30px;
}
.el-tag {
  margin-right: 15px;
}

.dr-ads-item {
  color: #48576a;
  border-radius: 4px;
  border: 1px solid #bfcbd9;
  padding: 5px;
  position: relative;
  margin: 15px 0;
  .img {
    width: 70px;
    height: 70px;
    position: absolute;
    img {
      width: 100%;
      height: 100%;
    }
  }
  .details {
    display: inline-block;
    margin-left: 80px;
    ul {
      margin: 0;
      padding: 0;
      li {
        list-style-type: none;
      }
    }
  }
  .options {
    position: absolute;
    right: 20px;
    top: 20px;
  }
  .el-icon-close {
    position: absolute;
    right: 5px;
    top: 5px;
    font-size: 11px;
    cursor: pointer;
    color: #bfcbd9;
  }
}
</style>