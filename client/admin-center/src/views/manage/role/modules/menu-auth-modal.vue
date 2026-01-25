<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { TreeInstance } from 'element-plus';
import { fetchGetMenuList } from '@/service/api';
import { $t } from '@/locales';

defineOptions({ name: 'MenuAuthModal' });

interface MenuButton {
  code: string;
  desc: string;
  permissionCode?: string | null;
}

interface ApiMenu {
  id: string;
  menuName: string;
  menuType: string;
  buttons: MenuButton[] | null;
  children: ApiMenu[] | null;
}

interface MenuTree {
  id: string;
  menuName: string;
  menuType: string;
  isButton?: boolean;
  children: MenuTree[];
}

interface Props {
  /** 默认选中的菜单ID列表 */
  defaultMenuIds?: string[];
  /** 默认选中的按钮code列表 */
  defaultButtonCodes?: string[];
}

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'submit', data: { menus: string[]; buttons: string[] }): void;
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });
const treeRef = ref<TreeInstance>();
function closeModal() {
  visible.value = false;
}

const title = computed(() => $t('common.edit') + $t('page.manage.role.menuAuth'));

const menuTree = ref<MenuTree[]>([]);
const checkedMenus = ref<string[]>([]);
const checkedButtons = ref<string[]>([]);

/** 转换菜单数据结构 */
function transformMenuData(menus: ApiMenu[], aliasMap: Map<string, string>): MenuTree[] {
  return menus.map(menu => {
    const node: MenuTree = {
      id: menu.id,
      menuName: menu.menuName,
      menuType: menu.menuType,
      children: [],
    };

    // 将按钮转换为子节点
    if (menu.buttons?.length) {
      node.children = menu.buttons
        .filter(btn => Boolean(btn.permissionCode))
        .map(btn => {
          const nodeId = btn.permissionCode as string;
          aliasMap.set(nodeId, nodeId);
          return {
            id: nodeId,
            menuName: btn.desc,
            menuType: 'button',
            isButton: true,
            children: [],
          };
        });
    }

    // 处理子菜单
    if (menu.children?.length) {
      const childNodes = transformMenuData(menu.children, aliasMap);
      node.children = node.children.concat(childNodes);
    }

    return node;
  });
}

/** 获取菜单树数据 */
async function getMenuTree() {
  try {
    const data = await fetchGetMenuList({ isPaging: '0' });
    const menuData = data?.data || [];
    const aliasMap = new Map<string, string>();
    menuTree.value = transformMenuData(menuData as ApiMenu[], aliasMap);

    // 设置默认选中项
    if (props.defaultMenuIds?.length) {
      checkedMenus.value = props.defaultMenuIds;
    }
    if (props.defaultButtonCodes?.length) {
      checkedButtons.value = props.defaultButtonCodes.map(code => aliasMap.get(code) || code);
    }
    nextTick(() => {
      const allKeys = [...checkedMenus.value, ...checkedButtons.value];
      const leafKeys = allKeys.filter(key => {
        const node = treeRef.value?.getNode(key);
        return node?.isLeaf;
      });
      treeRef.value?.setCheckedKeys(leafKeys);
    });
  } catch (err) {
    console.error('Failed to fetch menu tree:', err);
    window.$message?.error($t('common.error'));
  }
}

/** 处理节点选中状态变化 */
function handleCheckChange() {
  if (!treeRef.value) return;

  const checkedNodes = treeRef.value.getCheckedNodes(false, true);

  // 重置选中状态
  checkedMenus.value = [];
  checkedButtons.value = [];

  // 遍历选中节点，分别处理菜单和按钮
  checkedNodes.forEach(node => {
    if (node.isButton) {
      // 按钮节点
      checkedButtons.value.push(node.id);
    } else {
      // 菜单或目录节点
      checkedMenus.value.push(node.id);
    }
  });
}

/** 处理提交 */
function handleSubmit() {
  emits('submit', {
    menus: checkedMenus.value,
    buttons: checkedButtons.value,
  });
  closeModal();
}

/** 初始化 */
function init() {
  getMenuTree();
}

watch(visible, val => {
  if (val) {
    init();
  }
});
</script>

<template>
  <ElDialog v-model="visible" :title="title" preset="card" class="w-640px">
    <ElTree ref="treeRef" :data="menuTree" node-key="id" show-checkbox default-expand-all @check="handleCheckChange">
      <template #default="{ data }">
        <span>{{ data.menuName }}</span>
      </template>
    </ElTree>
    <template #footer>
      <ElSpace class="w-full justify-end">
        <ElButton size="small" @click="closeModal">
          {{ $t('common.cancel') }}
        </ElButton>
        <ElButton type="primary" size="small" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>

<style scoped>
.el-tree {
  max-height: 480px;
  overflow-y: auto;
}

:deep(.el-tree-node__content) {
  height: auto !important;
  padding: 4px 0;
}
</style>
