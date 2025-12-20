<template>
  <div class="page-container join-comments">
    <PageHeader :title="$t('user.center.joinComments')" />

    <div class="page-box-content">
      <!-- Empty state -->
      <div v-if="!myJoinTopicsList.length" class="no-contents">
        <el-empty :description="$t('user.center.noJoinComment')">
          <template #image>
            <el-icon class="empty-icon"><MessageBox /></el-icon>
          </template>
        </el-empty>
      </div>

      <!-- Comments list -->
      <div v-else class="my-join-topics-list">
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in myJoinTopicsList"
            :key="index"
            :timestamp="item.createdAt"
            placement="top"
          >
            <div class="comment-item">
              <div class="comment-header">
                <a :href="CONTENT_BASE_URL + '/user/' + userInfo.userId" class="user-name" target="_blank">
                  {{ userInfo.userName }}
                </a>
                <span class="comment-on">{{ $t('user.center.commentOn') }}</span>
                <a :href="CONTENT_BASE_URL + item.contentId.url" class="content-title" target="_blank">
                  {{ item.contentId.title }}
                </a>
              </div>
              <div class="comment-content">
                {{ item.content }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- Pagination -->
      <div class="pagination-container" v-if="myJoinTopicsList.length">
        <el-pagination
          v-model:currentPage="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { getUserComments } from '@/api/content';
import { CircleCloseFilled, MessageBox } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';

const userStore = useUserStore();
const userInfo = ref(userStore.userInfo);

const myJoinTopicsList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const CONTENT_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const fetchJoinTopics = async (page = 1) => {
  try {
    const params = {
      userId: userInfo.value.id,
      listState: 'all',
      current: page,
      pageSize: pageSize.value,
    };
    const res = await getUserComments(params);
    myJoinTopicsList.value = res.data.docs;
    total.value = res.data?.pageInfo?.totalItems;
  } catch (error) {
    console.error('Failed to fetch join topics:', error);
  }
};

const handlePageChange = page => {
  currentPage.value = page;
  fetchJoinTopics(page);
};

const handleSizeChange = size => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchJoinTopics(1);
};

onMounted(() => {
  fetchJoinTopics();
});
</script>

<style lang="scss" scoped>
.join-comments {
  // padding: 20px;

  .no-contents {
    padding: 40px 0;
  }

  .my-join-topics-list {
    max-width: 1200px;
    margin: 0 auto;

    .comment-item {
      padding: 16px;
      background-color: var(--el-bg-color);
      border-radius: 4px;
      margin-bottom: 16px;
      box-shadow: var(--el-box-shadow-light);
    }

    .comment-header {
      margin-bottom: 12px;

      .user-name {
        font-weight: 500;
        color: var(--el-color-primary);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      .comment-on {
        margin: 0 5px;
        color: var(--el-text-color-secondary);
      }

      .content-title {
        color: var(--el-color-primary);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .comment-content {
      color: var(--el-text-color-regular);
      line-height: 1.5;
    }
  }

  .pagination-container {
    margin-top: 24px;
    text-align: center;
  }
}

.no-contents {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-icon {
  font-size: 30px;
  color: #909399;
}
</style>
