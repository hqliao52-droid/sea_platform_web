import { request } from '@/utils/request.js'

/**
 * 发送邮箱验证码
 * @param {string} email - 邮箱地址
 * @returns {Promise}
 */
export function sendVerifyCode(email) {
  return new Promise((resolve, reject) => {
    // 1. 基础校验
    if (!email) {
      reject(new Error('请输入邮箱地址'))
      return
    }
    const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailReg.test(email)) {
      reject(new Error('请输入正确的邮箱地址'))
      return
    }

    // 2. 显示加载状态
    uni.showLoading({ title: '发送中...', mask: true })

    // 3. 请求接口
    request({
      url: '/email/send_code',
      method: 'POST',
      data: { email }
    })
      .then(res => {
        uni.hideLoading()
        if (res.code === 200 || res.code === '200') {
          resolve(res)
        } else {
          uni.showToast({ title: res.msg || '发送失败', icon: 'none' })
          reject(new Error(res.msg || '发送失败'))
        }
      })
      .catch(err => {
        uni.hideLoading()
        console.error('发送验证码异常：', err)
        uni.showToast({ title: '网络异常，请重试', icon: 'none' })
        reject(err)
      })
  })
}

/**
 * 验证邮箱验证码
 * @param {string} email - 邮箱地址
 * @param {string} code - 验证码
 * @returns {Promise}
 */
export function verifyCode(email, code) {
  return new Promise((resolve, reject) => {
    if (!email || !code) {
      reject(new Error('参数不完整'))
      return
    }

    // 可选：如果验证过程很快，可以不加 Loading，或者加一个轻微的提示
    // uni.showLoading({ title: '验证中...', mask: true })

    request({
      url: '/email/verify_code',
      method: 'POST',
      data: { email, code }
    })
      .then(res => {
        // uni.hideLoading()
        if (res.code === 200 || res.code === '200') {
          resolve(res)
        } else {
          // 验证失败通常不需要全局 Toast，由调用方决定如何显示（如输入框变红）
          reject(new Error(res.msg || '验证码错误'))
        }
      })
      .catch(err => {
        // uni.hideLoading()
        console.error('验证验证码异常：', err)
        reject(err)
      })
  })
}

/**
 * 注册专用：发送邮箱验证码
 * @param {string} email - 邮箱地址
 * @returns {Promise}
 */
export function registerSendVerifyCode(email) {
  return new Promise((resolve, reject) => {
    // 1. 基础校验
    if (!email) {
      reject(new Error('请输入邮箱地址'))
      return
    }
    const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailReg.test(email)) {
      reject(new Error('请输入正确的邮箱地址'))
      return
    }

    // 2. 显示加载状态
    uni.showLoading({ title: '发送中...', mask: true })

    // 3. 请求接口
    request({
      url: '/email/register/send_code',
      method: 'POST',
      data: { email }
    })
      .then(res => {
        uni.hideLoading()
        if (res.code === 200 || res.code === '200') {
          resolve(res)
        } else {
          uni.showToast({ title: res.msg || '发送失败', icon: 'none' })
          reject(new Error(res.msg || '发送失败'))
        }
      })
      .catch(err => {
        uni.hideLoading()
        console.error('发送验证码异常：', err)
        uni.showToast({ title: '网络异常，请重试', icon: 'none' })
        reject(err)
      })
  })
}

/**
 * 注册专用：验证邮箱验证码
 * @param {string} email - 邮箱地址
 * @param {string} code - 验证码
 * @returns {Promise}
 */
export function registerVerifyCode(email, code) {
  return new Promise((resolve, reject) => {
    if (!email || !code) {
      reject(new Error('参数不完整'))
      return
    }

    // 可选：如果验证过程很快，可以不加 Loading，或者加一个轻微的提示
    // uni.showLoading({ title: '验证中...', mask: true })

    request({
      url: '/email/register/verify_code',
      method: 'POST',
      data: { email, code }
    })
      .then(res => {
        // uni.hideLoading()
        if (res.code === 200 || res.code === '200') {
          resolve(res)
        } else {
          // 验证失败通常不需要全局 Toast，由调用方决定如何显示（如输入框变红）
          reject(new Error(res.msg || '验证码错误'))
        }
      })
      .catch(err => {
        // uni.hideLoading()
        console.error('验证验证码异常：', err)
        reject(err)
      })
  })
}