import { getUserInfo } from '@/utils/user.js';

export default {
  data() {
    return {
      // 用户可直接编辑
      avatar: '',
      nickname: '',
      city: '',

      // 手机号
      phone: '',
      editPhone: false,
      phoneCode: '',
      phoneCodeStatus: '', // loading / success / error

      // 邮箱
      email: '',
      editEmail: false,
      emailCode: '',
      emailCodeStatus: '',

      // 只读字段
      username: '',
      status: 1,
      statusText: '',
      created_time: '',
      updated_time: '',
      last_login_time: '',
      statusClass: '', 

      showAvatarPreview: false
    };
  },
  onShow() {
    this.loadUserInfo();
  },
  methods: {
    previewAvatar() {
      if (!this.avatar) return;
      this.showAvatarPreview = true;
    },
    closeAvatarPreview() {
      this.showAvatarPreview = false;
    },
    chooseAndUploadAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.uploadAvatar(tempFilePath);
        }
      });
    },
    uploadAvatar(filePath) {
      uni.showLoading({ title: '上传中...' });

      uni.uploadFile({
        url: 'http://106.52.97.98:8000/file/upload_file',
        filePath: filePath,
        name: 'file',
        method: 'POST',
        success: (uploadRes) => {
          try {
            const data = JSON.parse(uploadRes.data);
            if (data.code === 200 || data.code === '200') {
              const newAvatarUrl = data.data.url;
              this.updateUserAvatar(newAvatarUrl);
            } else {
              uni.showToast({ title: data.msg || '上传失败', icon: 'none' });
            }
          } catch (e) {
            console.error(e);
            uni.showToast({ title: '上传解析失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.showToast({ title: '上传请求失败', icon: 'none' });
        },
        complete: () => {
          uni.hideLoading();
        }
      });
    },
    async updateUserAvatar(newUrl) {
      try {
        const res = await request({
          url: '/user/update_info',
          method: 'PUT',
          data: {
            avatar: newUrl
          }
        });

        if (res.code === '200' || res.code === 200) {
          // 1. 更新页面显示
          this.avatar = newUrl;
          
          // 2. 更新本地缓存
          const userInfo = getUserInfo();
          if (userInfo) {
            userInfo.avatar = newUrl;
            uni.setStorageSync('userInfo', userInfo);
          }
          
          uni.showToast({ title: "头像修改成功", icon: 'success' });
        } else {
          uni.showToast({ title: res.msg || '更新失败', icon: 'none' });
        }
      } catch (err) {
        console.error('Update Avatar Error:', err);
        uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
      }
    },
    /**
     * 加载用户信息
     */
    async loadUserInfo() {
      const userInfo = getUserInfo();
      if (userInfo) {
        // 赋值可编辑信息
        this.avatar = userInfo.avatar || '/static/images/default-avatar.png';
        this.nickname = userInfo.nickname;
        this.city = userInfo.city || '';

        // 赋值手机号/邮箱
        this.phone = userInfo.phone;
        this.email = userInfo.email;

        // 赋值只读信息
        this.username = userInfo.username;
        this.status = userInfo.status;
        this.setStatusText();
        this.setStatusClass();
        this.created_time = userInfo.created_time;
        this.updated_time = userInfo.updated_time;
        this.last_login_time = userInfo.last_login_time;
      } else {
        // 未登录，可自行打开注释
        // uni.redirectTo({ url: '/pages/login/login' });
      }
    },

    /**
     * 账号状态文字
     */
    setStatusText() {
      const map = {
        0: '禁用',
        1: '正常',
        2: '锁定'
      };
      this.statusText = map[this.status] || '未知';
    },
    setStatusClass() {
      const map = {
        0: 'status-forbid',
        1: 'status-normal',
        2: 'status-lock'
      };
      this.statusClass = map[this.status] || '';
    },
    goAccountAppeal() {
      console.log('进入账号申诉');
      uni.showModal({
        title: '账号申诉',
        content: '即将跳转到账号申诉页面',
        showCancel: true
      });
      // 后续可写路由跳转
      // uni.navigateTo({ url: '/pages/accountAppeal/accountAppeal' });
    },

    /**
     * 手机号验证码输入
     */
    handlePhoneCodeInput(e) {
      const val = e.detail ? e.detail.value : e.value;
      if (val.length === 4) {
        this.verifyPhoneCode();
      } else {
        this.phoneCodeStatus = '';
      }
    },

    /**
     * 邮箱验证码输入
     */
    handleEmailCodeInput(e) {
      const val = e.value;
      if (val.length === 4) {
        this.verifyEmailCode();
      } else {
        this.emailCodeStatus = '';
      }
    },

    /**
     * 发送手机验证码（占位）
     */
    sendPhoneCode() {
      if (!this.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' });
        return;
      }
      console.log('发送手机验证码:', this.phone);
      uni.showToast({ title: '验证码已发送', icon: 'success' });
    },

    /**
     * 发送邮箱验证码（占位）
     */
    sendEmailCode() {
      if (!this.email) {
        uni.showToast({ title: '请输入邮箱', icon: 'none' });
        return;
      }
      console.log('发送邮箱验证码:', this.email);
      uni.showToast({ title: '验证码已发送', icon: 'success' });
    },

    /**
     * 验证手机验证码（占位）
     */
    async verifyPhoneCode() {
      this.phoneCodeStatus = 'loading';
      try {
        // TODO 后端请求
        console.log('验证手机验证码:', this.phoneCode);
        await new Promise(resolve => setTimeout(resolve, 800));
        this.phoneCodeStatus = 'success';
      } catch (err) {
        this.phoneCodeStatus = 'error';
      }
    },

    /**
     * 验证邮箱验证码（占位）
     */
    async verifyEmailCode() {
      this.emailCodeStatus = 'loading';
      try {
        // TODO 后端请求
        console.log('验证邮箱验证码:', this.emailCode);
        await new Promise(resolve => setTimeout(resolve, 800));
        this.emailCodeStatus = 'success';
      } catch (err) {
        this.emailCodeStatus = 'error';
      }
    },

    /**
     * 保存用户信息（占位）
     */
    async saveUserInfo() {
      const params = {
        avatar: this.avatar,
        nickname: this.nickname,
        city: this.city,
        phone: this.editPhone ? this.phone : null,
        email: this.editEmail ? this.email : null,
        phoneCode: this.phoneCode,
        emailCode: this.emailCode
      };
      console.log('保存用户信息:', params);
      uni.showToast({ title: '保存成功', icon: 'success' });
    }
  }
};