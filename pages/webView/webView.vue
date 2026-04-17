<template>
  <view class="container">
    <!-- web-view 组件会自动铺满屏幕 -->
    <web-view :src="pageUrl"></web-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      pageUrl: ''
    };
  },
  onLoad(options) {
    // 接收传递过来的 url 参数
    if (options.url) {
      this.pageUrl = decodeURIComponent(options.url);
    } else {
      uni.showToast({ title: '链接无效', icon: 'none' });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  }
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100vh;
}
</style>