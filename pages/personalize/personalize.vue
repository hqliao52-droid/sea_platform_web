<template>
  <view class="container">
    <!-- 头部 -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <image src="/static/icons/back.png" mode="aspectFit"></image>
      </view>
    </view>

    <!-- 标题区 -->
    <view class="title-section">
      <view class="main-title">定制化情报推送</view>
      <view class="sub-title">ⓘ 基于您的企业经营范围实时更新</view>
    </view>

    <!-- 推送规则设置卡片 -->
    <view class="card">
      <view class="card-title">
        <image src="/static/icons/rule-icon.png" mode="aspectFit"></image>
        <text>推送规则设置</text>
      </view>

      <!-- 每日消息最大推送量 -->
      <view class="form-item">
        <view class="row-container">
          <view class="label">
            每日消息最大推送量
            <text class="icon-info clickable" @click="toggleHint">ⓘ</text>
          </view>

          <view class="input-group">
            <button class="btn-minus" @click="decreaseCount">-</button>
            <view class="input-num">{{ pushCount }}</view>
            <button class="btn-plus" @click="increaseCount">+</button>
            <text class="unit">条/日</text>
          </view>
        </view>
        <view class="hint-row" v-if="showHint">
          <text class="hint-text">范围：0-24 条/日</text>
        </view>
      </view>

      <!-- 推送类别 → 这里修复了样式 + 按钮点击 -->
      <view class="form-item">
        <view class="label">推送类别
          <!-- <text class="icon-info">ⓘ</text> -->
        </view>
        <view class="tag-group">
          <view class="tag" v-for="item in selectedCategories" :key="item.id">
            {{ item.tag_name }}
            <text class="tag-close" @click="removeCategory(item.id)">×</text>
          </view>
          <view class="select-box" @click="openCategoryModal">
            <text>+ 选择类别</text>
          </view>
        </view>
      </view>

      <!-- 通知方式 -->
      <view class="form-item">
        <view class="label">通知方式
          <text class="icon-info">ⓘ</text>
        </view>
        <view class="select-box" @click="showNotifyModal = true">
          <text>{{ notifyMethod }}</text>
        </view>
      </view>

      <!-- 通知方式输入 -->
      <view class="form-item" v-if="notifyMethod === '邮箱'">
        <view class="label">对应的通知方式输入
          <text class="icon-info">ⓘ</text>
        </view>
        <input class="input-field" placeholder="请输入邮箱地址" v-model="email" />
      </view>

      <!-- 验证邮箱 -->
      <view class="form-item" v-if="notifyMethod === '邮箱'">
        <view class="label">验证邮箱
          <text class="icon-info">ⓘ</text>
        </view>
        <view class="code-group">
          <input class="input-code" placeholder="请输入验证码" v-model="verifyCode" />
          <button class="btn-code" @click="getVerifyCode">获取验证码</button>
        </view>
        <view class="hint">验证码将发送至您的邮箱</view>
      </view>

      <!-- AI 选择 -->
      <view class="form-item">
        <view class="label">AI 选择
          <text class="icon-info">ⓘ</text>
        </view>
        <view class="select-box" @click="showAiModal = true">
          <text>{{ aiModel }}</text>
        </view>
      </view>
    </view>

    <!-- 权重设置卡片 -->
    <view class="card">
      <view class="card-title">
        <text>保存定制权重（可选）</text>
      </view>
      <view class="sub-hint">调整各维度的推荐权重，AI将按权重个性化推荐</view>

      <view class="slider-group">
        <view class="slider-item" v-for="(item, index) in weightList" :key="index">
          <view class="slider-header">
            <view class="slider-title">
              <image :src="item.icon" mode="aspectFit"></image>
              <text>{{ item.name }}</text>
            </view>
            <text class="slider-value">{{ item.value }}%</text>
          </view>
          <slider class="custom-slider" :value="item.value" @change="handleSliderChange($event, index)" :activeColor="item.color" backgroundColor="#eee" />
        </view>
      </view>

      <view class="reset-btn" @click="resetWeight">
        <image src="/static/icons/reset.png" mode="aspectFit"></image>
        <text>重置为默认权重</text>
      </view>
    </view>

    <!-- 推送预览 -->
    <view class="preview-card">
      <view class="preview-title">
        <image src="/static/icons/preview.png" mode="aspectFit"></image>
        <text>推送预览</text>
      </view>
      <view class="preview-sub">基于当前设置，预计将推送以下内容（示例）</view>
      <view class="preview-tags">
        <view class="preview-tag" v-for="(tag, index) in previewTags" :key="index">
          # {{ tag }}
        </view>
        <view class="preview-tag more">...</view>
      </view>
      <view class="view-example" @click="viewExample">查看示例 ></view>
    </view>

    <!-- 温馨提示 -->
    <view class="tip-card">
      <image src="/static/icons/tip.png" mode="aspectFit"></image>
      <view class="tip-text">
        <text class="tip-title">温馨提示</text>
        <text class="tip-content">您可随时在个人中心修改推送设置，我们将持续优化推送质量。</text>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-btn" @click="saveSettings">保存定制权重</view>

        <!-- 类别选择弹窗 -->
    <view class="category-picker-mask" v-if="showCategoryPicker" @click="closeCategoryPicker">
      <view class="category-picker-container" @click.stop>
        <!-- 1. 头部固定区 -->
        <view class="picker-header">
          <text class="cancel" @click="closeCategoryPicker">取消</text>
          <text class="title">选择推送类别</text>
          <text class="confirm" @click="confirmCategorySelect">确定</text>
        </view>
        <!-- 2. 内容滚动区 (添加 scroll-view 或设置 overflow) -->
        <scroll-view scroll-y class="category-list-scroll">
          <view class="category-list-inner">
            <view 
              class="category-item" 
              v-for="cat in categoryOptions" 
              :key="cat.id"
              @click="toggleTempCategory(cat)"
            >
              <!-- 使用之前修复的判断方法 -->
              <checkbox :checked="isCategorySelected(cat.id)" color="#4080ff" />
              <text>{{ cat.tag_name }} - <text style="font-size: 20rpx;color: #ccc;">{{ cat.example }}</text></text>
            </view>
          </view>
        </scroll-view>

      </view>
    </view>
  </view>
</template>

<script src="./personalize.js"></script>
<style lang="scss" scoped src="./personalize.scss"></style>