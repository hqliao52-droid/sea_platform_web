<template>
  <view class="container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="nav-back" @click="goBack">
        <image src="/static/back.png" mode="aspectFit"></image>
      </view>
      <view class="nav-title">深度分析详情</view>
      <view class="nav-share">
        <image src="/static/share.png" mode="aspectFit"></image>
      </view>
    </view>

    <!-- AI核心摘要模块 -->
    <view class="card summary-card">
      <view class="summary-header">
        <image class="summary-icon" src="/static/ai-icon.png" mode="aspectFit"></image>
        <text class="summary-title">AI 核心摘要</text>
      </view>
      <view class="summary-list">
        <view v-for="(item, index) in aiSummaryList" :key="index" class="summary-item">
          <view class="check-icon"></view>
          <text class="summary-text" :class="{ highlight: index === 0 }">{{ item }}</text>
        </view>
      </view>
      <!-- 风险提示 -->
      <view class="risk-tip" v-if="risk === true">
        <view class="risk-header">
          <image src="/static/warning.png" mode="aspectFit"></image>
          <text class="risk-title">风险提示</text>
        </view>
        <text class="risk-text"><span style="font-weight: bold;">市场/运营风险：</span>{{market_risk}}</text><br>
        <text class="risk-text"><span style="font-weight: bold;">政策/合规要点：</span>{{policy_compliance}}</text>
      </view>
    </view>

    <!-- 文章标题和来源 -->
    <view class="article-section">
      <view class="article-title">{{news_title}}</view>
      <view class="article-meta">
        <image src="/static/book.png" mode="aspectFit"></image>
        <text class="meta-text">{{ rss_name }}</text>
        <text class="meta-text">约 {{content.length}} 字</text>
      </view>
      <view class="article-desc">
        <text>{{ processedContent }}</text>
        <text 
          v-if="!isContentExpanded && content.length > 50" 
          class="show-more-link" 
          @click="toggleContent"
        >显示全文</text>
      </view>
      <view class="tag-list">
        <text v-for="(tag, index) in articleTags" :key="index" class="tag-item">#{{ tag }}</text>
      </view>
    </view>

    <!-- AI提取关键词 -->
    <view class="keyword-section">
      <view class="keyword-header">
        <image src="/static/key.png" mode="aspectFit"></image>
        <text class="keyword-title">AI 提取关键词</text>
      </view>
      <view class="keyword-list">
        <view v-for="(item, index) in keywordList" :key="index" class="keyword-item">{{ item }}</view>
      </view>
    </view>

    <!-- 关联政策与案例 -->
    <view class="relation-section">
      <view class="relation-header">
        <view class="left">
          <image src="/static/check.png" mode="aspectFit"></image>
          <text class="relation-title">关联政策与案例</text>
        </view>
        <view class="right" @click="viewAll">
          <text class="view-all">查看全部 →</text>
        </view>
      </view>
      <view class="relation-list">
        <view v-for="(item, index) in relationList" :key="index" class="relation-item">
          <view class="item-header">
            <text class="item-type">{{ item.type }}</text>
            <text class="item-rate">关联度 {{ item.rate }}%</text>
          </view>
          <view class="item-title">{{ item.title }}</view>
          <view class="item-desc">{{ item.desc }}</view>
        </view>
      </view>
    </view>

    <!-- 合规雷达推送
    <view class="radar-card">
      <view class="radar-header">
        <view class="radar-icon"></view>
        <view class="radar-info">
          <text class="radar-title">合规雷达推送已开启</text>
          <text class="radar-desc">系统将实时监测印尼电商政策的二阶段细则，并为您精准推送。</text>
        </view>
      </view>
      <view class="radar-setting" @click="openSetting">
        <text>配置推送规则</text>
      </view>
    </view> -->

    <!-- 底部输入框 -->
    <view class="bottom-bar">
      <view class="input-area">
        <view class="avatar">
          <image src="/static/avatar.png" mode="aspectFill"></image>
        </view>
        <view class="input-box">
          <input 
            type="text" 
            v-model="inputValue"
            placeholder="针对此文章询问 AI ..." 
            confirm-type="send"
            @confirm="sendQuestion" 
          />
          <view class="send-btn">
            <image src="/static/send.png" mode="aspectFit"></image>
          </view>
        </view>
      </view>
      <view class="hint-text clickable" @click="fillInputFromHint">
        <text class="hint-prefix">↳ 尝试问：“这篇文章对 </text>
        
        <!-- 关键词滚动容器 -->
        <view class="keyword-roller">
          <text :key="dynamicHintKeyword" class="rolling-keyword animate-slide-up">
            {{ dynamicHintKeyword }}
          </text>
        </view>
        
        <text class="hint-suffix"> 有什么具体影响？”</text>
      </view>
    </view>
  </view>
</template>

<script src="./news_detail.js"></script>

<style src="./news_detail.scss" scoped lang="scss"></style>