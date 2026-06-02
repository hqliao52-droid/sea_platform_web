/**
 * 浏览历史工具类
 * Key: 'recent_read_history'
 * Max Count: 3
 */

const HISTORY_KEY = 'recent_read_history';
const MAX_HISTORY_COUNT = 4;

/**
 * 获取当前用户的存储 Key
 * @param {String|Number} userId - 用户ID
 */
function getHistoryKey(userId) {
  if (!userId) {
    console.warn('获取阅读历史时缺少 userId，可能导致数据混淆');
    // 为了兼容旧数据或未登录情况，可以返回默认 Key，但建议强制要求 userId
    return HISTORY_KEY;
  }
  return `${HISTORY_KEY}_${userId}`;
}

/**
 * 添加阅读记录
 * @param {Object} article - 文章对象 (至少包含 id, title, cover等关键信息)
 */
export function addReadHistory(article, userId) {
  if (!article || !article.id) return;
  if (!userId) {
    console.error('添加阅读历史失败：缺少 userId');
    return;
  }
  const key = getHistoryKey(userId);

  // 1. 获取现有历史
  let history = uni.getStorageSync(key) || [];

  // 2. 去重：如果该文章已存在，先移除旧记录（为了把它移到最前面）
  history = history.filter(item => item.id !== article.id);

  // 3. 构造精简后的文章对象（避免存入过多无用字段，节省空间）
  const simpleArticle = {
    id: article.id,
    title: article.title,
    content: article.content || '', // 来源
    published_at: article.published_at,
    // 如果有封面图，也可以存下来
    // cover: article.cover 
  };

  // 4. 添加到数组头部（最新阅读的在最前）
  history.unshift(simpleArticle);

  // 5. 截取前N个
  if (history.length > MAX_HISTORY_COUNT) {
    history = history.slice(0, MAX_HISTORY_COUNT);
  }

  // 6. 保存回本地存储
  try {
    uni.setStorageSync(key, history);
    console.log('阅读历史已更新:', history);
  } catch (e) {
    console.error('保存阅读历史失败', e);
  }
}

/**
 * 获取阅读历史
 * @returns {Array}
 */
export function getReadHistory(userId) {
  if (!userId) {
    return [];
  }
  const key = getHistoryKey(userId);
  let history = uni.getStorageSync(key);

  if (!history || history.length !== 0) {
    const oldKey = HISTORY_KEY; // 'recent_read_history'
    const oldData = uni.getStorageSync(key);
    if (oldData && oldData.length > 0) {
      // 将旧数据写入新 Key
      uni.setStorageSync(key, oldData);
      // 可选：清除旧 Key，避免后续混淆
      uni.removeStorageSync(oldKey);
      return oldData;
    }
  }
  return history || [];
}

/**
 * 清空阅读历史
 */
export function clearReadHistory(userId) {
  if (!userId) return;
  const key = getHistoryKey(userId);
  uni.removeStorageSync(key);
}