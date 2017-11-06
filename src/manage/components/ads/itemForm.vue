<template>
    <div class="dr-adminGroupForm">
        <el-dialog width="35%" size="small" :title="(formState.edit?'编辑':'添加')+(adsType == '1'?'图片':'文本链接')" :visible.sync="formState.show" :close-on-click-modal="false">
            <el-form v-if="adsType == '1'" :model="formState.formData" :rules="rules" ref="ruleForm" label-width="80px" class="demo-ruleForm">
                <el-form-item label="描述" prop="alt">
                    <el-input size="small" v-model="formState.formData.alt"></el-input>
                </el-form-item>
                <el-form-item label="链接" prop="link">
                    <el-input size="small" v-model="formState.formData.link"></el-input>
                </el-form-item>
                <el-form-item label="上传" prop="sImg">
                    <el-upload class="avatar-uploader" action="/system/upload?type=images" :show-file-list="false" :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload">
                        <img v-if="formState.formData.sImg" :src="formState.formData.sImg" class="avatar">
                        <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                    </el-upload>
                </el-form-item>
                <el-form-item>
                    <el-button size="medium" type="primary" @click="submitForm('ruleForm')">{{formState.edit ? '更新' : '保存'}}</el-button>
                </el-form-item>
            </el-form>
            <el-form v-if="adsType == '0'" :model="formState.formData" :rules="rules1" ref="ruleForm1" label-width="80px" class="demo-ruleForm">
                <el-form-item label="文字内容" prop="title">
                    <el-input size="small" v-model="formState.formData.title"></el-input>
                </el-form-item>
                <el-form-item label="链接" prop="link">
                    <el-input size="small" v-model="formState.formData.link"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button size="smmediumall" type="primary" @click="submitForm('ruleForm1')">{{formState.edit ? '更新' : '保存'}}</el-button>
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
        formState: Object
    },
    data() {
        return {
            rules1: {
                title: [{
                    required: true,
                    message: '请输入文字内容',
                    trigger: 'blur'
                }, {
                    min: 2,
                    max: 15,
                    message: '请输入2-15个字符',
                    trigger: 'blur'
                }],
                link: [{
                    required: true,
                    message: '请填写备注',
                    trigger: 'blur'
                }]
            },
            rules: {
                alt: [{
                    required: true,
                    message: '请输入广告备注',
                    trigger: 'blur'
                }, {
                    min: 2,
                    max: 30,
                    message: '请输入2-30个字符',
                    trigger: 'blur'
                }],
                link: [{
                    required: true,
                    message: '请填写备注',
                    trigger: 'blur'
                }]
            }
        };
    },
    computed: {
        adsType() {
            return this.$store.getters.adsInfoForm.formData.type
        }
    },
    methods: {
        handleAvatarSuccess(res, file) {
            this.formState.formData.sImg = res;
        },
        beforeAvatarUpload(file) {
            const isJPG = file.type === 'image/jpeg';
            const isPNG = file.type === 'image/png';
            const isGIF = file.type === 'image/gif';
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isJPG && !isPNG && !isGIF) {
                this.$message.error('上传头像图片只能是 JPG,PNG,GIF 格式!');
            }
            if (!isLt2M) {
                this.$message.error('上传头像图片大小不能超过 2MB!');
            }
            return (isJPG || isPNG || isGIF) && isLt2M;
        },
        submitForm(formName, type = '') {
            this.$refs[formName].validate((valid) => {
                if (valid) {
                    let params = this.formState.formData;
                    let oldFormState = this.$store.getters.adsInfoForm;
                    let adsItems = oldFormState.formData.items;
                    // 更新
                    if (this.formState.edit) {
                        for (let i = 0; i < adsItems.length; i++) {
                            if (adsItems[i]._id == params._id) adsItems[i] = params;
                        }
                        this.$store.dispatch('adsInfoForm', oldFormState);
                    } else {
                        // 新增
                        adsItems.push(params);
                        this.$store.dispatch('adsInfoForm', oldFormState);
                    }
                    this.$store.dispatch('hideAdsItemForm');
                } else {
                    console.log('error submit!!');
                    return false;
                }
            });
        }
    }
}

</script>

<style lang="scss">
.avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.avatar-uploader .el-upload:hover {
    border-color: #409EFF;
}

.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 200px;
    height: 150px;
    line-height: 150px;
    text-align: center;
}

.avatar {
    width: 200px;
    height: 158px;
    display: block;
}
</style>

