<template>
  <el-dialog
    :title="isEdit ? $t('model.edit') : $t('model.add')"
    v-model="dialogVisible"
    width="680px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" size="default">
      <!-- 提供商选择 -->
      <el-form-item :label="$t('model.form.aiProvider')" prop="provider">
        <el-select v-model="formData.provider" :placeholder="$t('model.form.selectProvider')" @change="onProviderChange" :disabled="isEdit">
          <el-option v-for="provider in providers" :key="provider.id" :label="provider.name" :value="provider.id">
            <div style="display: flex; align-items: center; justify-content: space-between">
              <span>{{ provider.name }}</span>
              <el-tag v-if="provider.id === 'deepseek'" type="success" size="small">{{ $t('model.form.lowCost') }}</el-tag>
              <el-tag v-else-if="provider.id === 'ollama'" type="warning" size="small">{{ $t('model.form.localFree') }}</el-tag>
              <el-tag v-else-if="provider.id === 'openai'" size="small">{{ $t('model.form.highQuality') }}</el-tag>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 提供商信息提示 -->
      <el-alert
        v-if="selectedProvider"
        :title="selectedProvider.name"
        type="info"
        :closable="false"
        style="margin-bottom: 18px"
      >
        <div style="font-size: 13px; line-height: 1.6">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px">
            <div style="flex: 1; min-width: 0">{{ selectedProvider.description }}</div>
            <div v-if="selectedProvider.apiKeyUrl" style="flex-shrink: 0; white-space: nowrap">
              <a :href="selectedProvider.apiKeyUrl" target="_blank" style="color: #409eff; text-decoration: none">
                <el-icon style="vertical-align: middle"><Link /></el-icon>
                <span style="vertical-align: middle; margin-left: 4px">{{ $t('model.form.getApiKey') }}</span>
              </a>
            </div>
          </div>
        </div>
      </el-alert>

      <!-- API Key（OpenAI/DeepSeek/Anthropic 需要） -->
      <el-form-item v-if="needsApiKey" :label="$t('model.form.apiKey')" prop="apiKey">
        <el-input v-model="formData.apiKey" :type="showApiKey ? 'text' : 'password'" placeholder="sk-..." clearable>
          <template #append>
            <el-button :icon="showApiKey ? View : Hide" @click="showApiKey = !showApiKey" />
            <el-button :icon="testingApiKey ? Loading : Check" @click="handleTestApiKey" :loading="testingApiKey">
              {{ $t('model.form.test') }}
            </el-button>
          </template>
        </el-input>
        <div style="font-size: 12px; color: #909399; margin-top: 4px">
          <el-icon><Lock /></el-icon>
          {{ $t('model.form.apiKeySecurity') }}
        </div>
      </el-form-item>

      <!-- API 端点 -->
      <el-form-item :label="$t('model.form.apiEndpoint')" prop="apiEndpoint">
        <el-input v-model="formData.apiEndpoint" placeholder="https://api.openai.com/v1" />
      </el-form-item>

      <!-- 模型名称 -->
      <el-form-item :label="$t('model.form.modelName')" prop="modelName">
        <el-select
          v-model="formData.modelName"
          filterable
          allow-create
          :placeholder="$t('model.form.selectOrInputModel')"
          style="width: 100%"
        >
          <el-option v-for="model in availableModels" :key="model" :label="model" :value="model" />
        </el-select>
      </el-form-item>

      <!-- 显示名称 -->
      <el-form-item :label="$t('model.form.displayName')" prop="displayName">
        <el-input v-model="formData.displayName" :placeholder="$t('model.form.displayNamePlaceholder')" />
      </el-form-item>

      <!-- 描述 -->
      <el-form-item :label="$t('model.form.description')">
        <el-input v-model="formData.description" type="textarea" :rows="2" :placeholder="$t('model.form.descriptionPlaceholder')" />
      </el-form-item>

      <!-- 支持任务 -->
      <el-form-item :label="$t('model.form.supportedTasks')">
        <el-checkbox-group v-model="formData.supportedTasks">
          <el-checkbox label="title_generation">{{ $t('model.tasks.titleGeneration') }}</el-checkbox>
          <el-checkbox label="tag_extraction">{{ $t('model.tasks.tagExtraction') }}</el-checkbox>
          <el-checkbox label="summary_generation">{{ $t('model.tasks.summaryGeneration') }}</el-checkbox>
          <el-checkbox label="category_matching">{{ $t('model.tasks.categoryMatching') }}</el-checkbox>
          <el-checkbox label="seo_optimization">{{ $t('model.tasks.seoOptimization') }}</el-checkbox>
          <el-checkbox label="content_quality_check">{{ $t('model.tasks.contentQualityCheck') }}</el-checkbox>
          <el-checkbox label="keyword_extraction">{{ $t('model.tasks.keywordExtraction') }}</el-checkbox>
          <el-checkbox label="image_generation">{{ $t('model.tasks.imageGeneration') }}</el-checkbox>
          <el-checkbox label="text_to_image">{{ $t('model.tasks.textToImage') }}</el-checkbox>
          <el-checkbox label="image_prompt_optimization">{{ $t('model.tasks.imagePromptOptimization') }}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <!-- 优先级 -->
      <el-form-item :label="$t('model.form.priority')">
        <el-slider v-model="formData.priority" :min="1" :max="20" show-stops :marks="priorityMarks" />
        <div style="font-size: 12px; color: #909399; margin-top: 20px">
          {{ $t('model.form.priorityTip', { value: formData.priority }) }}
        </div>
      </el-form-item>

      <!-- 高级配置（折叠） -->
      <el-collapse style="margin-top: 8px">
        <el-collapse-item :title="$t('model.form.advancedConfig')" name="advanced">
          <el-form-item :label="$t('model.form.temperature')">
            <el-input-number v-model="formData.temperature" :min="0" :max="2" :step="0.1" :precision="1" />
            <span style="margin-left: 8px; font-size: 12px; color: #909399">
              {{ $t('model.form.temperatureTip') }}
            </span>
          </el-form-item>

          <el-form-item :label="$t('model.form.maxTokens')">
            <el-input-number v-model="formData.maxTokens" :min="100" :max="32768" :step="100" />
            <span style="margin-left: 8px; font-size: 12px; color: #909399">{{ $t('model.form.maxTokensTip') }}</span>
          </el-form-item>

          <el-form-item :label="$t('model.form.timeout')">
            <el-input-number v-model="formData.timeout" :min="5000" :max="120000" :step="1000" />
            <span style="margin-left: 8px; font-size: 12px; color: #909399">{{ $t('model.form.timeoutTip') }}</span>
          </el-form-item>

          <el-form-item :label="$t('model.form.maxRetries')">
            <el-input-number v-model="formData.maxRetries" :min="0" :max="5" />
          </el-form-item>

          <el-form-item :label="$t('model.form.enableStatus')">
            <el-switch v-model="formData.isEnabled" :active-text="$t('model.form.enable')" :inactive-text="$t('model.form.disable')" />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">{{ $t('system.button.cancel') }}</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        {{ isEdit ? $t('model.form.update') : $t('model.form.create') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { View, Hide, Check, Loading, Lock, Link } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { testApiKey } from '@/api/aiModel';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  modelData: {
    type: Object,
    default: null,
  },
  providers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:visible', 'success']);

const formRef = ref(null);
const dialogVisible = ref(false);
const showApiKey = ref(false);
const testingApiKey = ref(false);
const submitting = ref(false);

const isEdit = computed(() => !!props.modelData?.id || !!props.modelData?._id);

const priorityMarks = computed(() => ({
  5: t('model.form.priorityLow'),
  10: t('model.form.priorityMedium'),
  15: t('model.form.priorityHigh'),
  20: t('model.form.priorityHighest'),
}));

const formData = reactive({
  provider: '',
  apiKey: '',
  apiEndpoint: '',
  modelName: '',
  displayName: '',
  description: '',
  supportedTasks: [
    'title_generation',
    'tag_extraction',
    'summary_generation',
    'category_matching',
    'seo_optimization',
    'content_quality_check',
    'keyword_extraction',
    'image_generation',
    'text_to_image',
    'image_prompt_optimization',
  ],
  priority: 10,
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 30000,
  maxRetries: 2,
  isEnabled: true,
});

const rules = computed(() => ({
  provider: [{ required: true, message: t('model.form.pleaseSelectProvider'), trigger: 'change' }],
  apiKey: [
    {
      validator: (rule, value, callback) => {
        if (needsApiKey.value && !value && !isEdit.value) {
          callback(new Error(t('model.form.pleaseInputApiKey')));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  apiEndpoint: [{ required: true, message: t('model.form.pleaseInputApiEndpoint'), trigger: 'blur' }],
  modelName: [{ required: true, message: t('model.form.pleaseInputModelName'), trigger: 'blur' }],
  displayName: [{ required: true, message: t('model.form.pleaseInputDisplayName'), trigger: 'blur' }],
}));

const selectedProvider = computed(() => {
  return props.providers.find(p => p.id === formData.provider);
});

const needsApiKey = computed(() => {
  return formData.provider && formData.provider !== 'ollama';
});

const availableModels = computed(() => {
  return selectedProvider.value?.models || [];
});

watch(
  () => props.visible,
  val => {
    dialogVisible.value = val;
    if (val) {
      initForm();
    }
  }
);

watch(dialogVisible, val => {
  emit('update:visible', val);
});

function initForm() {
  if (isEdit.value) {
    // 编辑模式：填充数据
    const data = props.modelData;
    Object.assign(formData, {
      provider: data.provider,
      apiKey: '',
      apiEndpoint: data.config?.apiEndpoint || '',
      modelName: data.modelName,
      displayName: data.displayName,
      description: data.description || '',
      supportedTasks: data.supportedTasks || [],
      priority: data.priority || 10,
      temperature: data.config?.temperature || 0.7,
      maxTokens: data.config?.maxTokens || 2000,
      timeout: data.config?.timeout || 30000,
      maxRetries: data.maxRetries || 2,
      isEnabled: data.isEnabled !== false,
    });
  } else {
    // 新建模式：重置表单
    Object.assign(formData, {
      provider: '',
      apiKey: '',
      apiEndpoint: '',
      modelName: '',
      displayName: '',
      description: '',
      supportedTasks: [
        'title_generation',
        'tag_extraction',
        'summary_generation',
        'category_matching',
        'seo_optimization',
        'content_quality_check',
        'keyword_extraction',
        'image_generation',
        'text_to_image',
        'image_prompt_optimization',
      ],
      priority: 10,
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
      maxRetries: 2,
      isEnabled: true,
    });
  }
  showApiKey.value = false;
}

function onProviderChange() {
  // 提供商改变时，更新默认端点
  if (selectedProvider.value) {
    formData.apiEndpoint = selectedProvider.value.defaultEndpoint;
    formData.modelName = '';
  }
}

async function handleTestApiKey() {
  // 验证必填项
  if (!formData.provider) {
    ElMessage.warning(t('model.form.pleaseSelectProvider'));
    return;
  }

  if (!formData.apiKey && formData.provider !== 'ollama') {
    ElMessage.warning(t('model.form.pleaseInputApiKey'));
    return;
  }

  if (!formData.apiEndpoint) {
    ElMessage.warning(t('model.form.pleaseInputApiEndpoint'));
    return;
  }

  testingApiKey.value = true;
  try {
    const res = await testApiKey({
      provider: formData.provider,
      apiKey: formData.apiKey,
      apiEndpoint: formData.apiEndpoint,
    });

    // 检查响应状态
    if (res.status !== 200 && res.status !== 0) {
      throw new Error(res.message || '测试失败');
    }

    // 检查测试结果
    if (res.data?.valid) {
      ElMessage.success({
        message: t('model.form.apiKeyValid'),
        duration: 2000,
      });
    } else {
      // ElMessage.error({
      //   message: res.data?.message || 'API Key 无效，请检查配置',
      //   duration: 3000,
      // });
    }
  } catch (error) {
    console.error('测试 API Key 失败:', error);
    // ElMessage.error({
    //   message: 'API Key 测试失败：' + (error.message || '未知错误'),
    //   duration: 3000,
    // });
  } finally {
    testingApiKey.value = false;
  }
}

async function handleSubmit() {
  // 表单验证
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning(t('model.form.pleaseCheckForm'));
    return;
  }

  // 额外验证
  if (needsApiKey.value && !formData.apiKey && !isEdit.value) {
    ElMessage.warning(t('model.form.pleaseInputApiKey'));
    return;
  }

  if (!formData.apiEndpoint) {
    ElMessage.warning(t('model.form.pleaseInputApiEndpoint'));
    return;
  }

  if (!formData.modelName) {
    ElMessage.warning(t('model.form.pleaseInputModelName'));
    return;
  }

  submitting.value = true;
  try {
    const submitData = {
      provider: formData.provider,
      modelName: formData.modelName,
      displayName: formData.displayName,
      description: formData.description,
      config: {
        apiEndpoint: formData.apiEndpoint,
        maxTokens: formData.maxTokens,
        temperature: formData.temperature,
        timeout: formData.timeout,
      },
      supportedTasks: formData.supportedTasks,
      priority: formData.priority,
      maxRetries: formData.maxRetries,
      isEnabled: formData.isEnabled,
    };

    const isMaskedKey = value => {
      if (!value) return false;
      return value.includes('*') || /^\*+/.test(value) || /^sk-?\*+/.test(value);
    };

    // 只有在提供了有效 API Key 时才包含它（过滤掉后端返回的掩码值）
    if (formData.apiKey && !isMaskedKey(formData.apiKey)) {
      submitData.config.apiKey = formData.apiKey;
    }

    // 如果是编辑模式，添加 ID
    if (isEdit.value) {
      submitData.id = props.modelData.id || props.modelData._id;
    }

    // 发送事件给父组件处理
    emit('success', submitData);

    // 关闭对话框（父组件会在成功后重新加载数据）
    handleClose();
  } catch (error) {
    console.error('提交表单失败:', error);
    // ElMessage.error('操作失败：' + (error.message || '未知错误'));
  } finally {
    submitting.value = false;
  }
}

function handleClose() {
  formRef.value?.resetFields();
  dialogVisible.value = false;
}
</script>

<style scoped lang="scss">
:deep(.el-checkbox) {
  margin-right: 12px;
  margin-bottom: 8px;
}

:deep(.el-input-group__append) {
  button {
    border-left: 1px solid var(--el-border-color);
  }
  button + button {
    margin-left: 0;
  }
}
</style>
