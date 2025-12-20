<template>
  <div class="child-component">
    <el-card shadow="never">
      <div class="child-content">
        <p class="message-display">{{ $t('demo.receivedFromParent') }}: {{ message }}</p>
        <el-input v-model="response" :placeholder="$t('demo.enterResponse')" size="small" style="margin-bottom: 10px" />
        <el-button type="primary" size="small" @click="sendResponse">
          {{ $t('demo.sendToParent') }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  message: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['response']);

const response = ref('');

const sendResponse = () => {
  if (response.value) {
    emit('response', response.value);
    response.value = '';
  }
};
</script>

<style scoped lang="scss">
.child-component {
  .child-content {
    .message-display {
      margin: 0 0 10px 0;
      padding: 10px;
      background: #ecf5ff;
      border-radius: 4px;
      color: #409eff;
      font-size: 14px;
    }
  }
}
</style>
