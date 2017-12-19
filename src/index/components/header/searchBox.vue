<template>
    <div class="search-pannel">
        <div class="input-area" v-bind:class="{ active: activeSearch }">
            <el-input @keyup.enter.native="handleIconClick"  size="small" placeholder="请输入关键字" v-model="searchkey"></el-input>
            <i class="fa fa-search" @click="showSearchInput"></i>
        </div>
    </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
export default {
  name: "searchbox",
  data() {
    return {
      searchkey: "",
      activeSearch: false
    };
  },
  methods: {
    handleIconClick(ev) {
      this.$router.replace("/search/" + this.searchkey);
    },
    showSearchInput() {
      this.activeSearch = !this.activeSearch;
    },
    search(e) {}
  }
};
</script>
<style lang="scss">

</style>