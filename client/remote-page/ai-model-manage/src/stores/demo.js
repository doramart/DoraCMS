import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * Demo Store - 演示状态管理
 * 展示 Pinia 的基本用法
 */
export const useDemoStore = defineStore('demo', () => {
  // State
  const counter = ref(0);
  const items = ref([]);
  const settings = ref({
    theme: 'light',
    language: 'zh-CN',
    notifications: true,
  });

  // Getters (Computed)
  const doubleCounter = computed(() => counter.value * 2);
  const itemCount = computed(() => items.value.length);
  const isLightTheme = computed(() => settings.value.theme === 'light');

  // Actions
  function increment() {
    counter.value++;
  }

  function decrement() {
    counter.value--;
  }

  function incrementBy(amount) {
    counter.value += amount;
  }

  function reset() {
    counter.value = 0;
  }

  function addItem(item) {
    items.value.push({
      id: Date.now(),
      ...item,
      createdAt: new Date().toISOString(),
    });
  }

  function removeItem(id) {
    const index = items.value.findIndex(item => item.id === id);
    if (index !== -1) {
      items.value.splice(index, 1);
    }
  }

  function clearItems() {
    items.value = [];
  }

  function updateSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings };
  }

  function toggleTheme() {
    settings.value.theme = settings.value.theme === 'light' ? 'dark' : 'light';
  }

  function toggleNotifications() {
    settings.value.notifications = !settings.value.notifications;
  }

  // 持久化示例
  function saveToLocalStorage() {
    localStorage.setItem('demo_counter', counter.value.toString());
    localStorage.setItem('demo_items', JSON.stringify(items.value));
    localStorage.setItem('demo_settings', JSON.stringify(settings.value));
  }

  function loadFromLocalStorage() {
    const savedCounter = localStorage.getItem('demo_counter');
    const savedItems = localStorage.getItem('demo_items');
    const savedSettings = localStorage.getItem('demo_settings');

    if (savedCounter) counter.value = parseInt(savedCounter);
    if (savedItems) items.value = JSON.parse(savedItems);
    if (savedSettings) settings.value = JSON.parse(savedSettings);
  }

  function clearLocalStorage() {
    localStorage.removeItem('demo_counter');
    localStorage.removeItem('demo_items');
    localStorage.removeItem('demo_settings');
  }

  return {
    // State
    counter,
    items,
    settings,

    // Getters
    doubleCounter,
    itemCount,
    isLightTheme,

    // Actions
    increment,
    decrement,
    incrementBy,
    reset,
    addItem,
    removeItem,
    clearItems,
    updateSettings,
    toggleTheme,
    toggleNotifications,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
  };
});
