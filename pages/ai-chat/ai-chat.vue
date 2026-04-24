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
        <image v-if="newSessionWindowLoading === true" class="new-session" src="/static/new_session.png" mode="aspectFill"></image>
        <view v-else>加载中...</view>
      </view>
    </view>

    <!-- 聊天列表区域 -->
    <scroll-view class="chat-content" scroll-y>
      <!-- 时间分隔线 -->
      <view class="time-divider"></view>

      <!-- 聊天消息列表 -->
      <view v-for="(msg, index) in messageList" :key="index" class="message-item" :class="{ 'user-msg': msg.type === 'user', 'ai-msg': msg.type === 'ai' }">
        <!-- AI头像 -->
        <view v-if="msg.type === 'ai'" class="avatar ai-avatar">
          <image src="/static/ai-active.png" mode="aspectFill"></image>
        </view>

        <!-- 消息气泡 -->
        <view class="bubble-wrapper">
          <view class="bubble">
            <text class="bubble-text">{{ msg.content }}</text>
            <!-- AI消息里的策略建议 -->
            <view v-if="msg.type === 'ai' && msg.suggestions" class="suggestions">
              <view class="suggest-title">策略建议</view>
              <view class="suggest-list">
                <view v-for="(item, i) in msg.suggestions" :key="i" class="suggest-item">• {{ item }}</view>
              </view>
            </view>
            <!-- AI消息里的引用来源 -->
            <view v-if="msg.type === 'ai' && msg.sources" class="sources">
              <view class="source-title">引用来源</view>
              <view v-for="(source, i) in msg.sources" :key="i" class="source-item">
                <image src="/static/file-icon.png" mode="aspectFit"></image>
                <text class="source-name">{{ source.name }}</text>
                <image class="link-icon" src="/static/link.png" mode="aspectFit"></image>
              </view>
            </view>
          </view>

          <!-- 消息下方的操作栏（AI消息才有） -->
          <view v-if="msg.type === 'ai'" class="msg-action">
            <view class="action-btn">
              <image src="/static/save.png" mode="aspectFit"></image>
              <text>保存到常见问答</text>
            </view>
            <view class="action-btn">
              <image src="/static/copy.png" mode="aspectFit"></image>
              <text>复制回答</text>
            </view>
          </view>

          <!-- 消息时间 -->
          <view class="msg-time">{{ msg.time }}</view>
        </view>

        <!-- 用户头像 -->
        <view v-if="msg.type === 'user'" class="avatar user-avatar">
          <image v-bind:src="avatar" mode="aspectFill"></image>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入区域 -->
    <view class="input-area">
      <!-- 常用查询标签 -->
      <view class="quick-query">
        <view class="query-title">常用查询</view>
        <view class="query-tags">
          <view v-for="tag in quickTags" :key="tag" class="tag">{{ tag }}</view>
        </view>
      </view>
      <view class="input-tools">
        <view class="tool-item">
          <image src="/static/clip.png" mode="aspectFit"></image>
        </view>
        <view class="tool-item">
          <image src="/static/bookmark.png" mode="aspectFit"></image>
        </view>
        <view class="upload-tip">支持上传 PDF/Docx 企业文档</view>
      </view>
      <view class="input-box">
        <input type="text" placeholder="输入出海咨询问题..." class="input" />
        <view class="send-btn">
          <image src="/static/send.png" mode="aspectFit"></image>
        </view>
      </view>
      <view class="disclaimer">AI 生成内容仅供参考，请结合当地法律顾问意见。</view>
    </view>

    <!-- 侧边栏内容 -->
    <view 
      class="sidebar-container" 
      :class="{ 'sidebar-open': showSidebar }"
    >
      <!-- 蒙版 -->
      <view
        class="sidebar-mask" 
        :class="{ 'show': showSidebar }"
        @click="closeSidebar"
      >
      </view>
      
      <view class="sidebar-header">
        <view class="sidebar-close" @click="closeSidebar">
          <image class="close-btn" src="/static/close-btn.png" mode="aspectFit"></image>
        </view>
        <text class="sidebar-title">历史会话</text>
      </view>
      
      <scroll-view class="sidebar-content" scroll-y>
        <view v-if="groupedSessions.length === 0" class="empty-tip">暂无历史会话</view>
        
        <view v-for="(group, gIndex) in groupedSessions" :key="gIndex" class="date-group">
          <view class="date-label">{{ group.label }}</view>
          <view 
            v-for="(session, sIndex) in group.items" 
            :key="session.id" 
            class="session-item"
            @click="selectSession(session)"
          >
            <text class="session-topic">{{ session.session_topic || '未命名会话' }}</text>
            <text class="session-time">{{ formatTimeShort(session.update_time) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>


  </view>
</template>

<script src="./ai-chat.js"></script>

<style src="./ai-chat.scss" scoped lang="scss"></style>