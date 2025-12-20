<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { VNode } from 'vue';
import type { DropdownInstance } from 'element-plus';
import { $t } from '@/locales';
import { useTabStore } from '@/store/modules/tab';
import { useSvgIcon } from '@/hooks/common/icon';

defineOptions({ name: 'ContextMenu' });

interface Props {
  /** ClientX */
  x: number;
  /** ClientY */
  y: number;
  tabId: string;
  excludeKeys?: App.Global.DropdownKey[];
  disabledKeys?: App.Global.DropdownKey[];
}

const props = withDefaults(defineProps<Props>(), {
  excludeKeys: () => [],
  disabledKeys: () => []
});

const { removeTab, clearTabs, clearLeftTabs, clearRightTabs } = useTabStore();
const { SvgIconVNode } = useSvgIcon();

type DropdownOption = {
  key: App.Global.DropdownKey;
  label: string;
  icon?: () => VNode;
  disabled?: boolean;
};

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      key: 'closeCurrent',
      label: $t('dropdown.closeCurrent'),
      icon: SvgIconVNode({ icon: 'ant-design:close-outlined', fontSize: 18 })
    },
    {
      key: 'closeOther',
      label: $t('dropdown.closeOther'),
      icon: SvgIconVNode({ icon: 'ant-design:column-width-outlined', fontSize: 18 })
    },
    {
      key: 'closeLeft',
      label: $t('dropdown.closeLeft'),
      icon: SvgIconVNode({ icon: 'mdi:format-horizontal-align-left', fontSize: 18 })
    },
    {
      key: 'closeRight',
      label: $t('dropdown.closeRight'),
      icon: SvgIconVNode({ icon: 'mdi:format-horizontal-align-right', fontSize: 18 })
    },
    {
      key: 'closeAll',
      label: $t('dropdown.closeAll'),
      icon: SvgIconVNode({ icon: 'ant-design:line-outlined', fontSize: 18 })
    }
  ];
  const { excludeKeys, disabledKeys } = props;

  const result = opts.filter(opt => !excludeKeys.includes(opt.key));

  disabledKeys.forEach(key => {
    const opt = result.find(item => item.key === key);

    if (opt) {
      opt.disabled = true;
    }
  });

  return result;
});

const visible = defineModel<boolean>('visible');

const dropdown = ref<DropdownInstance>();

watch(visible, val => {
  if (val) {
    dropdown.value!.handleOpen();
  } else {
    dropdown.value!.handleClose();
  }
});

function hideDropdown() {
  visible.value = false;
  dropdown.value!.handleClose();
}

const dropdownAction: Record<App.Global.DropdownKey, () => void> = {
  closeCurrent() {
    removeTab(props.tabId);
  },
  closeOther() {
    clearTabs([props.tabId]);
  },
  closeLeft() {
    clearLeftTabs(props.tabId);
  },
  closeRight() {
    clearRightTabs(props.tabId);
  },
  closeAll() {
    clearTabs();
  }
};

function handleDropdown(optionKey: App.Global.DropdownKey) {
  dropdownAction[optionKey]?.();
  hideDropdown();
}
</script>

<template>
  <div class="absolute" :style="{ top: `${y - 60}px`, left: `${x + 60}px` }">
    <ElDropdown ref="dropdown" popper-class="arrow-hide" trigger="click" @command="handleDropdown">
      <!-- Avoid waning: [ElOnlyChild] no valid child node found -->
      <span></span>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem
            v-for="{ key, label, icon, disabled } in options"
            :key="key"
            class="mx-4px my-1px rounded-6px"
            :icon="icon"
            :command="key"
            :disabled="disabled"
          >
            {{ label }}
          </ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </div>
</template>

<style lang="scss">
.arrow-hide {
  .el-popper__arrow {
    display: none;
  }
}
</style>
