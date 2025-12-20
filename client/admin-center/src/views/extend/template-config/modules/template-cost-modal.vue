<script setup lang="ts">
import { ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { CircleCheck, Loading } from '@element-plus/icons-vue';
import { checkPaymentStatus, createPaymentInvoice } from '@/service/api/template-config';
import { TOKEN_KEY } from '@/store/modules/auth/shared';
import { $t } from '@/locales';

defineOptions({ name: 'TemplateCostModal' });

const token = useStorage(TOKEN_KEY, '');

interface Props {
  paymentData: {
    templateItem: Api.PluginManage.TemplateMarketItem | null;
    qrCode: string;
    noInvoice: string;
    checkPaymentTask: number;
  };
}

const props = defineProps<Props>();

interface Emits {
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const loading = ref(false);
const qrCodeUrl = ref('');
const checkIntervalId = ref(0);

async function initPayment() {
  if (!props.paymentData.templateItem) {
    closeModal();
    return;
  }

  loading.value = true;
  try {
    const response = await createPaymentInvoice({
      tempId: props.paymentData.templateItem.id,
      singleUserToken: token.value,
    });

    // Handle the response assuming it's in the format { data: { qrCode, noInvoice } }
    const qrCode = response.data?.qrCode;
    const noInvoice = response.data?.noInvoice;

    if (qrCode) {
      qrCodeUrl.value = `/api/createQRCode?text=${encodeURIComponent(qrCode)}`;

      // Start checking payment status
      if (checkIntervalId.value) clearInterval(checkIntervalId.value);

      checkIntervalId.value = window.setInterval(() => {
        checkPayment(noInvoice || '', props.paymentData.templateItem?.id || '');
      }, 5000);
    }
  } catch (error) {
    console.error('Failed to create payment:', error);
    window.$message?.error('Failed to create payment QR code');
  } finally {
    loading.value = false;
  }
}

async function checkPayment(noInvoice: string, itemId: string) {
  try {
    const response = await checkPaymentStatus({
      noInvoice,
      singleUserToken: token.value,
      itemId,
    });

    // Handle the response assuming it's in the format { data: { checkState } }
    const checkState = response.data?.checkState;

    if (checkState) {
      clearInterval(checkIntervalId.value);
      closeModal();
      window.$message?.success($t('page.extend.templateConfig.form.installSuccessMsg'));
      emit('success');
    }
  } catch (error) {
    console.error('Failed to check payment status:', error);
  }
}

function closeModal() {
  if (checkIntervalId.value) {
    clearInterval(checkIntervalId.value);
    checkIntervalId.value = 0;
  }
  visible.value = false;
}

watch(visible, newVal => {
  if (newVal) {
    initPayment();
  } else if (checkIntervalId.value) {
    clearInterval(checkIntervalId.value);
    checkIntervalId.value = 0;
  }
});
</script>

<script lang="ts">
export default {
  name: 'TemplateCostModal',
};
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="$t('page.extend.templateConfig.paymentTitle')"
    width="500px"
    :close-on-click-modal="false"
    :before-close="closeModal"
  >
    <template #header>
      <div class="flex items-center">
        <ElIcon class="mr-8px text-success">
          <CircleCheck />
        </ElIcon>
        <span>{{ $t('page.extend.templateConfig.paymentTitle') }}</span>
      </div>
    </template>

    <ElRow :gutter="20">
      <ElCol :xs="24" :sm="12">
        <div class="tips-content p-12px">
          {{ props.paymentData.templateItem?.buy_tips || '' }}
        </div>
      </ElCol>
      <ElCol :xs="24" :sm="12">
        <div v-if="qrCodeUrl" class="qr-code-container flex-center">
          <ElImage :src="qrCodeUrl" fit="cover" :width="180" :height="180" />
        </div>
        <div v-else-if="loading" class="qr-code-container flex-center">
          <ElIcon class="is-loading">
            <Loading />
          </ElIcon>
        </div>
      </ElCol>
    </ElRow>
  </ElDialog>
</template>

<style lang="scss" scoped>
.qr-code-container {
  min-height: 180px;
}

.tips-content {
  min-height: 180px;
  display: flex;
  align-items: center;
}
</style>
