<template>
  <el-card class="ai-suggestion-panel" shadow="never">
    <template #header>
      <div class="panel-header">
        <div class="header-left">
          <el-icon class="ai-icon"><MagicStick /></el-icon>
          <span class="header-title">{{ $t('aiSuggestion.title') }}</span>
        </div>
        <el-tag :type="statusType" size="small" effect="plain" round>{{ statusText }}</el-tag>
      </div>
    </template>

    <!-- AI 服务不可用提示 -->
    <el-empty v-if="!aiAvailable" :description="$t('aiSuggestion.unavailable')" :image-size="100">
      <el-button type="primary" @click="handleGoToConfig">{{ $t('aiSuggestion.goToConfig') }}</el-button>
    </el-empty>

    <!-- AI 服务可用时显示功能区 -->
    <div v-else class="panel-content">
      <!-- 快速操作区 -->
      <div class="quick-actions">
        <el-button
          type="primary"
          :icon="MagicStick"
          :loading="generating"
          :disabled="!hasContent"
          @click="handlePreview"
          class="w-full mb-3"
          size="large"
        >
          {{ generating ? $t('aiSuggestion.button.generating') : $t('aiSuggestion.button.preview') }}
        </el-button>

        <!-- 单项生成按钮 -->
        <template v-if="showQuickActions">
          <div class="quick-grid">
            <el-tooltip :content="$t('aiSuggestion.button.generateTitle')" placement="top">
              <el-button
                size="default"
                :loading="generatingTitle"
                :disabled="!hasContent"
                @click="handleGenerateTitle"
                class="grid-btn"
              >
                <el-icon><EditPen /></el-icon>
                <span>{{ $t('aiSuggestion.type.title') }}</span>
              </el-button>
            </el-tooltip>

            <el-tooltip :content="$t('aiSuggestion.button.generateSummary')" placement="top">
              <el-button
                size="default"
                :loading="generatingSummary"
                :disabled="!hasContent"
                @click="handleGenerateSummary"
                class="grid-btn"
              >
                <el-icon><Document /></el-icon>
                <span>{{ $t('aiSuggestion.type.summary') }}</span>
              </el-button>
            </el-tooltip>

            <el-tooltip :content="$t('aiSuggestion.button.extractTags')" placement="top">
              <el-button
                size="default"
                :loading="generatingTags"
                :disabled="!hasContent"
                @click="handleGenerateTags"
                class="grid-btn"
              >
                <el-icon><PriceTag /></el-icon>
                <span>{{ $t('aiSuggestion.type.tags') }}</span>
              </el-button>
            </el-tooltip>
          </div>
        </template>
      </div>

      <!-- 本次生成消耗提示 -->
      <div v-if="lastRequestCost > 0" class="cost-alert mb-3">
        <el-alert
          :title="$t('aiSuggestion.costAlert', { cost: lastRequestCost.toFixed(4) })"
          type="info"
          show-icon
          :closable="true"
          @close="lastRequestCost = 0"
        >
          <template #icon>
            <el-icon><Money /></el-icon>
          </template>
        </el-alert>
      </div>

      <!-- 建议列表区 -->
      <div v-if="suggestions.length > 0" class="suggestions-section">
        <div class="suggestions-header">
          <span class="suggestions-title">{{ $t('aiSuggestion.list.title') }}</span>
          <el-popconfirm :title="$t('common.confirmDelete')" @confirm="handleClearAll">
            <template #reference>
              <el-button type="primary" link size="small">
                {{ $t('aiSuggestion.button.clearAll') }}
              </el-button>
            </template>
          </el-popconfirm>
        </div>

        <el-scrollbar max-height="calc(100vh - 450px)" class="suggestions-scroll">
          <div class="suggestion-items">
            <transition-group name="list">
              <div
                v-for="suggestion in suggestions"
                :key="suggestion.id"
                class="suggestion-item"
                :class="{ applied: suggestion.applied }"
              >
                <div class="item-header">
                  <div class="item-type">
                    <el-tag :type="getSuggestionTypeTag(suggestion.type)" size="small" effect="light">
                      {{ getSuggestionTypeText(suggestion.type) }}
                    </el-tag>
                    <span class="item-time">{{ formatTime(suggestion.timestamp) }}</span>
                  </div>
                  <div class="item-actions">
                    <el-button
                      v-if="!suggestion.applied"
                      type="primary"
                      link
                      size="small"
                      @click="handleApply(suggestion)"
                    >
                      {{ $t('aiSuggestion.button.apply') }}
                    </el-button>
                    <el-tag v-else type="success" size="small" effect="plain">
                      <el-icon><Check /></el-icon> {{ $t('aiSuggestion.button.applied') }}
                    </el-tag>
                    <el-button type="info" link size="small" class="ml-2" @click="handleDismiss(suggestion.id)">
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                </div>

                <div class="item-content">
                  <div v-if="suggestion.type === 'tags'" class="tags-content">
                    <el-tag v-for="(tag, idx) in suggestion.content" :key="idx" size="small" class="mr-2 mb-2">
                      {{ tag }}
                    </el-tag>
                  </div>
                  <div v-else class="text-content">{{ suggestion.content }}</div>
                </div>

                <div v-if="suggestion.metadata" class="item-footer">
                  <span class="metadata-tag" v-if="suggestion.metadata.provider">
                    <el-icon><Cpu /></el-icon> {{ suggestion.metadata.provider }}
                  </span>
                  <span class="metadata-tag" v-if="suggestion.metadata.cost">
                    <el-icon><Money /></el-icon> {{ $t('aiSuggestion.costUnit')
                    }}{{ suggestion.metadata.cost.toFixed(4) }}
                  </span>
                </div>
              </div>
            </transition-group>
          </div>
        </el-scrollbar>
      </div>

      <el-empty v-else :image-size="60" :description="$t('aiSuggestion.empty')" class="mt-4" />
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  MagicStick,
  EditPen,
  Document,
  PriceTag,
  Clock,
  Money,
  DataLine,
  Check,
  Close,
  Cpu,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';

const { t } = useI18n();

const props = defineProps({
  // AI 服务是否可用
  aiAvailable: {
    type: Boolean,
    default: false,
  },
  // 是否有内容（用于禁用按钮）
  hasContent: {
    type: Boolean,
    default: false,
  },
  // 使用统计
  usageStats: {
    type: Object,
    default: null,
  },
  // 是否显示快速操作按钮（生成标题、生成摘要、提取标签）
  showQuickActions: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  'preview',
  'generate-title',
  'generate-summary',
  'generate-tags',
  'apply-suggestion',
  'go-to-config',
]);

// 生成状态
const generating = ref(false);
const generatingTitle = ref(false);
const generatingSummary = ref(false);
const generatingTags = ref(false);

// 上次请求消耗
const lastRequestCost = ref(0);

// 建议列表
const suggestions = ref([]);

// AI 状态
const statusType = computed(() => (props.aiAvailable ? 'success' : 'warning'));
const statusText = computed(() =>
  props.aiAvailable ? t('aiSuggestion.status.available') : t('aiSuggestion.status.unavailable')
);

/**
 * 添加建议
 */
function addSuggestion(type, content, metadata = null) {
  const suggestion = {
    id: nanoid(),
    type,
    content,
    metadata,
    applied: false,
    timestamp: Date.now(),
  };
  suggestions.value.unshift(suggestion);

  // 限制建议数量
  if (suggestions.value.length > 20) {
    suggestions.value = suggestions.value.slice(0, 20);
  }
}

/**
 * 预览 AI 增强效果
 */
async function handlePreview() {
  generating.value = true;
  try {
    emit('preview');
  } finally {
    generating.value = false;
  }
}

/**
 * 生成标题
 */
async function handleGenerateTitle() {
  generatingTitle.value = true;
  try {
    emit('generate-title');
  } finally {
    generatingTitle.value = false;
  }
}

/**
 * 生成摘要
 */
async function handleGenerateSummary() {
  generatingSummary.value = true;
  try {
    emit('generate-summary');
  } finally {
    generatingSummary.value = false;
  }
}

/**
 * 生成标签
 */
async function handleGenerateTags() {
  generatingTags.value = true;
  try {
    emit('generate-tags');
  } finally {
    generatingTags.value = false;
  }
}

/**
 * 采用建议
 */
function handleApply(suggestion) {
  suggestion.applied = true;
  emit('apply-suggestion', suggestion);
  ElMessage.success(t('aiSuggestion.success.applied'));
}

/**
 * 忽略建议
 */
function handleDismiss(id) {
  const index = suggestions.value.findIndex(s => s.id === id);
  if (index !== -1) {
    suggestions.value.splice(index, 1);
  }
}

/**
 * 清空全部建议
 */
function handleClearAll() {
  suggestions.value = [];
}

/**
 * 前往配置
 */
function handleGoToConfig() {
  emit('go-to-config');
}

/**
 * 获取建议类型标签
 */
function getSuggestionTypeTag(type) {
  const tags = {
    title: 'primary',
    summary: 'success',
    tags: 'warning',
    category: 'info',
  };
  return tags[type] || 'info';
}

/**
 * 获取建议类型文本
 */
function getSuggestionTypeText(type) {
  const texts = {
    title: t('aiSuggestion.type.title'),
    summary: t('aiSuggestion.type.summary'),
    tags: t('aiSuggestion.type.tags'),
    category: t('aiSuggestion.type.category'),
  };
  return texts[type] || type;
}

function formatTime(timestamp) {
  return dayjs(timestamp).format('HH:mm');
}

// 暴露方法
defineExpose({
  addSuggestion,
  suggestions,
  setGenerating(loading) {
    generating.value = loading;
  },
  setGeneratingTitle(loading) {
    generatingTitle.value = loading;
  },
  setGeneratingSummary(loading) {
    generatingSummary.value = loading;
  },
  setGeneratingTags(loading) {
    generatingTags.value = loading;
  },
  setLastRequestCost(cost) {
    lastRequestCost.value = cost;
  },
});
</script>

<style scoped lang="scss">
.ai-suggestion-panel {
  height: 100%;
  border: none;
  background-color: transparent;
  margin-bottom: 4px;
  :deep(.el-card__header) {
    padding: 16px;
    background-color: var(--el-bg-color);
    border-radius: 8px 8px 0 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-card__body) {
    padding: 16px !important;
    background-color: var(--el-bg-color);
    border-radius: 0 0 8px 8px;
    min-height: 400px;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .ai-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }

    .header-title {
      font-weight: 600;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }
  }
}

.quick-actions {
  margin-bottom: 20px;

  .quick-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;

    .grid-btn {
      display: flex;
      flex-direction: column;
      height: auto;
      padding: 8px 4px;
      gap: 4px;

      .el-icon {
        margin: 0;
        font-size: 16px;
      }

      span {
        font-size: 12px;
      }
    }
  }
}

.suggestions-section {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;

  .suggestions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .suggestions-title {
      font-weight: 600;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
  }
}

.suggestion-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background-color: var(--el-fill-color-blank);
  margin-bottom: 12px;
  transition: all 0.3s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &.applied {
    background-color: var(--el-color-success-light-9);
    border-color: var(--el-color-success-light-5);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .item-type {
      display: flex;
      align-items: center;
      gap: 8px;

      .item-time {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .item-content {
    margin-bottom: 8px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-regular);

    .tags-content {
      display: flex;
      flex-wrap: wrap;
    }
  }

  .item-footer {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .metadata-tag {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.w-full {
  width: 100%;
}
.mb-3 {
  margin-bottom: 12px;
}
.mt-4 {
  margin-top: 16px;
}
.ml-2 {
  margin-left: 8px;
}
.mr-2 {
  margin-right: 8px;
}
.mb-2 {
  margin-bottom: 8px;
}
</style>
