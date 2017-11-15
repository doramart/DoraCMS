<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="userName" label="用户名" width="120">
            </el-table-column>
            <el-table-column prop="group.name" label="用户类型" width="120">
            </el-table-column>
            <el-table-column prop="name" label="姓名" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="phoneNum" label="联系方式" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="email" label="邮箱" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="enable" label="是否有效" show-overflow-tooltip>
                <template slot-scope="scope">
                    <i :class="scope.row.enable ? 'fa fa-check-circle' : 'fa fa-minus-circle'" :style="scope.row.enable ? green : red"></i>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
                <template slot-scope="scope">
                    <el-button size="mini" type="primary" plain round @click="editUserInfo(scope.$index, dataList)"> <i class="fa fa-edit"></i></el-button>
                    <el-button size="mini" type="danger" plain round icon="el-icon-delete" @click="deleteUser(scope.$index, dataList)"></el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import services from '../../store/services.js';
import _ from 'lodash';
export default {
    props: {
        dataList: Array
    },
    data() {
        return {
            loading: false,
            tableData3: this.$store.getters.adminUserList.docs,
            multipleSelection: [],
            green: { color: '#13CE66' },
            red: { color: '#FF4949' }
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
        editUserInfo(index, rows) {
            console.log('--rows---', rows);
            let rowData = rows[index];
            let newRowData = _.assign({}, rowData);
            newRowData.group = rows[index].group._id;
            this.$store.dispatch('showAdminUserForm', {
                edit: true,
                formData: newRowData
            });
        },
        deleteUser(index, rows) {
            this.$confirm('此操作将永久删除该用户, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                return services.deleteAdminUser({
                    ids: rows[index]._id
                });
            }).then((result) => {
                if (result.data.state === 'success') {
                    this.$store.dispatch('getAdminUserList');
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