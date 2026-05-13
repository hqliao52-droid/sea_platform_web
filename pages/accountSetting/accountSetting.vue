<template>
  <view class="account-setting-container">
    <!-- 可直接编辑区域 -->
    <view class="section">
      <!-- 头像 -->
      <view class="form-item avatar-item">
        <view class="label">头像</view>
        
        <!-- 头像展示区域：居中布局 -->
        <view class="avatar-display-area">
          <!-- 点击头像本身：放大预览 -->
          <image 
            class="avatar-img" 
            :src="avatar" 
            mode="aspectFill"
            @click="previewAvatar"
          ></image>
          
          <!-- 点击文字：触发更换 -->
          <text class="change-text" @click="chooseAndUploadAvatar">点击更换</text>
        </view>
      </view>

      <!-- 昵称 -->
      <view class="form-item">
        <view class="label">昵称</view>
        <input class="input" v-model="nickname" placeholder="请输入昵称" />
      </view>

      <!-- 常驻城市 -->
      <view class="form-item">
        <view class="label">常驻城市</view>
        <input class="input" v-model="city" placeholder="请输入城市" />
      </view>
    </view>

    <!-- 需要验证码修改区域：手机号 -->
    <view class="section">
      <view class="form-item">
        <view class="label">手机号</view>
        <view class="input-row" v-if="!editPhone">
          <text class="text-content">{{ phone || '未设置' }}</text>
          <text class="edit-btn" @click="editPhone = true">修改</text>
        </view>
        <view class="input-row" v-else>
          <input class="input" v-model="phone" placeholder="请输入新手机号" />
          <text class="code-btn" @click="sendPhoneCode">发送验证码</text>
        </view>

        <!-- 验证码输入框（修改手机号时显示） -->
        <view class="code-row" v-if="editPhone">
          <input class="code-input" v-model="phoneCode" placeholder="请输入4位验证码" maxlength="4" @input="handlePhoneCodeInput" />
          <view class="verify-status">
            <text v-if="phoneCodeStatus === 'loading'" class="status-loading">验证中...</text>
            <text v-else-if="phoneCodeStatus === 'success'" class="status-success">✓</text>
            <text v-else-if="phoneCodeStatus === 'error'" class="status-error">✗</text>
          </view>
        </view>
      </view>

      <!-- 需要验证码修改区域：邮箱 -->
      <view class="form-item">
        <view class="label">邮箱</view>
        <view class="input-row" v-if="!editEmail">
          <text class="text-content">{{ email || '未设置' }}</text>
          <text class="edit-btn" @click="editEmail = true">修改</text>
        </view>
        <view class="input-row" v-else>
          <input class="input" v-model="email" placeholder="请输入新邮箱" />
          <text class="code-btn" @click="sendEmailCode">发送验证码</text>
        </view>

        <!-- 验证码输入框（修改邮箱时显示） -->
        <view class="code-row" v-if="editEmail">
          <input class="code-input" v-model="emailCode" placeholder="请输入4位验证码" maxlength="4" @input="handleEmailCodeInput" />
          <view class="verify-status">
            <text v-if="emailCodeStatus === 'loading'" class="status-loading">验证中...</text>
            <text v-else-if="emailCodeStatus === 'success'" class="status-success">✓</text>
            <text v-else-if="emailCodeStatus === 'error'" class="status-error">✗</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 只读展示区域 —— 改成单行、灰色底纹 -->
     <view class="section">
      <!-- 1. 普通行：登录账号 -->
      <view class="readonly-item">
        <text class="readonly-label">登录账号：</text>
        <!-- 普通文本直接放在 readonly-value 中 -->
        <text class="readonly-value plain-text">{{ username }}</text>
      </view>

      <!-- 2. 特殊行：账号状态（带颜色和按钮） -->
      <view class="readonly-item">
        <text class="readonly-label">账号状态：</text>
        <!-- 【关键修改】这里必须加上 class="readonly-value" 才能匹配 SCSS -->
        <view class="readonly-value status-wrapper">
          <view class="status-value-wrapper">
            <text class="status-value" :class="statusClass">{{ statusText }}</text>
            <!-- 非正常状态显示申诉按钮 -->
            <text v-if="status !== 1" class="appeal-btn" @click="goAccountAppeal">账号申诉</text>
          </view>
        </view>
      </view>

      <!-- 3. 普通行：注册时间 -->
      <view class="readonly-item">
        <text class="readonly-label">注册时间：</text>
        <text class="readonly-value plain-text">{{ created_time }}</text>
      </view>
      
      <!-- 4. 普通行：最后登录时间 -->
      <view class="readonly-item">
        <text class="readonly-label">最后登录时间：</text>
        <text class="readonly-value plain-text">{{ last_login_time || '从未登录' }}</text>
      </view>

      <!-- 5. 普通行：上次修改时间 -->
      <view class="readonly-item">
        <text class="readonly-label">上次修改时间：</text>
        <text class="readonly-value plain-text">{{ updated_time }}</text>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-btn-wrapper">
      <button class="save-btn" @click="saveUserInfo">保存修改</button>
    </view>
  </view>
</template>

<script src="./accountSetting.js"></script>
<style lang="scss" scoped src="./accountSetting.scss"></style>