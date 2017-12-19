<template>
    <div class="user-bar">
        <div class="bar-items">
            <ul>
                <!-- <li :class="{active : $route.fullPath == '/users/center'}">
                    <router-link to="/users/center">个人资料</router-link>
                </li> -->
                <li :class="{active : $route.fullPath == '/users/messages'}">
                    <router-link to="/users/messages"><i aria-hidden="true" class="fa fa-comment"></i>&nbsp;消息管理</router-link>
                </li>
                <li :class="{active : $route.fullPath == '/users/replies'}">
                    <router-link to="/users/replies"><i aria-hidden="true" class="fa fa-file-text"></i>&nbsp;参与话题</router-link>
                </li>
            </ul>
        </div>
    </div>
</template>
<script>
import { mapGetters } from "vuex";
export default {
  name: "UserBar"
};
</script>

<style lang="scss">

</style>
