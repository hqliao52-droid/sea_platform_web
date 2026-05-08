import {request} from '@/utils/request.js';
import { getUserInfo } from '@/utils/user.js';

export default {
  data() {
    return {
      nikeName: '未登录',
      avatar: '/static/images/default-avatar.png' || "",

      showAvatarPreview: false,
      // 企业统计数据
      statsList: [
        { value: '128', label: '推送记录' },
        { value: '12h', label: '节省工时' },
        { value: '98%', label: 'AI准确率' }
      ],
      // AI推送规则标签
      ruleTags: ['东南亚市场', '跨境电商', '合规政策'],
      // 推送历史列表
      historyList: [
        { date: '11-20', articles: 12, quality: 94 },
        { date: '11-19', articles: 8, quality: 88 },
        { date: '11-18', articles: 15, quality: 91 }
      ],
      // 底部菜单列表
      menuList: [
        { icon: '👥', title: '企业信息管理' },
        { icon: '🛡', title: '安全与隐私设置' }
      ]
    };
  },
  onShow(){
    // 每次页面显示时重新获取最新用户信息
    this.loadUserInfo();
  },
  methods:{
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
        sourceType: ['album', 'camera'], // 允许从相册或相机选择
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.uploadAvatar(tempFilePath);
        }
      });
    },

    // 【新增】从预览界面触发修改头像
    handleChangeAvatarFromPreview() {
      this.closeAvatarPreview(); // 先关闭预览
      this.chooseAndUploadAvatar(); // 再调用选择上传
    },

    uploadAvatar(filePath) {
      uni.showLoading({ title: '上传中...' });

      uni.uploadFile({
        // 【注意】建议将 URL 提取到配置文件，这里暂时保留原样
        url: 'http://106.52.97.98:8000/file/upload_file', 
        filePath: filePath,
        name: 'file',
        method: 'POST',
        // 【重要】如果需要登录态，可能需要手动添加 Header，或者确保 uni.uploadFile 自动携带 Cookie/Token
        // header: { 'Authorization': uni.getStorageSync('token') }, 
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
        // 1. 调用后端接口更新用户信息 (假设有一个 update_profile 接口)
        // 如果没有单独接口，可能需要调用 /user/update_info 等
        const res = await request({
          url: '/user/update_avatar', // 【请根据实际后端接口修改】
          method: 'PUT', // 或 POST
          data: {
            avatar: newUrl
          }
        });

        if (res.code === 200 || res.code === '200') {
          // 2. 更新前端显示
          this.avatar = newUrl;
          
          // 3. 更新本地缓存的用户信息，保证下次进入页面也是新头像
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
        uni.showToast({ title: '网络异常', icon: 'none' });
      }
    },

    // ... 原有的 loadUserInfo 和 logout 保持不变
    async loadUserInfo(){
      const userInfo = getUserInfo();
      console.log('用户信息：', userInfo);
      if(userInfo){
        this.nikeName = userInfo.nickname;
        this.avatar = userInfo.avatar || '/static/images/default-avatar.png';
      }else{
        // 未登录
        // uni.redirectTo({ url: '/pages/login/login' });
      }
    },
    async loadUserInfo(){
      const userInfo = getUserInfo();
      console.log('用户信息：', userInfo);
      if(userInfo){
        this.nikeName = userInfo.nickname;
        this.avatar = userInfo.avatar || '/static/images/default-avatar.png';
      }else{
        // 未登录
        // uni.redirectTo({ url: '/pages/login/login' });
      }
    },

    async logout(){
        try{
            const res = await request({
              url: '/user/logout',
              method: 'POST'
            })
            if (res.code === '200' || res.code === 200) {
              uni.showToast({ title: '退出登录成功', icon: 'success' })
              uni.removeStorageSync('token');
              uni.reLaunch({
                url: '/pages/login/login'
              })
            } else {
              uni.showToast({ title: res.msg || '退出登录失败', icon: 'none' })
            }
        }
        catch(err){
          console.error('Logout Error:', err)
          uni.showToast({ title: '网络请求失败', icon: 'none' })
        }
    }
  }
};