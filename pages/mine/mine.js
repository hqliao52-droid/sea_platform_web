import { methods } from "uview-ui/libs/mixin/mixin";

export default {
  data() {
    return {
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
  methods:{
    logout(){
        uni.removeStorageSync('token');
        uni.reLaunch({
          url: '/pages/login/login'
        })
    }
  }
};