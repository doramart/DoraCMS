<style lang='scss'>
.siteMap {
    padding: 15px;
}

.siteMap ul li {
    height: 25px;
}
</style>
<template>
    <div class="container min-hight" style="margin-bottom: 20px;background: #FFFFFF">
        <el-row :gutter="10">
            <el-col :xs="1" :sm="1" :md="2" :lg="2" :xl="5">
                <div class="grid-content bg-purple">&nbsp;</div>
            </el-col>
            <el-col :xs="22" :sm="22" :md="20" :lg="20" :xl="14">
                <div class="col-md-12 siteMap">
                    <ul>
                        <li v-for="(item,index) in siteMapList.data" :key="item._id" v-once>
                            <router-link :to="'/details/'+item._id+'.html'" class="continue-reading">{{index+1}}.&nbsp;{{item.title}}</router-link>
                        </li>
                    </ul>
                </div>
            </el-col>
            <el-col :xs="1" :sm="1" :md="2" :lg="2" :xl="5">
                <div class="grid-content bg-purple">&nbsp;</div>
            </el-col>
        </el-row>
    </div>
</template>

<script>
import {
    mapGetters,
    mapActions
} from 'vuex'
export default {
    async asyncData({ store, route }, config = {}) {
        const { params: path } = route
        const base = { ...config, path }
        await store.dispatch('global/footerConfigs/getSiteMapList')
    },
    name: 'sitemap',
    computed: {
        ...mapGetters({
            siteMapList: 'global/footerConfigs/getSiteMapList'
        })
    }

}
</script>