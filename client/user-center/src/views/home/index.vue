<template>
  <div class="home-container">
    <div class="card form-container">
      <h2 class="form-title">{{ $t('user.home.userInfo') }}</h2>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item :label="$t('user.profile.basic.username')" prop="username">
          <el-input v-model="form.username" :placeholder="$t('user.profile.placeholder.username')" />
        </el-form-item>
        
        <el-form-item :label="$t('user.profile.basic.email')" prop="email">
          <el-input v-model="form.email" :placeholder="$t('user.profile.placeholder.email')" />
        </el-form-item>
        
        <el-form-item :label="$t('user.profile.basic.phoneNum')" prop="phone">
          <el-input v-model="form.phone" :placeholder="$t('user.profile.placeholder.tel')" />
        </el-form-item>
        
        <el-form-item :label="$t('user.home.gender')" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio :label="1">{{ $t('user.home.male') }}</el-radio>
            <el-radio :label="2">{{ $t('user.home.female') }}</el-radio>
            <el-radio :label="0">{{ $t('user.home.secret') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item :label="$t('user.home.birthday')" prop="birthday">
          <el-date-picker
            v-model="form.birthday"
            type="date"
            :placeholder="$t('user.home.selectDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item :label="$t('user.home.region')" prop="region">
          <el-cascader
            v-model="form.region"
            :options="regionOptions"
            :placeholder="$t('user.home.selectRegion')"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">{{ $t('user.home.save') }}</el-button>
          <el-button @click="resetForm">{{ $t('system.button.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { regionData } from '@/config/region-data'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const formRef = ref(null)

const form = reactive({
  username: '',
  email: '',
  phone: '',
  gender: 0,
  birthday: '',
  region: []
})

const rules = {
  username: [
    { required: true, message: t('validation.inputNull', [t('user.profile.basic.username')]), trigger: 'blur' },
    { min: 2, max: 20, message: t('validation.rangelength', [t('user.profile.basic.username'), 2, 20]), trigger: 'blur' }
  ],
  email: [
    { required: true, message: t('validation.inputNull', [t('user.profile.basic.email')]), trigger: 'blur' },
    { type: 'email', message: t('validation.inputCorrect', [t('user.profile.basic.email')]), trigger: 'blur' }
  ],
  phone: [
    { required: true, message: t('validation.inputNull', [t('user.profile.basic.phoneNum')]), trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: t('user.home.phoneNumberFormat'), trigger: 'blur' }
  ],
  gender: [
    { required: true, message: t('user.home.selectGender'), trigger: 'change' }
  ],
  birthday: [
    { required: true, message: t('user.home.selectBirthday'), trigger: 'change' }
  ],
  region: [
    { required: true, message: t('user.home.selectRegion'), trigger: 'change' }
  ]
}

// 模拟区域数据
const regionOptions = ref(regionData || [
  {
    value: 110000,
    label: '北京市',
    children: [
      {
        value: 110100,
        label: '北京市',
        children: [
          { value: 110101, label: '东城区' },
          { value: 110102, label: '西城区' }
        ]
      }
    ]
  },
  {
    value: 120000,
    label: '天津市',
    children: [
      {
        value: 120100,
        label: '天津市',
        children: [
          { value: 120101, label: '和平区' },
          { value: 120102, label: '河东区' }
        ]
      }
    ]
  }
])

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      ElMessage.success(t('user.home.submitSuccess'))
      console.log('表单数据:', form)
      // 这里可以调用 API 将数据提交到后端
    } else {
      console.log('表单校验失败:', fields)
      ElMessage.error(t('user.home.formCheckFailed'))
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}
</script>

<style lang="scss" scoped>
.home-container {
  .form-container {
    margin-top: 20px;
  }
  
  .form-title {
    margin-bottom: 20px;
    text-align: center;
    font-size: 22px;
    color: var(--text-color-primary);
  }
}

@media (max-width: 768px) {
  :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    padding: 0 0 10px;
  }
  
  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}
</style> 