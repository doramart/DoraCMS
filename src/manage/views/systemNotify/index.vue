<template>
    <div class="adminUser">
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="systemNotify" :ids="selectlist"></TopBar>
                <DataTable :dataList="systemNotify.docs" @changeSystemNotifySelectList="changeLogsSelect"></DataTable>
                <Pagination :pageInfo="systemNotify.pageInfo" pageType="systemNotify"></Pagination>
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
    name: 'systemNotify',
    data() {
        return {
            selectlist: []
        }
    },
    components: {
        DataTable,
        TopBar,
        Pagination
    },
    methods: {
        changeLogsSelect(ids) {
            this.selectlist = ids;
        }
    },
    computed: {
        ...mapGetters([
            'systemNotify'
        ])
    },
    mounted() {
        this.$store.dispatch('getSystemNotifyList');
    }
}

</script>

<style lang="">

</style>
