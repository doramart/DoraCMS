<template>
  <div class="dr-contentForm">
    <el-form
      :model="formState.formData"
      :rules="rules"
      ref="ruleForm"
      label-width="120px"
      class="demo-ruleForm"
    >
      <el-form-item :label="$t('contents.enable')" prop="state">
        <el-select size="small" v-model="formState.formData.state" placeholder="审核文章">
          <el-option
            v-for="item in contentState"
            :key="'kw_'+item.value"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="formState.formData.state == '3'" label="驳回原因" prop="dismissReason">
        <el-input size="small" v-model="formState.formData.dismissReason"></el-input>
      </el-form-item>
      <el-form-item label="指定用户" prop="targetUser">
        <el-select
          size="small"
          v-model="formState.formData.targetUser"
          filterable
          remote
          reserve-keyword
          placeholder="请输入要分配的用户名"
          :remote-method="remoteUserMethod"
          :loading="userLoading"
          @change="changeTargetUser"
        >
          <el-option
            v-for="item in selectUserList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('contents.title')" prop="title">
        <el-input size="small" v-model="formState.formData.title"></el-input>
      </el-form-item>

      <el-form-item :label="$t('contents.categories')" prop="categories">
        <el-cascader
          size="small"
          expandTrigger="hover"
          :options="contentCategoryList.docs"
          v-model="formState.formData.categories"
          @change="handleChangeCategory"
          :props="categoryProps"
        ></el-cascader>
      </el-form-item>

      <div v-if="formState.formData.type == '1'">
        <el-form-item :label="$t('contents.stitle')" prop="stitle">
          <el-input size="small" v-model="formState.formData.stitle"></el-input>
        </el-form-item>

        <el-form-item label="关键字" prop="keywords">
          <el-input size="small" v-model="formState.formData.keywords"></el-input>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            size="small"
            v-model="formState.formData.tags"
            multiple
            filterable
            allow-create
            :placeholder="$t('validate.selectNull', {label: this.$t('contents.tags')})"
          >
            <el-option
              v-for="item in contentTagList.docs"
              :key="item._id"
              :label="item.name"
              :value="item._id"
            ></el-option>
          </el-select>
        </el-form-item>
      </div>
      <el-form-item class="upSimg" :label="$t('contents.sImg')" prop="sImg">
        <el-upload
          class="avatar-uploader"
          action="/api/v0/upload/files?type=images"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
        >
          <img v-if="formState.formData.sImg" :src="formState.formData.sImg" class="avatar" />
          <i v-else class="el-icon-plus avatar-uploader-icon"></i>
        </el-upload>
        <el-button size="mini" @click="getRandomContentImg()" class="refresh-btn" plain round>
          <i class="fa fa-refresh"></i>
        </el-button>
      </el-form-item>
      <el-form-item :label="$t('contents.discription')" prop="discription">
        <el-input size="small" type="textarea" v-model="formState.formData.discription"></el-input>
      </el-form-item>
      <el-form-item :label="$t('contents.comments')" prop="comments">
        <Ueditor @ready="editorReady" ref="ueditor"></Ueditor>
      </el-form-item>

      <el-form-item class="dr-submitContent">
        <el-button
          size="medium"
          type="primary"
          @click="submitForm('ruleForm')"
        >{{formState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
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
  .post-rate {
    .el-rate {
      margin-top: 10px;
    }
  }
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

  .upSimg {
    position: relative;
    .refresh-btn {
      position: absolute;
      left: 220px;
      top: 0;
      i {
        // color: #dcdfe6;
        font-weight: 400;
      }
    }
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
      contentState: [
        { value: "0", label: "退回" },
        { value: "1", label: "待审核" },
        { value: "2", label: "审核通过" },
        { value: "3", label: "审核不通过" }
      ],
      selectUserList: [],
      loading: false,
      userLoading: false,
      selectSpecialList: [],
      content: "",
      simpleComments: "",
      isflash: false,
      config: {
        initialFrameWidth: null,
        initialFrameHeight: 320
      },
      imageUrl: "",
      categoryProps: {
        value: "_id",
        label: "name",
        children: "children"
      },
      currentType: "1",
      rules: {
        sImg: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: "缩略图"
            }),
            trigger: "blur"
          }
        ],
        categories: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("contents.categories")
            }),
            trigger: "blur"
          }
        ],
        title: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contents.title")
            }),
            trigger: "blur"
          },
          {
            min: 2,
            max: 50,
            message: this.$t("validate.rangelength", { min: 2, max: 50 }),
            trigger: "blur"
          }
        ],
        stitle: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contents.stitle")
            }),
            trigger: "blur"
          },
          {
            min: 2,
            max: 50,
            message: this.$t("validate.rangelength", { min: 2, max: 50 }),
            trigger: "blur"
          }
        ],
        tags: [
          {
            validator: (rule, value, callback) => {
              if (_.isEmpty(value)) {
                callback(
                  new Error(
                    this.$t("validate.selectNull", {
                      label: this.$t("contents.tags")
                    })
                  )
                );
              } else {
                callback();
              }
            },
            trigger: "change"
          }
        ],
        discription: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contents.discription")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 300,
            message: this.$t("validate.rangelength", { min: 5, max: 100 }),
            trigger: "blur"
          }
        ],
        comments: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contents.comments")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            message: this.$t("validate.rangelength", { min: 5, max: 100000 }),
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
    changeTargetUser(value) {
      let targetUserInfo = _.filter(this.selectUserList, item => {
        return item.value == value;
      });
      if (!_.isEmpty(targetUserInfo)) {
        localStorage.setItem(
          "contentAuthor",
          JSON.stringify(targetUserInfo[0])
        );
      }
    },
    remoteUserMethod(query) {
      if (query !== "") {
        this.userLoading = true;
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
            _this.userLoading = false;
          } else {
            _this.selectUserList = [];
          }
        })
        .catch(err => {
          console.log(err);
          _this.selectUserList = [];
        });
    },
    getRandomContentImg(params = {}) {
      let _this = this;
      services
        .getRandomContentImg(params)
        .then(result => {
          if (result.status == 200 && result.data && result.data.data) {
            let randomImg = result.data.data[0];
            let initFormData = Object.assign({}, this.formState.formData, {
              sImg: randomImg
            });
            // 保留原有指定作者
            let oldUauthor = localStorage.getItem("contentAuthor");
            if (oldUauthor) {
              let targetUser = JSON.parse(oldUauthor);
              this.queryUserListByParams({
                searchkey: targetUser.label
              });
              Object.assign(initFormData, { targetUser: targetUser.value });
            }
            this.$store.dispatch("showContentForm", {
              formData: initFormData
            });
          }
        })
        .catch(err => {
          console.log(err);
        });
    },
    checkFlashPost(currentType) {
      this.$store.dispatch("showContentForm", {
        edit: this.formState.edit,
        formData: Object.assign({}, this.formState.formData, {
          type: currentType ? "2" : "1"
        })
      });
    },
    inputEditor(value) {
      this.$store.dispatch("showContentForm", {
        edit: this.formState.edit,
        formData: Object.assign({}, this.formState.formData, {
          markDownComments: value
        })
      });
    },
    changeEditor(value) {
      console.log(value);
    },
    getLocalContents() {
      let localContent = localStorage.getItem("addContent") || "";
      if (localContent) {
        return JSON.parse(localContent);
      } else {
        return {};
      }
    },
    editorReady(instance) {
      this.ueditorObj = instance;
      if (this.formState.edit) {
        setTimeout(() => {
          instance.setContent(this.formState.formData.comments);
          this.simpleComments = instance.getPlainTxt();
        }, 1500);
      } else {
        instance.setContent("");
      }
      instance.addListener("contentChange", () => {
        this.content = instance.getContent();
        this.simpleComments = instance.getPlainTxt();
        this.$store.dispatch("showContentForm", {
          edit: this.formState.edit,
          formData: Object.assign({}, this.formState.formData, {
            comments: this.content,
            simpleComments: this.simpleComments
          })
        });
      });
    },

    handleAvatarSuccess(res, file) {
      let imageUrl = res.data.path;
      this.$store.dispatch("showContentForm", {
        edit: this.formState.edit,
        formData: Object.assign({}, this.formState.formData, {
          sImg: imageUrl
        })
      });
    },
    beforeAvatarUpload(file) {
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
    handleChangeCategory(value) {
      console.log(value);
    },
    backToList() {
      this.$router.push("/content");
    },
    submitForm(formName, type = "") {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = Object.assign({}, this.formState.formData, {
            comments: this.ueditorObj.getContent(),
            simpleComments: this.ueditorObj.getPlainTxt()
          });
          // 更新
          if (this.formState.edit) {
            services.updateContent(params).then(result => {
              if (result.data.status === 200) {
                this.$router.push("/content");
                this.$message({
                  message: this.$t("main.updateSuccess"),
                  type: "success"
                });
              } else {
                this.$message.error(result.data.message);
              }
            });
          } else {
            // 新增
            services.addContent(params).then(result => {
              if (result.data.status === 200) {
                this.$router.push("/content");
                this.$message({
                  message: this.$t("main.addSuccess"),
                  type: "success"
                });
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
    ...mapGetters(["contentTagList", "contentCategoryList"]),
    formState() {
      return this.$store.getters.contentFormState;
    }
  },
  mounted() {
    // 针对手动页面刷新
    let _this = this;
    if (this.$route.params.id) {
      services.getOneContent({ id: this.$route.params.id }).then(result => {
        if (result.data.status === 200) {
          if (result.data.data) {
            let contentObj = result.data.data,
              categoryIdArr = [],
              tagsArr = [];

            if (contentObj.categories) {
              contentObj.categories.map((item, index) => {
                item && categoryIdArr.push(item._id);
              });
              contentObj.categories = categoryIdArr;
            }
            if (contentObj.tags) {
              contentObj.tags.map((item, index) => {
                item && tagsArr.push(item._id);
              });
              contentObj.tags = tagsArr;
            }
            if (contentObj.keywords) {
              contentObj.keywords = contentObj.keywords.join();
            }
            if (contentObj.uAuthor) {
              this.queryUserListByParams({
                searchkey: contentObj.uAuthor.userName
              });
              contentObj.targetUser = contentObj.uAuthor._id;
            }

            this.$store.dispatch("showContentForm", {
              edit: true,
              formData: contentObj
            });
          } else {
            this.$message({
              message: this.$t("validate.error_params"),
              type: "warning",
              onClose: () => {
                this.$router.push("/content");
              }
            });
          }
        } else {
          this.$message.error(result.data.message);
        }
      });
    } else {
      let localContent = this.getLocalContents();
      if (!_.isEmpty(localContent)) {
        this.$confirm(
          this.$t("main.askForReInputContent"),
          this.$t("main.scr_modal_title"),
          {
            confirmButtonText: this.$t("main.confirmBtnText"),
            cancelButtonText: this.$t("main.cancelBtnText"),
            type: "warning"
          }
        )
          .then(() => {
            let currentComments = localContent.comments || "";
            _this.$refs.ueditor.setContent(currentComments);
            // 清除缓存
            localStorage.removeItem(this.$route.path.split("/")[1]);
            this.$store.dispatch("showContentForm", {
              edit: false,
              formData: localContent
            });
          })
          .catch(() => {
            localStorage.removeItem(this.$route.path.split("/")[1]);
            this.$message({
              type: "info",
              message: this.$t("main.scr_modal_del_error_info")
            });
          });
      } else {
        this.getRandomContentImg();
      }
    }
    this.$store.dispatch("getContentCategoryList");
    this.$store.dispatch("getContentTagList", {
      pageSize: 200
    });
  }
};
</script>
