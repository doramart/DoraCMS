<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { ElButton, ElImage, ElTabPane, ElTabs, ElTag, ElUpload } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import {
  enableTemplate,
  fetchGetMyTemplateList,
  fetchGetTempsFromShop,
  installTemplate,
  uninstallTemplate,
  updateTemplate,
} from '@/service/api/template-config';
import { TOKEN_KEY } from '@/store/modules/auth/shared';
import { $t } from '@/locales';
import TemplateCostModal from './modules/template-cost-modal.vue';

defineOptions({ name: 'TemplateConfig' });

const token = useStorage(TOKEN_KEY, '');
const activeTab = ref('installedTemplates');
const loadingPage = ref(false);
const uploadFileList = ref<UploadFile[]>([]);

// Template operation loading state
const isOperating = ref(false);

// Installed templates
const installedTemplates = ref<Api.PluginManage.Template[]>([]);
const currentTheme = ref<Api.PluginManage.Template | null>(null);

// Template market
const templateMarket = ref<Api.PluginManage.TemplateMarketItem[]>([]);
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
});

// Payment modal
const paymentModalVisible = ref(false);
const paymentModalData = reactive({
  templateItem: null as Api.PluginManage.TemplateMarketItem | null,
  qrCode: '',
  noInvoice: '',
  checkPaymentTask: 0,
});

// Methods
async function getInstalledTemplates() {
  try {
    const response: any = await fetchGetMyTemplateList();
    if (response?.data?.docs) {
      installedTemplates.value = response.data.docs;
      // Set current theme
      currentTheme.value = response.data.docs.find((item: any) => item.active) || null;
    }
  } catch (error) {
    // Failed to get installed templates
  }
}

async function getTemplateMarket() {
  try {
    const response = await fetchGetTempsFromShop({
      current: pagination.current,
      size: pagination.size,
    });
    if (response?.data) {
      const { docs, pageInfo } = response.data;
      if (docs && pageInfo) {
        templateMarket.value = docs;
        pagination.total = pageInfo.totalItems;
      }
    }
  } catch (error) {
    // Failed to get template market
  }
}

function refreshData() {
  getInstalledTemplates();
  getTemplateMarket();
}

// Handle tab change
function handleTabChange() {
  // Prevent tab switching during operation
  if (isOperating.value || loadingPage.value) {
    return false;
  }
  return true;
}

// Template operations
function handleTemplateOp(
  template: Api.PluginManage.TemplateMarketItem | Api.PluginManage.Template,
  operation: 'install' | 'update' | 'enable' | 'uninstall'
) {
  // Prevent multiple operations
  if (isOperating.value) {
    return;
  }

  // If template needs payment, show payment modal
  if (operation === 'install' && 'amount' in template && template.amount > 0) {
    showPaymentModal(template as Api.PluginManage.TemplateMarketItem);
    return;
  }

  const operationMap = {
    install: installTemplate,
    update: updateTemplate,
    enable: enableTemplate,
    uninstall: uninstallTemplate,
  };

  const messageMap = {
    install: $t('page.extend.templateConfig.form.installSuccessMsg'),
    update: $t('page.extend.templateConfig.form.updateSuccessMsg'),
    enable: $t('page.extend.templateConfig.form.enableSuccessMsg'),
    uninstall: $t('page.extend.templateConfig.form.uninstallSuccessMsg'),
  };

  const id = template.id;
  if (!id) return;

  // Set loading state
  isOperating.value = true;

  operationMap[operation](id)
    .then(() => {
      window.$message?.success(messageMap[operation]);
      refreshData();
    })
    .catch(error => {
      window.$message?.error(error.message || `Failed to ${operation} template`);
    })
    .finally(() => {
      isOperating.value = false;
    });
}

// Payment modal
function showPaymentModal(template: Api.PluginManage.TemplateMarketItem) {
  paymentModalData.templateItem = template;
  paymentModalVisible.value = true;
}

// Preview template
function previewTemplate(preview: string) {
  if (preview) {
    window.open(preview, '_blank');
  }
}

// Upload handlers
function handleUploadSuccess() {
  loadingPage.value = false;
  window.$message?.success($t('page.extend.templateConfig.form.uploadSuccessMsg'));
  refreshData();
}

function handleUploadError(error: any) {
  loadingPage.value = false;
  window.$message?.error(error.message || $t('page.extend.templateConfig.form.uploadFailMsg'));
}

function beforeUpload(file: File) {
  loadingPage.value = true;
  const isZip = file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
  const isLt10M = file.size / 1024 / 1024 < 10;

  if (!isZip) {
    loadingPage.value = false;
    window.$message?.error($t('page.extend.templateConfig.form.limitFileType'));
    return false;
  }

  if (!isLt10M) {
    loadingPage.value = false;
    window.$message?.error($t('page.extend.templateConfig.form.limitFileSize'));
    return false;
  }

  return isZip && isLt10M;
}

onMounted(() => {
  refreshData();
});
</script>

<template>
  <div
    v-loading="isOperating || loadingPage"
    element-loading-text="操作进行中，请稍候..."
    element-loading-background="rgba(0, 0, 0, 0.5)"
    class="template-config min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto"
  >
    <ElCard class="sm:flex-1-hidden card-wrapper">
      <!--
 <template #header>
        <div class="flex items-center justify-between">
          <h2>{{ $t('page.extend.templateConfig.title') }}</h2>
          <ElButton type="primary" @click="refreshData">
            <template #icon>
              <icon-ic-round-refresh class="text-icon" />
            </template>
            {{ $t('common.refresh') }}
          </ElButton>
        </div>
      </template>
-->

      <ElTabs v-model="activeTab" :before-leave="handleTabChange" class="template-tabs">
        <!-- Installed Templates Tab -->
        <ElTabPane :label="$t('page.extend.templateConfig.installedTemplates')" name="installedTemplates">
          <div v-if="currentTheme" class="current-theme mb-20px">
            <ElRow :gutter="20">
              <!-- Current Theme Info -->
              <ElCol :xs="24" :md="12">
                <div class="theme-info rounded-8px bg-gray-100 p-16px dark:bg-dark">
                  <ElRow :gutter="20">
                    <ElCol :xs="24" :md="10">
                      <div class="theme-image">
                        <ElImage :src="currentTheme.screenshot" fit="cover" class="h-160px w-full rounded-4px" />
                      </div>
                    </ElCol>
                    <ElCol :xs="24" :md="14">
                      <div class="theme-info-content p-8px">
                        <ul class="list-none p-0">
                          <li class="mb-8px">
                            <strong>{{ $t('common.name') }}:</strong>
                            {{ currentTheme.name }}&nbsp;
                            <ElTag type="success" size="small">
                              {{ $t('page.extend.templateConfig.currentTheme') }}
                            </ElTag>
                          </li>
                          <li class="mb-8px">
                            <strong>{{ $t('page.extend.templateConfig.author') }}:</strong>
                            {{ currentTheme.author }}
                          </li>
                          <li class="mb-8px">
                            <strong>{{ $t('page.extend.templateConfig.version') }}:</strong>
                            <ElTag>
                              {{ currentTheme.version }}
                            </ElTag>
                          </li>
                          <li class="mb-8px">
                            <strong>{{ $t('page.extend.templateConfig.introduction') }}:</strong>
                            {{ currentTheme.comment || '-' }}
                          </li>
                        </ul>
                      </div>
                    </ElCol>
                  </ElRow>
                </div>
              </ElCol>
            </ElRow>

            <!-- Available Templates -->
            <div class="mt-20px">
              <h3 class="mb-12px">{{ $t('page.extend.templateConfig.installedTemplates') }}</h3>
              <ElRow :gutter="20">
                <ElCol
                  v-for="template in installedTemplates"
                  :key="template.id"
                  :xs="12"
                  :sm="8"
                  :md="6"
                  :lg="4"
                  class="mb-16px"
                >
                  <div
                    class="template-card h-full flex flex-col overflow-hidden rounded-8px bg-white shadow-sm dark:bg-dark"
                  >
                    <div class="template-card-image relative">
                      <ElImage :src="template.screenshot" fit="cover" class="h-150px w-full" />
                      <span v-if="template.shoudUpdate" class="absolute right-8px top-8px">
                        <ElTag type="warning">{{ $t('page.extend.templateConfig.update') }}</ElTag>
                      </span>
                    </div>
                    <div class="template-card-content flex-1 p-12px">
                      <h4 class="mb-8px text-16px font-medium">{{ template.name }}</h4>
                      <p class="mb-8px text-12px text-gray-500">
                        <strong>{{ $t('page.extend.templateConfig.author') }}:</strong>
                        {{ template.author }}
                      </p>
                      <!-- <p class="mb-12px text-12px">
                        <strong>{{ $t('page.extend.templateConfig.version') }}:</strong>
                        <ElTag
                          v-for="version in template.version"
                          :key="version"
                          type="info"
                          size="small"
                          class="mr-4px"
                        >
                          {{ version }}
                        </ElTag>
                      </p> -->
                      <div v-if="!template.active" class="mt-auto flex gap-8px pt-8px">
                        <ElButton size="small" @click="handleTemplateOp(template, 'enable')">
                          {{ $t('page.extend.templateConfig.enable') }}
                        </ElButton>
                        <ElButton
                          v-if="!template.isSystemTemplate"
                          size="small"
                          type="danger"
                          @click="handleTemplateOp(template, 'uninstall')"
                        >
                          {{ $t('page.extend.templateConfig.uninstall') }}
                        </ElButton>
                        <ElTag v-else type="info" size="small">
                          {{ $t('page.extend.templateConfig.systemTemplate') }}
                        </ElTag>
                      </div>
                      <div v-else class="mt-auto pt-8px">
                        <ElTag type="success">{{ $t('page.extend.templateConfig.currentTheme') }}</ElTag>
                      </div>
                    </div>
                  </div>
                </ElCol>
              </ElRow>
            </div>
          </div>
          <ElEmpty v-else :description="$t('common.noData')" />
        </ElTabPane>

        <!-- Template Market Tab -->
        <ElTabPane :label="$t('page.extend.templateConfig.templateMarket')" name="templateMarket">
          <ElRow :gutter="20">
            <ElCol
              v-for="template in templateMarket"
              :key="template.id"
              :xs="12"
              :sm="8"
              :md="6"
              :lg="4"
              class="mb-16px"
            >
              <div
                class="template-card h-full flex flex-col overflow-hidden rounded-8px bg-white shadow-sm dark:bg-dark"
              >
                <div class="template-card-image">
                  <ElImage :src="template.sImg" fit="cover" class="h-150px w-full" />
                </div>
                <div class="template-card-content flex-1 p-12px">
                  <h4 class="mb-8px text-16px font-medium">{{ template.name }}</h4>
                  <!-- <p class="mb-8px text-12px text-gray-500">
                    <strong>{{ $t('page.extend.templateConfig.author') }}:</strong>
                    {{ template.author }}
                  </p> -->
                  <!-- <p class="mb-8px text-12px">
                    <strong>{{ $t('page.extend.templateConfig.version') }}:</strong>
                    <ElTag v-for="version in template.version" :key="version" type="info" size="small" class="mr-4px">
                      {{ version }}
                    </ElTag>
                  </p>
                  <p class="mb-8px text-12px">
                    <strong>{{ $t('page.extend.templateConfig.introduction') }}:</strong>
                    {{ template.comment }}
                  </p>
                  <p class="mb-12px text-12px">
                    <strong>{{ $t('page.extend.templateConfig.price') }}:</strong>
                    <span v-if="template.amount && Number(template.amount) > 0" class="text-red-500">
                      ¥ {{ template.amount }}
                    </span>
                    <span v-else class="text-green-500">
                      {{ $t('page.extend.templateConfig.free') }}
                    </span>
                  </p> -->
                  <div class="mt-auto flex gap-8px pt-8px">
                    <ElButton
                      :disabled="template.installed"
                      size="small"
                      type="primary"
                      @click="handleTemplateOp(template, 'install')"
                    >
                      {{ $t('page.extend.templateConfig.install') }}
                    </ElButton>
                    <ElButton size="small" :disabled="!template.preview" @click="previewTemplate(template.preview)">
                      {{ $t('page.extend.templateConfig.preview') }}
                    </ElButton>
                  </div>
                </div>
              </div>
            </ElCol>
          </ElRow>
          <div class="mt-20px flex justify-end">
            <ElPagination
              v-if="pagination.total"
              layout="total,prev,pager,next,sizes"
              :total="pagination.total"
              :current-page="pagination.current"
              :page-size="pagination.size"
              @current-change="
                page => {
                  pagination.current = page;
                  getTemplateMarket();
                }
              "
              @size-change="
                size => {
                  pagination.size = size;
                  pagination.current = 1;
                  getTemplateMarket();
                }
              "
            />
          </div>
        </ElTabPane>

        <!-- Upload Template Tab -->
        <ElTabPane :label="$t('page.extend.templateConfig.uploadTemplate')" name="uploadTemplate">
          <ElRow>
            <ElCol :span="24">
              <ElUpload
                class="upload-demo"
                action="/manage/template/uploadCMSTemplate"
                :headers="{ Authorization: `Bearer ${token.value}` }"
                :on-success="handleUploadSuccess"
                :on-error="handleUploadError"
                :before-upload="beforeUpload"
                :file-list="uploadFileList"
                multiple
                :limit="1"
                accept=".zip"
              >
                <ElButton size="default" type="primary" :icon="UploadFilled">
                  {{ $t('common.upload') }}
                </ElButton>
                <template #tip>
                  <div class="el-upload__tip">
                    {{ $t('page.extend.templateConfig.form.limitFileType') }},
                    {{ $t('page.extend.templateConfig.form.limitFileSize') }}
                  </div>
                </template>
              </ElUpload>
            </ElCol>
          </ElRow>

          <hr class="my-20px border-t border-gray-200 dark:border-gray-700" />

          <ElRow>
            <ElCol :span="24">
              <ElButton
                link
                type="primary"
                href="http://cdn.html-js.cn/cms/sql-templates/2.1.7/tempdemo.zip"
                rel="noopener noreferrer"
                target="_blank"
              >
                <template #icon>
                  <Download />
                </template>
                {{ $t('page.extend.templateConfig.downloadExample') }}
              </ElButton>
            </ElCol>
          </ElRow>
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <!-- Template Payment Modal -->
    <TemplateCostModal v-model:visible="paymentModalVisible" :payment-data="paymentModalData" @success="refreshData" />
  </div>
</template>

<style lang="scss" scoped>
.template-config {
  .template-tabs {
    width: 100%;
  }

  .current-theme {
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding-bottom: 20px;
  }

  .theme-info-content {
    ul {
      margin: 0;
    }
  }

  .template-card {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
  }
}
</style>
