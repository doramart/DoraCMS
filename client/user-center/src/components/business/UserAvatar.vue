<template>
  <div class="user-avatar" :class="{ clickable: clickable }">
    <el-avatar
      :size="size"
      :src="avatarUrl"
      :alt="username"
      @click="handleClick"
    >
      {{ firstLetter }}
    </el-avatar>
    <div v-if="showUsername" class="username">{{ username }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  username: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  size: {
    type: [Number, String],
    default: 'default'
  },
  showUsername: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const firstLetter = computed(() => {
  const name = props.username || t('user.center.user')
  return name.charAt(0).toUpperCase()
})

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style lang="scss" scoped>
.user-avatar {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  
  &.clickable {
    cursor: pointer;
    
    &:hover {
      :deep(.el-avatar) {
        transform: scale(1.05);
      }
    }
  }
  
  :deep(.el-avatar) {
    background-color: var(--primary-color);
    transition: transform 0.2s ease;
  }
  
  .username {
    margin-top: 8px;
    font-size: 14px;
    color: var(--text-color-regular);
  }
}
</style> 