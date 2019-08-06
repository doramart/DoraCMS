<template>
  <div class="adminTemplate">
    <el-row class="dr-datatable">
      <el-col :span="24">
        <TopBar :code="codetxt" :path="codePath" type="adminTemplate"></TopBar>
        <el-row :gutter="20">
          <el-col :span="16">
            <div class="in-coder-panel">
              <textarea ref="textarea"></textarea>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content bg-purple">
              <TemplateTree
                :treeData="adminTemplateList.docs"
                pageType="adminTemplate"
                @changeTreeFile="readTreeFile"
              ></TemplateTree>
            </div>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import TemplateTree from "./templateTree";
import TopBar from "../common/TopBar.vue";
import { mapGetters, mapActions } from "vuex";
// 引入全局实例
import _CodeMirror from "codemirror";

// 需要引入具体的语法高亮库才会有对应的语法高亮效果
// codemirror 官方其实支持通过 /addon/mode/loadmode.js 和 /mode/meta.js 来实现动态加载对应语法高亮库
// 但 vue 貌似没有无法在实例初始化后再动态加载对应 JS ，所以此处才把对应的 JS 提前引入
import "codemirror/mode/javascript/javascript.js";
import "codemirror/mode/css/css.js";
import "codemirror/mode/xml/xml.js";
import "codemirror/mode/clike/clike.js";
import "codemirror/mode/markdown/markdown.js";
import "codemirror/mode/python/python.js";
import "codemirror/mode/r/r.js";
import "codemirror/mode/shell/shell.js";
import "codemirror/mode/sql/sql.js";
import "codemirror/mode/swift/swift.js";
import "codemirror/mode/vue/vue.js";

// 尝试获取全局实例
const CodeMirror = window.CodeMirror || _CodeMirror;
export default {
  name: "index",
  props: {
    // 外部传入的内容，用于实现双向绑定
    value: String,
    // 外部传入的语法类型
    language: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      codetxt: "",
      codePath: "",
      // 默认的语法类型
      mode: "html",
      // 编辑器实例
      coder: null,
      // 默认配置
      options: {
        // 缩进格式
        tabSize: 2,
        // 主题，对应主题库 JS 需要提前引入
        theme: "default",
        // 显示行号
        lineNumbers: true,
        line: true
      },
      // 支持切换的语法高亮类型，对应 JS 已经提前引入
      // 使用的是 MIME-TYPE ，不过作为前缀的 text/ 在后面指定时写死了
      modes: [
        {
          value: "css",
          label: "CSS"
        },
        {
          value: "javascript",
          label: "Javascript"
        },
        {
          value: "html",
          label: "XML/HTML"
        },
        {
          value: "x-java",
          label: "Java"
        },
        {
          value: "x-objectivec",
          label: "Objective-C"
        },
        {
          value: "x-python",
          label: "Python"
        },
        {
          value: "x-rsrc",
          label: "R"
        },
        {
          value: "x-sh",
          label: "Shell"
        },
        {
          value: "x-sql",
          label: "SQL"
        },
        {
          value: "x-swift",
          label: "Swift"
        },
        {
          value: "x-vue",
          label: "Vue"
        },
        {
          value: "markdown",
          label: "Markdown"
        }
      ]
    };
  },
  components: {
    TopBar,
    TemplateTree
  },
  methods: {
    readTreeFile(data) {
      this.codetxt = data.doc;
      this.codePath = data.path;

      if (this.codetxt) {
        this.coder.setValue(this.codetxt);
      }
    },
    // 初始化
    _initialize() {
      // 初始化编辑器实例，传入需要被实例化的文本域对象和默认配置
      this.coder = CodeMirror.fromTextArea(this.$refs.textarea, this.options);
      // 编辑器赋值
      this.coder.setValue(this.value || this.codetxt);

      // 支持双向绑定
      this.coder.on("change", coder => {
        this.codetxt = coder.getValue();

        if (this.$emit) {
          this.$emit("input", this.codetxt);
        }
      });

      // 尝试从父容器获取语法类型
      if (this.language) {
        // 获取具体的语法类型对象
        let modeObj = this._getLanguage(this.language);

        // 判断父容器传入的语法是否被支持
        if (modeObj) {
          this.mode = modeObj.label;
        }
      }
    },
    // 获取当前语法类型
    _getLanguage(language) {
      // 在支持的语法类型列表中寻找传入的语法类型
      return this.modes.find(mode => {
        // 所有的值都忽略大小写，方便比较
        let currentLanguage = language.toLowerCase();
        let currentLabel = mode.label.toLowerCase();
        let currentValue = mode.value.toLowerCase();

        // 由于真实值可能不规范，例如 java 的真实值是 x-java ，所以讲 value 和 label 同时和传入语法进行比较
        return (
          currentLabel === currentLanguage || currentValue === currentLanguage
        );
      });
    },
    // 更改模式
    changeMode(val) {
      // 修改编辑器的语法配置
      this.coder.setOption("mode", `text/${val}`);

      // 获取修改后的语法
      let label = this._getLanguage(val).label.toLowerCase();

      // 允许父容器通过以下函数监听当前的语法值
      this.$emit("language-change", label);
    }
  },
  computed: {
    ...mapGetters(["adminTemplateList"])
  },
  mounted() {
    this.$store.dispatch("getAdminTemplateList");
    // 初始化
    this._initialize();
  }
};
</script>

<style lang="scss">
.CodeMirror {
  height: 700px;
  border: 1px solid #eee;
  box-shadow: 1px 1px 1px #eee;
}
</style>