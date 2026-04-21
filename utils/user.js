/**
 * 获取当前登录用户信息
 * @returns {Object|null} 用户信息对象，未登录返回 null
 */
export function getUserInfo() {
  try {
    const userInfoStr = uni.getStorageSync('userInfo');
    if (userInfoStr) {
      return JSON.parse(userInfoStr);
    }
  } catch (e) {
    console.error('解析用户信息失败', e);
  }
  return null;
}

/**
 * 清除登录状态
 */
export function clearLoginStatus() {
  uni.removeStorageSync('token');
  uni.removeStorageSync('userInfo');
}