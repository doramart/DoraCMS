<template>
    <div class="user-bar">
        <el-row :gutter="0" class="header-main">
            <el-col :xs="1" :sm="1" :md="3" :lg="3" :xl="6">
                <div class="grid-content bg-purple">&nbsp;</div>
            </el-col>
            <el-col :xs="22" :sm="22" :md="18" :lg="18" :xl="12">
                <div class="bar-items">
                    <ul>
                        <li :class="{active : $route.fullPath == '/users/center'}">
                            <router-link to="/users/center">个人资料</router-link>
                        </li>
                        <li :class="{active : $route.fullPath == '/users/messages'}">
                            <router-link to="/users/messages">消息管理</router-link>
                        </li>
                        <li :class="{active : $route.fullPath == '/users/replies'}">
                            <router-link to="/users/replies">参与话题</router-link>
                        </li>
                    </ul>
                </div>
            </el-col>
            <el-col :xs="1" :sm="1" :md="3" :lg="3" :xl="6">
                <div class="grid-content bg-purple">
                    &nbsp;
                </div>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
    name: 'UserBar'
}

</script>

<style lang="scss">
.user-bar {
    background-color: #ffffff;
    width: 100%;
    z-index: 100;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, .05);
    transition: all .2s;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    .bar-items {
        ul {
            li {
                padding: 12px 20px 12px 0;
                display: inline-block;
                font-size: 13px;
            }
            li.active a {
                color: #409EFF
            }
        }
    }
}
</style>
