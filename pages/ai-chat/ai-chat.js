import {request} from '@/utils/request.js';
import { getUserInfo } from '@/utils/user.js';
import avatar from 'uview-ui/libs/config/props/avatar';

export default {
  data() {
    return {
      // 聊天消息列表
      messageList: [
        {
          type: 'ai',
          content: '您好！我是您的出海战略助手。我已经整合了今日最新的东南亚市场资讯，您可以针对特定国家、行业或合规政策向我提问。',
          time: '10:00 AM'
        },
        {
          type: 'user',
          content: '我想了解目前印尼对于跨境电商化妆品准入的最新政策有哪些变化?',
          time: '10:02 AM'
        },
        {
          type: 'ai',
          content: '根据最近的监管动态，印尼 BPOM (国家食品药品监督管理局)更新了进口许可证的要求。主要涉及 Halal 认证的强制性执行节点提前。',
          time: '10:03 AM',
          suggestions: [
            '重点关注东南亚电商合规性认证（如 SNI）',
            '利用当地斋月节点进行社交媒体本土化投放',
            '建立与当地第三方支付平台（如 ShopeePay）的深度合作'
          ],
          sources: [
            { name: '2024印尼贸易部进口限制命令' },
            { name: '东南亚美妆市场准入合规手册' }
          ]
        }
      ],
      nikeName: '',
      avatar: '',
      // 常用查询标签
      quickTags: [
        '越南清关流程',
        '最新关税政策',
        '竞品动态分析'
      ]
    };
  },
  onShow(){
    this.loadUserInfo();
  },
  methods: {
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
    }
  }

  
};