<template>
  <div :class="classObj" class="dr-contentForm">
    <CoverTable
      @updateTargetCover="updateTargetCover"
      :coverTypeList="coverTypeList"
      :targetCover="targetCover"
      :dialogState="contentCoverDialog"
      :device="device"
    ></CoverTable>
    <div class="main-container">
      <el-form
        :model="formState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="70px"
        class="demo-ruleForm"
        :label-position="device == 'mobile' ? 'top' : 'right'"
      >
        <el-row :gutter="15" style="margin-top:10px;">
          <el-col :span="17">
            <el-row :gutter="15">
              <el-col :span="24">
                <div class="grid-content bg-purple">
                  <el-card class="box-card">
                    <el-form-item :label="$t('contents.title')" prop="title">
                      <el-input
                        size="small"
                        v-model="formState.formData.title"
                      ></el-input>
                    </el-form-item>

                    <el-form-item
                      :label="$t('contents.discription')"
                      prop="discription"
                    >
                      <el-input
                        size="small"
                        type="textarea"
                        v-model="formState.formData.discription"
                      ></el-input>
                    </el-form-item>
                    <el-form-item
                      :label="$t('contents.uploadWord')"
                      prop="uploadWord"
                      style="margin-bottom:0px;"
                    >
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
                        <el-button size="small" type="primary"
                          >上传Word文档</el-button
                        >
                        <div slot="tip" class="el-upload__tip">
                          只能上传doc/docx文件，且不超过5mb
                        </div>
                      </el-upload>
                    </el-form-item>
                  </el-card>
                </div>
              </el-col>
              <el-col :span="24" style="margin-top:15px;">
                <div class="grid-content bg-purple">
                  <vue-ueditor-wrap
                    class="editorForm"
                    @ready="editorReady"
                    v-model="formState.formData.comments"
                    :config="editorConfig"
                  ></vue-ueditor-wrap>
                </div>
              </el-col>
            </el-row>
          </el-col>
          <el-col :span="7"
            ><div class="grid-content bg-purple">
              <el-card class="box-card">
                <el-form-item
                  :label="$t('contents.enable')"
                  label-width="60px"
                  prop="state"
                >
                  <el-select
                    size="small"
                    v-model="formState.formData.state"
                    placeholder="审核文章"
                  >
                    <el-option
                      v-for="item in contentState"
                      :key="'kw_' + item.value"
                      :label="item.label"
                      :value="item.value"
                    ></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="formState.formData.state == '3'"
                  label="驳回原因"
                  label-width="60px"
                  prop="dismissReason"
                >
                  <el-input
                    size="small"
                    v-model="formState.formData.dismissReason"
                  ></el-input>
                </el-form-item>

                <el-form-item
                  :label="$t('contents.categories')"
                  label-width="60px"
                  prop="categories"
                >
                  <el-cascader
                    size="small"
                    expandTrigger="hover"
                    :options="contentCategoryList.docs"
                    v-model="formState.formData.categories"
                    @change="handleChangeCategory"
                    :props="categoryProps"
                  ></el-cascader>
                </el-form-item>
                <el-form-item label="来源" label-width="60px" prop="source">
                  <el-input
                    size="small"
                    v-model="formState.formData.source"
                  ></el-input>
                </el-form-item>
                <el-form-item label="关键字" label-width="60px" prop="keywords">
                  <el-input
                    size="small"
                    v-model="formState.formData.keywords"
                  ></el-input>
                </el-form-item>

                <el-form-item label="标签" label-width="60px" prop="tags">
                  <el-select
                    size="small"
                    v-model="formState.formData.tags"
                    multiple
                    filterable
                    allow-create
                    default-first-option
                    :placeholder="
                      $t('validate.selectNull', {
                        label: this.$t('contents.tags'),
                      })
                    "
                  >
                    <el-option
                      v-for="item in contentTagList.docs"
                      :key="item._id"
                      :label="item.name"
                      :value="item._id"
                    ></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item
                  :label="$t('contents.sImg')"
                  label-width="60px"
                  prop="sImgType"
                >
                  <el-radio v-model="formState.formData.sImgType" label="2"
                    >上传</el-radio
                  >
                  <el-radio v-model="formState.formData.sImgType" label="1"
                    >自动生成</el-radio
                  >
                </el-form-item>

                <el-form-item
                  v-if="formState.formData.sImgType == '2'"
                  class="upSimg"
                  label
                  prop="sImg"
                >
                  <el-upload
                    class="avatar-uploader"
                    action="/api/upload/files"
                    :show-file-list="false"
                    :on-success="handleAvatarSuccess"
                    :before-upload="beforeAvatarUpload"
                    :data="{ action: 'uploadimage' }"
                  >
                    <img
                      v-if="formState.formData.sImg"
                      :src="formState.formData.sImg"
                      class="avatar"
                    />
                    <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                  </el-upload>
                  <el-button
                    size="mini"
                    @click="getRandomContentImg()"
                    class="refresh-btn"
                    plain
                    round
                  >
                    <svg-icon icon-class="reload" />
                  </el-button>
                </el-form-item>

                <div v-if="formState.formData.sImgType == '1'">
                  <el-form-item label="封面" label-width="60px" prop="covers">
                    <el-row
                      :gutter="15"
                      class="covers-list"
                      style="padding-left: 10px"
                    >
                      <el-col
                        :xs="6"
                        :md="8"
                        v-for="item in selectCoverList"
                        :key="item._id"
                      >
                        <div class="grid-img" @click="selectThisCover(item)">
                          <img :src="item.cover" />
                          <div
                            class="cover"
                            :style="
                              formState.formData.cover == item._id
                                ? coverActiveStyle
                                : {}
                            "
                          >
                            <span>
                              <svg-icon icon-class="icon_check_right" />已选择
                            </span>
                          </div>
                        </div>
                      </el-col>
                      <el-col :xs="6" :md="3">
                        <div class="grid-img" @click="showMoreCovers()">
                          <div class="cover" style="display: block">
                            <span class="showMoreCover">
                              <svg-icon icon-class="icon_more" />
                            </span>
                          </div>
                        </div>
                      </el-col>
                    </el-row>
                  </el-form-item>
                  <el-form-item label="标题" label-width="60px" prop="stitle">
                    <el-input
                      size="small"
                      v-model="formState.formData.stitle"
                    ></el-input>
                  </el-form-item>
                  <div id="view"></div>
                  <el-form-item
                    label="预览"
                    label-width="60px"
                    prop="coversPreview"
                  >
                    <div class="covers-list" style="marginleft: 10px">
                      <div class="preview" :style="renderPreviewBackground">
                        <div class="grid-img">
                          <div
                            :style="currentStyle"
                            v-html="renderPreviewTitle"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </el-form-item>
                </div>
              </el-card></div
          ></el-col>
        </el-row>

        <el-form-item class="dr-submitContent">
          <el-button
            size="medium"
            type="primary"
            @click="submitForm('ruleForm')"
            >{{
              formState.edit
                ? $t("main.form_btnText_update")
                : $t("main.form_btnText_save")
            }}</el-button
          >
          <el-button size="medium" @click="backToList">{{
            $t("main.back")
          }}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import VueUeditorWrap from "vue-ueditor-wrap";
import { initEvent } from "@root/publicMethods/events";
import CoverTable from "./coverTable";
import {
  showFullScreenLoading,
  tryHideFullScreenLoading,
} from "@root/publicMethods/axiosLoading";
import {
  getOneContent,
  addContent,
  updateContent,
  getRandomContentImg,
  regUserList,
  coverList,
  coverInfo,
  uploadCover,
  contentCoverTypeList,
} from "@/api/content";

import _ from "lodash";
import { mapGetters, mapActions } from "vuex";
import html2canvas from "html2canvas";
export default {
  props: {
    groups: Array,
  },
  data() {
    return {
      dataURL: "",
      coverImg: "https://cdn.html-js.cn/cms/covers/1.png",
      targetCover: "",
      coverTypeList: [],
      wordFileList: [],
      wordFileUrl: "",
      sidebarOpened: true,
      device: "desktop",
      contentState: [
        { value: "0", label: "退回" },
        { value: "1", label: "待审核" },
        { value: "2", label: "审核通过" },
        { value: "3", label: "审核不通过" },
      ],
      selectUserList: [],
      loading: false,
      userLoading: false,
      selectSpecialList: [],
      selectCoverList: [],
      content: "",
      simpleComments: "",
      isflash: false,
      config: {
        initialFrameWidth: null,
        initialFrameHeight: 320,
      },
      editorConfig: {
        // 编辑器不自动被内容撑高
        autoHeightEnabled: false,
        // 初始容器高度
        initialFrameHeight: 600,
        // 初始容器宽度
        initialFrameWidth: "100%",
        // 上传文件接口（这个地址是我为了方便各位体验文件上传功能搭建的临时接口，请勿在生产环境使用！！！）
        serverUrl: "/api/upload/ueditor",
        // UEditor 资源文件的存放路径，如果你使用的是 vue-cli 生成的项目，通常不需要设置该选项，vue-ueditor-wrap 会自动处理常见的情况，如果需要特殊配置，参考下方的常见问题2
        UEDITOR_HOME_URL: this.$root.staticRootPath + "/plugins/ueditor/",
      },
      imageUrl: "",
      categoryProps: {
        value: "_id",
        label: "name",
        children: "children",
      },
      currentType: "1",
      rules: {
        targetUser: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: "指定用户",
            }),
            trigger: "blur",
          },
        ],
        sImg: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: "缩略图",
            }),
            trigger: "blur",
          },
        ],
        categories: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("contents.categories"),
            }),
            trigger: "blur",
          },
        ],
        title: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contents.title"),
            }),
            trigger: "blur",
          },
          {
            min: 2,
            max: 50,
            message: this.$t("validate.rangelength", { min: 2, max: 50 }),
            trigger: "blur",
          },
        ],
        // stitle: [
        //   {
        //     required: true,
        //     message: this.$t("validate.inputNull", {
        //       label: this.$t("contents.stitle"),
        //     }),
        //     trigger: "blur",
        //   },
        //   {
        //     min: 2,
        //     max: 50,
        //     message: this.$t("validate.rangelength", { min: 2, max: 50 }),
        //     trigger: "blur",
        //   },
        // ],
        tags: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contents.tags"),
            }),
            trigger: "blur",
          },
          {
            validator: (rule, value, callback) => {
              if (_.isEmpty(value)) {
                callback(
                  new Error(
                    this.$t("validate.selectNull", {
                      label: this.$t("contents.tags"),
                    })
                  )
                );
              } else {
                callback();
              }
            },
            trigger: "change",
          },
        ],
        discription: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contents.discription"),
            }),
            trigger: "blur",
          },
          {
            min: 5,
            max: 300,
            message: this.$t("validate.rangelength", { min: 5, max: 100 }),
            trigger: "blur",
          },
        ],
        comments: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contents.comments"),
            }),
            trigger: "blur",
          },
          {
            min: 5,
            message: this.$t("validate.rangelength", { min: 5, max: 100000 }),
            trigger: "blur",
          },
        ],
      },
    };
  },
  components: {
    VueUeditorWrap,
    CoverTable,
  },
  methods: {
    updateTargetCover(item) {
      this.targetCover = item;
    },
    showMoreCovers() {
      this.$store.dispatch("content/showCoverListDialog");
      if (!_.isEmpty(this.coverTypeList)) {
        let defaultCoverType = !_.isEmpty(this.targetCover)
          ? this.targetCover.type._id
          : this.coverTypeList[0]._id;
        this.$store.dispatch("content/getContentCoverList", {
          type: defaultCoverType,
          pageSize: 30,
        });
      }
    },
    htmlToImage() {
      return new Promise((reslove, reject) => {
        let element = document.getElementsByClassName("preview")[0];
        var width = element.offsetWidth;
        var height = element.offsetHeight;
        var scale = 1;
        var canvas = document.createElement("canvas");
        // 获取元素相对于视窗的偏移量
        var rect = element.getBoundingClientRect();
        canvas.width = width * scale;
        canvas.height = height * scale * 1;
        var context = canvas.getContext("2d");
        context.scale(scale, scale);

        // 设置context位置, 值为相对于视窗的偏移量的负值, 实现图片复位
        let canvasHeight = window.scrollY;
        context.translate(0, -canvasHeight);

        var options = {
          scale: scale,
          canvas: canvas,
          width: width,
          height: height,
          taintTest: true, //在渲染前测试图片
          useCORS: true, //貌似与跨域有关，但和allowTaint不能共存
          dpi: window.devicePixelRatio, // window.devicePixelRatio是设备像素比
          background: "#fff",
        };

        html2canvas(element, options).then(function(canvas) {
          var dataURL = canvas.toDataURL("image/png", 1.0); //将图片转为base64, 0-1 表示清晰度
          var base64String = dataURL
            .toString()
            .substring(dataURL.indexOf(",") + 1); //截取base64以便上传
          let params = { base64: base64String };
          uploadCover(params).then((result) => {
            if (result.status === 200) {
              reslove(result.data);
            } else {
              reject(result.message);
            }
          });
        });
      });
    },
    selectThisCover(item) {
      if (!_.isEmpty(item)) {
        this.targetCover = item;
        this.formState.formData.cover = item._id;
      }
    },
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
        type: "success",
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
        .then((result) => {
          let specialList = result.data.docs;
          if (specialList) {
            _this.selectUserList = specialList.map((item) => {
              return {
                value: item._id,
                label: item.userName,
              };
            });
            _this.userLoading = false;
          } else {
            _this.selectUserList = [];
          }
        })
        .catch((err) => {
          console.log(err);
          _this.selectUserList = [];
        });
    },
    getRandomContentImg(params = {}) {
      let _this = this;
      getRandomContentImg(params)
        .then((result) => {
          if (result.status == 200 && result && result.data) {
            let randomImg = result.data[0];
            let initFormData = Object.assign({}, this.formState.formData, {
              sImg: randomImg,
            });
            this.$store.dispatch("content/showContentForm", {
              formData: initFormData,
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    },
    queryCoverListByParams(params = {}) {
      let _this = this;
      coverList(params)
        .then((result) => {
          let cvList = result.data.docs;
          if (cvList) {
            _this.selectCoverList = cvList;
            setTimeout(() => {
              if (this.$route.params.id) {
                coverInfo({
                  id: _this.formState.formData.cover,
                }).then((result) => {
                  if (!_.isEmpty(result)) {
                    _this.targetCover = result.data;
                    _this.formState.formData.cover = result.data._id;
                  }
                });
              } else {
                _this.targetCover = cvList[0];
                _this.formState.formData.cover = cvList[0]._id;
              }
            }, 1000);
          } else {
            _this.selectCoverList = [];
          }
        })
        .catch((err) => {
          console.log(err);
          _this.selectUserList = [];
        });
    },

    queryCoverTypeListByParams(params = {}) {
      let _this = this;
      contentCoverTypeList(params)
        .then((result) => {
          let typeList = result.data;
          if (typeList) {
            _this.coverTypeList = typeList;
            let defaultType = _.filter(typeList, (item) => {
              return item.isDefault;
            });
            if (!_.isEmpty(defaultType)) {
              _this.queryCoverListByParams({ type: defaultType[0]._id });
            }
          } else {
            _this.coverTypeList = [];
          }
        })
        .catch((err) => {
          console.log(err);
          _this.coverTypeList = [];
        });
    },

    checkFlashPost(currentType) {
      this.$store.dispatch("content/showContentForm", {
        edit: this.formState.edit,
        formData: Object.assign({}, this.formState.formData, {
          type: currentType ? "2" : "1",
        }),
      });
    },
    inputEditor(value) {
      this.$store.dispatch("content/showContentForm", {
        edit: this.formState.edit,
        formData: Object.assign({}, this.formState.formData, {
          markDownComments: value,
        }),
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
          sImg: imageUrl,
        }),
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
      this.$refs[formName].validate(async (valid) => {
        if (valid) {
          try {
            let params = Object.assign({}, this.formState.formData, {
              comments: this.ueditorObj.getContent(),
              simpleComments: this.ueditorObj.getPlainTxt(),
            });
            // 上传合成图片
            if (this.formState.formData.sImgType == "1") {
              params.sImg = await this.htmlToImage();
            }
            // 更新
            if (this.formState.edit) {
              updateContent(params).then((result) => {
                if (result.status === 200) {
                  this.$router.push(this.$root.adminBasePath + "/content");
                  this.$message({
                    message: this.$t("main.updateSuccess"),
                    type: "success",
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
              addContent(params).then((result) => {
                if (result.status === 200) {
                  this.$router.push(this.$root.adminBasePath + "/content");
                  this.$message({
                    message: this.$t("main.addSuccess"),
                    type: "success",
                  });
                } else {
                  this.$message.error(result.message);
                }
              });
            }
          } catch (error) {
            this.$message.error(error.message);
          }
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
  },
  computed: {
    ...mapGetters([
      "contentTagList",
      "contentCategoryList",
      "adminUserInfo",
      "contentCoverDialog",
    ]),
    formState() {
      return this.$store.getters.contentFormState;
    },
    classObj() {
      return {
        hideSidebar: !this.sidebarOpened,
        openSidebar: this.sidebarOpened,
        withoutAnimation: "false",
        mobile: this.device === "mobile",
      };
    },
    coverActiveStyle() {
      return {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.4)",
        display: "block",
      };
    },
    currentStyle() {
      let renderStyle = {};
      return Object.assign(
        {},
        {
          color: this.targetCover.titleColor,
          fontSize: Number(this.targetCover.titleSize) + "px",
        }
      );
    },
    renderPreviewBackground() {
      let backStyle = this.targetCover.backgroundDefaultCss;
      let defaultCss = {
        backgroundImage: "url(" + this.targetCover.cover + ")",
        backgroundSize: "cover",
        width: this.targetCover.width + "px",
        height: this.targetCover.height + "px",
      };
      if (!_.isEmpty(backStyle)) {
        Object.assign(defaultCss, JSON.parse(backStyle));
      }
      return defaultCss;
    },
    renderPreviewTitle() {
      let stitle = this.formState.formData.stitle;
      let targetCover = this.targetCover;
      if (!_.isEmpty(targetCover) && !_.isEmpty(targetCover.type)) {
        if (stitle) {
          let stitleArr = stitle.split("--");
          let newHtml = this.targetCover.type.structure.replace(
            "content_title",
            stitle
          );
          if (
            stitleArr.length == 2 &&
            this.targetCover.type.structure.indexOf("content_title_1") >= 0
          ) {
            newHtml = this.targetCover.type.structure
              .replace("content_title", stitleArr[0])
              .replace("content_title_1", stitleArr[1]);
          }
          return newHtml;
        } else {
          return this.targetCover.type.structure;
        }
      } else {
        return "";
      }
    },
  },
  mounted() {
    initEvent(this);
    // 初始化模板
    this.queryCoverTypeListByParams({ isDefault: true });
    this.$store.dispatch("adminUser/getUserInfo");
    // 针对手动页面刷新
    let _this = this;
    if (this.$route.params.id) {
      getOneContent({ id: this.$route.params.id }).then((result) => {
        if (result.status === 200) {
          if (result.data) {
            let contentObj = result.data,
              categoryIdArr = [],
              tagsArr = [];
            if (contentObj.categories) {
              contentObj.categories = _.sortBy(
                contentObj.categories,
                (item) => {
                  return item.parentId != "0";
                }
              );
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
                searchkey: contentObj.uAuthor.userName,
              });
              contentObj.targetUser = contentObj.uAuthor._id;
            }

            this.$store.dispatch("content/showContentForm", {
              edit: true,
              formData: contentObj,
            });
          } else {
            this.$message({
              message: this.$t("validate.error_params"),
              type: "warning",
              onClose: () => {
                this.$router.push(this.$root.adminBasePath + "/content");
              },
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
            type: "warning",
          }
        )
          .then(() => {
            let currentComments = localContent.comments || "";
            _this.$refs.ueditor.setContent(currentComments);
            // 清除缓存
            localStorage.removeItem(this.$route.path.split("/")[1]);
            this.$store.dispatch("content/showContentForm", {
              edit: false,
              formData: localContent,
            });
          })
          .catch(() => {
            localStorage.removeItem(this.$route.path.split("/")[1]);
            this.$message({
              type: "info",
              message: this.$t("main.scr_modal_del_error_info"),
            });
          });
      } else {
        this.getRandomContentImg();
      }
    }
    this.$store.dispatch("contentCategory/getContentCategoryList");
    this.$store.dispatch("contentTag/getContentTagList", {
      pageSize: 200,
    });
  },
};
</script>
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

  .top-card {
    .el-card__body {
      padding-top: 10px;
      padding-bottom: 10px;
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

  .covers-list {
    overflow: hidden;
    .el-col {
      height: 100px;
      margin-bottom: 15px;
      .grid-img {
        border-radius: 4px;
        overflow: hidden;
        height: 100%;
        cursor: pointer;
        position: relative;
        .cover {
          display: none;
          span {
            position: absolute;
            top: 50%;
            left: 50%;
            display: inline-block;
            transform: translate(-50%, -50%);
            color: #fff;
            font-size: 12px;
            width: 60px;
            svg {
              margin-right: 4px;
            }
          }
          .showMoreCover {
            color: rgb(170, 170, 170);
            text-align: center;
            border: 1px solid #eee;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            line-height: 50px;
            box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
            font-size: 15px;
          }
        }
        img {
          width: 100%;
          height: 100%;
        }
      }
    }
    .preview {
      position: relative;
      padding-left: 0 !important;
      padding-right: 0 !important;
      .grid-img {
        overflow: hidden;
        height: 100%;
        .cover-title {
          overflow: hidden;
          word-break: break-word;
          font-family: fzlthjt;
        }
      }
    }
  }
}

.dr-contentForm.mobile {
  .covers-list {
    .preview {
      width: 300px !important;
      height: 200px !important;
    }
    .el-col {
      height: 50px !important;
    }
  }
}
</style>
