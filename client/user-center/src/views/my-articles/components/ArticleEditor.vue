<template>
  <div class="article-editor">
    <PageHeader :title="isEdit ? $t('content.action.editContent') : $t('content.action.addContent')" />
    <div class="page-box-content">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" class="content-form">
        <!-- Title field -->
        <el-form-item :label="$t('content.fields.title')" prop="title">
          <el-input v-model="formData.title" :placeholder="$t('content.placeholder.title')"></el-input>
        </el-form-item>

        <!-- Description field -->
        <el-form-item :label="$t('content.fields.description')" prop="discription">
          <el-input
            v-model="formData.discription"
            type="textarea"
            :rows="3"
            :placeholder="$t('content.placeholder.description')"
          ></el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <!-- Categories selection -->
            <el-form-item :label="$t('content.fields.category')" prop="categories">
              <el-cascader
                v-model="formData.categories"
                :options="categoryOptions"
                :props="categoryProps"
                :placeholder="$t('content.placeholder.selectCategory')"
                clearable
              ></el-cascader>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- Tags selection -->
            <el-form-item :label="$t('content.fields.tag')" prop="tags">
              <el-select v-model="formData.tags" :placeholder="$t('content.placeholder.selectTag')" clearable multiple>
                <el-option v-for="tag in tagOptions" :key="tag.value" :label="tag.label" :value="tag.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <!-- Thumbnail upload -->
            <el-form-item :label="$t('content.fields.thumbnail')" prop="sImg">
              <el-upload
                class="thumbnail-uploader"
                :action="UPLOAD_URL"
                :on-success="handleThumbnailSuccess"
                :on-error="handleUploadError"
                :before-upload="beforeThumbnailUpload"
                :on-remove="handleThumbnailRemove"
                :limit="1"
                :show-file-list="false"
                list-type="picture-card"
                :auto-upload="true"
              >
                <img v-if="formData.sImg" :src="formData.sImg" class="thumbnail-image" />
                <el-icon v-else><Plus /></el-icon>
                <template #tip>
                  <div class="upload-tip">
                    {{ $t('content.tips.thumbnailSize') }}
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col>
          <!-- <el-col :span="12">
          <el-form-item :label="$t('content.action.uploadWord')">
            <el-upload
              class="word-uploader"
              :action="WORD_UPLOAD_URL"
              :on-success="handleWordSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeWordUpload"
              :limit="1"
              accept=".doc,.docx"
            >
              <el-button type="primary">{{ $t('content.action.uploadWord') }}</el-button>
              <template #tip>
                <div class="upload-tip">
                  {{ $t('content.tips.wordSize') }}
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-col> -->
        </el-row>

        <!-- Rich text editor -->
        <el-form-item :label="$t('content.fields.details')" prop="comments">
          <div class="editor-container">
            <WangEditor ref="editorRef" v-model="formData.comments" />
          </div>
        </el-form-item>

        <!-- Form buttons -->
        <el-form-item>
          <el-button type="primary" @click="submitContent">
            {{ $t('content.action.commitContent') }}
          </el-button>
          <el-button type="default" @click="saveDraft">
            {{ $t('content.action.saveDraft') }}
          </el-button>
          <el-button @click="goBack">{{ $t('common.cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import WangEditor from '@/components/editor/WangEditor.vue';
import { getCategories, getTags, getContentById, addContent, updateContent } from '@/api/content';
import { convertToTree } from '@/utils/content';
import { UPLOAD_URL, WORD_UPLOAD_URL } from '@/constants';
import { useUserStore } from '@/stores/user';
import PageHeader from '@/components/common/PageHeader.vue';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// Form and validation
const formRef = ref(null);
const editorRef = ref(null);
const isEdit = computed(() => !!route.params.id);

// Form data
const formData = reactive({
  title: '',
  discription: '',
  categories: [],
  tags: '',
  sImg: '',
  comments: '',
  draft: '0',
});

// Form validation rules
const formRules = reactive({
  title: [
    { required: true, message: t('content.validation.titleRequired'), trigger: 'blur' },
    {
      min: 5,
      max: 50,
      message: t('validation.ranglengthandnormal', [t('content.placeholder.title'), 5, 50]),
      trigger: 'blur',
    },
  ],
  discription: [
    { required: true, message: t('content.validation.descriptionRequired'), trigger: 'blur' },
    {
      min: 5,
      max: 300,
      message: t('validation.ranglengthandnormal', [t('content.fields.description'), 5, 300]),
      trigger: 'blur',
    },
  ],
  categories: [{ required: true, message: t('validation.userContentCategory'), trigger: 'change' }],
  tags: [{ required: true, message: t('validation.userContentTags'), trigger: 'change' }],
  sImg: [{ required: true, message: t('validation.userContentSImg'), trigger: 'change' }],
  comments: [{ required: true, message: t('content.validation.contentRequired'), trigger: 'blur' }],
});

// Data for categories and tags
const categoryOptions = ref([]);
const tagOptions = ref([]);
const thumbnailList = ref([]);

// Category props for el-cascader
const categoryProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  emitPath: true,
  // checkStrictly: true,
};

// Load initial data
onMounted(async () => {
  await Promise.all([fetchCategories(), fetchTags()]);

  // If editing, load content data
  if (isEdit.value) {
    await fetchContentData(route.params.id);
  }
});

// Fetch categories
const fetchCategories = async () => {
  try {
    // const userId = localStorage.getItem('userId') || '';
    const res = await getCategories({});
    if (res && res.data) {
      categoryOptions.value = convertToTree(res.data);
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    ElMessage.error(t('common.error.fetchCategoriesFailed'));
  }
};

// Fetch tags
const fetchTags = async () => {
  try {
    const res = await getTags();
    if (res && res.data) {
      tagOptions.value = res.data.map(tag => ({
        value: tag.id,
        label: tag.name,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    ElMessage.error(t('common.error.fetchTagsFailed'));
  }
};

// Fetch content data for editing
const fetchContentData = async id => {
  try {
    const userId = userStore.userInfo?.id || '';
    const res = await getContentById({ id, userId });
    if (res && res.data) {
      const contentData = res.data;

      // Populate form data
      formData.title = contentData.title || '';
      formData.discription = contentData.discription || '';
      formData.comments = contentData.comments || '';

      // Set tags
      if (contentData.tags && contentData.tags.length > 0) {
        formData.tags = contentData.tags.map(tag => tag.id);
        console.log('🚀 ~ formData.tags:', formData.tags);
      }

      // Set categories
      if (contentData.categories && contentData.categories.length > 0) {
        // 获取完整的分类路径
        const categoryPath = contentData.categories.map(cat => cat.id);
        formData.categories = categoryPath;
      }

      // Set thumbnail
      if (contentData.sImg) {
        formData.sImg = contentData.sImg;
        thumbnailList.value = [
          {
            name: 'thumbnail',
            url: contentData.sImg,
          },
        ];
      }
    }
  } catch (error) {
    console.error('Failed to fetch content data:', error);
    ElMessage.error(t('common.error.fetchContentFailed'));
  }
};

// Thumbnail upload handlers
const handleThumbnailSuccess = (response, file) => {
  if (response && response.status === 200) {
    formData.sImg = response.data.path;
    ElMessage.success(t('upload.success'));
  }
};

const handleUploadError = () => {
  ElMessage.error(t('upload.failed'));
};

const beforeThumbnailUpload = file => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const isValidType = allowedTypes.includes(file.type);
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isValidType) {
    ElMessage.error(t('upload.imageTypeError'));
    return false;
  }

  if (!isLt2M) {
    ElMessage.error(t('upload.imageSizeError'));
    return false;
  }

  return true;
};

const handleThumbnailRemove = () => {
  formData.sImg = '';
};

// Word document upload handlers
const beforeWordUpload = file => {
  const isWord = file.name.endsWith('.doc') || file.name.endsWith('.docx');
  const isLt10M = file.size / 1024 / 1024 < 10;

  if (!isWord) {
    ElMessage.error(t('upload.wordTypeError'));
    return false;
  }

  if (!isLt10M) {
    ElMessage.error(t('upload.wordSizeError'));
    return false;
  }

  return true;
};

const handleWordSuccess = response => {
  if (response && response.status === 200) {
    formData.comments = response.data;
    ElMessage.success(t('upload.wordImportSuccess'));
  }
};

// Form submission
const submitContent = () => {
  formData.draft = '0';
  submitForm();
};

const saveDraft = () => {
  formData.draft = '1';
  submitForm();
};

const submitForm = () => {
  formRef.value.validate(async valid => {
    if (valid) {
      // Check required fields
      if (!formData.sImg) {
        ElMessage.error(t('validation.userContentSImg'));
        return;
      }

      if (!formData.categories || formData.categories.length === 0) {
        ElMessage.error(t('validation.userContentCategory'));
        return;
      }

      if (!formData.tags) {
        ElMessage.error(t('validation.userContentTags'));
        return;
      }

      try {
        const params = {
          title: formData.title,
          discription: formData.discription,
          sImg: formData.sImg,
          categories: Array.isArray(formData.categories) ? formData.categories : [formData.categories],
          tags: formData.tags,
          comments: formData.comments,
          draft: formData.draft,
          simpleComments: editorRef.value.getPlainText(),
        };

        let res;
        if (isEdit.value) {
          params.id = route.params.id;
          res = await updateContent(params);
        } else {
          res = await addContent(params);
        }

        if (res && res.status === 200) {
          ElMessage.success(t('content.submitSuccess'));
          goToList();
        } else {
          ElMessage.error(res?.message || t('content.submitFailed'));
        }
      } catch (error) {
        console.error('Content submission failed:', error);
        ElMessage.error(t('content.submitFailed'));
      }
    } else {
      ElMessage.error(t('validation.formInvalid'));
    }
  });
};

// Navigation
const goBack = () => {
  ElMessageBox.confirm(t('content.confirmCancel'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  })
    .then(() => {
      goToList();
    })
    .catch(() => {});
};

const goToList = () => {
  router.push('/my-articles');
};
</script>

<style scoped>
.article-editor {
  width: 100%;
  /* padding: 20px; */
}

.editor-title {
  font-size: 22px;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.content-form {
  max-width: 1200px;
}

.thumbnail-uploader,
.word-uploader {
  display: flex;
  flex-direction: column;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.editor-container {
  border-radius: 4px;
  min-height: 400px;
}

.submit-btn {
  margin-right: 10px;
}
</style>
