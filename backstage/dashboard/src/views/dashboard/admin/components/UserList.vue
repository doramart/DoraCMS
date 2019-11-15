<template>
  <div class="dash-box">
    <h2 class="dash-title">{{$t('main.nearNewUsers')}}</h2>
     <div class="user-list">
       <ul>
         <li v-for="user in regUsers" :key="user._id">
           <random-logo :user="user"/>
           <label for="">{{user.userName}}</label>
         </li>
       </ul>
     </div>
  </div>
</template>

<script>
import RandomLogo from "@/components/RandomLogo";

export default {
  props: ["regUsers"],
  filters: {},
  components: {
    RandomLogo
  },
  data() {
    return {
      list: null
    };
  }
};
</script>
<style lang="scss">
.user-list {
  padding: 0;
  ul {
    padding: 0;
    margin: 0;
    li {
      display: block;
      position: relative;
      width: 100%;
      border-bottom: 1px solid #eee;
      padding: 15px;

      label {
        height: 40px;
        line-height: 40px;
        margin-left: 50px;
      }
    }
  }
}
</style>
