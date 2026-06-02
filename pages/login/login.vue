<template>
  <view class="login-page">
    <!-- 顶部标题 -->
    <view class="header">
      <view class="main-title">欢迎来到企业出海资讯平台</view>
      <view class="sub-title">你的实时新闻助手</view>
    </view>

    <!-- 登录表单 -->
    <view class="form-box">
      <view class="input-item">
        <input v-model="form.account" placeholder="请输入账号/手机号" type="text" />
      </view>

      <view class="input-item password-row">
        <input 
          v-model="form.password" 
          placeholder="请输入密码" 
          :password="!showPassword" 
          :key="showPassword" 
          class="password-input"
        />
        <view class="eye-icon" @click="togglePasswordVisibility">
          <!-- 如果使用了 uview-ui，可以使用 u-icon -->
          <u-icon :name="showPassword ? 'eye' : 'eye-off'" size="20" color="#999"></u-icon>
          
          <!-- 如果没有 u-icon 或想简单实现，可以用文字或图片替代，这里用 unicode 字符示意 -->
          <!-- <text class="icon-text">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</text> -->
        </view>
        <view class="forget-password" v-if="retry < 3" @click="goRegister">忘记密码？</view>
      </view>

      <button class="login-btn" @click="handleLogin" :disabled="loading">
        <text v-if="!loading">登录</text>
        <text v-else>登录中...</text>
      </button>

      <view class="link-row">
        <view class="link" @click="goRegister">没有账号？去注册</view>
      </view>
    </view>
  </view>
</template>

<script src="./login.js"></script>
<style src="./login.scss" lang="scss" scoped></style>