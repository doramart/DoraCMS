<template>
    <div class="dr-adminGroupForm">
        <el-dialog width="35%" size="small" title="填写用户信息" :visible.sync="dialogState.show" :close-on-click-modal="false">
            <el-form :model="dialogState.formData" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
                <el-form-item label="角色名" prop="name">
                    <el-input size="small" v-model="dialogState.formData.name"></el-input>
                </el-form-item>
                <el-form-item label="角色描述" prop="comments">
                    <el-input size="small" v-model="dialogState.formData.comments"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button size="medium" type="primary" @click="submitForm('ruleForm')">{{dialogState.edit ? '更新' : '保存'}}</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>
    </div>
</template>
<script>
import services from '../../store/services.js';
const validatorUtil = require('../../../../utils/validatorUtil.js')

export default {
    props: {
        dialogState: Object
    },
    data() {
        return {
            rules: {
                name: [{
                    message: '请输入角色名称',
                    trigger: 'blur'
                },
                {
                    validator: (rule, value, callback) => {
                        if (!validatorUtil.checkName(value, 2, 10)) {
                            callback(new Error('2-10个中文字符!'));
                        } else {
                            callback();
                        }
                    },
                    trigger: 'blur'
                }
                ],
                comments: [{
                    message: '请填写备注',
                    trigger: 'blur'
                }, {
                    min: 5,
                    max: 30,
                    message: '请输入5-30个字符',
                    trigger: 'blur'
                }]
            }
        };
    },
    methods: {
        confirm() {
            this.$store.dispatch('hideAdminGroupForm')
        },
        submitForm(formName) {
            this.$refs[formName].validate((valid) => {
                if (valid) {
                    console.log('---formdatas--', this);
                    let params = this.dialogState.formData;
                    // 更新
                    if (this.dialogState.edit) {
                        services.updateAdminGroup(params).then((result) => {
                            if (result.data.state === 'success') {
                                this.$store.dispatch('hideAdminGroupForm');
                                this.$store.dispatch('getAdminGroupList');
                                this.$message({
                                    message: '更新成功',
                                    type: 'success'
                                });
                            } else {
                                this.$message.error(result.data.message);
                            }
                        });
                    } else {
                        // 新增
                        services.addAdminGroup(params).then((result) => {
                            if (result.data.state === 'success') {
                                this.$store.dispatch('hideAdminGroupForm');
                                this.$store.dispatch('getAdminGroupList');
                                this.$message({
                                    message: '添加成功',
                                    type: 'success'
                                });
                            } else {
                                this.$message.error(result.data.message);
                            }
                        })
                    }

                } else {
                    console.log('error submit!!');
                    return false;
                }
            });
        }
    }
}
</script>