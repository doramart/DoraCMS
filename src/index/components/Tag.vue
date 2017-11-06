<template>
    <PannelBox title="标签云" className="content-tag">
        <div class="content-tag-list">
            <ul>
                <li :key="item._id" v-for="(item,index) in tags">
                    <el-button size="mini" round @click="searchTag(item)">{{item.name}}</el-button>
                </li>
            </ul>
        </div>
    </PannelBox>
</template>
<script>
import { mapGetters } from "vuex";
import PannelBox from "./PannelBox.vue";
export default {
  name: "Tag",
  props: ["tags"],
  components: {
    PannelBox
  },
  methods: {
    searchTag(item) {
      this.$router.push("/tag/" + item.name);
    }
  }
};
</script>

<style lang="scss">
.content-tag {
  ul {
    padding-top: 15px;
    li {
      float: left;
      height: 35px;
      margin: 0 10px 10px 0;
      cursor: pointer;
      text-align: left;
      border: none;
      padding: 0;
      font-weight: 700;
      a:link,
      a:visited {
        color: #3ca5f6;
      }
      a:hover {
        color: #337ab7;
      }
    }
  }
}
</style>