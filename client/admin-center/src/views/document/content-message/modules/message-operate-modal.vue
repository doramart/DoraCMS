<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { addContentMessage, fetchGetOneContentMessage } from '@/service/api/content-message';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'MessageOperateModal' });

interface Props {
  /** the type of operation */
  operateType: UI.TableOperateType;
  /** the message data to reply to */
  rowData?: Api.DocumentManage.ContentMessage | null;
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
  return $t('page.document.contentMessage.replyUser');
});

interface Model {
  content: string;
}

const model = ref<Model>({
  content: '',
});

const originalMessage = ref<string>('');

const rules = {
  content: [
    defaultRequiredRule,
    { min: 5, max: 200, message: `内容长度在 5-200 个字符之间`, trigger: 'blur' },
  ],
};

watch(
  () => visible.value,
  async newVal => {
    if (newVal && props.rowData) {
      // Get the reply detail
      const { error, data } = await fetchGetOneContentMessage(props.rowData.id);
      if (!error && data) {
        originalMessage.value = data.content;
      }
      model.value = {
        content: '',
      };
    }
  }
);

function closeDialog() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  if (props.rowData) {
    const params: Api.DocumentManage.ContentMessageReply = {
      relationMsgId: props.rowData.id,
      contentId: props.rowData.contentId.id,
      utype: '1', // Admin reply
      content: model.value.content,
    };

    if (props.rowData.author) {
      params.replyAuthor = props.rowData.author.id;
    }
    // Due to type issues, we'll simply exclude the admin reply for now
    // This might need to be fixed in the API type definition

    const { error } = await addContentMessage(params);

    if (!error) {
      closeDialog();
      emit('submitted');
    }
  }
}
</script>

<template>
  <ElDialog v-model="visible" :title="title" width="600px" @closed="restoreValidation">
    <ElForm ref="formRef" :model="model" :rules="rules" label-position="top">
      <ElFormItem :label="$t('page.document.contentMessage.userSaid')">
        {{ originalMessage }}
      </ElFormItem>
      <ElFormItem :label="$t('page.document.contentMessage.reply')" prop="content">
        <ElInput
          v-model="model.content"
          type="textarea"
          :rows="5"
          :placeholder="$t('common.input.placeholder')"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="closeDialog">{{ $t('common.cancel') }}</ElButton>
      <ElButton type="primary" @click="handleSubmit">{{
        $t('page.document.contentMessage.reply')
      }}</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped></style>
