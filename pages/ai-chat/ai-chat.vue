<template>
  <view class="chat-page">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="nav-left">
        <view class="tit_liner" @click="getSessions">
          <image class="tit_liner_img" src="/static/liner.png" mode="aspectFill"></image>
        </view>
      </view>
      <view class="nav-title">AI 战略助手</view>
      <view class="nav-right" @click="newSession">
        <image v-if="newSessionWindowLoading" class="new-session" src="/static/new_session.png" mode="aspectFill"></image>
        <view v-else>加载中...</view>
      </view>
    </view>

    <!-- 聊天列表区域 -->
    <scroll-view class="chat-content" scroll-y :scroll-top="scrollTop" scroll-with-animation>
      <view class="time-divider">今天</view>

      <view v-for="(msg, index) in messageList" :key="index" class="message-item" :class="{ 'user-msg': msg.role === 'user', 'ai-msg': msg.role === 'assistant' }">
        
        <!-- AI头像 -->
        <view v-if="msg.role === 'assistant'" class="avatar ai-avatar">
          <image src="/static/ai-active.png" mode="aspectFill"></image>
        </view>

        <!-- 消息气泡 -->
        <view class="bubble-wrapper">
          <view class="bubble">
            <!-- assistant：渲染 Markdown（加粗/换行/列表）富文本 -->
            <u-parse
              v-if="msg.role === 'assistant'"
              :content="msg.renderedHtml || ''"
              :tag-style="bubbleTagStyle"
            />

            <!-- user：保持纯文本显示 -->
            <text v-else class="bubble-text">{{ msg.content }}</text>
            
            <!-- 流式加载时的光标动画 (可选) -->
            <text v-if="msg.role === 'assistant' && isStreaming && index === messageList.length - 1 && msg.content" class="cursor">|</text>
            <text v-else-if="msg.role === 'assistant' && isStreaming && index === messageList.length - 1 && !msg.content" class="cursor blinking">|</text>

            <!-- 策略建议 (流式结束后显示) -->
            <view v-if="msg.role === 'assistant' && msg.suggestions && msg.suggestions.length" class="suggestions">
              <view class="suggest-title">策略建议</view>
              <view class="suggest-list">
                <view v-for="(item, i) in msg.suggestions" :key="i" class="suggest-item">• {{ item }}</view>
              </view>
            </view>
            
            <!-- 引用来源 -->
            <view v-if="msg.role === 'assistant' && msg.sources && msg.sources.length" class="sources">
              <view class="source-title">引用来源</view>
              <view v-for="(source, i) in msg.sources" :key="i" class="source-item">
                <image src="/static/file-icon.png" mode="aspectFit"></image>
                <text class="source-name">{{ source.name }}</text>
              </view>
            </view>
          </view>

          <!-- 操作栏 -->
          <view v-if="msg.role === 'assistant' && !isStreaming" class="msg-action">
            <view class="action-btn">
              <image src="/static/save.png" mode="aspectFit"></image>
              <text>保存</text>
            </view>
            <view class="action-btn">
              <image src="/static/copy.png" mode="aspectFit"></image>
              <text>复制</text>
            </view>
          </view>

          <view class="msg-time">{{ msg.created_time }}</view>
        </view>

        <!-- 用户头像 -->
        <view v-if="msg.role === 'user'" class="avatar user-avatar">
          <image :src="avatar" mode="aspectFill"></image>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入区域 -->
    <view class="input-area">

      <view class="recent-read-section" v-if="recentHistory.length > 0">
        
        <!-- 标题栏：包含标题和切换按钮 -->
        <view class="section-header" @click="toggleHistory">
          <view class="section-title">最近阅读</view>
          <!-- 箭头图标：根据状态旋转 -->
          <text class="toggle-icon" :class="{ 'expanded': isHistoryExpanded }">﹀</text>
        </view>

        <!-- 内容区域：使用 max-height 实现动画效果 -->
        <view class="history-list-wrapper" :class="{ 'expanded': isHistoryExpanded }">
          <view class="history-list">
            <view 
              class="history-item" 
              v-for="(item, index) in recentHistory" 
              :key="item.id"
              @click="inputText = item.content"
            >
              <text class="history-title">{{ item.title }}</text>
              <text class="history-source">{{ item.rss_tag }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="quick-query">
        <view class="query-title">常用查询</view>
        <view class="query-tags">
          <view v-for="tag in quickTags" :key="tag" class="tag" @click="inputText = tag">{{ tag }}</view>
        </view>
      </view>
      
      <view class="input-box">
        <!-- 关键点：绑定 v-model -->
        <textarea 
          v-model="inputText" 
          placeholder="输入出海咨询问题..." 
          class="input-textarea" 
          :auto-height="true" 
          :show-confirm-bar="false"
          confirm-type="send"
          @confirm="sendMessage"
          @input="onInput"
        ></textarea>
        <view class="send-btn" @click="sendMessage">
          <image src="/static/send.png" mode="aspectFit"></image>
        </view>
      </view>
      <view class="disclaimer">AI 生成内容仅供参考</view>
    </view>

    <!-- 侧边栏 (保持不变) -->
    <view class="sidebar-container" :class="{ 'sidebar-open': showSidebar }">
      <view class="sidebar-mask" :class="{ 'show': showSidebar }" @click="closeSidebar"></view>
      <!-- ... 侧边栏内容 ... -->
       <view class="sidebar-header">
        <view class="sidebar-close" @click="closeSidebar">
          <image class="close-btn" src="/static/close-btn.png" mode="aspectFit"></image>
        </view>
        <text class="sidebar-title">历史会话</text>
      </view>
      <scroll-view class="sidebar-content" scroll-y>
         <!-- ... 历史会话列表 ... -->
         <view v-for="(group, gIndex) in groupedSessions" :key="gIndex" class="date-group">
          <view class="date-label">{{ group.label }}</view>
          <view v-for="(session, sIndex) in group.items" :key="session.id" class="session-item" @click="selectSession(session)">
            <text class="session-topic">{{ session.session_topic || '未命名会话' }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script src="./ai-chat.js"></script>
<style src="./ai-chat.scss" scoped lang="scss"></style>