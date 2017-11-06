<template>
    <div class="dr-adminGroupForm">
        <ItemForm :formState="adsItemForm" />
        <el-form :model="formState.formData" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
            <el-form-item label="广告名" prop="name">
                <el-input size="small" v-model="formState.formData.name"></el-input>
            </el-form-item>
            <el-form-item v-if="!formState.edit" label="广告类型" prop="type">
                <el-radio-group v-model="formState.formData.type" @change="changeType">
                    <el-radio class="radio" label="0">文字</el-radio>
                    <el-radio class="radio" label="1">图片</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="有效" prop="state">
                <el-switch on-text="是" off-text="否" v-model="formState.formData.state"></el-switch>
            </el-form-item>
            <el-form-item label="备注" prop="comments">
                <el-input size="small" v-model="formState.formData.comments"></el-input>
            </el-form-item>

            <div v-if="formState.formData.type == '1'">
                <el-form-item label="轮播" prop="carousel">
                    <el-switch on-text="是" off-text="否" v-model="formState.formData.carousel"></el-switch>
                </el-form-item>
                <el-form-item label="显示高度" prop="height">
                    <el-input size="small" type="number" min="0" max="10" style="width:150px;" placeholder="显示高度" v-model="formState.formData.height">
                        <template slot="append">px</template>
                    </el-input>
                </el-form-item>
                <el-form-item label="图片列表" prop="items">
                    <el-button size="small" type="primary" plain round @click="showAdsItemForm">添加图片</el-button>
                    <div class="dr-ads-item" v-for="item in formState.formData.items" :key="item._id">
                        <div class="img">
                            <img :src="item.sImg" />
                        </div>
                        <div class="details">
                            <ul>
                                <li>名称：{{item.alt}}</li>
                                <li>链接：{{item.link}}</li>
                            </ul>
                        </div>
                        <div class="options">
                            <el-button size="mini" type="primary" plain round @click="editAdsItemInfo(item)">
                                <i class="fa fa-edit"></i>
                            </el-button>
                        </div>
                        <i class="el-icon-close" @click="deleteAdsItem(item)"></i>
                    </div>
                </el-form-item>
            </div>
            <div v-if="formState.formData.type == '0'">
                <el-form-item label="链接列表" prop="items">
                    <el-button size="small" type="primary" plain round @click="showAdsItemForm">添加链接</el-button>
                    <div v-if="formState.formData.items.length > 0">
                        <el-tag v-for="tag in formState.formData.items" :key="tag.title" type='gray' :closable="true" @close="deleteAdsItem(tag)">
                            <span @click="editAdsItemInfo(tag)">{{tag.title}}</span>
                        </el-tag>
                    </div>
                </el-form-item>
            </div>
            <el-form-item>
                <el-button size="medium" type="primary" @click="submitForm('ruleForm')">{{formState.edit ? '更新' : '保存'}}</el-button>
                <el-button size="medium" @click="backToList">返回</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
import services from '../../store/services.js';
const validatorUtil = require('../../../../utils/validatorUtil.js')
import ItemForm from './itemForm'
import _ from 'lodash'
import {
    mapGetters,
    mapActions
} from 'vuex'
export default {
    data() {
        return {
            rules: {
                name: [{
                    required: true,
                    message: '请输入广告名称',
                    trigger: 'blur'
                }, {
                    min: 2,
                    max: 15,
                    message: '请输入2-15个字符',
                    trigger: 'blur'
                }],
                comments: [{
                    required: true,
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
    components: {
        ItemForm
    },
    methods: {
        backToList() {
            this.$router.push('/ads');
        },
        changeType(type) {
        },
        showAdsItemForm() {
            this.$store.dispatch('showAdsItemForm', { edit: false })
        },
        editAdsItemInfo(item) {
            this.$store.dispatch('showAdsItemForm', {
                edit: true,
                formData: item
            });
        },
        deleteAdsItem(item) {
            let oldFormState = this.$store.getters.adsInfoForm;
            let adsItems = oldFormState.formData.items;
            let currentIndex = _.findIndex(adsItems, item);
            adsItems.splice(currentIndex, 1);
            this.$store.dispatch('adsInfoForm', oldFormState);
        },
        submitForm(formName) {
            this.$refs[formName].validate((valid) => {
                if (valid) {
                    let params = this.formState.formData;
                    // 更新
                    if (this.formState.edit) {
                        services.updateAds(params).then((result) => {
                            if (result.data.state === 'success') {
                                this.$store.dispatch('hideAdsItemForm');
                                this.$message({
                                    message: '更新成功',
                                    type: 'success'
                                });
                                this.$router.push('/ads');
                            } else {
                                this.$message.error(result.data.message);
                            }
                        });
                    } else {
                        // 新增
                        services.addOneAd(params).then((result) => {
                            if (result.data.state === 'success') {
                                this.$message({
                                    message: '添加成功',
                                    type: 'success'
                                });
                                this.$router.push('/ads');
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
    },
    computed: {
        ...mapGetters([
            'adsItemForm'
        ]),
        formState() {
            return this.$store.getters.adsInfoForm
        }
    },
    mounted() {
        // 针对手动页面刷新
        if (this.$route.params.id) {
            services.getOneAd(this.$route.params).then((result) => {
                if (result.data.state === 'success') {
                    if (result.data.doc) {
                        this.$store.dispatch('adsInfoForm', {
                            edit: true,
                            formData: result.data.doc
                        });
                    } else {
                        this.$message({
                            message: '参数非法,请重新操作！',
                            type: 'warning',
                            onClose: () => {
                                this.$router.push('/ads');
                            }
                        });
                    }
                } else {
                    this.$message.error(result.data.message);
                }
            });
        }
    }
}
</script>
<style lang="scss">
.el-tag {
    margin-right: 15px;
}

.dr-ads-item {
    color: #48576a;
    border-radius: 4px;
    border: 1px solid #bfcbd9;
    padding: 5px;
    position: relative;
    margin: 15px 0;
    .img {
        width: 70px;
        height: 70px;
        position: absolute;
        img {
            width: 100%;
            height: 100%;
        }
    }
    .details {
        display: inline-block;
        margin-left: 80px;
        ul {
            margin: 0;
            padding: 0;
            li {
                list-style-type: none;
            }
        }
    }
    .options {
        position: absolute;
        right: 20px;
        top: 20px;
    }
    .el-icon-close {
        position: absolute;
        right: 5px;
        top: 5px;
        font-size: 11px;
        cursor: pointer;
        color: #bfcbd9;
    }
}
</style>