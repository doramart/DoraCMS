<template>
    <PannelBox title="分类目录" className="catesMenu" v-if="rightNavs.parents.length>0">
        <div v-for="parentNav in rightNavs.parents" :key="parentNav._id">
            <div class="parent-name">{{parentNav.name}}</div>
            <ul class="cate-list">
                <li :key="sonNav._id" :class="{ active: sonNav._id == typeId }" v-for="sonNav in rightNavs.cates" v-if="sonNav.parentId === parentNav._id">
                    <router-link :to="{path: '/'+sonNav.defaultUrl+ '___'+sonNav._id}">{{sonNav.name}}</router-link>
                </li>
            </ul>
        </div>
    </PannelBox>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import _ from "lodash";
import PannelBox from "./PannelBox.vue";
export default {
  serverCacheKey: props => {
    return `navlist-${props.typeId}`;
  },
  props: ["typeId"],
  name: "CatesMenu",
  components: {
    PannelBox
  },
  computed: {
    rightNavs() {
      let fullNav = this.$store.getters["global/category/getHeaderNavList"];
      let parentObj = _.filter(fullNav.data, doc => {
        return doc._id == this.typeId;
      });
      let cates = [],
        parents = [];
      if (parentObj.length > 0) {
        let parentId = parentObj[0].sortPath.split(",")[1] || "0";
        cates = _.filter(fullNav.data, doc => {
          return doc.sortPath.indexOf(parentId) > 0;
        });
        parents = _.filter(cates, doc => {
          return doc.parentId === "0";
        });
      }
      return {
        parents,
        cates
      };
    }
  }
};
</script>
<style lang="scss">

</style>