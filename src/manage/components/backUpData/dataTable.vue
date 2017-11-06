<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="fileName" label="文件名" width="200">
                <template slot-scope="scope">
                    <i :style="{color: '#99A9BF'}" class="fa fa-database"></i>&nbsp;{{scope.row.fileName}}
                </template>
            </el-table-column>
            <el-table-column prop="logs" label="行为">
            </el-table-column>
            <el-table-column prop="date" label="备份时间">
            </el-table-column>
            <el-table-column label="操作" width="120">
                <template slot-scope="scope">
                    <el-button size="mini" type="danger" plain round icon="el-icon-delete" @click="deleteDataItem(scope.$index, dataList)"></el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

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
        handleSelectionChange(val) {
            this.multipleSelection = val;
        },
        deleteDataItem(index, rows) {
            this.$confirm('此操作将永久删除该数据, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                return services.deletetBakDataItem({
                    ids: rows[index]._id,

                });
            }).then((result) => {
                if (result.data.state === 'success') {
                    this.$store.dispatch('getBakDateList');
                    this.$message({
                        message: '删除成功',
                        type: 'success'
                    });
                } else {
                    this.$message.error(result.data.message);
                }
            }).catch(() => {
                this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });
        }
    }
}

</script>
