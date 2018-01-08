<template>
    <div class="dr-contentForm">
        <el-form :model="formState.formData" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
            <el-form-item label="标题" prop="title">
                <el-input size="small" v-model="formState.formData.title"></el-input>
            </el-form-item>
            <el-form-item label="简短标题" prop="stitle">
                <el-input size="small" v-model="formState.formData.stitle"></el-input>
            </el-form-item>
            <el-form-item label="来源" prop="from">
                <el-radio class="radio" v-model="formState.formData.from" label="1">原创</el-radio>
                <el-radio class="radio" v-model="formState.formData.from" label="2">转载</el-radio>
                <el-radio class="radio" v-model="formState.formData.from" label="3">用户发布</el-radio>
            </el-form-item>
            <el-form-item label="发布" prop="state">
                <el-switch on-text="是" off-text="否" v-model="formState.formData.state"></el-switch>
            </el-form-item>
            <el-form-item label="标签/关键字" prop="tags">
                <el-select size="small" v-model="formState.formData.tags" multiple filterable allow-create placeholder="请选择文章标签">
                    <el-option v-for="item in contentTagList.docs" :key="item._id" :label="item.name" :value="item._id">
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="缩略图" prop="sImg">
                <el-upload class="avatar-uploader" action="/system/upload?type=images" :show-file-list="false" :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload">
                    <img v-if="formState.formData.sImg" :src="formState.formData.sImg" class="avatar">
                    <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                </el-upload>
            </el-form-item>
            <el-form-item label="文章类别" prop="categories">
                <el-cascader size="small" expand-trigger="hover" :options="contentCategoryList.docs" v-model="formState.formData.categories" @change="handleChangeCategory" :props="categoryProps">
                </el-cascader>
            </el-form-item>
            <el-form-item label="内容摘要" prop="discription">
                <el-input size="small" type="textarea" v-model="formState.formData.discription"></el-input>
            </el-form-item>
            <el-form-item label="文档详情" prop="comments">
                <Ueditor @ready="editorReady" v-show="!formState.formData.uAuthor"></Ueditor>
                <MarkDownEditor v-show="formState.formData.uAuthor" v-model="formState.formData.markDownComments" @input="inputEditor" :toc="toc" @change="changeEditor"></MarkDownEditor>
            </el-form-item>
            <el-form-item class="dr-submitContent">
                <el-button size="medium" type="primary" @click="submitForm('ruleForm')">{{formState.edit ? '更新' : '保存'}}</el-button>
                <el-button size="medium" @click="backToList">返回</el-button>
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
import MarkDownEditor from "../../../index/components/mkeditor";

import _ from "lodash";
import { mapGetters, mapActions } from "vuex";
export default {
  props: {
    groups: Array
  },
  data() {
    return {
      toc: "",
      content: "",
      defaultMsg: "初始文本",
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

      rules: {
        title: [
          {
            required: true,
            message: "请输入文档标题",
            trigger: "blur"
          },
          {
            min: 5,
            max: 50,
            message: "5-50个非特殊字符",
            trigger: "blur"
          }
        ],
        stitle: [
          {
            required: true,
            message: "请输入简短标题",
            trigger: "blur"
          },
          {
            min: 5,
            max: 50,
            message: "5-50个非特殊字符",
            trigger: "blur"
          }
        ],
        categories: [
          {
            validator: (rule, value, callback) => {
              if (_.isEmpty(value)) {
                callback(new Error("请选择文档类别!"));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        tags: [
          {
            validator: (rule, value, callback) => {
              if (_.isEmpty(value)) {
                callback(new Error("请选择标签!"));
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
            message: "请输入内容摘要",
            trigger: "blur"
          },
          {
            min: 5,
            max: 300,
            message: "5-100个非特殊字符",
            trigger: "blur"
          }
        ],
        comments: [
          {
            required: true,
            message: "请输入内容详情",
            trigger: "blur"
          },
          {
            min: 5,
            message: "5-10000个非特殊字符",
            trigger: "blur"
          }
        ]
      }
    };
  },
  components: {
    Ueditor,
    MarkDownEditor
  },
  methods: {
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
    editorReady(instance) {
      if (this.formState.edit) {
        instance.setContent(this.formState.formData.comments);
      } else {
        instance.setContent("");
      }
      instance.addListener("contentChange", () => {
        this.content = instance.getContent();
        this.$store.dispatch("showContentForm", {
          edit: this.formState.edit,
          formData: Object.assign({}, this.formState.formData, {
            comments: this.content
          })
        });
      });
    },

    handleAvatarSuccess(res, file) {
      let imageUrl = res;
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
        this.$message.error("上传头像图片只能是 JPG,PNG,GIF 格式!");
      }
      if (!isLt2M) {
        this.$message.error("上传头像图片大小不能超过 2MB!");
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
          let params = this.formState.formData;
          // 更新
          if (this.formState.edit) {
            services.updateContent(params).then(result => {
              if (result.data.state === "success") {
                this.$router.push("/content");
                this.$message({
                  message: "更新成功",
                  type: "success"
                });
              } else {
                this.$message.error(result.data.message);
              }
            });
          } else {
            // 新增
            services.addContent(params).then(result => {
              if (result.data.state === "success") {
                this.$router.push("/content");
                this.$message({
                  message: "添加成功",
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
    ...mapGetters(["contentCategoryList", "contentTagList"]),
    formState() {
      return this.$store.getters.contentFormState;
    }
  },
  mounted() {
    // 针对手动页面刷新
    if (this.$route.params.id && !this.formState.formData.title) {
      services.getOneContent(this.$route.params).then(result => {
        if (result.data.state === "success") {
          if (result.data.doc) {
            let contentObj = result.data.doc,
              categoryIdArr = [];
            contentObj.categories.map((item, index) => {
              categoryIdArr.push(item._id);
            });
            contentObj.categories = categoryIdArr;
            this.$store.dispatch("showContentForm", {
              edit: true,
              formData: contentObj
            });
          } else {
            this.$message({
              message: "参数非法,请重新操作！",
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
    }
    this.$store.dispatch("getContentCategoryList");
    this.$store.dispatch("getContentTagList", {
      pageSize: 200
    });
  }
};
</script>
