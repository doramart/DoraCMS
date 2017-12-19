<style lang='scss'>

</style>
<template>
    <div>
        <div class="contentContainer">
            <div>
                <el-row :gutter="0">
                    <el-col :xs="1" :sm="1" :md="1" :lg="1">
                        <div class="grid-content bg-purple">&nbsp;</div>
                    </el-col>
                    <el-col :xs="22" :sm="22" :md="22" :lg="22" class="content-mainbody-left">
                        <el-row :gutter="24">
                            <el-col :xs="24" :sm="24" :md="24" :lg="24">
                                <ItemList :contentList="contentList" typeId="searchList" />
                            </el-col>
                        </el-row>
                    </el-col>
                    <el-col :xs="1" :sm="1" :md="1" :lg="1">
                        <div class="grid-content bg-purple">&nbsp;</div>
                    </el-col>
                </el-row>
            </div>
        </div>
    </div>
</template>

<script>
import shortid from 'shortid';
import ItemList from './ItemList.vue'
import SearchBox from '../components/SearchBox.vue'

import {
    mapGetters,
    mapActions
} from 'vuex'
export default {
    name: 'search-list-view',
    metaInfo() {
        return {
            title: '搜索结果' + this.systemConfig.configs.siteName,
            desc: this.systemConfig.configs.siteDiscription,
            keywords: this.systemConfig.configs.siteKeywords
        }
    },
    data() {
        return {
        }
    },
    components: {
        ItemList,
        SearchBox
    },
    computed: {
        ...mapGetters([
            'contentList',
            'systemConfig'
        ]),
        page() {
            return Number(this.$store.state.route.params.page) || 1
        }
    },
    asyncData({ store, route }) {
        let params = { model: 'normal' };
        params.current = Number(route.params.page) || 1;
        if (route.params.searchkey) {
            params.searchkey = route.params.searchkey
        }
        return store.dispatch('indexContentList', params)
    },

}
</script>