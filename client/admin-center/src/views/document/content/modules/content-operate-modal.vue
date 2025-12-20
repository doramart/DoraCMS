<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { Plus } from '@element-plus/icons-vue';
// Import WangEditor v5 components
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig } from '@wangeditor/editor';
import { uploadUrl } from '@/constants/common';
import {
  createContent,
  fetchGetContentCategoryList,
  fetchGetContentTagList,
  // fetchGetContentTypeList,
  fetchGetOneContent,
  updateContent,
} from '@/service/api/content';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';
import { convertToTree } from '../utils';
import '@wangeditor/editor/dist/css/style.css';

defineOptions({ name: 'ContentOperateModal' });

type OperateType = 'add' | 'edit';

interface Props {
  operateType: OperateType;
  rowData?: any;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const emit = defineEmits(['submitted']);

const { formRef, restoreValidation } = useForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<OperateType, string> = {
    add: $t('page.document.content.addContent'),
    edit: $t('page.document.content.editContent'),
  };
  return titles[props.operateType];
});

const state = reactive({
  categories: [] as any[],
  tags: [] as any[],
  types: [] as any[],
  formData: {
    id: '',
    title: '',
    stitle: '',
    type: '',
    categories: [] as string[],
    tags: [] as string[],
    keywords: '',
    sImg: '',
    discription: '',
    content: '',
    comments: '',
    simpleComments: '',
    isTop: false,
    clickNum: 0,
    state: '0',
    author: '',
    source: '',
    likeNum: 0,
    roofPlacement: false,
    updatedAt: new Date().toISOString(),
  },
});

const rules = {
  title: defaultRequiredRule,
  type: defaultRequiredRule,
  categories: defaultRequiredRule,
  comments: defaultRequiredRule,
  state: defaultRequiredRule,
  tags: defaultRequiredRule,
  sImg: defaultRequiredRule,
};

const categoryProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  emitPath: true,
};

// Editor setup for WangEditor v5
const editorRef = shallowRef<IDomEditor>();
const toolbarConfig = {}; // Toolbar configuration
const editorConfig: Partial<IEditorConfig> = {
  placeholder: $t('page.document.content.form.contentPlaceholder'),
};
const editorHtml = ref('');

// Handle file upload for cover image
const uploadHeaders = {
  // Add any required headers, e.g., authorization
};

function handleUploadSuccess(response: any) {
  if (response?.data?.path) {
    state.formData.sImg = response.data.path;
    window.$message?.success($t('common.uploadSuccess'));
  } else {
    window.$message?.error($t('common.uploadError'));
  }
}

function beforeAvatarUpload(file: File) {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const isValidType = allowedTypes.includes(file.type);

  if (!isImage || !isValidType) {
    window.$message?.error($t('page.document.content.form.imageFormatError'));
    return false;
  }
  if (!isLt2M) {
    window.$message?.error($t('page.document.content.form.imageSizeError'));
    return false;
  }
  return true;
}

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor; // Save editor instance
}

function handleEditorChanged() {
  if (editorRef.value) {
    state.formData.comments = editorRef.value.getHtml();
  }
}

// Watch for dialog visibility changes
watch(visible, newValue => {
  if (newValue) {
    restoreValidation();
  }
});

onBeforeUnmount(() => {
  // Destroy the editor when component is unmounted
  const editor = editorRef.value;
  if (editor) {
    editor.destroy();
    editorRef.value = undefined;
  }
});

async function handleSubmit() {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  try {
    // Get content from editor
    if (editorRef.value) {
      state.formData.comments = editorRef.value.getHtml();
      state.formData.simpleComments = editorRef.value.getText();
    }

    // 提交前转换 isTop/roofPlacement
    const submitData = {
      ...state.formData,
      isTop: state.formData.isTop ? 1 : 0,
      roofPlacement: state.formData.roofPlacement ? '1' : '0',
    };

    // Request
    const requestObj = props.operateType === 'add' ? createContent : updateContent;
    const result = await requestObj(submitData as unknown as Api.DocumentManage.Content);
    if (result?.error) {
      window.$message?.error(result?.error?.message);
    } else {
      window.$message?.success($t('common.updateSuccess'));
      closeModal();
      emit('submitted');
    }
  } catch (error) {
    console.error('Error submitting content form:', error);
    window.$message?.error($t('common.submitError'));
  }
}

async function getContentData() {
  if (props.operateType === 'edit' && props.rowData && props.rowData.id) {
    try {
      const { error, data } = await fetchGetOneContent(props.rowData.id);
      if (!error && data) {
        // 转换 categories 和 tags 为 id 数组
        const categories = Array.isArray(data.categories)
          ? data.categories.map((item: any) => item.id || item.id)
          : [];
        const tags = Array.isArray(data.tags)
          ? data.tags.map((item: any) => item.id || item.id)
          : [];
        const keywords = Array.isArray(data.keywords) ? data.keywords.join(',') : [];
        Object.assign(state.formData, {
          ...data,
          categories,
          tags,
          keywords,
          isTop: data.isTop === 1 || data.isTop === '1',
          roofPlacement: data.roofPlacement === 1 || data.roofPlacement === '1',
        });
        // 回填编辑器内容
        if (data.comments) {
          editorHtml.value = data.comments;
        }
      }
    } catch (error) {
      console.error('Error fetching content data:', error);
    }
  }
}

async function getCategoryOptions() {
  try {
    const { error, data } = await fetchGetContentCategoryList();
    if (!error && data) {
      state.categories = data;
    }
  } catch (error) {
    console.error('Error fetching category list:', error);
  }
}

async function getTagOptions() {
  try {
    const { error, data } = await fetchGetContentTagList({ isPaging: '0', pageSize: 200 });
    if (!error && data) {
      state.tags = data;
    }
  } catch (error) {
    console.error('Error fetching tag list:', error);
  }
}

function closeModal() {
  visible.value = false;
  resetForm();
}

function resetForm() {
  if (props.operateType === 'add') {
    Object.assign(state.formData, {
      id: '',
      title: '',
      stitle: '',
      type: '',
      categories: [],
      tags: [],
      keywords: '',
      sImg: '',
      discription: '',
      content: '',
      comments: '',
      isTop: false,
      clickNum: 0,
      state: '0',
      author: '',
      source: '',
      likeNum: 0,
      roofPlacement: false,
      updatedAt: new Date().toISOString(),
    });
    editorHtml.value = '';
  }
  restoreValidation();
}

watch(
  () => visible.value,
  newValue => {
    if (newValue) {
      getContentData();
    }
  }
);

onMounted(() => {
  getCategoryOptions();
  getTagOptions();
  // getTypeOptions();
});
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="title"
    width="80%"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <ElForm ref="formRef" :model="state.formData" :rules="rules" label-width="120px">
      <ElFormItem :label="$t('page.document.content.mainTitle')" prop="title">
        <ElInput v-model="state.formData.title" />
      </ElFormItem>
      <ElFormItem :label="$t('page.document.content.subTitle')" prop="stitle">
        <ElInput v-model="state.formData.stitle" />
      </ElFormItem>

      <ElFormItem :label="$t('page.document.content.category')" prop="categories">
        <ElCascader
          v-model="state.formData.categories"
          :options="state.categories"
          :props="categoryProps"
          filterable
          clearable
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem :label="$t('page.document.content.tags')" prop="tags">
        <ElSelect v-model="state.formData.tags" multiple filterable class="w-full">
          <ElOption v-for="item in state.tags" :key="item.id" :label="item.name" :value="item.id" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('page.document.content.keywords')" prop="keywords">
        <ElInput v-model="state.formData.keywords" :placeholder="$t('page.document.content.form.keywordsSeparator')" />
      </ElFormItem>

      <ElFormItem :label="$t('page.document.content.coverImage')" prop="sImg">
        <ElUpload
          class="avatar-uploader"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :show-file-list="false"
          accept="image/*"
          :on-success="handleUploadSuccess"
          :before-upload="beforeAvatarUpload"
          :data="{ action: 'uploadimage' }"
        >
          <img v-if="state.formData.sImg" :src="state.formData.sImg" class="avatar" />
          <ElButton v-else type="primary">
            <ElIcon><Plus /></ElIcon>
            {{ $t('page.document.content.uploadCover') }}
          </ElButton>
        </ElUpload>
      </ElFormItem>
      <ElFormItem :label="$t('page.document.content.description')" prop="discription">
        <ElInput v-model="state.formData.discription" type="textarea" :rows="3" />
      </ElFormItem>

      <ElFormItem :label="$t('page.document.content.source')" prop="source">
        <ElInput v-model="state.formData.source" />
      </ElFormItem>

      <ElFormItem>
        <ElCheckbox v-model="state.formData.isTop">{{
          $t('page.document.content.isTop')
        }}</ElCheckbox>
        <ElCheckbox v-model="state.formData.roofPlacement">{{
          $t('page.document.content.isPinned')
        }}</ElCheckbox>
      </ElFormItem>

      <ElFormItem :label="$t('page.document.content.state')" prop="state">
        <ElRadioGroup v-model="state.formData.state">
          <ElRadio value="0">{{ $t('page.document.content.draft') }}</ElRadio>
          <ElRadio value="1">{{ $t('page.document.content.pendingReview') }}</ElRadio>
          <ElRadio value="2">{{ $t('page.document.content.approved') }}</ElRadio>
          <ElRadio value="3">{{ $t('page.document.content.offline') }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem :label="$t('page.document.content.content')" prop="comments">
        <div style="border: 1px solid #ccc; width: 100%">
          <Toolbar
            style="border-bottom: 1px solid #ccc"
            :editor="editorRef"
            :default-config="toolbarConfig"
            mode="default"
          />
          <Editor
            v-model="editorHtml"
            style="height: 400px; overflow-y: hidden; width: 100%"
            :default-config="editorConfig"
            mode="default"
            @on-created="handleCreated"
            @on-change="handleEditorChanged"
          />
        </div>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="closeModal">{{ $t('common.cancel') }}</ElButton>
      <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
    </template>
  </ElDialog>
</template>

<style lang="scss" scoped>
.avatar-uploader {
  .avatar {
    width: 178px;
    height: 178px;
    display: block;
    object-fit: cover;
  }
}
</style>
