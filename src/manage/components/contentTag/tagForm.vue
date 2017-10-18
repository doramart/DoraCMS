<template>
    <div class="dr-contentTagForm">
        <el-dialog width="35%" size="small" title="填写标签信息" :visible.sync="dialogState.show" :close-on-click-modal="false">
            <el-form :model="dialogState.formData" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
                <el-form-item label="名称" prop="name">
                    <el-input size="small" v-model="dialogState.formData.name"></el-input>
                </el-form-item>
                <el-form-item label="备注" prop="comments">
                    <el-input size="small" type="textarea" v-model="dialogState.formData.comments"></el-input>
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
import _ from 'lodash';
export default {
    props: {
        dialogState: Object,
        groups: Array
    },
    data() {
        return {
            rules: {
                name: [{
                    required: true,
                    message: '请输入标签名称',
                    trigger: 'blur'
                },
                {
                    min: 1,
                    max: 12,
                    message: '请输入1-12个非特殊字符',
                    trigger: 'blur'
                }
                ],
                comments: [{
                    required: true,
                    message: '请填写备注',
                    trigger: 'blur'
                }, {
                    min: 2,
                    max: 30,
                    message: '请输入5-30个字符',
                    trigger: 'blur'
                }]
            }
        };
    },
    methods: {
        confirm() {
            this.$store.dispatch('hideContentTagForm')
        },
        submitForm(formName) {
            this.$refs[formName].validate((valid) => {
                if (valid) {
                    let params = this.dialogState.formData;
                    // 更新
                    if (this.dialogState.edit) {
                        services.updateContentTag(params).then((result) => {
                            if (result.data.state === 'success') {
                                this.$store.dispatch('hideContentTagForm');
                                this.$store.dispatch('getContentTagList');
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
                        services.addContentTag(params).then((result) => {
                            if (result.data.state === 'success') {
                                this.$store.dispatch('hideContentTagForm');
                                this.$store.dispatch('getContentTagList');
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