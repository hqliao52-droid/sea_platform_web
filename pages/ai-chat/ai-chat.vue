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
      <!-- <view class="time-divider">今天</view> -->

      <view v-for="(msg, index) in messageList" :key="index" class="message-item" :class="{ 'user-msg': msg.role === 'user', 'ai-msg': msg.role === 'assistant' }">
        
        <!-- AI头像 (左侧) -->
        <view v-if="msg.role === 'assistant'" class="avatar ai-avatar">
          <image src="/static/ai-active.png" mode="aspectFill"></image>
        </view>

        <!-- 消息气泡包裹层 -->
        <view class="bubble-wrapper">
          <view class="bubble" :class="{ 'user-bubble': msg.role === 'user', 'ai-bubble': msg.role === 'assistant' }">
            
            <view 
              v-if="msg.role === 'assistant' && isStreaming && index === messageList.length - 1 && !msg.content"
              class="thinking-status"
            >
              <view class="thinking-dots">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
              </view>
              <text class="status-text">{{ statusText }}</text>
            </view>
            <!-- 1. Assistant 消息：渲染 Markdown -->
            <u-parse
              v-if="msg.role === 'assistant'"
              :content="msg.renderedHtml || ''"
              :tag-style="bubbleTagStyle"
            />

            <!-- 2. User 消息：文本 + 引用折叠区 -->
            <view v-else class="user-message-container">
              <text class="bubble-text">{{ msg.content }}</text>
              
              <!-- 【新增】用户消息的引用区域 (仅当有引用文章时显示) -->
              <view v-if="msg.llm_refer_data && msg.llm_refer_data.length > 0" class="user-references">
                
                <!-- 状态 A: 折叠态 (默认) -->
                <view v-if="!msg.isReferencesExpanded" class="ref-collapsed" @click="toggleUserReference(index)">
                  <text class="ref-icon">📎</text>
                  <text class="ref-summary">参考了 {{ msg.llm_refer_data.length }} 篇文章</text>
                </view>
                
                <!-- 状态 B: 展开态 -->
                <view v-else class="ref-expanded">
                  <view class="ref-header" @click="toggleUserReference(index)">
                    <text class="ref-title">参考文章 ({{ msg.llm_refer_data.length }})</text>
                    <text class="ref-arrow expanded">︿</text>
                  </view>
                  <view class="ref-list">
                    <view v-for="(title, tIndex) in msg.llm_refer_data" :key="tIndex" class="ref-item">
                      <text class="ref-dot">•</text>
                      <text class="ref-text">{{ title }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 流式加载光标 (仅 Assistant) -->
            <text v-if="msg.role === 'assistant' && isStreaming && index === messageList.length - 1 && msg.content" class="cursor">|</text>
            <text v-else-if="msg.role === 'assistant' && isStreaming && index === messageList.length - 1 && !msg.content" class="cursor blinking">|</text>

            <!-- 策略建议 (仅 Assistant) -->
            <view v-if="msg.role === 'assistant' && msg.suggestions && msg.suggestions.length" class="suggestions">
              <view class="suggest-title">策略建议</view>
              <view class="suggest-list">
                <view v-for="(item, i) in msg.suggestions" :key="i" class="suggest-item">• {{ item }}</view>
              </view>
            </view>
            
            <!-- 引用来源 (仅 Assistant) -->
            <view v-if="msg.role === 'assistant' && msg.sources && msg.sources.length" class="sources">
              <view class="source-title">引用来源</view>
              <view v-for="(source, i) in msg.sources" :key="i" class="source-item">
                <image src="/static/file-icon.png" mode="aspectFit"></image>
                <text class="source-name">{{ source.name }}</text>
              </view>
            </view>
          </view>

          <!-- 操作栏 (仅 Assistant 且非流式) -->
          <view v-if="msg.role === 'assistant' && !isStreaming" class="msg-action">
            <view class="action-btn" @click="copyMessage(msg)">
              <image src="/static/copy.png" mode="aspectFit"></image>
            </view>
            <view class="action-btn">
              <image src="/static/again.png" mode="aspectFit"></image>
            </view>
            <view class="action-btn">
              <image src="/static/like.png" mode="aspectFit"></image>
            </view>
            <view class="action-btn">
              <image src="/static/dislike.png" mode="aspectFit"></image>
            </view>
          </view>

          <view class="msg-time">{{ msg.created_time }}</view>
        </view>

        <!-- 用户头像 (右侧) -->
        <view v-if="msg.role === 'user'" class="avatar user-avatar">
          <image :src="avatar" mode="aspectFill"></image>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入区域 -->
    <view class="input-area">
      <!-- ... 保持原有内容 ... -->
      <view class="recent-read-section" v-if="recentHistory.length > 0">
        <view class="section-header" @click="toggleHistory">
          <view class="section-title">最近阅读（已记录{{ recentHistory.length }}/4条）</view>
          <text class="toggle-icon" :class="{ 'expanded': isHistoryExpanded }">︿</text>
        </view>

        <view class="history-list-wrapper" :class="{ 'expanded': isHistoryExpanded }">
          <view class="history-list">
            <view 
              class="history-item" 
              :class="{ 'is-selected': selectedNewsIds.includes(item.id) }"
              v-for="(item, index) in recentHistory" 
              :key="item.id"
              @click="toggleNewsSelection(item)"
            >
              <text class="history-title">{{ item.title }}</text>
              
              <!-- 【新增】选中态的小红点/角标 -->
              <view v-if="selectedNewsIds.includes(item.id)" class="selected-badge">
                {{ selectedNewsIds.indexOf(item.id) + 1 }}
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <view v-if="lastDeletedText" class="deleted-backup-bar" @click="restoreDeletedText">
        <text class="backup-icon">↺</text>
        <text class="backup-text">点击恢复</text>
        <text class="backup-preview">{{ lastDeletedText.substring(0, 20) }}{{ lastDeletedText.length > 20 ? '...' : '' }}</text>
        <view class="deleted-icon-btn">
          <image src="/static/delete.png" mode="aspectFit" @click="clearInputWithbackUpBar"></image> 
        </view>
      </view>
      
      <view class="quick-query">
        <!-- <view class="query-title">上传</view> -->
        <view class="upload_files">
          <img src="/static/attach.png" alt="" style="width: 40rpx;height: 40rpx;">
        </view>
        <view class="query-tags">
          <view 
            v-for="tag in attachedFiles" 
            :key="tag.url" 
            class="tag" 
            @click="inputText = tag.filename">{{ tag.filename }}</view>
        </view>
      </view>
      <view class="input-box">

        <view class="plus-trigger" @click.stop="togglePlusMenu">
          <image src="/static/plus.png" mode="aspectFit"></image> 
          <!-- 如果没有 plus-icon.png，可以用文字 + 或者 uview 图标代替 -->
        </view>
        <view class="input-wrapper">
          <textarea 
            v-model="inputText" 
            :placeholder="selectedNewsIds.length > 0 ? '基于选中的文章进行提问...' : '请输入...'" 
            placeholder-class="textarea-placeholder"
            class="input-textarea" 
            :auto-height="true" 
            :show-confirm-bar="false"
            confirm-type="send"
            @confirm="sendMessage"
            @input="onInput"
          ></textarea>
        </view>

        <view class="input-actions">
          <!-- 删除按钮：仅当有内容且未处于发送状态时显示 -->
          <view v-if="inputText && !isStreaming" class="action-icon-btn" @click.stop="clearInputWithBackup">
            <image src="/static/delete.png" mode="aspectFit"></image> 
            <!-- 如果没有 delete.png 图标，可以用文字或 uview 图标替代 -->
          </view>
          
          <view class="send-btn" @click="sendMessage">
            <image src="/static/send.png" mode="aspectFit"></image>
          </view>
        </view>
        
        <view v-if="showPlusMenu" class="plus-menu-popover">
          <!-- 左侧：操作入口 -->
          <view class="menu-left">
            <view class="menu-item" @click="handleUploadAttachment">
              <image src="/static/attach.png" mode="aspectFit" class="menu-icon"></image>
              <text class="menu-text">上传附件</text>
            </view>
            <view class="menu-item" @click="toggleRecentFiles">
              <image src="/static/recent.png" mode="aspectFit" class="menu-icon"></image>
              <text class="menu-text">近期文件</text>
              <!-- <image src="/static/recent.png" mode="aspectFit" class="arrow-icon"></image> -->
            </view>
          </view>

          <!-- 右侧：近期文件列表 (仅当点击“近期文件”时显示，或者一直显示看需求，这里按需求描述为二级或并列) -->
          <!-- 根据描述 "用户点击+号后变为... 近期文件 -> | 文件列表"，这里做成点击“近期文件”展开右侧，或者直接展示 -->
          <!-- 为了体验更好，建议点击“近期文件”后，右侧滑出或显示列表。这里简化为：如果 recentFiles 有数据，直接显示在右侧区域，或者点击后显示 -->
          
          <view v-if="showRecentFilesList" class="menu-right">
            <view class="recent-file-header">
              <text class="rf-title">近期文件</text>
              <text class="rf-close" @click.stop="showRecentFilesList = false">×</text>
            </view>
            <scroll-view scroll-y class="recent-file-list">
              <view v-for="(file, index) in recentFiles" :key="index" class="rf-item" @click="selectRecentFile(file)">
                <image src="/static/file-doc.png" mode="aspectFit" class="rf-icon"></image>
                <text class="rf-name">{{ file.filename }}</text>
              </view>
              <view v-if="recentFiles.length === 0" class="rf-empty">暂无近期文件</view>
            </scroll-view>
          </view>
        </view>
      </view>
      <view class="disclaimer">AI 生成内容仅供参考</view>
    </view>

    <!-- 侧边栏 -->
    <view class="sidebar-container" :class="{ 'sidebar-open': showSidebar }">
      <view class="sidebar-mask" :class="{ 'show': showSidebar }" @click="closeSidebar"></view>
      <view class="sidebar-header">
        <view class="sidebar-close" @click="closeSidebar">
          <image class="close-btn" src="/static/close-btn.png" mode="aspectFit"></image>
        </view>
        <text class="sidebar-title">历史会话</text>
      </view>
      <scroll-view class="sidebar-content" scroll-y>
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