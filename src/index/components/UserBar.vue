<template>
    <div class="user-bar">
        <div class="bar-items">
            <ul>
                <li :class="{active : $route.fullPath == '/users/contents'}">
                    <router-link to="/users/contents"><i aria-hidden="true" class="fa fa-pencil"></i>&nbsp;文章</router-link>
                </li>
                <li :class="{active : $route.fullPath == '/users/messages'}">
                    <router-link to="/users/messages"><i aria-hidden="true" class="fa fa-comment"></i>&nbsp;消息管理</router-link>
                </li>
                <li :class="{active : $route.fullPath == '/users/replies'}">
                    <router-link to="/users/replies"><i aria-hidden="true" class="fa fa-file-text"></i>&nbsp;参与话题</router-link>
                </li>
                <li :class="{active : $route.fullPath == '/users/addContent'}">
                    <router-link to="/users/addContent"><i class="fa fa-edit" aria-hidden="true"></i>&nbsp;投稿</router-link>
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
