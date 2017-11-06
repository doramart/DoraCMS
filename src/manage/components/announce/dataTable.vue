<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleSystemAnnounceSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="title" label="标题">
            </el-table-column>
            <el-table-column prop="content" label="内容">
                <template slot-scope="scope">
                    <span v-html="scope.row.content"></span>
                </template>
            </el-table-column>
            <el-table-column prop="adminSender" label="发布者">
                <template slot-scope="scope">
                    <span>{{scope.row.adminSender.userName}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="date" label="发生时间">
            </el-table-column>
            <el-table-column label="操作" fixed="right">
                <template slot-scope="scope">
                    <el-button type="danger" plain size="mini" round icon="el-icon-delete" @click="deleteAnnounce(scope.$index, dataList)"></el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<style lang="scss">
.fa-star {
    cursor: pointer
}

.fa-star-o {
    cursor: pointer
}
</style>
<script>
import services from '../../store/services.js';
export default {
    props: {
        dataList: Array
    },
    data() {
        return {
            loading: false,
            multipleSelection: []
        }
    },

    methods: {
        toggleSelection(rows) {
            if (rows) {
                rows.forEach(row => {
                    this.$refs.multipleTable.toggleRowSelection(row);
                });
            } else {
                this.$refs.multipleTable.clearSelection();
            }
        },
        handleSystemAnnounceSelectionChange(val) {
            if (val && val.length > 0) {
                let ids = val.map((item, index) => {
                    return item._id;
                })
                this.multipleSelection = ids;
                this.$emit('handleSystemAnnounceChange', ids);
            }
        },
        deleteAnnounce(index, rows) {
            this.$confirm('此操作将永久删除该公告, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                return services.deleteSystemAnnounce({
                    ids: rows[index]._id
                });
            }).then((result) => {
                if (result.data.state === 'success') {
                    this.$store.dispatch('getSystemAnnounceList');
                    this.$message({
                        message: '删除成功',
                        type: 'success'
                    });
                } else {
                    this.$message.error(result.data.message);
                }
            }).catch((err) => {
                this.$message({
                    type: 'info',
                    message: '已取消删除:' + err
                });
            });
        }
    },
    computed: {

    }
}

</script>
