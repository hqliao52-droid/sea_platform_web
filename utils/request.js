// utils/request.js
import config from './config.js';

export function request(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token');

    const header = {
      'Content-Type': 'application/json'
    };

    if (token) {
      header['Authorization'] = 'Bearer ' + token;
    }

    uni.request({
      //  使用统一配置的 baseURL
      url: config.baseURL + options.url,
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