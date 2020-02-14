<template>
  <div :class="classObj" class="dr-contentForm">
    <div class="main-container">
      <el-form
        :model="formState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="120px"
        class="demo-ruleForm"
        :label-position="device == 'mobile' ? 'top' : 'right'"
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
              default-first-option
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
            action="/api/upload/files"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :data="{action:'uploadimage'}"
          >
            <img v-if="formState.formData.sImg" :src="formState.formData.sImg" class="avatar" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
          <el-button size="mini" @click="getRandomContentImg()" class="refresh-btn" plain round>
            <svg-icon icon-class="reload" />
          </el-button>
        </el-form-item>
        <el-form-item :label="$t('contents.discription')" prop="discription">
          <el-input size="small" type="textarea" v-model="formState.formData.discription"></el-input>
        </el-form-item>
        <el-form-item :label="$t('contents.uploadWord')" prop="uploadWord">
          <el-upload
            class="upload-demo"
            action="/api/content/getWordHtmlContent"
            :on-preview="handleWordPreview"
            :on-remove="handleWordRemove"
            :before-remove="beforeWordRemove"
            :on-success="uploadWordSuccess"
            :before-upload="beforeWordUpload"
            multiple
            :limit="1"
            :on-exceed="handleWordExceed"
            :file-list="wordFileList"
          >
            <el-button size="small" type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">只能上传doc/docx文件，且不超过5mb</div>
          </el-upload>
        </el-form-item>
        <el-form-item :label="$t('contents.comments')" prop="comments">
          <vue-ueditor-wrap
            class="editorForm"
            @ready="editorReady"
            v-model="formState.formData.comments"
            :config="editorConfig"
          ></vue-ueditor-wrap>
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
  </div>
</template>

<style lang="scss">
.edui-default .edui-toolbar {
  line-height: 20px !important;
}
.dr-contentForm {
  padding: 20px;
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
    line-height: 150px !important;
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
import VueUeditorWrap from "vue-ueditor-wrap";
import { initEvent } from "@root/publicMethods/events";
import {
  showFullScreenLoading,
  tryHideFullScreenLoading
} from "@root/publicMethods/axiosLoading";
import {
  getOneContent,
  addContent,
  updateContent,
  getRandomContentImg,
  regUserList
} from "@/api/content";

import _ from "lodash";
import { mapGetters, mapActions } from "vuex";
export default {
  props: {
    groups: Array
  },
  data() {
    return {
      wordFileList: [],
      wordFileUrl: "",
      sidebarOpened: true,
      device: "desktop",
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
      editorConfig: {
        // 编辑器不自动被内容撑高
        autoHeightEnabled: false,
        // 初始容器高度
        initialFrameHeight: 240,
        // 初始容器宽度
        initialFrameWidth: "100%",
        // 上传文件接口（这个地址是我为了方便各位体验文件上传功能搭建的临时接口，请勿在生产环境使用！！！）
        serverUrl: "/api/upload/ueditor",
        // UEditor 资源文件的存放路径，如果你使用的是 vue-cli 生成的项目，通常不需要设置该选项，vue-ueditor-wrap 会自动处理常见的情况，如果需要特殊配置，参考下方的常见问题2
        UEDITOR_HOME_URL: this.$root.staticRootPath + "/plugins/ueditor/"
      },
      imageUrl: "",
      categoryProps: {
        value: "_id",
        label: "name",
        children: "children"
      },
      currentType: "1",
      rules: {
        targetUser: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: "指定用户"
            }),
            trigger: "blur"
          }
        ],
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
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contents.tags")
            }),
            trigger: "blur"
          },
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
    VueUeditorWrap
  },
  methods: {
    handleWordRemove(file, fileList) {
      console.log(file, fileList);
    },
    handleWordPreview(file) {
      console.log(file);
    },
    handleWordExceed(files, fileList) {
      this.$message.warning(
        `当前限制选择 1 个文件，本次选择了 ${
          files.length
        } 个文件，共选择了 ${files.length + fileList.length} 个文件`
      );
    },
    beforeWordRemove(file, fileList) {
      return this.$confirm(`确定移除 ${file.name}？`);
    },
    uploadWordSuccess(res, file) {
      tryHideFullScreenLoading();
      this.wordFileUrl = res.data ? res.data : "";
      this.ueditorObj.setContent(res.data);
      this.$message({
        message: "恭喜，导入成功！",
        type: "success"
      });
    },
    beforeWordUpload(file) {
      const isDocx = file.type.indexOf("officedocument") > 0 ? true : false;
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isDocx) {
        this.$message.error("只能上传docx,doc格式！");
      }
      if (!isLt5M) {
        this.$message.error(
          this.$t("validate.limitUploadImgSize", { size: 5 })
        );
      }
      if (isDocx && isLt5M) {
        showFullScreenLoading();
      }
      return isDocx && isLt5M;
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
      getRandomContentImg(params)
        .then(result => {
          if (result.status == 200 && result && result.data) {
            let randomImg = result.data[0];
            let initFormData = Object.assign({}, this.formState.formData, {
              sImg: randomImg
            });
            this.$store.dispatch("content/showContentForm", {
              formData: initFormData
            });
          }
        })
        .catch(err => {
          console.log(err);
        });
    },
    checkFlashPost(currentType) {
      this.$store.dispatch("content/showContentForm", {
        edit: this.formState.edit,
        formData: Object.assign({}, this.formState.formData, {
          type: currentType ? "2" : "1"
        })
      });
    },
    inputEditor(value) {
      this.$store.dispatch("content/showContentForm", {
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
    },

    handleAvatarSuccess(res, file) {
      let imageUrl = res.data.path;
      this.$store.dispatch("content/showContentForm", {
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
      this.$router.push(this.$root.adminBasePath + "/content");
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
            updateContent(params).then(result => {
              if (result.status === 200) {
                this.$router.push(this.$root.adminBasePath + "/content");
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
            if (
              !_.isEmpty(this.adminUserInfo) &&
              !_.isEmpty(this.adminUserInfo.targetEditor)
            ) {
              params.targetUser = this.adminUserInfo.targetEditor._id;
            } else {
              this.$message.error("在添加文档之前，您需要指定一个默认编辑！");
              this.$router.push(this.$root.adminBasePath + "/content");
              return false;
            }
            addContent(params).then(result => {
              if (result.status === 200) {
                this.$router.push(this.$root.adminBasePath + "/content");
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
  },
  computed: {
    ...mapGetters(["contentTagList", "contentCategoryList", "adminUserInfo"]),
    formState() {
      return this.$store.getters.contentFormState;
    },
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
    this.$store.dispatch("adminUser/getUserInfo");
    // 针对手动页面刷新
    let _this = this;
    if (this.$route.params.id) {
      getOneContent({ id: this.$route.params.id }).then(result => {
        if (result.status === 200) {
          if (result.data) {
            let contentObj = result.data,
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

            this.$store.dispatch("content/showContentForm", {
              edit: true,
              formData: contentObj
            });
          } else {
            this.$message({
              message: this.$t("validate.error_params"),
              type: "warning",
              onClose: () => {
                this.$router.push(this.$root.adminBasePath + "/content");
              }
            });
          }
        } else {
          this.$message.error(result.message);
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
            this.$store.dispatch("content/showContentForm", {
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
    this.$store.dispatch("contentCategory/getContentCategoryList");
    this.$store.dispatch("contentTag/getContentTagList", {
      pageSize: 200
    });
  }
};
</script>
