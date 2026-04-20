import { request } from '@/utils/request.js' 

export default {
  data() {
    return {
      form: {
        account: '',
        password: ''
      },
      loading: false
    }
  },
  methods: {
    // 登录
    handleLogin() {
      const { account, password } = this.form
      if (!account) {
        uni.showToast({ title: '请输入账号', icon: 'none' })
        return
      }
      if (!password) {
        uni.showToast({ title: '请输入密码', icon: 'none' })
        return
      }

      this.loading = true

      request({
        url: '/user/login',
        method: 'POST',
        data: {
          username: account,
          password: password
        }
      }).then(res => {
        if (res.code === '200' || res.code === 200) {
          const token = res.data.token
          
          // 4. 存入缓存
          uni.setStorageSync('token', token)
          
          uni.showToast({ title: '登录成功', icon: 'success' })
          
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/index/index'
            })
          }, 1000)
        } else {
          uni.showToast({ title: res.msg || '登录失败', icon: 'none' })
        }
      }).catch(err => {
        console.error('Login Error:', err)
        uni.showToast({ title: '网络请求失败', icon: 'none' })
      }).finally(() => {
        this.loading = false
      })
    },

    // 去注册
    goRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      })
    }
  }
}