<template>
    <div>
        <el-table align="center" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="name" label="角色名" width="120">
            </el-table-column>
            <el-table-column prop="comments" label="角色描述" show-overflow-tooltip>
            </el-table-column>
            <el-table-column label="操作" width="200">
                <template slot-scope="scope">
                    <el-button size="mini" type="primary" plain round @ @click="editRoleInfo(scope.$index, dataList)"><i class="fa fa-edit"></i></el-button>
                    <el-button size="mini" type="warning" plain round @click="editPowerInfo(scope.$index, dataList)"><i class="fa fa-superpowers"></i></el-button>
                    <el-button size="mini" type="danger" plain round icon="el-icon-delete" @click="deleteRole(scope.$index, dataList)"></el-button>
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
        handleSelectionChange(val) {
            this.multipleSelection = val;
        },
        editRoleInfo(index, rows) {
            this.$store.dispatch('showAdminGroupForm', {
                edit: true,
                formData: rows[index]
            });
        },
        editPowerInfo(index, rows) {
            this.$store.dispatch('showAdminGroupRoleForm', {
                edit: true,
                formData: rows[index]
            });
        },
        deleteRole(index, rows) {
            this.$confirm('此操作将永久删除该角色, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                return services.deleteAdminGroup({
                    ids: rows[index]._id
                });
            }).then((result) => {
                if (result.data.state === 'success') {
                    this.$store.dispatch('getAdminGroupList');
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