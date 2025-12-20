<template>
  <div class="publish-mode-selector">
    <div class="mode-cards">
      <!-- 手动模式 -->
      <div class="mode-card" :class="{ active: selectedMode === 'manual' }" @click="handleModeChange('manual')">
        <div class="card-icon">
          <el-icon><Edit /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-title">{{ $t('publish.mode.manual') }}</div>
          <div class="card-desc">{{ $t('publish.mode.manualDesc') }}</div>
        </div>
        <div class="card-check" v-if="selectedMode === 'manual'">
          <el-icon><Check /></el-icon>
        </div>
      </div>

      <!-- AI 辅助模式 -->
      <div
        class="mode-card"
        :class="{ active: selectedMode === 'ai_smart', disabled: !aiAvailable }"
        @click="aiAvailable && handleModeChange('ai_smart')"
      >
        <div class="card-icon ai-icon">
          <el-icon><MagicStick /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-title">
            {{ $t('publish.mode.aiSmart') }}
            <el-tag size="small" type="primary" effect="plain" round class="ml-2">AI</el-tag>
          </div>
          <div class="card-desc">{{ $t('publish.mode.aiSmartDesc') }}</div>
        </div>
        <div class="card-check" v-if="selectedMode === 'ai_smart'">
          <el-icon><Check /></el-icon>
        </div>
      </div>

      <!-- AI 完全模式 -->
      <div
        v-if="!disabledModes.includes('ai_full')"
        class="mode-card"
        :class="{ active: selectedMode === 'ai_full', disabled: !aiAvailable }"
        @click="aiAvailable && handleModeChange('ai_full')"
      >
        <div class="card-icon ai-full-icon">
          <el-icon><Cpu /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-title">
            {{ $t('publish.mode.aiFull') }}
            <el-tag size="small" type="success" effect="plain" round class="ml-2">Auto</el-tag>
          </div>
          <div class="card-desc">{{ $t('publish.mode.aiFullDesc') }}</div>
        </div>
        <div class="card-check" v-if="selectedMode === 'ai_full'">
          <el-icon><Check /></el-icon>
        </div>
      </div>
    </div>

    <div v-if="!aiAvailable" class="ai-unavailable-tip">
      <el-alert type="warning" :closable="false" show-icon>
        <template #title>
          <div class="flex items-center justify-between w-full">
            <span>{{ $t('publish.mode.unavailable') }}</span>
            <el-button type="primary" link size="small" @click="handleGoToConfig">
              {{ $t('publish.mode.goToConfig') }}
            </el-button>
          </div>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Edit, MagicStick, Cpu, Check } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: 'manual',
    validator: value => ['manual', 'ai_smart', 'ai_full'].includes(value),
  },
  aiAvailable: {
    type: Boolean,
    default: false,
  },
  disabledModes: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'change', 'go-to-config']);

const selectedMode = ref(props.modelValue);

// 监听外部变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== selectedMode.value) {
      selectedMode.value = newValue;
    }
  }
);

// 监听 AI 可用性变化
watch(
  () => props.aiAvailable,
  newValue => {
    // 如果 AI 服务不可用，切换回手动模式
    if (!newValue && selectedMode.value !== 'manual') {
      selectedMode.value = 'manual';
      emit('update:modelValue', 'manual');
      emit('change', 'manual');
    }
  }
);

// 监听禁用模式变化
watch(
  () => props.disabledModes,
  newValue => {
    // 如果当前选中的模式被禁用，切换到可用模式
    if (newValue.includes(selectedMode.value)) {
      // 优先选择 manual 模式
      selectedMode.value = 'manual';
      emit('update:modelValue', 'manual');
      emit('change', 'manual');
    }
  },
  { immediate: true }
);

/**
 * 处理模式切换
 */
function handleModeChange(mode) {
  if (props.disabledModes.includes(mode)) return;

  selectedMode.value = mode;
  emit('update:modelValue', mode);
  emit('change', mode);
}

/**
 * 前往配置
 */
function handleGoToConfig() {
  emit('go-to-config');
}
</script>

<style scoped lang="scss">
.publish-mode-selector {
  width: 100%;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.mode-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: var(--el-bg-color);

  &:hover:not(.disabled) {
    border-color: var(--el-color-primary-light-5);
    background-color: var(--el-color-primary-light-9);
    transform: translateY(-2px);
  }

  &.active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    box-shadow: 0 2px 12px rgba(var(--el-color-primary-rgb), 0.1);

    .card-icon {
      color: var(--el-color-primary);
      background-color: var(--el-color-white);
    }
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
    background-color: var(--el-fill-color-light);

    &:hover {
      transform: none;
    }
  }
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 20px;
  margin-right: 12px;
  transition: all 0.3s;

  &.ai-icon {
    color: var(--el-color-primary);
  }

  &.ai-full-icon {
    color: var(--el-color-success);
  }
}

.card-content {
  flex: 1;

  .card-title {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  .card-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }
}

.card-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--el-color-primary);
  font-size: 16px;
}

.ai-unavailable-tip {
  margin-top: 16px;
}
</style>
