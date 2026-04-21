<template>
  <view class="register-page">
    <view class="register-container">
      <!-- 顶部标题 -->
      <view class="header">
        <view class="main-title">欢迎来到企业出海资讯平台</view>
        <view class="sub-title">你的实时新闻助手</view>
      </view>

      <!-- 头像上传区域 -->
      <view class="avatar-upload" @click="chooseAvatar">
        <!-- 已上传则显示头像，未上传则显示 + 号 -->
        <image v-if="avatarUrl" :src="avatarUrl" class="avatar-img" mode="aspectFill"></image>
        <view v-else class="avatar-placeholder">
          <text class="plus">+</text>
        </view>

        <!-- 已上传头像 → 显示删除按钮 -->
          <view v-if="avatarUrl" class="avatar-delete" @click.stop="deleteAvatar">
            <text>×</text>
          </view>
      </view>

      <!-- 注册表单 -->
      <view class="form-box">
        <view class="input-item">
          <input v-model="form.account" placeholder="请输入账号/手机号" type="text" />
        </view>

        <view class="input-item">
          <input v-model="form.password" placeholder="请设置密码" password />
        </view>

        <view class="input-item">
          <input v-model="form.confirmPwd" placeholder="请确认密码" password />
        </view>

        <view class="input-item">
          <input v-model="form.nickName" placeholder="昵称" />
        </view>

        <view class="input-item">
          <input v-model="form.phone" placeholder="电话" />
        </view>

        <button class="register-btn" @click="handleRegister" :disabled="loading">
          <text v-if="!loading">注册</text>
          <text v-else>注册中...</text>
        </button>

        <view class="link-row">
          <view class="link" @click="goLogin">已有账号？返回登录</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script src="./register.js"></script>

<style src="./register.scss" scoped lang="scss"></style>