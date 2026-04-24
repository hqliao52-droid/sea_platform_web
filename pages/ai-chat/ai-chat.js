import {request} from '@/utils/request.js';
import { getUserInfo } from '@/utils/user.js';
import avatar from 'uview-ui/libs/config/props/avatar';

export default {
  data() {
    return {
      userInfo: null,
      newSessionWindowLoading: true,
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
        },
        {
          type: 'user',
          content: '我想了解目前印尼对于跨境电商化妆品准入的最新政策有哪些变化?',
          time: '10:02 AM'
        },
      ],
      nikeName: '',
      avatar: '',
      // 常用查询标签
      quickTags: [
        '越南清关流程',
        '最新关税政策',
        '竞品动态分析'
      ],

      // 侧边栏
      showSidebar: false,
      sessionList: [],
      groupedSessions: []
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
        this.userInfo = userInfo;
      }else{
        // 未登录
        // uni.redirectTo({ url: '/pages/login/login' });
      }
    },
    async newSession(){
      this.newSessionWindowLoading = false;
      this.messageList = [];
      if(!this.userInfo || !this.userInfo.id){
        uni.showToast({title: '请先登录',icon: 'none'});
        return;
      }
      try{
        const res = await request({
          url: '/session/new_session',
          method: 'PUT',
          data: {user_id: parseInt(this.userInfo.id)}
        });

        if(res.code === 200 || res.code === '200'){
          console.log('新会话返回：', res);
        }else{
          uni.showToast({title: res.msg || '创建新会话失败',icon: 'none'});

        }
      }catch(err){
        console.error('New Session Error:', err);
        uni.showToast({title: '网络请求失败',icon: 'none'});
      }finally{
        this.newSessionWindowLoading = true;
      }
    },
    async getSessions(){
      if(this.showSidebar){
        this.showSidebar = false;
        return;
      }

      if(!this.userInfo || !this.userInfo.id){
        uni.showToast({title: '请先登录',icon: 'none'});
        return;
      }

      try{
        uni.showLoading({ title: '加载中...' });

        const res = await request({
          url: '/session/get_sessions',
          method:"GET",
          data: {user_id: parseInt(this.userInfo.id)}
        });

        if(res.code === 200 || res.code === '200'){
          this.sessionList = res.data || [];
          this.groupSessionsByDate(this.sessionList);
          this.showSidebar = true;
        }else{
          uni.showToast({title: res.msg || '拉取会话列表失败',icon: 'none'});
        }

      }catch(err){ 
        console.error('Get Sessions Error:', err.data);
        uni.showToast({title: '网络请求失败',icon: 'none'});
      }finally{
        uni.hideLoading();
      }
    },

    // 按日期分组会话
    groupSessionsByDate(list) { 
      if (!list || list.length === 0) {
        this.groupedSessions = [];
        return;
      }

      const groups = [];
      let lastDateLabel = '';

      list.forEach(item => {
        const dateStr = item.update_time || item.created_time;
        const dateObj = new Date(dateStr);
        
        // 获取今天的日期对象（清零时间部分以便比较）
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(dateObj);
        targetDate.setHours(0, 0, 0, 0);

        let label = '';
        const diffTime = today.getTime() - targetDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          label = '今天';
        } else if (diffDays === 1) {
          label = '昨天';
        } else {
          // 格式化为 MM月DD日
          const month = dateObj.getMonth() + 1;
          const day = dateObj.getDate();
          label = `${month}月${day}日`;
        }

        // 如果当前标签与上一个不同，创建新组
        if (label !== lastDateLabel) {
          groups.push({
            label: label,
            items: [item]
          });
          lastDateLabel = label;
        } else {
          // 否则加入当前组
          groups[groups.length - 1].items.push(item);
        }
      });

      this.groupedSessions = groups;
    },
    // --- 点击蒙版或会话项关闭侧边栏 ---
    closeSidebar() {
      this.showSidebar = false;
    },

     // --- 点击某个会话 ---
     selectSession(session) {
      console.log('选中会话:', session);
      // TODO: 这里可以添加跳转逻辑或加载该会话的历史消息
      // 例如: this.loadSessionMessages(session.id);
      this.closeSidebar();
    },
    formatTimeShort(timeStr) {
      if (!timeStr) return '';
      const date = new Date(timeStr);
      const h = date.getHours().toString().padStart(2, '0');
      const m = date.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    }
  }
};