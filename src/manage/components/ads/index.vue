<template>
    <div class="adminUser">
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="ads"></TopBar>
                <DataTable :dataList="adsList.docs"></DataTable>
                <Pagination :pageInfo="adsList.pageInfo" pageType="ads"></Pagination>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import InfoForm from './infoForm'
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

        }
    },
    components: {
        DataTable,
        TopBar,
        InfoForm,
        Pagination
    },
    methods: mapActions([

    ]),
    computed: {
        ...mapGetters([
            'adsList'
        ]),
        formState() {
            return this.$store.getters.adsInfoForm
        }
    },
    mounted() {
        this.$store.dispatch('getAdsList');
    }
}
</script>

<style lang="">

</style>