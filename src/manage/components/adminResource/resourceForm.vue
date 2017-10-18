<template>
    <div class="dr-AdminResourceForm">
        <el-dialog width="35%" size="small" title="填写资源信息" :visible.sync="dialogState.show" :close-on-click-modal="false">
            <el-form :model="dialogState.formData" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
                <el-form-item v-show="dialogState.type==='children' && !dialogState.edit" label="父对象" prop="label">
                    <el-input size="small" :disabled="true" v-model="dialogState.formData.parent.label"></el-input>
                </el-form-item>

                <el-form-item label="资源名称" prop="label">
                    <el-input size="small" v-model="dialogState.formData.label"></el-input>
                </el-form-item>
                <el-form-item label="类型" prop="type">
                    <el-select size="small" v-model="dialogState.formData.type" placeholder="请选择" @change="changeType">
                        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
                <div v-if="dialogState.formData.type === '0'">
                    <el-form-item label="Icon" prop="componentPath">
                        <el-input size="small" v-model="dialogState.formData.icon">
                            <template slot="prepend">fa fa-</template>
                        </el-input>
                    </el-form-item>
                    <div v-if="dialogState.formData.parentId !== '0'">
                        <el-form-item label="路由Key" prop="routePath">
                            <el-input size="small" v-model="dialogState.formData.routePath">
                            </el-input>
                        </el-form-item>
                        <el-form-item label="模板路径" prop="componentPath">
                            <el-input size="small" v-model="dialogState.formData.componentPath">
                                <template slot="prepend">/component/</template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="显示在菜单项" prop="enable">
                            <el-switch on-text="是" off-text="否" v-model="dialogState.formData.enable"></el-switch>
                        </el-form-item>
                    </div>
                </div>
                <div v-else>
                    <el-form-item label="资源地址" prop="api">
                        <el-input size="small" v-model="dialogState.formData.api">
                            <template slot="prepend">/manage/</template>
                        </el-input>
                    </el-form-item>
                </div>
                <el-form-item label="排序" prop="sortId">
                    <el-input-number size="small" v-model="dialogState.formData.sortId" @change="handleChange" :min="1" :max="50"></el-input-number>
                </el-form-item>
                <el-form-item label="资源描述" prop="comments">
                    <el-input size="small" v-model="dialogState.formData.comments"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button size="medium" type="primary" @click="submitForm('ruleForm')">{{dialogState.edit ? '更新' : '保存'}}</el-button>
                    <el-button size="medium" @click="resetForm('ruleForm')">重置</el-button>
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
                label: [{
                    required: true,
                    message: '请输入资源名称',
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
                type: [{
                    required: true,
                    message: '请选择资源类型',
                    trigger: 'change'
                }],
                comments: [{
                    message: '请填写备注',
                    trigger: 'blur'
                }, {
                    min: 2,
                    max: 30,
                    message: '请输入2-30个字符',
                    trigger: 'blur'
                }]
            },
            options: [{
                value: '0',
                label: '基础菜单'
            }, {
                value: '1',
                label: '操作和功能'
            }]
        };
    },
    methods: {
        handleChange(value) {
            console.log(value);
        },
        changeType(value) {

        },
        confirm() {
            this.$store.dispatch('hideAdminResourceForm')
        },
        submitForm(formName) {
            this.$refs[formName].validate((valid) => {
                if (valid) {
                    let params = this.dialogState.formData;
                    // 更新
                    if (this.dialogState.edit) {
                        services.updateAdminResource(params).then((result) => {
                            if (result.data.state === 'success') {
                                this.$store.dispatch('hideAdminResourceForm');
                                this.$store.dispatch('getAdminResourceList');
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
                        services.addAdminResource(params).then((result) => {
                            if (result.data.state === 'success') {
                                this.$store.dispatch('hideAdminResourceForm');
                                this.$store.dispatch('getAdminResourceList');
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
        },
        resetForm(formName) {
            this.$refs[formName].resetFields();
        }

    }
}
</script>