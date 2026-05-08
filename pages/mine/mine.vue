<template>
  <view class="container">
    <!-- 企业信息卡片 -->
    <view class="company-card">
      <view class="company-header">
        <view class="avatar" @click="previewAvatar">
          <image v-bind:src="avatar" mode="aspectFill"></image>
          <view class="status-dot"></view>
        </view>
        <view class="company-info">
          <view class="company-name">{{nikeName }}</view>
          <view class="company-level">
            <text>⟐</text> 高级企业账户 (Pro)
          </view>
        </view>
      </view>
      <view class="stats-row">
        <view class="stat-item" v-for="stat in statsList" :key="stat.label">
          <view class="stat-value">{{ stat.value }}</view>
          <view class="stat-label">{{ stat.label }}</view>
        </view>
      </view>
      <view class="renew-bar">
        <view class="renew-tip">续费提醒: 2024.12.31 到期</view>
        <view class="renew-btn">立即续费</view>
      </view>
    </view>

    <!-- 订阅与推送设置 -->
    <view class="section">
      <view class="section-title">
        <view class="title-icon">⚙</view>
        订阅与推送设置
      </view>
      <view class="setting-card">
        <view class="setting-item">
          <view class="item-left">
            <view class="item-icon">🔔</view>
            <view class="item-info">
              <view class="item-title">实时推送服务</view>
              <view class="item-desc">聚合最新出海资讯即时提醒</view>
            </view>
          </view>
          <view class="switch-btn"></view>
        </view>
        <view class="divider"></view>
        <view class="setting-item">
          <view class="item-left">
            <view class="item-icon">↗</view>
            <view class="item-info">
              <view class="item-title">每日推送频率</view>
              <view class="item-desc">当前设定: 每天 2 次</view>
            </view>
          </view>
        </view>
        <view class="slider-area">
          <view class="slider">
            <view class="slider-track"></view>
            <view class="slider-thumb"></view>
          </view>
          <view class="slider-labels">
            <text>低频</text>
            <text>高频</text>
          </view>
        </view>
      </view>
    </view>

    <!-- AI个性化推送规则 -->
    <view class="section">
      <view class="section-title">
        <view class="title-icon">↝</view>
        AI 个性化推送规则
      </view>
      <view class="ai-rule-card">
        <view class="tag-row">
          <view class="tag" v-for="tag in ruleTags" :key="tag">{{ tag }}</view>
          <view class="add-tag">+ 添加领域</view>
        </view>
        <view class="rule-summary">
          <text class="summary-title">AI 策略摘要：</text>
          系统已为您配置基于“中东制造”与“拉美清关”的高优先级过滤规则。每日 09:00 将同步全球汇率波动影响分析。
        </view>
        <view class="edit-btn">修改推送权重</view>
      </view>
    </view>

    <!-- 推送历史与导出 -->
    <view class="section">
      <view class="section-header">
        <view class="section-title">
          <view class="title-icon">⏱</view>
          推送历史与导出
        </view>
        <view class="view-all">查看全部</view>
      </view>
      <view class="history-card">
        <view class="history-header">
          <text>日期</text>
          <text>文章数</text>
          <text>质量</text>
          <text>操作</text>
        </view>
        <view class="history-row" v-for="row in historyList" :key="row.date">
          <text>{{ row.date }}</text>
          <text>{{ row.articles }} 篇</text>
          <text>{{ row.quality }}</text>
          <view class="action-btns">
            <view class="action-btn">⤓</view>
            <view class="action-btn">⟳</view>
          </view>
        </view>
        <view class="export-btn">
          <view class="export-icon">⇓</view>
          生成月度出海报告 (PDF)
        </view>
      </view>
    </view>

    <!-- 企业信息管理等设置项 -->
    <view class="menu-card">
      <view class="menu-item" v-for="item in menuList" :key="item.title">
        <view class="menu-left">
          <view class="menu-icon">{{ item.icon }}</view>
          <text>{{ item.title }}</text>
        </view>
        <view class="menu-arrow">></view>
      </view>
    </view>

    <!-- 退出账号按钮 -->
    <view class="logout-btn" @click="logout()">退出当前账号</view>

    <!-- 【新增】自定义头像预览弹窗 -->
    <view class="avatar-preview-modal" v-if="showAvatarPreview" @click="closeAvatarPreview">
      <!-- 背景遮罩 -->
      <view class="modal-mask"></view>
      
      <!-- 内容区域 -->
      <view class="modal-content" @click.stop>
        <image :src="avatar" mode="aspectFit" class="preview-image"></image>
        
        <view class="modal-actions">
          <view class="action-btn change-btn" @click="handleChangeAvatarFromPreview">
            <text class="btn-icon">📷</text>
            <text>修改头像</text>
          </view>
          <view class="action-btn close-btn" @click="closeAvatarPreview">
            <text class="btn-icon">✕</text>
            <text>关闭</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script src="./mine.js"></script>

<style src="./mine.scss" scoped lang="scss"></style>