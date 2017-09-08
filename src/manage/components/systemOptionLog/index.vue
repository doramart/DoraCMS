<template>
    <div class="adminUser">
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="systemOptionLogs" :ids="selectlist"></TopBar>
                <DataTable :dataList="systemOptionLogs.docs" @changeSystemLogsSelectList="changeLogsSelect"></DataTable>
                <Pagination :pageInfo="systemOptionLogs.pageInfo" pageType="systemOptionLogs"></Pagination>
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
        Pagination
    },
    methods: {
        changeLogsSelect(ids) {
            this.selectlist = ids;
        }
    },
    computed: {
        ...mapGetters([
            'systemOptionLogs'
        ])
    },
    mounted() {
        this.$store.dispatch('getSystemLogsList');
    }
}

</script>

<style lang="">

</style>
