<template>
    <div class="adminUser">
        <MessageForm :dialogState="formState"></MessageForm>
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="contentMessage" :ids="selectlist" :pageInfo="contentMessageList.pageInfo"></TopBar>
                <DataTable :dataList="contentMessageList.docs" :pageInfo="contentMessageList.pageInfo" @changeMsgSelectList="changeSelect"></DataTable>
                <Pagination :pageInfo="contentMessageList.pageInfo" pageType="contentMessage"></Pagination>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import MessageForm from './messageForm'
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
        MessageForm,
        Pagination
    },
    methods: {
        changeSelect(ids) {
            this.selectlist = ids;
        }
    },
    computed: {
        ...mapGetters([
            'contentMessageList'
        ]),
        formState() {
            return this.$store.getters.contentMessageFormState
        }
    },
    mounted() {
        this.$store.dispatch('getContentMessageList');
    }
}
</script>

<style lang="">

</style>