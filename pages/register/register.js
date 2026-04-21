import {request} from '@/utils/request.js';
import icon from 'uview-ui/libs/config/props/icon';

export default {
  data() {
    return {
      form: {
        account: '',
        password: '',
        confirmPwd: '',
        nickName: '',
        phone: '',

      },
      avatarUrl: '',
      loading: false
    }
  },
  methods: {
    // 选择头像
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        extension: ['jpg', 'jpeg', 'png'], 
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          // 直接上传，不做后缀判断！
          this.uploadAvatar(tempFilePath)
        }
      })
    },
    // 上传头像
    uploadAvatar(filePath) {
      uni.showLoading({ title: '上传中...' })

      // 【重点】上传文件 不要手动加 header！！！
      uni.uploadFile({
        url: 'http://127.0.0.1:8000/file/upload_file',
        filePath: filePath,
        name: 'file',
        method: 'POST',
        success: (uploadRes) => {
          try {
            const data = JSON.parse(uploadRes.data)
            if (data.code === 200 || data.code === '200') {
              this.avatarUrl = data.data.url
              uni.showToast({ title: "上传成功", icon: 'success' })
            } else {
              uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
            }
          } catch (e) {
            uni.showToast({ title: '上传失败', icon: 'none' })
          }
        },
        fail: () => {
          uni.showToast({ title: '上传请求失败', icon: 'none' })
        },
        complete: () => {
          uni.hideLoading()
        }
      })
    },
    deleteAvatar() {
      this.avatarUrl = ''
      uni.showToast({ title: '已删除头像', icon: 'success' })
    },

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
            password: password,
            avatar: this.avatarUrl || '',
            nickname: this.form.nickName || '',
            phone: this.form.phone || ''
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