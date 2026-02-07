<template>
  <div class="content-publish-container">
    <div class="publish-layout">
      <el-row :gutter="12">
        <!-- 左侧：主编辑区 -->
        <el-col
          :xs="24"
          :sm="24"
          :md="showRightColumn ? (showAIPanel ? 16 : 18) : 24"
          :lg="showRightColumn ? (showAIPanel ? 17 : 19) : 24"
          :xl="showRightColumn ? (showAIPanel ? 18 : 20) : 24"
        >
          <div class="main-editor">
            <!-- 顶部：标题与模式选择 -->
            <el-card shadow="hover" class="mb-4 section-card">
              <div class="page-header">
                <div class="header-title">
                  <h2 class="title-text">
                    {{ isEditMode ? $t('publish.pageTitle.edit') : $t('publish.pageTitle.create') }}
                  </h2>
                  <el-tag v-if="isEditMode" type="warning" effect="plain" size="small" class="ml-2">
                    {{ $t('publish.status.editing') }}
                  </el-tag>
                </div>
                <div class="header-actions">
                  <el-button @click="handleGoBack">{{ $t('publish.button.cancel') }}</el-button>
                  <el-button type="primary" :loading="publishing" @click="handlePublish">
                    <el-icon v-if="isAIFullMode" class="mr-1"><MagicStick /></el-icon>
                    {{ isAIFullMode ? $t('publish.button.aiPublish') : $t('publish.button.publish') }}
                  </el-button>
                </div>
              </div>

              <el-divider class="my-4" />

              <!-- 发布模式选择器 -->
              <PublishModeSelector
                v-model="publishMode"
                :ai-available="aiAvailable"
                :disabled-modes="isEditMode ? ['ai_full'] : []"
                @change="handleModeChange"
                @go-to-config="handleGoToAIConfig"
              />

              <!-- AI 完全模式提示 -->
              <transition name="el-fade-in">
                <el-alert v-if="isAIFullMode" type="info" :closable="false" show-icon class="mt-4 ai-full-alert">
                  <template #title>
                    <span class="font-medium">{{ $t('publish.aiFullAlert.title') }}</span>
                  </template>
                  <p class="alert-desc">
                    {{ $t('publish.aiFullAlert.description') }}
                  </p>
                </el-alert>
              </transition>
            </el-card>

            <!-- 内容表单 -->
            <el-form
              ref="formRef"
              :model="formData"
              :rules="formRules"
              label-position="top"
              class="publish-form"
              :disabled="publishing"
            >
              <!-- 基础信息卡片 -->
              <el-card shadow="hover" class="mb-4 section-card" v-if="!isAIFullMode">
                <template #header>
                  <div class="card-header">
                    <span class="header-text">{{ $t('publish.section.basicInfo') }}</span>
                  </div>
                </template>

                <el-row :gutter="24">
                  <el-col :span="24">
                    <!-- 标题 -->
                    <el-form-item :label="$t('publish.form.title')" prop="title">
                      <div class="form-item-with-ai">
                        <el-input
                          v-model="formData.title"
                          :placeholder="$t('publish.placeholder.title')"
                          :class="{ 'ai-generated': aiGenerated.title }"
                          size="large"
                          clearable
                          maxlength="100"
                          show-word-limit
                        >
                          <template v-if="aiGenerated.title" #prefix>
                            <el-tooltip :content="$t('publish.tips.aiGenerated')" placement="top">
                              <el-icon class="ai-badge-icon"><MagicStick /></el-icon>
                            </el-tooltip>
                          </template>
                        </el-input>
                        <el-tooltip
                          :content="$t('publish.button.aiGenerate')"
                          placement="top"
                          v-if="showInlineAIButtons"
                        >
                          <el-button
                            type="primary"
                            plain
                            :icon="MagicStick"
                            size="large"
                            :loading="generating.title"
                            :disabled="!hasContent"
                            @click="handleGenerateTitle"
                            class="ai-btn"
                          />
                        </el-tooltip>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-card>

              <!-- 内容编辑卡片 -->
              <el-card shadow="hover" class="mb-4 section-card">
                <template #header>
                  <div class="card-header">
                    <span class="header-text">{{ $t('publish.section.content') }}</span>
                  </div>
                </template>

                <el-form-item prop="comments" class="mb-0">
                  <WangEditor
                    ref="editorRef"
                    v-model="formData.comments"
                    height="600px"
                    @change="handleContentChange"
                  />
                </el-form-item>
              </el-card>

              <!-- 摘要与SEO卡片 (AI完全模式下隐藏) -->
              <el-card shadow="hover" class="mb-4 section-card" v-if="!isAIFullMode">
                <template #header>
                  <div class="card-header">
                    <span class="header-text">{{ $t('publish.section.seo') }}</span>
                  </div>
                </template>

                <el-form-item :label="$t('publish.form.summary')" prop="discription">
                  <div class="form-item-with-ai">
                    <el-input
                      v-model="formData.discription"
                      type="textarea"
                      :class="{ 'ai-generated': aiGenerated.summary }"
                      :rows="4"
                      :placeholder="$t('publish.placeholder.summary')"
                      maxlength="300"
                      show-word-limit
                      resize="none"
                    />
                    <el-tooltip :content="$t('publish.button.aiGenerate')" placement="top" v-if="showInlineAIButtons">
                      <el-button
                        type="primary"
                        plain
                        :icon="MagicStick"
                        :loading="generating.summary"
                        :disabled="!hasContent"
                        @click="handleGenerateSummary"
                        class="ai-btn is-textarea"
                      />
                    </el-tooltip>
                  </div>
                </el-form-item>

                <el-form-item :label="$t('publish.form.keywords')" prop="keywords">
                  <div class="form-item-with-ai">
                    <el-input
                      v-model="formData.keywords"
                      :class="{ 'ai-generated': aiGenerated.keywords }"
                      :placeholder="$t('publish.placeholder.keywords')"
                    >
                      <template v-if="aiGenerated.keywords" #prefix>
                        <el-icon class="ai-badge-icon"><MagicStick /></el-icon>
                      </template>
                    </el-input>
                    <el-tooltip :content="$t('publish.button.aiGenerate')" placement="top" v-if="showInlineAIButtons">
                      <el-button
                        type="primary"
                        plain
                        :icon="MagicStick"
                        :loading="generating.keywords"
                        :disabled="!hasContent"
                        @click="handleGenerateKeywords"
                        class="ai-btn"
                      />
                    </el-tooltip>
                  </div>
                </el-form-item>
              </el-card>
            </el-form>
          </div>
        </el-col>

        <!-- 右侧：设置与AI面板 -->
        <el-col
          v-if="showRightColumn"
          :xs="24"
          :sm="24"
          :md="showAIPanel ? 8 : 6"
          :lg="showAIPanel ? 7 : 5"
          :xl="showAIPanel ? 6 : 4"
        >
          <div class="sidebar-container">
            <!-- AI 助手面板 (仅在AI辅助模式下显示) -->
            <transition name="el-zoom-in-top">
              <div v-if="showAIPanel" class="mb-4">
                <AISuggestionPanel
                  ref="aiPanelRef"
                  :ai-available="aiAvailable"
                  :has-content="hasContent"
                  :usage-stats="usageStats"
                  :show-quick-actions="false"
                  @preview="handlePreviewAI"
                  @generate-title="handleGenerateTitle"
                  @generate-summary="handleGenerateSummary"
                  @generate-tags="handleGenerateTags"
                  @apply-suggestion="handleApplySuggestion"
                  @go-to-config="handleGoToAIConfig"
                />
              </div>
            </transition>

            <!-- 发布设置卡片 -->
            <el-card shadow="hover" class="section-card settings-card" v-if="!isAIFullMode">
              <template #header>
                <div class="card-header">
                  <span class="header-text">{{ $t('publish.section.settings') }}</span>
                </div>
              </template>

              <el-form :model="formData" :rules="formRules" label-position="top" class="settings-form">
                <!-- 封面图 -->
                <el-form-item :label="$t('publish.form.coverImage')" prop="sImg">
                  <div class="cover-upload-container">
                    <el-upload
                      class="cover-uploader"
                      :action="uploadUrl"
                      :headers="uploadHeaders"
                      :show-file-list="false"
                      accept="image/*"
                      :on-success="handleUploadSuccess"
                      :before-upload="beforeImageUpload"
                      :data="{ action: 'uploadimage' }"
                      drag
                    >
                      <img v-if="formData.sImg" :src="formData.sImg" class="cover-image" />
                      <div v-else class="upload-placeholder">
                        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                        <div class="el-upload__text">
                          {{ $t('publish.tips.dragOrClick') }}
                        </div>
                      </div>
                    </el-upload>

                    <!-- 封面图操作栏 -->
                    <div class="cover-actions mt-2">
                      <div class="image-actions">
                        <el-tooltip :content="$t('publish.tips.coverConfigPrompt')" :disabled="imageGenAvailable">
                          <el-button
                            type="primary"
                            size="small"
                            @click="handleGenerateCoverImage"
                            :loading="generating.coverImage"
                            :disabled="!imageGenAvailable"
                            v-if="showInlineAIButtons"
                          >
                            <el-icon><MagicStick /></el-icon>
                            {{ $t('publish.button.aiGenerate') }}
                          </el-button>
                        </el-tooltip>
                        <el-button type="danger" size="small" plain @click="handleRemoveImage" v-if="formData.sImg">
                          <el-icon><Delete /></el-icon>
                          {{ $t('common.delete') }}
                        </el-button>
                      </div>
                    </div>
                  </div>
                </el-form-item>

                <!-- 分类 -->
                <el-form-item :label="$t('publish.form.category')" prop="categories">
                  <div class="form-item-with-ai">
                    <el-cascader
                      v-model="formData.categories"
                      :options="categoryTree"
                      :props="categoryProps"
                      :placeholder="$t('publish.placeholder.selectCategory')"
                      clearable
                      class="w-full"
                    />
                    <el-tooltip :content="$t('publish.button.aiMatch')" placement="top" v-if="showInlineAIButtons">
                      <el-button
                        type="primary"
                        plain
                        :icon="MagicStick"
                        :loading="generating.category"
                        :disabled="!hasContent"
                        @click="handleGenerateCategory"
                        class="ai-btn"
                      />
                    </el-tooltip>
                  </div>
                </el-form-item>

                <!-- 标签 -->
                <el-form-item :label="$t('publish.form.tags')" prop="tags">
                  <div class="form-item-with-ai">
                    <el-select
                      v-model="formData.tags"
                      :class="{ 'ai-generated': aiGenerated.tags }"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      :placeholder="$t('publish.placeholder.selectTags')"
                      class="w-full"
                    >
                      <el-option v-for="tag in tagList" :key="tag.id" :label="tag.name" :value="tag.id" />
                    </el-select>
                    <el-tooltip :content="$t('publish.button.aiExtract')" placement="top" v-if="showInlineAIButtons">
                      <el-button
                        type="primary"
                        plain
                        :icon="MagicStick"
                        :loading="generating.tags"
                        :disabled="!hasContent"
                        @click="handleGenerateTags"
                        class="ai-btn"
                      />
                    </el-tooltip>
                  </div>
                </el-form-item>

                <!-- 来源 -->
                <el-form-item :label="$t('publish.form.source')" prop="source">
                  <el-input v-model="formData.source" :placeholder="$t('publish.placeholder.source')" />
                </el-form-item>

                <!-- 发布状态 -->
                <el-form-item v-if="!appConfigStore.isUserCenter" :label="$t('publish.form.state')" prop="state">
                  <el-select v-model="formData.state" class="w-full">
                    <el-option :label="$t('publish.status.draft')" value="0" />
                    <el-option :label="$t('publish.status.pending')" value="1" />
                    <el-option :label="$t('publish.status.published')" value="2" />
                    <el-option :label="$t('publish.status.offline')" value="3" />
                  </el-select>
                </el-form-item>

                <el-divider class="my-4" />

                <!-- 高级选项 -->
                <el-collapse accordion class="advanced-collapse">
                  <el-collapse-item :title="$t('publish.form.advanced')" name="advanced">
                    <div class="advanced-options">
                      <div class="option-item">
                        <span>{{ $t('publish.form.isTop') }}</span>
                        <el-switch v-model="formData.isTop" />
                      </div>
                      <div class="option-item">
                        <span>{{ $t('publish.form.recommendToHome') }}</span>
                        <el-switch v-model="formData.roofPlacement" />
                      </div>
                      <div class="option-item">
                        <span>{{ $t('publish.form.initialViews') }}</span>
                        <el-input-number v-model="formData.clickNum" :min="0" size="small" controls-position="right" />
                      </div>
                      <div class="option-item">
                        <span>{{ $t('publish.form.initialLikes') }}</span>
                        <el-input-number v-model="formData.likeNum" :min="0" size="small" controls-position="right" />
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </el-form>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { MagicStick, Picture, Plus, Delete, Edit, UploadFilled } from '@element-plus/icons-vue';
import PublishModeSelector from '@/components/ai/PublishModeSelector.vue';
import AISuggestionPanel from '@/components/ai/AISuggestionPanel.vue';
import WangEditor from '@/components/editor/WangEditor.vue';
import { getCategories, getTags, addContent, updateContent, getContentById } from '@/api/content';
import {
  createContentWithAI,
  previewAIEnhancements,
  generateTitle,
  generateSummary,
  generateTags,
  generateKeywords,
  matchCategory,
  checkAIStatus,
  getAIUsageStats,
  findOrCreateTagsByNames,
  generateImage,
  getImageGenerationModels,
} from '@/api/ai-content';
import { getModels } from '@/api/aiModel';
import { convertToTree } from '@/utils/content-helper';
import { useAppConfigStore } from '@/stores/app-config';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const appConfigStore = useAppConfigStore();

// 编辑模式标识
const isEditMode = ref(false);
const editingId = ref('');

// 表单引用
const formRef = ref(null);
const editorRef = ref(null);
const aiPanelRef = ref(null);

// 上传配置
const uploadUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/manage/v1/files`;
const uploadHeaders = {
  // 可以添加认证头等
};

// 发布模式
const publishMode = ref('manual');

// AI 可用性
const aiAvailable = ref(false);
const aiModelsCount = ref(0);

// 图片生成模型可用性
const imageGenAvailable = ref(false);
const imageGenModelsCount = ref(0);

// 表单数据
const formData = reactive({
  id: '',
  title: '',
  type: '1',
  categories: [],
  tags: [],
  sImg: '',
  comments: '',
  simpleComments: '',
  discription: '',
  keywords: '',
  author: '',
  source: '',
  state: '0',
  isTop: false,
  roofPlacement: false,
  clickNum: 0,
  likeNum: 0,
});

// 表单验证规则（根据发布模式动态调整）
const formRules = computed(() => {
  // AI 完全模式：仅验证核心字段
  if (isAIFullMode.value) {
    return {
      comments: [{ required: true, message: t('publish.validation.contentRequired'), trigger: 'blur' }],
      state: [{ required: true, message: t('publish.validation.stateRequired'), trigger: 'change' }],
      // 🔥 AI 完全模式下封面图会自动生成，不需要验证
    };
  }

  // 传统模式和 AI 辅助模式：验证所有字段
  return {
    title: [{ required: true, message: t('publish.validation.titleRequired'), trigger: 'blur' }],
    type: [{ required: true, message: t('publish.validation.categoryRequired'), trigger: 'change' }],
    categories: [{ required: true, message: t('publish.validation.categoryRequired'), trigger: 'change' }],
    tags: [{ required: true, message: t('publish.validation.tagsRequired'), trigger: 'change' }],
    keywords: [{ required: true, message: t('publish.validation.keywordsRequired'), trigger: 'blur' }],
    discription: [{ required: true, message: t('publish.validation.summaryRequired'), trigger: 'blur' }],
    comments: [{ required: true, message: t('publish.validation.contentRequired'), trigger: 'blur' }],
    state: [{ required: true, message: t('publish.validation.stateRequired'), trigger: 'change' }],
    sImg: [{ required: true, message: t('publish.validation.coverRequired'), trigger: 'blur' }],
  };
});

// 分类和标签数据
const categoryList = ref([]);
const categoryTree = ref([]);
const tagList = ref([]);

// 分类级联选择器配置
const categoryProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  emitPath: true,
  checkStrictly: false,
};

// AI 生成状态
const aiGenerated = reactive({
  title: false,
  summary: false,
  tags: false,
  keywords: false,
  category: false,
});

// 生成中状态
const generating = reactive({
  title: false,
  summary: false,
  tags: false,
  keywords: false,
  category: false,
  coverImage: false,
});

// 保存/发布状态
const saving = ref(false);
const publishing = ref(false);

// AI 使用统计
const usageStats = ref({
  calls: 0,
  limit: 50,
  cost: 0,
});

// 计算属性
const isAIMode = computed(() => ['ai_smart', 'ai_full'].includes(publishMode.value));

// AI 辅助模式显示面板（不包括 AI 完全模式）
const showAIPanel = computed(() => publishMode.value === 'ai_smart');

// AI 完全模式（简化表单）
const isAIFullMode = computed(() => publishMode.value === 'ai_full');

// 右侧区域显示条件：手动/AI辅助展示；AI完全隐藏
const showRightColumn = computed(() => !isAIFullMode.value);

// 是否显示表单项后的 AI 生成按钮
const showInlineAIButtons = computed(() => publishMode.value === 'ai_smart');

const hasContent = computed(() => {
  return formData.simpleComments && formData.simpleComments.trim().length > 100;
});

// 监听内容变化
watch(
  () => formData.comments,
  () => {
    // 内容变化后，更新纯文本版本
    if (editorRef.value) {
      formData.simpleComments = editorRef.value.getPlainText();
    }
  }
);

/**
 * 页面初始化
 */
onMounted(async () => {
  // 首先加载基础数据
  await Promise.all([
    loadCategories(),
    loadTags(),
    checkAIAvailability(),
    checkImageGenAvailability(),
    loadAIUsageStats(),
  ]);

  // 如果 AI 可用且是新增流程，默认切到 AI 辅助模式
  if (!isEditMode.value && aiAvailable.value && publishMode.value === 'manual') {
    publishMode.value = 'ai_smart';
  }

  // 检查是否为编辑模式
  const contentId = route.query.id;
  if (contentId) {
    isEditMode.value = true;
    editingId.value = contentId;
    await loadContentForEdit(contentId);
  }
});

/**
 * 检查 AI 服务可用性（文本生成模型）
 */
async function checkAIAvailability() {
  try {
    // 检查是否有已配置的 AI 模型
    const res = await getModels({ isEnabled: 'true', pageSize: 1 });

    if (res.status === 200 && res.data) {
      const docs = res.data.docs || res.data.list || res.data.data || [];
      aiModelsCount.value = docs.length;
      aiAvailable.value = docs.length > 0;
    } else {
      aiAvailable.value = false;
    }
  } catch (error) {
    console.error('检查 AI 服务可用性失败:', error);
    aiAvailable.value = false;
  }
}

/**
 * 检查图片生成模型可用性（文生图模型）
 */
async function checkImageGenAvailability() {
  try {
    // 检查是否有已配置的文生图模型
    const res = await getImageGenerationModels();

    if (res.status === 200 && res.data) {
      const models = res.data.models || res.data.data || [];
      imageGenModelsCount.value = models.length;
      imageGenAvailable.value = models.length > 0;

      if (models.length > 0) {
        console.log(
          `✅ 检测到 ${models.length} 个可用的文生图模型:`,
          models.map(m => m.displayName || m.modelName)
        );
      } else {
        console.warn('⚠️ 未检测到可用的文生图模型，封面图AI生成功能将不可用');
      }
    } else {
      imageGenAvailable.value = false;
    }
  } catch (error) {
    console.error('检查图片生成模型可用性失败:', error);
    imageGenAvailable.value = false;
  }
}

/**
 * 加载 AI 使用统计
 */
async function loadAIUsageStats() {
  if (!aiAvailable.value) return;

  try {
    const res = await getAIUsageStats();
    if (res.status === 200 && res.data) {
      usageStats.value = res.data;
    }
  } catch (error) {
    console.warn('加载 AI 使用统计失败:', error);
  }
}

/**
 * 加载编辑的内容数据
 */
async function loadContentForEdit(contentId) {
  const loading = ElLoading.service({ text: t('publish.tips.loadingArticle') });
  try {
    const res = await getContentById(contentId);

    if (res.status === 200 && res.data) {
      const content = res.data;
      console.log('📝 加载的文章数据:', content);

      // 回填基础字段
      formData.id = content.id || '';
      formData.title = content.title || '';
      formData.type = content.type || '1';
      formData.sImg = content.sImg || '';
      formData.comments = content.comments || '';
      formData.discription = content.discription || '';
      formData.keywords = (content.keywords || []).join(',');
      formData.author = content.author?.userName || content.author || '';
      formData.source = content.source || '';
      formData.state = String(content.state || '0');
      formData.isTop = content.isTop === 1 || content.isTop === true;
      formData.roofPlacement = content.roofPlacement === '1' || content.roofPlacement === true;
      formData.clickNum = content.clickNum || 0;
      formData.likeNum = content.likeNum || 0;

      // 回填分类（转换为级联选择器需要的格式）
      if (content.categories && content.categories.length > 0) {
        // 提取分类 ID 数组
        formData.categories = content.categories.map(cat => cat.id);
      }

      // 回填标签（转换为标签选择器需要的格式）
      if (content.tags && content.tags.length > 0) {
        formData.tags = content.tags.map(tag => tag.id);
      }

      // 回填纯文本内容（用于 AI 功能）
      if (content.simpleComments && Array.isArray(content.simpleComments)) {
        formData.simpleComments = content.simpleComments
          .filter(item => item.type === 'contents')
          .map(item => item.content)
          .join('\n\n');
      }

      ElMessage.success(t('publish.success.loadArticle'));
    } else {
      throw new Error(res.message || t('common.error.fetchContentFailed'));
    }
  } catch (error) {
    console.error('加载文章数据失败:', error);
    // ElMessage.error(t('publish.error.loadArticle') + '：' + (error.message || '未知错误'));
    // 加载失败，返回列表
    router.back();
  } finally {
    loading.close();
  }
}

/**
 * 加载分类列表
 */
async function loadCategories() {
  const loading = ElLoading.service({ text: t('publish.tips.loadingCategory') });
  try {
    const res = await getCategories({ isPaging: '0' });

    if (res.status === 200 && res.data) {
      categoryList.value = res.data || [];
      // 转换为树形结构
      categoryTree.value = convertToTree(res.data);
    } else {
      throw new Error(res.message || t('common.error.fetchCategoriesFailed'));
    }
  } catch (error) {
    console.error('加载分类失败:', error);
    // ElMessage.error(t('publish.error.loadCategory') + '：' + (error.message || '未知错误'));
    categoryList.value = [];
    categoryTree.value = [];
  } finally {
    loading.close();
  }
}

/**
 * 加载标签列表
 */
async function loadTags() {
  try {
    // TODO 临时查出1000条，后续优化
    const res = await getTags({ isPaging: '0', pageSize: 1000 });

    if (res.status === 200 && res.data) {
      tagList.value = res.data || [];
    } else {
      throw new Error(res.message || t('common.error.fetchTagsFailed'));
    }
  } catch (error) {
    console.error('加载标签失败:', error);
    // ElMessage.error(t('publish.error.loadTags') + '：' + (error.message || '未知错误'));
    tagList.value = [];
  }
}

/**
 * 处理内容变化
 */
function handleContentChange(html) {
  formData.comments = html;
  if (editorRef.value) {
    formData.simpleComments = editorRef.value.getPlainText();
  }
}

/**
 * 处理图片上传成功
 */
function handleUploadSuccess(response) {
  if (response?.status === 200 && response?.data?.path) {
    formData.sImg = response.data.path;
    ElMessage.success(t('publish.success.uploadCover'));
  } else {
    ElMessage.error(t('publish.error.uploadCover'));
  }
}

/**
 * 图片上传前验证
 */
function beforeImageUpload(file) {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const isValidType = allowedTypes.includes(file.type);

  if (!isImage || !isValidType) {
    ElMessage.error(t('publish.error.uploadImageType'));
    return false;
  }
  if (!isLt2M) {
    ElMessage.error(t('publish.error.uploadImageSize'));
    return false;
  }
  return true;
}

/**
 * 删除图片
 */
function handleRemoveImage() {
  ElMessageBox.confirm(t('publish.tips.confirmDelete'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  })
    .then(() => {
      formData.sImg = '';
      ElMessage.success(t('publish.success.deleteCover'));
    })
    .catch(() => {
      // 用户取消
    });
}

/**
 * 处理模式切换
 */
function handleModeChange(mode) {
  console.log('切换发布模式:', mode);

  if (mode !== 'manual' && !aiAvailable.value) {
    ElMessage.warning(t('publish.mode.unavailable'));
    publishMode.value = 'manual';
    return;
  }
}

/**
 * 预览 AI 增强效果
 */
async function handlePreviewAI() {
  if (!hasContent.value) {
    ElMessage.warning(t('publish.tips.needContent'));
    return;
  }

  const loading = ElLoading.service({ text: t('publish.tips.aiProcessing') });
  aiPanelRef.value?.setGenerating(true);

  try {
    // 按照后端期望的数据结构发送请求
    const res = await previewAIEnhancements({
      contentData: {
        comments: formData.comments,
        title: formData.title,
        discription: formData.discription,
        tags: formData.tags,
        categories: formData.categories,
      },
      options: {
        regenerateTitle: !formData.title,
        regenerateSummary: !formData.discription,
        regenerateTags: formData.tags.length === 0,
        autoCategory: formData.categories.length === 0,
        language: 'zh-CN',
      },
    });

    if (res.status === 200 && res.data) {
      const { enhancedContent, aiEnhancements } = res.data;

      console.log('🎨 AI 增强预览结果:', { enhancedContent, aiEnhancements });

      // 添加标题建议
      if (enhancedContent.title && enhancedContent.title !== formData.title) {
        aiPanelRef.value?.addSuggestion('title', enhancedContent.title, aiEnhancements?.title);
      }

      // 添加摘要建议
      if (enhancedContent.discription && enhancedContent.discription !== formData.discription) {
        aiPanelRef.value?.addSuggestion('summary', enhancedContent.discription, aiEnhancements?.summary);
      }

      // 添加标签建议（使用标签名称数组）
      if (enhancedContent.tags && enhancedContent.tags.length > 0) {
        aiPanelRef.value?.addSuggestion('tags', enhancedContent.tags, aiEnhancements?.tags);
      }

      // 添加分类建议（使用分类名称）
      if (enhancedContent.categories) {
        const categoryNames = getCategoryNamesByIds(enhancedContent.categories);
        if (categoryNames && categoryNames.length > 0) {
          aiPanelRef.value?.addSuggestion('category', categoryNames, aiEnhancements?.category);
        }
      }

      // 添加关键词建议
      if (enhancedContent.keywords) {
        aiPanelRef.value?.addSuggestion('keywords', enhancedContent.keywords, aiEnhancements?.keywords);
      }

      // 计算本次生成总消耗
      let totalCost = 0;
      if (aiEnhancements) {
        if (aiEnhancements.titleMetadata?.cost) totalCost += aiEnhancements.titleMetadata.cost;
        if (aiEnhancements.summaryMetadata?.cost) totalCost += aiEnhancements.summaryMetadata.cost;
        if (aiEnhancements.tagsMetadata?.cost) totalCost += aiEnhancements.tagsMetadata.cost;
        if (aiEnhancements.categoryMetadata?.cost) totalCost += aiEnhancements.categoryMetadata.cost;
        if (aiEnhancements.keywordsMetadata?.cost) totalCost += aiEnhancements.keywordsMetadata.cost;
        if (aiEnhancements.coverImageMetadata?.cost) totalCost += aiEnhancements.coverImageMetadata.cost;
        if (aiEnhancements.seoMetadata?.cost) totalCost += aiEnhancements.seoMetadata.cost;
      }

      if (totalCost > 0) {
        aiPanelRef.value?.setLastRequestCost(totalCost);
      }

      ElMessage.success(t('publish.success.preview'));
    } else {
      throw new Error(res.message || t('publish.error.preview'));
    }
  } catch (error) {
    console.error('预览 AI 增强失败:', error);
    // ElMessage.error(t('publish.error.preview') + '：' + (error.message || '未知错误'));
  } finally {
    loading.close();
    aiPanelRef.value?.setGenerating(false);
  }
}

/**
 * 生成标题
 */
async function handleGenerateTitle() {
  if (!hasContent.value) {
    ElMessage.warning(t('publish.tips.needContent'));
    return;
  }

  generating.title = true;
  aiPanelRef.value?.setGeneratingTitle(true);

  try {
    const res = await generateTitle({
      content: formData.simpleComments,
      style: 'engaging',
      language: 'zh-CN',
    });

    if (res.status === 200 && res.data) {
      const title = res.data.content || res.data.title;

      // 添加到建议列表
      aiPanelRef.value?.addSuggestion('title', title, res.data.metadata);
      ElMessage.success(t('publish.success.generateTitle'));
    } else {
      throw new Error(res.message || '生成标题失败');
    }
  } catch (error) {
    console.error('生成标题失败:', error);
    // ElMessage.error(t('publish.error.generateTitle') + '：' + (error.message || '未知错误'));
  } finally {
    generating.title = false;
    aiPanelRef.value?.setGeneratingTitle(false);
  }
}

/**
 * 生成摘要
 */
async function handleGenerateSummary() {
  if (!hasContent.value) {
    ElMessage.warning(t('publish.tips.needContent'));
    return;
  }

  generating.summary = true;
  aiPanelRef.value?.setGeneratingSummary(true);

  try {
    const res = await generateSummary({
      content: formData.simpleComments,
      language: 'zh-CN',
    });

    if (res.status === 200 && res.data) {
      const summary = res.data.content || res.data.summary;

      // 添加到建议列表
      aiPanelRef.value?.addSuggestion('summary', summary, res.data.metadata);
      ElMessage.success(t('publish.success.generateSummary'));
    } else {
      throw new Error(res.message || '生成摘要失败');
    }
  } catch (error) {
    console.error('生成摘要失败:', error);
    // ElMessage.error(t('publish.error.generateSummary') + '：' + (error.message || '未知错误'));
  } finally {
    generating.summary = false;
    aiPanelRef.value?.setGeneratingSummary(false);
  }
}

/**
 * 生成标签
 */
async function handleGenerateTags() {
  if (!hasContent.value) {
    ElMessage.warning(t('publish.tips.needContent'));
    return;
  }

  generating.tags = true;
  aiPanelRef.value?.setGeneratingTags(true);

  try {
    const res = await generateTags({
      content: formData.simpleComments,
      language: 'zh-CN',
    });

    if (res.status === 200 && res.data) {
      const tags = res.data.content || res.data.tags;

      // 添加到建议列表
      aiPanelRef.value?.addSuggestion('tags', tags, res.data.metadata);
      ElMessage.success(t('publish.success.generateTags'));
    } else {
      throw new Error(res.message || '生成标签失败');
    }
  } catch (error) {
    console.error('生成标签失败:', error);
    // ElMessage.error(t('publish.error.generateTags') + '：' + (error.message || '未知错误'));
  } finally {
    generating.tags = false;
    aiPanelRef.value?.setGeneratingTags(false);
  }
}

/**
 * 生成关键词
 */
async function handleGenerateKeywords() {
  if (!hasContent.value) {
    ElMessage.warning(t('publish.tips.needContent'));
    return;
  }

  generating.keywords = true;

  try {
    const res = await generateKeywords({
      content: formData.simpleComments,
      title: formData.title || '',
      maxKeywords: 8,
      language: 'zh-CN',
    });

    if (res.status === 200 && res.data) {
      const keywords = res.data.keywords || [];

      // 直接应用到表单（关键词是逗号分隔的字符串）
      formData.keywords = keywords.join(',');
      aiGenerated.keywords = true;

      ElMessage.success(t('publish.success.generateKeywords', { count: keywords.length }));
      console.log('✅ 关键词生成完成:', keywords);
    } else {
      throw new Error(res.message || '生成关键词失败');
    }
  } catch (error) {
    console.error('生成关键词失败:', error);
    // ElMessage.error(t('publish.error.generateKeywords') + '：' + (error.message || '未知错误'));
  } finally {
    generating.keywords = false;
  }
}

/**
 * 生成分类（AI智能匹配）
 */
async function handleGenerateCategory() {
  if (!hasContent.value) {
    ElMessage.warning(t('publish.tips.needContent'));
    return;
  }

  generating.category = true;

  try {
    const res = await matchCategory({
      content: formData.simpleComments || formData.comments,
      title: formData.title || '',
      tags: formData.tags || [],
      language: 'zh-CN',
    });

    if (res.status === 200 && res.data) {
      const { categories, metadata } = res.data;

      if (!categories || categories.length === 0) {
        ElMessage.warning(t('publish.error.noCategoryMatch'));
        return;
      }

      console.log('✅ AI推荐的分类:', categories);

      // 添加到建议列表
      aiPanelRef.value?.addSuggestion('category', categories, metadata);
      ElMessage.success(t('publish.success.matchCategory'));
    } else {
      throw new Error(res.message || '分类匹配失败');
    }
  } catch (error) {
    // ElMessage.error(t('publish.error.matchCategory') + '：' + (error.message || '未知错误'));
  } finally {
    generating.category = false;
  }
}

/**
 * 生成封面图（AI图片生成）
 */
async function handleGenerateCoverImage() {
  // 🔥 前置检查：是否配置了文生图模型
  if (!imageGenAvailable.value) {
    ElMessageBox.confirm(t('publish.tips.coverConfigPrompt'), t('common.warning'), {
      confirmButtonText: t('publish.mode.goToConfig'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
      .then(() => {
        // 打开新窗口跳转到 AI 模型配置页面
        window.open('/ai-model-manage', '_blank');
      })
      .catch(() => {
        // 用户取消
      });
    return;
  }

  if (!hasContent.value) {
    ElMessage.warning(t('publish.tips.needContent'));
    return;
  }

  generating.coverImage = true;

  try {
    // 使用标题作为提示词，如果没有标题则从内容中提取摘要作为提示词
    let prompt = '';
    if (formData.title) {
      prompt = formData.title;
    } else {
      // 从内容中提取前150个字符作为提示词
      const plainText = formData.simpleComments || '';
      prompt = plainText.substring(0, 150).trim();
    }

    if (!prompt) {
      ElMessage.warning(t('publish.error.noPrompt'));
      return;
    }

    console.log('🎨 开始生成封面图，提示词:', prompt);
    ElMessage.info(t('publish.tips.generating'));

    const res = await generateImage({
      prompt: prompt,
      size: '1024x1024', // 默认尺寸
      n: 1, // 生成1张
      optimizePrompt: true, // 优化提示词
      language: 'zh-CN',
    });

    if (res.status === 200 && res.data) {
      const imageData = res.data;

      // 根据返回的数据结构获取图片URL
      let imageUrl = '';
      if (imageData.url) {
        imageUrl = imageData.url;
      } else if (imageData.data && imageData.data.length > 0) {
        imageUrl = imageData.data[0].url || imageData.data[0].b64_json;
      } else if (imageData.images && imageData.images.length > 0) {
        imageUrl = imageData.images[0];
      }

      if (!imageUrl) {
        throw new Error('AI生成的图片URL为空');
      }

      // 更新表单数据
      formData.sImg = imageUrl;
      ElMessage.success(t('publish.success.generateCover'));
      console.log('✅ 封面图生成完成:', imageUrl);

      // 🔥 如果提示词被优化过，显示优化信息
      if (imageData.optimizedPrompt && imageData.originalPrompt) {
        console.log('📝 提示词优化:', {
          原始: imageData.originalPrompt,
          优化后: imageData.optimizedPrompt,
        });
      }
    } else {
      throw new Error(res.message || '生成封面图失败');
    }
  } catch (error) {
    console.error('生成封面图失败:', error);

    // 🔥 根据错误类型提供更详细的提示
    let errorMessage = '生成封面图失败';
    if (error.message?.includes('Model not found')) {
      errorMessage = '未找到可用的文生图模型，请先配置';
    } else if (error.message?.includes('does not support image generation')) {
      errorMessage = '所选模型不支持图片生成，请配置文生图模型';
    } else if (error.message?.includes('timeout')) {
      errorMessage = '生成超时，请稍后重试';
    } else if (error.message) {
      errorMessage += '：' + error.message;
    }

    ElMessage.error(errorMessage);
  } finally {
    generating.coverImage = false;
  }
}

/**
 * 应用 AI 建议
 */
async function handleApplySuggestion(suggestion) {
  switch (suggestion.type) {
    case 'title':
      formData.title = suggestion.content;
      aiGenerated.title = true;
      break;
    case 'summary':
      formData.discription = suggestion.content;
      aiGenerated.summary = true;
      break;
    case 'tags':
      // 🔥 使用智能标签处理：查找或创建标签
      await handleApplyTagSuggestion(suggestion.content);
      break;
    case 'category':
      // 🔥 使用智能分类匹配
      await handleApplyCategorySuggestion(suggestion.content);
      break;
    case 'keywords':
      // 🔥 使用智能关键词优化
      await handleApplyKeywordsSuggestion(suggestion.content);
      break;
  }
}

/**
 * 🔥 应用AI标签建议（智能查找或创建）
 * @param {Array<String>} tagNames - AI生成的标签名数组
 */
async function handleApplyTagSuggestion(tagNames) {
  if (!Array.isArray(tagNames) || tagNames.length === 0) {
    ElMessage.warning(t('publish.error.noTagSuggestion'));
    return;
  }

  try {
    // 调用智能标签处理API
    const res = await findOrCreateTagsByNames(tagNames);
    console.log('🚀 ~ findOrCreateTagsByNames response:', res);

    // 🔥 修复数据访问路径：res.data 而不是 res.data.data
    if (res.status === 200 && res.data) {
      const { tags, tagIds } = res.data;

      if (!tags || !tagIds) {
        throw new Error('返回数据格式错误');
      }

      console.log('✅ 获取到标签数据:', { tags, tagIds });

      // 更新表单数据
      formData.tags = tagIds;
      aiGenerated.tags = true;

      // 更新标签列表（确保新创建的标签显示在下拉框中）
      const newTags = tags.filter(tag => !tagList.value.some(t => (t.id || t._id) === (tag.id || tag._id)));
      if (newTags.length > 0) {
        tagList.value = [...tagList.value, ...newTags];
        console.log(`✅ 添加 ${newTags.length} 个新标签到下拉列表`);
      }

      // 统计新建的标签（通过标签名判断 - comments字段现在存储的是标签名）
      const createdTags = tags.filter(t => {
        // 新创建的标签，其 comments 等于 name（根据你修改后的逻辑）
        return t.comments === t.name && tagNames.includes(t.name);
      });
      const createdCount = createdTags.length;

      let message;
      if (createdCount > 0) {
        message = t('publish.success.applyTagWithNew', { count: tags.length, newCount: createdCount });
      } else {
        message = t('publish.success.applyTag', { count: tags.length });
      }

      ElMessage.success(message);
      console.log('✅ 标签应用完成:', message);
    } else {
      throw new Error(res.message || '标签处理失败');
    }
  } catch (error) {
    console.error('❌ 应用标签建议失败:', error);
    // ElMessage.error(t('publish.error.applyTag') + '：' + (error.message || '未知错误'));
  }
}

/**
 * 🔥 应用AI分类建议（智能匹配）
 * @param {Array<String>} categoryNames - AI推荐的分类名数组
 */
async function handleApplyCategorySuggestion(categoryNames) {
  if (!Array.isArray(categoryNames) || categoryNames.length === 0) {
    ElMessage.warning(t('publish.error.noCategorySuggestion'));
    return;
  }

  try {
    // 取第一个推荐的分类名
    const categoryName = categoryNames[0];

    // 从树形结构中提取所有分类（包括子分类）到扁平列表
    const flattenCategories = tree => {
      const result = [];
      const flatten = nodes => {
        nodes.forEach(node => {
          result.push(node);
          if (node.children && node.children.length > 0) {
            flatten(node.children);
          }
        });
      };
      flatten(tree);
      return result;
    };

    // 获取完整的扁平化分类列表（包括所有层级）
    const allCategories = categoryList.value.length > 0 ? categoryList.value : flattenCategories(categoryTree.value);

    // 在完整分类列表中查找匹配的分类（支持所有层级）
    const matchedCategory = allCategories.find(cat => cat.name === categoryName || cat.enName === categoryName);

    if (!matchedCategory) {
      ElMessage.warning(`未找到匹配的分类: ${categoryName}，请手动选择`);
      return;
    }

    // 构建分类路径（从父到子的ID数组，如 [4, 14] 或 ['id1', 'id2']）
    const categoryPath = [];
    let currentCat = matchedCategory;

    // 向上查找父级分类，构建完整路径
    while (currentCat) {
      // 获取ID（保持原始类型，可能是数字或字符串）
      const catId = currentCat.id || currentCat._id;

      // 添加到路径开头（因为是从子向父遍历）
      categoryPath.unshift(catId);

      // 检查是否有父级分类
      const hasParent = currentCat.parentId !== null && currentCat.parentId !== undefined && currentCat.parentId !== '';

      if (hasParent) {
        // 在完整分类列表中查找父级分类
        const parentId = currentCat.parentId;
        currentCat = allCategories.find(cat => {
          const id = cat.id || cat._id;
          return id == parentId; // 使用 == 比较，自动类型转换
        });

        if (!currentCat) {
          console.warn(`未找到父级分类 ID: ${parentId}`);
          break;
        }
      } else {
        // 已经是顶级分类，退出循环
        break;
      }
    }

    // 更新表单数据
    formData.categories = categoryPath;
    aiGenerated.category = true;

    ElMessage.success(t('publish.success.applyCategory', { name: matchedCategory.name }));
    console.log('✅ 分类应用完成:', {
      name: matchedCategory.name,
      path: categoryPath,
      formData: formData.categories,
    });
  } catch (error) {
    console.error('❌ 应用分类建议失败:', error);
    // ElMessage.error(t('publish.error.applyCategory') + '：' + (error.message || '未知错误'));
  }
}

/**
 * 🔥 应用AI关键词建议（智能优化）
 * @param {Array<String>} keywords - AI推荐的关键词数组
 */
async function handleApplyKeywordsSuggestion(keywords) {
  if (!keywords) {
    ElMessage.warning(t('publish.error.noKeywordSuggestion'));
    return;
  }
  try {
    const keywordList = Array.isArray(keywords) ? keywords : String(keywords).split(/[,，]/);
    const normalized = keywordList.map(k => k.trim()).filter(Boolean);
    const uniqueKeywords = Array.from(new Set(normalized));

    if (uniqueKeywords.length === 0) {
      ElMessage.warning(t('publish.error.noKeywordSuggestion'));
      return;
    }

    // 更新表单数据
    formData.keywords = uniqueKeywords.join(',');
    aiGenerated.keywords = true;

    ElMessage.success(t('publish.success.applyKeywords', { count: uniqueKeywords.length }));
    console.log('✅ 关键词应用完成:', uniqueKeywords);
  } catch (error) {
    console.error('❌ 应用关键词建议失败:', error);
    // ElMessage.error(t('publish.error.applyKeywords') + '：' + (error.message || '未知错误'));
  }
}

/**
 * 保存草稿
 */
async function handleSaveDraft() {
  formData.state = '0';
  await handleSubmit('draft');
}

/**
 * 发布文章
 */
async function handlePublish() {
  // formData.state = '1';
  await handleSubmit('publish');
}

/**
 * 提交表单
 */
async function handleSubmit(action) {
  // 验证表单
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning(t('publish.validation.formInvalid'));
    return;
  }

  const isPublish = action === 'publish';
  const actionText = isPublish ? t('publish.button.publish') : t('publish.button.saveDraft');

  if (isPublish) {
    publishing.value = true;
  } else {
    saving.value = true;
  }

  const loading = ElLoading.service({ text: actionText + '...' });

  try {
    const options = {
      regenerateTitle: !formData.title,
      regenerateSummary: !formData.discription,
      regenerateTags: formData.tags.length === 0,
      autoCategory: formData.categories.length === 0,
      generateCoverImage: !formData.sImg && imageGenAvailable.value, // 🔥 新增：没有封面图且配置了文生图模型时自动生成
      titleStyle: 'engaging',
      language: 'zh-CN',
    };
    // 准备提交数据
    const normalizedContent = {
      ...formData,
      isTop: formData.isTop ? 1 : 0,
      roofPlacement: formData.roofPlacement ? '1' : '0',
    };
    const submitData = {
      ...normalizedContent,
      publishMode: publishMode.value,
      // 如果是 AI 模式，传递 AI 相关参数
      ...(isAIMode.value && {
        ...options,
      }),
    };

    let res;
    if (isAIMode.value && !isEditMode.value) {
      // 🔥 新增模式且使用 AI 发布接口
      res = await createContentWithAI({
        contentData: normalizedContent,
        publishMode: publishMode.value,
        options: options,
      });
    } else if (isEditMode.value) {
      // 🔥 编辑模式：使用更新接口
      res = await updateContent({ ...submitData, id: formData.id });
    } else {
      // 🔥 新增模式：使用普通发布接口
      res = await addContent(submitData);
    }

    if (res.status === 200) {
      const successText = isEditMode.value ? t('publish.success.update') : t('publish.success.publish');
      ElMessage.success(successText);

      // 如果是 AI 模式，显示增强信息
      if (isAIMode.value && res.data?.aiEnhancements) {
        const enhancements = res.data.aiEnhancements;
        const messages = [];
        if (enhancements.titleGenerated) messages.push(t('publish.enhancement.title'));
        if (enhancements.summaryGenerated) messages.push(t('publish.enhancement.summary'));
        if (enhancements.tagsGenerated) messages.push(t('publish.enhancement.tags'));
        if (enhancements.categoryMatched) messages.push(t('publish.enhancement.category'));
        if (enhancements.coverImageGenerated) messages.push(t('publish.enhancement.coverImage'));

        if (messages.length > 0) {
          ElMessage.info(t('publish.success.aiEnhancements', { items: messages.join('、') }));
        }
      }

      // 返回列表页或关闭标签页
      setTimeout(() => {
        // 如果在 qiankun 环境中且主应用传递了 closeTab 方法，则调用之
        if (appConfigStore.hostConfig && typeof appConfigStore.hostConfig.closeTab === 'function') {
          appConfigStore.hostConfig.closeTab();
        } else {
          router.back();
        }
      }, 1000);
    } else {
      throw new Error(res.message || `${actionText}失败`);
    }
  } catch (error) {
    console.error(`${actionText}失败:`, error);
    // ElMessage.error(`${actionText}失败：` + (error.message || '未知错误'));
  } finally {
    loading.close();
    if (isPublish) {
      publishing.value = false;
    } else {
      saving.value = false;
    }
  }
}

/**
 * 前往 AI 配置页面
 */
function handleGoToAIConfig() {
  ElMessageBox.confirm(t('publish.tips.needAIConfig'), t('common.warning'), {
    confirmButtonText: t('publish.mode.goToConfig'),
    cancelButtonText: t('common.cancel'),
    type: 'info',
  })
    .then(() => {
      // 通过路由跳转到 AI 模型配置页面
      router.push('/remote-page/ai-model-manage');
    })
    .catch(() => {
      // 用户取消
    });
}

/**
 * 返回
 */
function handleGoBack() {
  if (appConfigStore.hostConfig && typeof appConfigStore.hostConfig.closeTab === 'function') {
    appConfigStore.hostConfig.closeTab();
  } else {
    router.back();
  }
}

/**
 * 根据分类 ID 获取分类名称
 */
function getCategoryNameById(id) {
  const category = categoryList.value.find(c => c.id === id || c._id === id);
  return category ? category.name : id;
}

/**
 * 根据分类 ID 数组获取分类名称数组
 * @param {Array} ids - 分类 ID 数组，如 [4, 14]
 * @returns {Array<String>} - 分类名称数组
 */
function getCategoryNamesByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  // 从树形结构中提取所有分类到扁平列表
  const flattenCategories = tree => {
    const result = [];
    const flatten = nodes => {
      nodes.forEach(node => {
        result.push(node);
        if (node.children && node.children.length > 0) {
          flatten(node.children);
        }
      });
    };
    flatten(tree);
    return result;
  };

  const allCategories = categoryList.value.length > 0 ? categoryList.value : flattenCategories(categoryTree.value);

  // 只返回最后一个ID对应的分类名（叶子节点）
  const lastId = ids[ids.length - 1];
  const category = allCategories.find(c => {
    const catId = c.id || c._id;
    return catId == lastId;
  });

  return category ? [category.name] : [];
}
</script>

<style scoped lang="scss">
.content-publish-container {
  padding: 12px;
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
}

.section-card {
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;
  margin-bottom: 4px;
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--el-box-shadow-light);
  }

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-fill-color-blank);
  }

  :deep(.el-card__body) {
    padding: 20px !important;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-title {
    display: flex;
    align-items: center;

    .title-text {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

.card-header {
  display: flex;
  align-items: center;

  .header-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    position: relative;
    padding-left: 12px;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 16px;
      background-color: var(--el-color-primary);
      border-radius: 2px;
    }
  }
}

.form-item-with-ai {
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: flex-start;

  > :first-child {
    flex: 1;
  }

  .ai-btn {
    flex-shrink: 0;

    &.is-textarea {
      margin-top: 2px;
    }
  }
}

.ai-generated {
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    background-color: var(--el-color-success-light-9);
    box-shadow: 0 0 0 1px var(--el-color-success-light-5) inset;

    &:hover,
    &:focus {
      box-shadow: 0 0 0 1px var(--el-color-success) inset;
    }
  }
}

.ai-badge-icon {
  color: var(--el-color-success);
  font-size: 16px;
}

.cover-upload-container {
  width: 100%;

  .cover-uploader {
    width: 100%;

    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
      height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 2px dashed var(--el-border-color);
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
      }
    }
  }

  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--el-text-color-secondary);

    .el-icon--upload {
      font-size: 48px;
      margin-bottom: 8px;
      color: var(--el-text-color-placeholder);
    }
  }
}

.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .option-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }
}

.ai-full-alert {
  border: 1px solid var(--el-color-info-light-5);
  background-color: var(--el-color-info-light-9);
  margin-top: 8px;
  .alert-desc {
    margin: 8px 0 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }
}

/* 响应式调整 */
@media (max-width: 992px) {
  .publish-layout {
    flex-direction: column;
  }

  .sidebar-container {
    margin-top: 24px;
  }
}
</style>
