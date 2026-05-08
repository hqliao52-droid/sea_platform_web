// utils/request.js

// 这里改成你电脑的局域网 IP + FastAPI 端口
// 注意：如果在真机调试，127.0.0.1 指的是手机本身，请改为电脑的局域网 IP (如 192.168.x.x)
const baseURL = 'http://106.52.97.98:8000';
// const baseURL = 'http://192.168.110.218:8000';

export function request(options) {
  return new Promise((resolve, reject) => {
    // 1. 获取本地存储的 token
    const token = uni.getStorageSync('token');
    
    // 2. 初始化 header
    const header = {
      'Content-Type': 'application/json'
    };

    // 3. 如果存在 token，则添加到 Authorization 字段
    if (token) {
      header['Authorization'] = 'Bearer ' + token;
    }

    uni.request({
      url: baseURL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: header, 
      success: res => {
        resolve(res.data)
      },
      fail: err => {
        reject(err)
      }
    })
  })
}