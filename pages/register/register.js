import { request } from '@/utils/request.js';
import { registerSendVerifyCode, registerVerifyCode } from '@/utils/email.js';

export default {
  data() {
    return {
      form: {
        account: '',
        password: '',
        confirmPwd: '',
        nickName: '',
        email: '',
        verifyCode: ''
      },
      avatarUrl: '',

      loading: false,

      countdown: 0,
      timer: null,
      isEmailVerified: false,
    }
  },
  methods: {
    onEmailInput() {
      if (this.isEmailVerified) {
        this.isEmailVerified = false;
        this.form.verifyCode = '';
        this.countdown = 0;
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    },
    getButtonText() {
      if (this.isEmailVerified) {
        return '已验证';
      }
      if (this.countdown > 0) {
        return `${this.countdown}s`;
      }
      return '获取验证码';
    },
    getCountdownText() {
      if (this.isEmailVerified) {
        return '已验证';
      }
      if (this.countdown > 0) {
        return `${this.countdown}s`;
      }
      return '获取验证码';
    },
    onVerifyPhone(e){
      const val = e.detail.value;
      this.verifyPhone = val;

      if (val.length === 11 && this.form.phone){
        this.autoVerifyPhone(val);
      }
    },
    async autoVerifyPhone(){
      try {
        await this.verify(this.verifyPhone);
        this.verifyStatus = "success";
      } catch (error) {
        this.verifyStatus = "fail";
      }
    },
    async verify(phone,username){
      try{
        const res = await request({
          url: '/user/verify',
          method: 'POST',
          data: {
            phone: phone || null,
            username: username || null
          }
        });
      }catch(err){
        throw err;
      }
    },
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

      // 上传文件 不要手动加 header！！！
      uni.uploadFile({
        url: 'http://106.52.97.98:8000/file/upload_file',
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
    async handleSendCode() {
      const email = this.form.email.trim();
      const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      if (!email) {
        uni.showToast({ title: '请输入邮箱', icon: 'none' });
        return;
      }
      if (!emailReg.test(email)) {
        uni.showToast({ title: '邮箱格式不正确', icon: 'none' });
        return;
      }

      try {
        await registerSendVerifyCode(email);
        uni.showToast({ title: '验证码已发送', icon: 'success' });
        this.startCountdown();
      } catch (err) {
        console.error(err);
      }
    },
    startCountdown() {
      this.countdown = 60;
      if (this.timer) clearInterval(this.timer);
      
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          clearInterval(this.timer);
          this.timer = null;
        }
      }, 1000);
    },
    async onCodeInput(e) {
      const code = e.detail.value;
      this.form.verifyCode = code;

      // 只有未验证状态下，且输入满6位才自动验证
      if (code.length === 6 && !this.isEmailVerified) {
        await this.handleVerifyCode(code);
      }
    },
    async handleVerifyCode(code) {
      const email = this.form.email.trim();
      if (!email) return;

      try {
        await registerVerifyCode(email, code);
        this.isEmailVerified = true;
        uni.showToast({ title: '验证成功，您可再次单击输入框重新编辑邮箱！', icon: 'success' });
        
        // 验证成功后停止倒计时
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      } catch (err) {
        this.isEmailVerified = false;
        uni.vibrateShort();
      }
    },

    // 注册
    async handleRegister() {
      if (!this.form.account) {
        uni.showToast({ title: '请输入注册账号', icon: 'none' });
        return;
      }
      if (!this.form.password) {
        uni.showToast({ title: '请设置密码', icon: 'none' });
        return;
      }
      if (!this.form.confirmPwd) {
        uni.showToast({ title: '请确认密码', icon: 'none' });
        return;
      }
      if (this.form.password !== this.form.confirmPwd) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' });
        return;
      }
      if (!this.form.nickName) {
        uni.showToast({ title: '请输入昵称', icon: 'none' });
        return;
      }
      if (!this.isEmailVerified) {
        uni.showToast({ title: '请先完成邮箱验证', icon: 'none' });
        return;
      }
      this.loading = true;

      try {
        const res = await request({
          url: '/user/register',
          method: 'POST',
          data: {
            username: this.form.account,
            password: this.form.password,
            avatar: this.avatarUrl || '',
            nickname: this.form.nickName || '',
            email: this.form.email
          }
        });


        // 假设 request 拦截器已经处理了非200的情况抛出异常，或者返回统一结构
        // 这里根据你原有的代码逻辑判断
        if (res.code !== '200' && res.code !== 200) {
          uni.showToast({ title: res.msg || '注册失败', icon: 'none' })
          this.loading = false; // 失败时重置 loading
          return
        }

        // 注册成功
        uni.showToast({
          title: '注册成功！请牢记注册账号，后续登录均需要使用该账号登录',
          icon: 'none', // 使用 none 可以显示更长的文本且通常不阻塞底层交互
          duration: 2000, // 停留3秒
          mask: false // 确保不显示遮罩，允许用户点击其他区域（虽然此时通常会跳转）
        });

        // 延迟跳转，确保 Toast 显示
        setTimeout(() => {
          this.loading = false;

          // 【修改点】使用 redirectTo 关闭当前页面并跳转到登录页
          // 路径请根据你的实际项目结构修改，通常是 /pages/login/login
          uni.redirectTo({
            url: '/pages/login/login'
          });

          // 备选方案：如果想清空所有页面栈并重启到登录页（更彻底）
          // uni.reLaunch({
          //   url: '/pages/login/login'
          // });

        }, 2000);

      } catch (err) {
        console.error('Register Error:', err);
        this.loading = false; // 异常时重置 loading
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      }
    },

    // 返回登录
    goLogin() {
      uni.navigateBack()
    }
  }
}