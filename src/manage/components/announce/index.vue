<template>
    <div class="content">
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="systemAnnounce"></TopBar>
                <DataTable :dataList="systemAnnounce.docs" @handleSystemAnnounceChange="changeAnnounceSelect"></DataTable>
                <Pagination :pageInfo="systemAnnounce.pageInfo" pageType="systemAnnounce"></Pagination>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import DataTable from './dataTable.vue';
import TopBar from '../common/TopBar.vue';
import Pagination from '../common/Pagination.vue';
import {
    mapGetters,
    mapActions
} from 'vuex'

export default {
    name: 'index',
    data() {
        return {
            selectlist: []
        }
    },
    components: {
        DataTable,
        TopBar,
        // ContentForm,
        Pagination
    },
    methods: {
        changeAnnounceSelect(ids) {
            this.selectlist = ids;
        }
    },
    computed: {
        ...mapGetters([
            'systemAnnounce'
        ])
    },
    mounted() {
        this.$store.dispatch('getSystemAnnounceList');
    }
}
</script>

<style lang="">

</style>