<template>
  <div class="contentContainer">
    <div class="mainbody user-center">
      <el-row :gutter="0">
        <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :xs="22" :sm="22" :md="22" :lg="19" :xl="14">
          <div class="user-info">
            <el-row :gutter="15" class="basic-info">
                <el-form :model="contentFormState.formData" :rules="rules" ref="ruleForm" label-width="70px" class="content-info-form">
              <el-col :xs="19" :sm="19" :md="19" :lg="19" :xl="19" class="right-pannel">
                    <el-form-item label="分类" prop="categories">
                      <el-cascader size="small" expand-trigger="hover" :options="cateMenu.docs" v-model="contentFormState.formData.categories" @change="handleChangeCategory" :props="categoryProps">
                      </el-cascader>
                    </el-form-item>
                    <el-form-item label="标题" prop="title">
                      <el-input placeholder="请输入标题" v-model="contentFormState.formData.title"></el-input>
                    </el-form-item>
                    <el-form-item label="摘要" prop="discription">
                      <el-input placeholder="请摘要" v-model="contentFormState.formData.discription"></el-input>
                    </el-form-item>
                    <el-form-item label="详情" prop="comments">
                      <MarkDownEditor v-model="contentFormState.formData.markDownComments" @input="inputEditor" :toc="toc" @change="changeEditor"></MarkDownEditor>
                      <div id="post-content" style="display:none;">
                          <textarea style="display:none;">### Hello Editor.md !</textarea>
                      </div>
                    </el-form-item>
              </el-col>
              <el-col :xs="5" :sm="5" :md="5" :lg="5" :xl="5" class="left-pannel">
              <el-form-item>
                <el-button size="small" type="primary" @click="submitForm('ruleForm')">提交发布</el-button>
              </el-form-item>
               <PannelBox title="缩略图" className="markdown-pannle">
                  <el-form-item prop="sImg">
                        <el-upload class="avatar-uploader" action="/system/upload?type=images" :show-file-list="false" :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload">
                            <img v-if="contentFormState.formData.sImg" :src="contentFormState.formData.sImg" class="avatar">
                            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                        </el-upload>
                    </el-form-item>
              </PannelBox>
               <PannelBox title="标签" className="markdown-pannle">
                 <el-form-item prop="tags">
                        <el-select v-model="contentFormState.formData.tags" multiple filterable allow-create placeholder="请选择文章标签">
                            <el-option v-for="item in contentTagList.data" :key="item._id" :label="item.name" :value="item._id">
                            </el-option>
                        </el-select>
                    </el-form-item>
               </PannelBox>
              </el-col>
              </el-form>
            </el-row>
          </div>
        </el-col>
        <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
          <div class="grid-content bg-purple">
            &nbsp;
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import api from "~api";
const validatorUtil = require("../../../utils/validatorUtil.js");
import { renderTreeData } from "../../manage/store/actions";
import PannelBox from "../components/PannelBox.vue";
import MarkDownEditor from "../components/mkeditor/index.vue";
import { mapGetters, mapActions } from "vuex";
import _ from 'lodash';
export default {
  name: "userLogin",
  metaInfo() {
    return {
      title: "用户中心-添加文章"
    };
  },
  components: {
    PannelBox,
    MarkDownEditor
  },
  data() {
    return {
      toc: "",
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
        ]
      },
      categoryProps: {
        value: "_id",
        label: "name",
        children: "children"
      },
      cateMenu: {
        docs: []
      }
    };
  },
  methods: {
    inputEditor(value) {
      this.$store.dispatch("frontend/user/contentForm", {
        edit: this.contentFormState.edit,
        formData: Object.assign({}, this.contentFormState.formData, {
          markDownComments: value
        })
      });
    },
    changeEditor(value) {
      console.log(value);
    },
    handleChangeCategory(value) {
      console.log(value);
    },
    handleAvatarSuccess(res, file) {
      let imageUrl = res;
      this.$store.dispatch("frontend/user/contentForm", {
        edit: this.contentFormState.edit,
        formData: Object.assign({}, this.contentFormState.formData, {
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
    setFormLogo(res) {
      this.contentFormState && (this.contentFormState.formData.logo = res);
    },
    clearFormData() {
      this.$store.dispatch("frontend/user/contentForm", {
        edit: false,
        formData: {}
      });
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.contentFormState.formData;
          let apiPath = "content/addOne";
          if (this.contentFormState.edit) {
            apiPath = "content/updateOne";
          }
          api
            .post(apiPath, params)
            .then(result => {
              if (result.data.state == "success") {
                this.$message({
                  message: "提交成功，请等待审核！",
                  type: "success",
                  onClose: () => {
                    this.clearFormData();
                    this.$router.push("/users/contents");
                  }
                });
              } else {
                this.$message({
                  message: result.data.message,
                  type: "error"
                });
              }
            })
            .catch(err => {
              this.$message.error(err.response.data.error);
            });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    renderCateData() {
      let fullNav = this.$store.getters["global/category/getHeaderNavList"];
      let navs = fullNav.data;
      return renderTreeData({ docs: navs });
    }
  },
  computed: {
    ...mapGetters({
      contentFormState: "frontend/user/contentFormState",
      contentTagList: "global/tags/getTagList"
    })
  },
  mounted() {
    let _this = this;
    // 针对文章编辑
    if (this.$route.params.id && !this.contentFormState.formData.title) {
      api
        .get("content/getContent", { id: this.$route.params.id })
        .then(result => {
          if (result.data.state === "success") {
            if (result.data.doc) {
              let contentObj = result.data.doc,
                categoryIdArr = [];
              contentObj.categories.map((item, index) => {
                categoryIdArr.push(item._id);
              });
              contentObj.categories = categoryIdArr;
              this.$store.dispatch("frontend/user/contentForm", {
                edit: true,
                formData: contentObj
              });
            } else {
              this.$message({
                message: "参数非法,请重新操作！",
                type: "warning",
                onClose: () => {
                  window.location.href = "/users/contents";
                }
              });
            }
          } else {
            this.$message.error(result.data.message);
          }
        });
    } else {
      this.clearFormData();
    }
    this.$store.dispatch("global/tags/getTagList", { limit: 100 });
    this.cateMenu = this.renderCateData();
  }
};
</script>

<style lang="scss">

</style>