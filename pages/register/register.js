import {request} from '@/utils/request.js';

export default {
  data() {
    return {
      form: {
        account: '',
        password: '',
        confirmPwd: ''
      },
      loading: false
    }
  },
  methods: {
    // 注册
    async handleRegister() {
      const { account, password, confirmPwd } = this.form
      if (!account) {
        uni.showToast({ title: '请输入账号', icon: 'none' })
        return
      }
      if (!password || password.length < 6) {
        uni.showToast({ title: '密码至少6位', icon: 'none' })
        return
      }
      if (password !== confirmPwd) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' })
        return
      }
      
      try{
        const res = await request({
          url: '/user/register',
          method: 'POST',
          data: {
            username: account,
            password: password
          }
        })

        if (res.code !== '200' && res.code !== 200) {
          uni.showToast({ title: res.msg || '注册失败', icon: 'none' })
          return
        }else {
          console.log('注册成功：', res)
          this.loading = true
          setTimeout(() => {
            uni.showToast({ title: '注册成功', icon: 'success' })
            uni.navigateBack()
            this.loading = false
          }, 1000)
        }
      }catch(err){
        console.error('Register Error:', err)
      }
        
    },

    // 返回登录
    goLogin() {
      uni.navigateBack()
    }
  }
}