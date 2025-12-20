<template>
  <div class="page-container my-articles-container">
    <PageHeader :title="$t('user.center.myDocument')">
      <el-button type="primary" @click="createArticle" class="create-btn">
        {{ $t('content.action.addContent') }}
      </el-button>
    </PageHeader>
    <div class="page-box-content">
      <div class="article-list">
        <base-table
          :data="articleList"
          :total="total"
          :show-pagination="true"
          :default-page-size="10"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
          border
          stripe
          style="width: 100%"
          :empty-text="$t('user.center.noDocument')"
        >
          <!-- Article title with state -->
          <el-table-column prop="title" show-overflow-tooltip :label="$t('content.title')" min-width="200">
            <template #default="scope">
              <div class="article-title">
                <div class="content-state" style="display: inline-block; margin-right: 8px; vertical-align: middle">
                  <el-tag v-if="scope.row.state === '0'" type="info" size="small">
                    <a v-if="scope.row.state === '0'" target="_blank" :href="`/users/editContent/${scope.row.id}`">{{
                      $t('content.state.draft')
                    }}</a>
                    <span v-else>{{ $t('content.state.draft') }}</span>
                  </el-tag>
                  <el-tag v-else-if="scope.row.state === '1'" type="warning" size="small">
                    {{ $t('content.state.wait') }}
                  </el-tag>
                  <el-tag v-else-if="scope.row.state === '2'" type="success" size="small">
                    {{ $t('content.state.publish') }}
                  </el-tag>
                  <el-tag v-else-if="scope.row.state === '3'" type="danger" size="small">
                    {{ $t('content.state.failed') }}
                  </el-tag>
                </div>
                <a
                  v-if="scope.row.state === '2'"
                  :href="scope.row.url"
                  target="_blank"
                  style="vertical-align: middle"
                  >{{ scope.row.title }}</a
                >
                <span v-else style="vertical-align: middle">{{ scope.row.title }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- Description -->
          <el-table-column prop="description" show-overflow-tooltip :label="$t('content.description')" min-width="250">
            <template #default="scope">
              <div v-html="scope.row.discription"></div>
            </template>
          </el-table-column>

          <!-- Date -->
          <el-table-column prop="createdAt" :label="$t('content.createdAt')" width="200" sortable>
            <template #default="scope">
              <span>{{ scope.row.createdAt }}</span>
            </template>
          </el-table-column>

          <!-- Views -->
          <el-table-column prop="clickNum" :label="$t('content.views')" width="100" sortable>
            <template #default="scope">
              <span>{{ scope.row.clickNum }}</span>
            </template>
          </el-table-column>

          <!-- Comments -->
          <el-table-column prop="commentNum" :label="$t('content.comments')" width="100" sortable>
            <template #default="scope">
              <span>{{ scope.row.commentNum }}</span>
            </template>
          </el-table-column>

          <!-- Actions -->
          <el-table-column :label="$t('content.actions')" width="150" fixed="right">
            <template #default="scope">
              <el-button v-if="scope.row.state === '2'" type="primary" link @click="viewArticle(scope.row)">{{
                $t('content.view')
              }}</el-button>
              <el-button
                v-if="scope.row.state === '0' || scope.row.state === '3'"
                type="primary"
                link
                @click="editArticle(scope.row)"
                >{{ $t('content.edit') }}</el-button
              >
            </template>
          </el-table-column>
        </base-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseTable from '@/components/common/BaseTable.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { getUserContents } from '@/api/content';
import { Clock, View, ChatSquare } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();

// 文章列表数据
const articleList = ref([]);
const total = ref(0);
const loading = ref(false);
const selectedArticles = ref([]);

// 分页参数
const currentPage = ref(1);
const pageSize = ref(10);

// 排序参数
const sortBy = ref('');
const sortOrder = ref('');

// 初始化获取数据
onMounted(() => {
  fetchArticleList();
});

// 获取用户文章列表
const fetchArticleList = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      userId: getUserId(),
      listState: 'all',
    };

    // 添加排序参数
    if (sortBy.value) {
      params.sort = sortBy.value;
      params.order = sortOrder.value;
    }

    const res = await getUserContents(params);
    if (res && res.data) {
      articleList.value = res.data.docs || [];
      total.value = res.data?.pageInfo?.totalItems || 0;
    }
  } catch (error) {
    console.error('Failed to fetch article list:', error);
  } finally {
    loading.value = false;
  }
};

// 获取当前用户ID
const getUserId = () => {
  // 可以从localStorage或vuex等获取
  return userStore.userInfo?.id || '';
};

// 处理页码变化
const handlePageChange = page => {
  currentPage.value = page;
  fetchArticleList();
};

// 处理每页条数变化
const handleSizeChange = size => {
  pageSize.value = size;
  fetchArticleList();
};

// 处理选择变化
const handleSelectionChange = selection => {
  selectedArticles.value = selection;
};

// 处理排序变化
const handleSortChange = ({ prop, order }) => {
  sortBy.value = prop;
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc';
  fetchArticleList();
};

// 查看文章
const viewArticle = article => {
  if (article.url) {
    window.open(import.meta.env.VITE_API_BASE_URL + article.url, '_blank');
  }
};

// 编辑文章
const editArticle = article => {
  if (article.id) {
    router.push(`/ai-content-publish?id=${article.id}`);
  }
};

// Create new article - 使用 AI 内容发布微应用
const createArticle = () => {
  router.push('/ai-content-publish');
};
</script>

<style scoped>
.my-articles-container {
  width: 100%;
  padding: 0px;
}

.article-list {
  margin-top: 20px;
}

.article-title {
  display: flex;
  flex-direction: row;
}

.article-title a {
  color: #409eff;
  text-decoration: none;
  margin-bottom: 5px;
}

.content-state a {
  color: inherit;
  text-decoration: none;
}

.create-btn {
  float: right;
  margin-top: -5px;
}
</style>
