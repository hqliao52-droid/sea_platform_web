import {request} from '@/utils/request.js';
import { getUserInfo } from '@/utils/user.js';

export default {
  data() {
    return {
      nikeName: '未登录',
      avatar: '/static/images/default-avatar.png' || "",
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