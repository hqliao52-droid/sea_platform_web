/**
 * 获取当前登录用户信息
 * @returns {Object|null} 用户信息对象，未登录返回 null
 */
export function getUserInfo() {
  try {
    const userInfo = uni.getStorageSync('userInfo');
    if (userInfo && typeof userInfo === 'object') {
      return userInfo;
    }
    console.log('用户信息：', userInfo);
    if (userInfo && typeof userInfo === 'string') {
      return JSON.parse(userInfo);
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