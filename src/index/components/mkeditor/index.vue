<template>
  <div class="md-panel">
    <el-menu default-active="1" class="el-menu-demo" mode="horizontal" @select="handleSelect">
      <el-menu-item index="1">加粗</el-menu-item>
      <el-menu-item index="2">斜体</el-menu-item>
      <el-menu-item index="3">引用</el-menu-item>
      <el-menu-item index="4">代码段</el-menu-item>
      <el-submenu index="5">
        <template slot="title">插入图片</template>
        <el-menu-item index="5-1"><i class="el-icon-upload2"></i>上传图片</el-menu-item>
        <el-menu-item index="5-2"><i class="el-icon-upload"></i>网络图片</el-menu-item>
      </el-submenu>
      <el-menu-item index="6"><i class="el-icon-more"></i>摘要</el-menu-item>
      <el-submenu index="7">
        <template slot="title">{{labels[mode]}}</template>
        <el-menu-item index="7-1">{{labels['edit']}}</el-menu-item>
        <el-menu-item index="7-2">{{labels['split']}}</el-menu-item>
        <el-menu-item index="7-3">{{labels['preview']}}</el-menu-item>
        <!-- <el-menu-item index="7-4">{{labels['full']}}</el-menu-item> -->
      </el-submenu>
      <!-- <el-menu-item index="8" ><i class="el-icon-edit"></i>编辑TOC</el-menu-item> -->
    </el-menu>

    <el-dialog title="图片上传" :visible.sync="isUploadShow" width="30%" class="uploadImg">
      <el-upload
        action="/system/upload?type=images"
        drag
        :on-success="handleSuccess"
        :on-error="handleError"
        :before-upload="beforeUpload"
        :show-file-list="true"
        :data="form"
        >
        <i class="el-icon-upload"></i>
        <div class="el-dragger__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">图片只能是 JPG,PNG,GIF 格式!不大于2M</div>
      </el-upload>
    </el-dialog>

    <div class="md-editor" :class="{ 
        'edit': mode === 'edit',
        'preview': mode === 'preview',
        'split': mode === 'split',
        'toc': mode === 'toc'
    }">
      <textarea ref="markdown" :value="value" @input="handleInput" @keydown.tab="handleTab"></textarea>
      <div v-if="mode !== 'toc'" class="md-preview markdown" v-html="compiledMarkdown"></div>
      <textarea v-else ref="toc" :value="toc" class="md-preview markdown" @input="handleTocInput"></textarea>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import { marked } from "./marked.js";

export default {
  name: "markdown",
  props: ["value", "toc"],
  data() {
    return {
      labels: {
        edit: "编辑模式",
        split: "分屏模式",
        preview: "预览模式",
        full: "全屏模式",
        toc: "TOC模式"
      },
      mode: "edit", // ['edit', 'split', 'preview', 'toc']
      isUploadShow: false,
      supportWebp: false,
      upToken: "",
      bucketHost: "",
      key: "",
      form: {}
    };
  },
  computed: {
    compiledMarkdown() {
      return marked(this.value.replace(/<!--more-->/g, ""));
    }
  },
  methods: {
    handleSelect(key, keyPath) {
      if (keyPath.length === 1) {
        switch (key) {
          case "1":
            this._boldText();
            break;
          case "2":
            this._italicText();
            break;
          case "3":
            this._blockquoteText();
            break;
          case "4":
            this._codeText();
            break;
          case "6":
            this._insertMore();
            break;
          case "8":
            this.mode = "toc";
            break;
        }
      } else if (keyPath.length === 2) {
        switch (key) {
          case "5-1":
            this._uploadImage();
            break;
          case "5-2":
            this._importImage();
            break;
          case "7-1":
            this.mode = "edit";
            break;
          case "7-2":
            this.mode = "split";
            break;
          case "7-3":
            this.mode = "preview";
            break;
          case "7-4":
            this.mode = "edit";
            break;
        }
      }
    },
    handleTab: function(e) {
      this._preInputText("\t");
      e.preventDefault();
    },
    handleInput: _.debounce(function(e) {
      let value = e.target.value;
      this.$emit("input", value);
    }, 300),
    handleTocInput: _.debounce(function(e) {
      let value = e.target.value;
      this.$emit("change", value);
    }, 300),
    _preInputText(text, preStart, preEnd) {
      let textControl = this.$refs.markdown;
      const start = textControl.selectionStart;
      const end = textControl.selectionEnd;
      const origin = this.value;

      if (start !== end) {
        const exist = origin.slice(start, end);
        text = text.slice(0, preStart) + exist + text.slice(preEnd);
        preEnd = preStart + exist.length;
      }
      let input = origin.slice(0, start) + text + origin.slice(end);

      this.$emit("input", input);
    },
    handlePreview(file) {},
    handleSuccess(response, file, fileList) {
      const width = "80%";
      const target = `<img width="${width}" src="${response}">`;
      this.$confirm(target, "上传成功，是否插入图片链接?", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        closeOnClickModal: false
      })
        .then(() => {
          this.isUploadShow = false;
          this._preInputText(target, 12, 12);
          this.$message({
            type: "success",
            message: "已插入图片链接"
          });
        })
        .catch(() => {
          this.isUploadShow = false;
          this.$message({
            type: "info",
            message: "已取消插入图片链接"
          });
        });
    },
    handleError(err, response, file) {
      if (err.status === 401) {
        this.$message.error("图片上传失败，请求中未附带Token");
      } else {
        this.$message.error(JSON.stringify(err));
      }
    },
    beforeUpload(file) {
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
    _uploadImage() {
      this.isUploadShow = true;
    },
    _importImage() {
      this.$prompt("请输入图片的链接", "导入图片链接", {
        confirmButtonText: "确定",
        cancelButtonText: "取消"
      })
        .then(({ value }) => {
          this._preInputText(`![](${value})`, 12, 12);
          this.$message({
            type: "success",
            message: "已插入图片链接"
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消插入图片链接"
          });
        });
    },
    _insertMore() {
      this._preInputText("<!--more-->", 12, 12);
    },
    _boldText() {
      this._preInputText("**加粗文字**", 2, 6);
    },
    _italicText() {
      this._preInputText("_斜体文字_", 1, 5);
    },
    _blockquoteText() {
      this._preInputText("> 引用", 3, 5);
    },
    _codeText() {
      this._preInputText("```\ncode block\n```", 5, 15);
    }
  }
};
</script>

<style lang="scss">
.md-editor textarea,
.md-preview {
  line-height: 1.5;
}

.el-dialog__wrapper {
  .el-dialog {
    width: 31%;
  }
}

.md-panel {
  display: block;
  position: relative;
  border: 1px solid #ddd;
  font-size: 14px;
  overflow: hidden;

  .uploadImg {
    .el-dialog__body {
      padding-top: 0;
    }
    .el-upload {
      width: 100%;
      .el-upload-dragger {
        width: 100%;
      }
    }
  }

  .md-editor {
    width: 100%;
    height: auto;
    transition: width 0.3s;
    background-color: #fff;
    position: relative;

    textarea {
      font-size: 14px;
      color: #111111;
      box-sizing: border-box;
      display: block;
      border-style: none;
      resize: none;
      outline: 0;
      height: 100%;
      min-height: 500px;
      width: 100%;
      padding: 15px 15px 0;
    }

    .md-preview {
      box-sizing: border-box;
      position: absolute;
      word-wrap: break-word;
      word-break: normal;
      width: 50%;
      height: 100%;
      left: 100%;
      top: 0;
      background-color: #f9fafc;
      border-left: 1px solid #ccc;
      overflow: auto;
      transition: left 0.3s, width 0.3s;
      padding: 15px 15px 0;
    }
  }

  .md-editor.edit {
    textarea {
      width: 100%;
    }
  }

  .md-editor.split {
    textarea {
      width: 50%;
    }

    .md-preview {
      left: 50%;
      width: 50%;
    }
  }

  .md-editor.toc {
    textarea {
      width: 50%;
    }

    .md-preview {
      left: 50%;
      width: 50%;
    }
  }

  .md-editor.preview {
    textarea {
      width: 50%;
    }

    .md-preview {
      left: 0;
      width: 100%;
      border-left-style: none;
    }
  }
}
</style>
