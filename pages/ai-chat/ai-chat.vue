<template>
  <view class="chat-page">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="nav-left">
        <view class="logo"></view>
      </view>
      <view class="nav-title">AI 战略助手</view>
      <view class="nav-right">
        <view class="pro-tag">Pro 企业版</view>
      </view>
    </view>

    <!-- 聊天列表区域 -->
    <scroll-view class="chat-content" scroll-y>
      <!-- 时间分隔线 -->
      <view class="time-divider">今天 10:00</view>

      <!-- 聊天消息列表 -->
      <view v-for="(msg, index) in messageList" :key="index" class="message-item" :class="{ 'user-msg': msg.type === 'user', 'ai-msg': msg.type === 'ai' }">
        <!-- AI头像 -->
        <view v-if="msg.type === 'ai'" class="avatar ai-avatar">
          <image src="/static/ai-avatar.png" mode="aspectFill"></image>
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
          <image src="/static/user-avatar.png" mode="aspectFill"></image>
        </view>
      </view>

      <!-- 常用查询标签 -->
      <view class="quick-query">
        <view class="query-title">常用查询</view>
        <view class="query-tags">
          <view v-for="tag in quickTags" :key="tag" class="tag">{{ tag }}</view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入区域 -->
    <view class="input-area">
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
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 聊天消息列表
      messageList: [
        {
          type: 'ai',
          content: '您好！我是您的出海战略助手。我已经整合了今日最新的东南亚市场资讯，您可以针对特定国家、行业或合规政策向我提问。',
          time: '10:00 AM'
        },
        {
          type: 'user',
          content: '我想了解目前印尼对于跨境电商化妆品准入的最新政策有哪些变化?',
          time: '10:02 AM'
        },
        {
          type: 'ai',
          content: '根据最近的监管动态，印尼 BPOM (国家食品药品监督管理局)更新了进口许可证的要求。主要涉及 Halal 认证的强制性执行节点提前。',
          time: '10:03 AM',
          suggestions: [
            '重点关注东南亚电商合规性认证（如 SNI）',
            '利用当地斋月节点进行社交媒体本土化投放',
            '建立与当地第三方支付平台（如 ShopeePay）的深度合作'
          ],
          sources: [
            { name: '2024印尼贸易部进口限制命令' },
            { name: '东南亚美妆市场准入合规手册' }
          ]
        }
      ],
      // 常用查询标签
      quickTags: [
        '越南清关流程',
        '最新关税政策',
        '竞品动态分析'
      ]
    };
  }
};
</script>

<style scoped lang="scss">
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #ffffff;

  /* 顶部导航栏 */
  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 120rpx;
    padding: 0 30rpx;
    border-bottom: 1rpx solid #eee;

    .nav-left {
      .logo {
        width: 60rpx;
        height: 60rpx;
        background-color: #000;
        border-radius: 12rpx;
      }
    }

    .nav-title {
      font-size: 34rpx;
      font-weight: 500;
    }

    .nav-right {
      .pro-tag {
        font-size: 26rpx;
        color: #007aff;
        background-color: #e8f4ff;
        padding: 8rpx 16rpx;
        border-radius: 20rpx;
      }
    }
  }

  /* 聊天内容区 */
  .chat-content {
    flex: 1;
    padding: 20rpx 30rpx;
    box-sizing: border-box;

    .time-divider {
      text-align: center;
      font-size: 26rpx;
      color: #999;
      margin: 20rpx 0;
      background-color: #f5f7fa;
      display: inline-block;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
      position: relative;
      left: 50%;
      transform: translateX(-50%);
    }

    .message-item {
      display: flex;
      margin-bottom: 30rpx;

      &.ai-msg {
        .bubble-wrapper {
          margin-left: 20rpx;
        }
        .bubble {
          background-color: #f5f7fa;
          border-radius: 0 20rpx 20rpx 20rpx;
        }
      }

      &.user-msg {
        flex-direction: row-reverse;

        .bubble-wrapper {
          margin-right: 20rpx;
          align-items: flex-end;
        }

        .bubble {
          background-color: #007aff;
          color: #fff;
          border-radius: 20rpx 0 20rpx 20rpx;
        }

        .msg-time {
          text-align: right;
        }
      }

      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;

        image {
          width: 100%;
          height: 100%;
        }
      }

      .bubble-wrapper {
        display: flex;
        flex-direction: column;
        max-width: 70%;

        .bubble {
          padding: 24rpx;
          font-size: 28rpx;
          line-height: 1.6;

          .suggestions {
            margin-top: 20rpx;

            .suggest-title {
              font-size: 28rpx;
              font-weight: 500;
              margin-bottom: 10rpx;
              display: flex;
              align-items: center;

              &::before {
                content: '';
                display: inline-block;
                width: 6rpx;
                height: 28rpx;
                background-color: #007aff;
                margin-right: 10rpx;
              }
            }

            .suggest-list {
              .suggest-item {
                font-size: 26rpx;
                line-height: 1.6;
                margin: 6rpx 0;
              }
            }
          }

          .sources {
            margin-top: 20rpx;

            .source-title {
              font-size: 26rpx;
              color: #666;
              margin-bottom: 12rpx;
            }

            .source-item {
              display: flex;
              align-items: center;
              background-color: #f0f2f5;
              border-radius: 12rpx;
              padding: 16rpx;
              margin-bottom: 10rpx;

              image {
                width: 36rpx;
                height: 36rpx;
                margin-right: 16rpx;
              }

              .source-name {
                flex: 1;
                font-size: 28rpx;
              }

              .link-icon {
                width: 30rpx;
                height: 30rpx;
              }
            }
          }
        }

        .msg-action {
          display: flex;
          margin-top: 10rpx;

          .action-btn {
            display: flex;
            align-items: center;
            margin-right: 30rpx;
            font-size: 24rpx;
            color: #666;

            image {
              width: 26rpx;
              height: 26rpx;
              margin-right: 6rpx;
            }
          }
        }

        .msg-time {
          font-size: 24rpx;
          color: #999;
          margin-top: 6rpx;
        }
      }
    }

    /* 常用查询 */
    .quick-query {
      margin-top: 40rpx;

      .query-title {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 20rpx;
      }

      .query-tags {
        display: flex;
        flex-wrap: wrap;

        .tag {
          font-size: 26rpx;
          padding: 12rpx 24rpx;
          background-color: #f5f7fa;
          border-radius: 30rpx;
          margin-right: 16rpx;
          margin-bottom: 16rpx;
        }
      }
    }
  }

  /* 底部输入区域 */
  .input-area {
    padding: 20rpx 30rpx;
    border-top: 1rpx solid #eee;
    background-color: #fff;

    .input-tools {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;

      .tool-item {
        width: 40rpx;
        height: 40rpx;
        margin-right: 30rpx;

        image {
          width: 100%;
          height: 100%;
        }
      }

      .upload-tip {
        font-size: 24rpx;
        color: #999;
        margin-left: auto;
      }
    }

    .input-box {
      display: flex;
      align-items: center;
      background-color: #f5f7fa;
      border-radius: 40rpx;
      padding: 0 24rpx;

      .input {
        flex: 1;
        height: 80rpx;
        font-size: 28rpx;
      }

      .send-btn {
        width: 60rpx;
        height: 60rpx;
        background-color: #007aff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        image {
          width: 30rpx;
          height: 30rpx;
        }
      }
    }

    .disclaimer {
      text-align: center;
      font-size: 22rpx;
      color: #999;
      margin-top: 10rpx;
    }
  }
}
</style>