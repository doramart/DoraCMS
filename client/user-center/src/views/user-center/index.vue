<template>
  <div class="user-center-container">
    <DashboardHeader />
    
    <StatCards />

    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <div class="left-column">
          <RecentActivity />
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <div class="right-column">
          <QuickActions />
          <div class="spacer"></div>
          <AnnouncementList />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import DashboardHeader from './components/DashboardHeader.vue';
import StatCards from './components/StatCards.vue';
import QuickActions from './components/QuickActions.vue';
import RecentActivity from './components/RecentActivity.vue';
import AnnouncementList from './components/AnnouncementList.vue';
</script>

<style lang="scss" scoped>
.user-center-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 24px;
}

.left-column, .right-column {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.spacer {
  height: 24px;
}

@media screen and (max-width: 992px) {
  .right-column {
    margin-top: 24px;
  }
}
</style>
