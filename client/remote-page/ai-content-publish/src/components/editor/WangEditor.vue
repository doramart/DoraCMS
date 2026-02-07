<template>
  <div class="wang-editor">
    <div style="border: 1px solid #ccc">
      <Toolbar
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
        :mode="mode"
        style="border-bottom: 1px solid #ccc"
      />
      <Editor
        :defaultConfig="editorConfig"
        v-model="valueHtml"
        :mode="mode"
        :style="{ height: height }"
        @onCreated="handleCreated"
        @onChange="handleChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount, watch } from 'vue';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  mode: {
    type: String,
    default: 'default', // 'default' or 'simple'
  },
  height: {
    type: String,
    default: '400px',
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

// Editor instance
const editorRef = shallowRef();
// HTML content
const valueHtml = ref(props.modelValue || '');

// Toolbar configuration
const toolbarConfig = {};

// Editor configuration
const editorConfig = {
  placeholder: 'Please enter content here...',
  MENU_CONF: {
    uploadImage: {
      server: `${import.meta.env.VITE_API_BASE_URL}/manage/v1/files`,
      fieldName: 'files',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxNumberOfFiles: 10,
      allowedFileTypes: ['image/*'],
      metaWithUrl: true,
      withCredentials: true,
      customInsert(res, insertFn) {
        if (res && res.status === 200 && res.data && res.data.path) {
          insertFn(res.data.path, res.data.name, res.data.path);
        }
      },
    },
  },
};

// Watch for external changes to model value
watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== valueHtml.value) {
      valueHtml.value = newValue;
    }
  }
);

// Watch for internal changes and emit to parent
watch(
  () => valueHtml.value,
  newValue => {
    emit('update:modelValue', newValue);
    emit('change', newValue);
  }
);

// Handle editor creation
const handleCreated = editor => {
  editorRef.value = editor;
};

// Handle content change
const handleChange = editor => {
  emit('update:modelValue', editor.getHtml());
  emit('change', editor.getHtml());
};

// Get plain text content from editor
const getPlainText = () => {
  const editor = editorRef.value;
  return editor ? editor.getText() : '';
};

// Expose methods
defineExpose({
  getPlainText,
});

// Destroy editor instance when component is unmounted
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) {
    editor.destroy();
  }
});
</script>

<style scoped>
.wang-editor {
  width: 100%;
}
</style>
