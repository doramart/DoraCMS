<script setup lang="ts" name="TemplateOperateDrawer">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig } from '@wangeditor/editor';
import { IToolbarConfig } from '@wangeditor/editor';
import {
  createMailTemplate,
  fetchGetMailTemplateTypeList,
  fetchGetOneMailTemplate,
  updateMailTemplate,
} from '@/service/api/mail-template';
import { useForm, useFormRules } from '@/hooks/common/form';
import { executeRequestCompat } from '@/utils/request-helper';
import { $t } from '@/locales';
import '@wangeditor/editor/dist/css/style.css';

defineOptions({ name: 'TemplateOperateDrawer' });

interface Props {
  /** the type of operation */
  operateType: UI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Email.MailTemplate | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const { formRef, validate, restoreValidation } = useForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<UI.TableOperateType, string> = {
    add: $t('page.email.mailTemplate.addTemplate'),
    edit: $t('page.email.mailTemplate.editTemplate'),
  };
  return titles[props.operateType];
});

const model = reactive<Partial<Api.Email.MailTemplate>>({
  type: '',
  comment: '',
  title: '',
  subTitle: '',
  content: '',
});

const templateTypeOptions = ref<{ label: string; value: string }[]>([]);

// Editor setup for WangEditor v5
const editorRef = shallowRef<IDomEditor | null>(null);
const toolbarConfig = {}; // Toolbar configuration
const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入内容...',
};
const editorHtml = ref('');

type RuleKey = Extract<keyof Api.Email.MailTemplate, 'type' | 'comment' | 'title' | 'subTitle'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  type: defaultRequiredRule,
  comment: defaultRequiredRule,
  title: defaultRequiredRule,
  subTitle: defaultRequiredRule,
};

async function getTemplateTypeOptions() {
  const { data } = await fetchGetMailTemplateTypeList();
  if (data) {
    const options = [];
    for (const key in data) {
      if (Object.hasOwn(data, key)) {
        options.push({
          label: data[key],
          value: key,
        });
      }
    }
    templateTypeOptions.value = options;
  }
}

// Watch for rowData changes
watch(
  () => props.rowData,
  async newVal => {
    if (newVal && newVal.id) {
      try {
        const { data } = await fetchGetOneMailTemplate(newVal.id);
        if (data) {
          Object.assign(model, {
            id: data.id,
            type: data.type,
            comment: data.comment,
            title: data.title,
            subTitle: data.subTitle,
            content: data.content,
          });

          nextTick(() => {
            if (data.content) {
              editorHtml.value = data.content;
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch template data:', error);
        window.$message?.error($t('common.modifyError'));
      }
    } else {
      // Reset form
      Object.assign(model, {
        type: '',
        comment: '',
        title: '',
        subTitle: '',
        content: '',
      });
      editorHtml.value = '';
    }
  },
  { immediate: true }
);

function closeDrawer() {
  visible.value = false;
}

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor; // Save editor instance
}

function handleEditorChanged() {
  if (editorRef.value) {
    model.content = editorRef.value.getHtml();
  }
}

async function handleSubmit() {
  await validate();

  // Get content from editor
  if (editorRef.value) {
    model.content = editorRef.value.getHtml();
  }

  // Request
  const requestObj = props.operateType === 'add' ? createMailTemplate : updateMailTemplate;
  const success = await executeRequestCompat(() => requestObj(model as Api.Email.MailTemplate));

  if (success) {
    window.$message?.success($t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  }
}

onBeforeUnmount(() => {
  // Destroy the editor when component is unmounted
  const editor = editorRef.value;
  if (editor) {
    editor.destroy();
    editorRef.value = null;
  }
});

// Get template types when component is mounted
onMounted(() => {
  getTemplateTypeOptions();
});

// Watch for drawer visibility changes
watch(visible, newValue => {
  if (newValue) {
    restoreValidation();
  }
});
</script>

<template>
  <ElDrawer v-model="visible" :title="title" :size="800">
    <ElForm ref="formRef" :model="model" :rules="rules" label-position="top">
      <ElFormItem :label="$t('page.email.mailTemplate.type')" prop="type">
        <ElSelect v-model="model.type" :placeholder="$t('page.email.mailTemplate.form.type')">
          <ElOption
            v-for="item in templateTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem :label="$t('page.email.mailTemplate.comment')" prop="comment">
        <ElInput
          v-model="model.comment"
          :placeholder="$t('page.email.mailTemplate.form.comment')"
        />
      </ElFormItem>

      <ElFormItem :label="$t('page.email.mailTemplate.templateTitle')" prop="title">
        <ElInput v-model="model.title" :placeholder="$t('page.email.mailTemplate.form.title')" />
      </ElFormItem>

      <ElFormItem :label="$t('page.email.mailTemplate.subTitle')" prop="subTitle">
        <ElInput
          v-model="model.subTitle"
          :placeholder="$t('page.email.mailTemplate.form.subTitle')"
        />
      </ElFormItem>

      <ElFormItem :label="$t('page.email.mailTemplate.tags')">
        <ElCard class="mb-4">
          <div class="mb-2">
            <div class="mb-2 font-bold">{{ $t('page.email.mailTemplate.commonTags') }}</div>
            <ElTag class="mb-1 mr-2" type="warning">
              {{ $t('page.email.mailTemplate.tag.siteName') }}
            </ElTag>
            <ElTag class="mb-1 mr-2" type="warning">
              {{ $t('page.email.mailTemplate.tag.siteDomain') }}
            </ElTag>
            <ElTag class="mb-1 mr-2" type="warning">
              {{ $t('page.email.mailTemplate.tag.email') }}
            </ElTag>
          </div>

          <div v-if="model.type === '0'" class="mb-2">
            <div class="mb-2 font-bold">
              {{ $t('page.email.mailTemplate.passwordRecoveryTags') }}
            </div>
            <ElTag class="mb-1 mr-2" type="warning">
              {{ $t('page.email.mailTemplate.tag.passwordToken') }}
            </ElTag>
          </div>

          <div v-if="model.type === '6'" class="mb-2">
            <div class="mb-2 font-bold">{{ $t('page.email.mailTemplate.messageTags') }}</div>
            <ElTag class="mb-1 mr-2" type="warning"
              >{{ $t('page.email.mailTemplate.tag.messageAuthor') }}</ElTag
            >
            <ElTag class="mb-1 mr-2" type="warning">
              {{ $t('page.email.mailTemplate.tag.messageSendDate') }}
            </ElTag>
            <ElTag class="mb-1 mr-2" type="warning"
              >{{ $t('page.email.mailTemplate.tag.messageContentTitle') }}</ElTag
            >
            <ElTag class="mb-1 mr-2" type="warning"
              >{{ $t('page.email.mailTemplate.tag.messageContentId') }}</ElTag
            >
          </div>

          <div v-if="model.type === '8'" class="mb-2">
            <div class="mb-2 font-bold">{{ $t('page.email.mailTemplate.verificationTags') }}</div>
            <ElTag class="mb-1 mr-2" type="warning">
              {{ $t('page.email.mailTemplate.tag.verificationCode') }}
            </ElTag>
          </div>
        </ElCard>
      </ElFormItem>

      <ElFormItem :label="$t('page.email.mailTemplate.content')">
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
      <ElSpace :size="16">
        <ElButton @click="closeDrawer">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </ElSpace>
    </template>
  </ElDrawer>
</template>

<style lang="scss" scoped>
:deep(.w-e-toolbar) {
  background: inherit !important;
  border-color: var(--el-border-color) !important;
}
:deep(.w-e-text-container) {
  background: inherit;
  border-color: var(--el-border-color) !important;
}
</style>
