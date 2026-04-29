import {request} from '@/utils/request.js';
import { getUserInfo } from '@/utils/user.js';

export default {
  data() {
    return {
      userInfo: null,
      newSessionWindowLoading: true,
      // 聊天消息列表
      messageList: [],
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
      groupedSessions: [],

      inputText:'',
      currentSessionId: null,
      isStreaming: false,

      scrollTop: 0, 
    };
  },
  onShow(){
    this.loadUserInfo();
  },
  methods: {
    testUpdate() {
      // 测试响应式更新
      if (this.messageList.length > 0) {
        const lastMsg = this.messageList[this.messageList.length - 1];
        if (lastMsg.role === 'assistant') {
          lastMsg.content += '测试文本';
          this.$forceUpdate();
          console.log('测试更新后的内容:', lastMsg.content);
        }
      }
    },
    // 流式接收 LLM 输出
    startStream(taskId, aiIndex) {
      const that = this;  // 关键：保存 Vue 实例
      let buffer = "";
      let contentUpdateCount = 0;
      
      if (!this.messageList[aiIndex]) {
        console.error('AI消息对象不存在, aiIndex:', aiIndex);
        return;
      }

      console.log('开始流式接收, taskId:', taskId, 'aiIndex:', aiIndex);

      const requestTask = uni.request({
        url: `/chatMessage/chat_stream/${taskId}`,
        method: "GET",
        enableChunkedResponse: true,
        responseType: "text",
        header: {
          'Accept': 'text/event-stream'
        },
        onChunkReceived: (res) => {
          // 这里已经是箭头函数，但为了安全，使用 that
          try {
            console.log('收到数据块'); // 检查是否进入回调
            
            const uint8 = new Uint8Array(res.data);
            const text = new TextDecoder("utf-8").decode(uint8);
            buffer += text;
            
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            
            for (let line of lines) {
              line = line.trim();
              if (!line || line.startsWith(":")) continue;
              
              if (line.startsWith("data:")) {
                // 兼容 data: 后面可能有空格的情况
                let delta = line.substring(5).trim();
                
                if (delta.includes("[[END]]")) {
                  that.isStreaming = false;
                  console.log("流结束，总更新次数:", contentUpdateCount);
                  that.$forceUpdate();
                  return;
                }
                
                if (delta.includes("[[ERROR]]")) {
                  that.isStreaming = false;
                  uni.showToast({ title: '生成失败', icon: 'none' });
                  if (that.messageList[aiIndex] && !that.messageList[aiIndex].content) {
                    that.messageList.splice(aiIndex, 1);
                  }
                  that.$forceUpdate();
                  return;
                }
                
                if (delta && delta !== '') {
                  contentUpdateCount++;
                  if (!that.messageList[aiIndex]) {
                    console.error('AI消息对象在更新时丢失');
                    return;
                  }
                  
                  const currentContent = that.messageList[aiIndex].content || '';
                  const newContent = currentContent + delta;
                  that.$set(that.messageList[aiIndex], 'content', newContent);
                  console.log(`更新 #${contentUpdateCount}:`, delta, '当前长度:', newContent.length);
                  that.scrollToBottom();
                }
              }
            }
          } catch (e) {
            console.error('解析流数据出错', e);
          }
        },
        success: () => {
          that.isStreaming = false;
          console.log('流请求完成');
          if (buffer && buffer.trim() && !buffer.includes("[[END]]")) {
            const currentContent = that.messageList[aiIndex]?.content || '';
            that.$set(that.messageList[aiIndex], 'content', currentContent + buffer);
            that.$forceUpdate();
          }
          that.scrollToBottom();
        },
        fail: (err) => {
          console.error("流失败", err);
          that.isStreaming = false;
          uni.showToast({ title: '网络连接中断', icon: 'none' });
          if (that.messageList[aiIndex] && !that.messageList[aiIndex].content) {
            that.messageList.splice(aiIndex, 1);
            that.$forceUpdate();
          }
        }
      });
      
      return requestTask;
    },
    // 发送消息 + 接收流式输出
    async sendMessage() {
      const content = this.inputText?.trim();
      if (!content || this.isStreaming) return;

      if (!this.userInfo || !this.userInfo.id) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      // 检查会话ID (如果没有，先创建新会话)
      if (!this.currentSessionId) {
        await this.newSession();
        if (!this.currentSessionId) return; // 创建失败则中止
      }

      // 1. 先加用户消息到列表
      const userMsg = {
        role: "user",
        content: content,
        created_time: this.formatTimeShort(new Date())
      };
      this.messageList.push(userMsg);
      
      // 2. 加一个空的AI消息（用来流式打字）- 关键：使用 $set 确保响应式
      const aiMsgIndex = this.messageList.length;
      const aiMsg = {
        role: "assistant",
        content: "",
        created_time: this.formatTimeShort(new Date()),
        suggestions: [],
        sources: []
      };
      this.messageList.push(aiMsg);
      
      // 确保 AI 消息是响应式的
      this.$set(this.messageList, aiMsgIndex, aiMsg);
      
      const aiIndex = aiMsgIndex; // 保存索引供后续使用

      this.inputText = "";
      this.isStreaming = true;
      this.scrollToBottom();

      try {
        // 调用 insert_message 获取 task_id
        const res = await request({
          url: "/chatMessage/insert_message",
          method: "PUT",
          data: {
            "query": content,
            "user_id": parseInt(this.userInfo.id),
            "session_id": this.currentSessionId || 0
          }
        });

        if (res.code != 200 && res.code !== '200') throw new Error("发送失败");

        const task_id = res.data.task_id;
        
        // 开始流式接收
        this.startStream(task_id, aiIndex);

      } catch (err) {
        console.error(err);
        this.isStreaming = false;
        // 移除失败的 AI 消息
        if (this.messageList[aiIndex]) {
          this.messageList.splice(aiIndex, 1);
        }
        uni.showToast({ title: err.data?.msg || '发送失败', icon: 'none' });
      }
    },
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
    scrollToBottom() {
      // 使用 $nextTick 确保 DOM 更新后再滚动
      this.$nextTick(() => {
        // 增加一点延迟，确保内容渲染完成
        setTimeout(() => {
          this.scrollTop = 999999;
        }, 50);
        // 删除下面这行错误代码
        // console.log('DOM更新后的内容:', this.messageList[aiIndex].content);
      });
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
          this.currentSessionId = res.data.id;
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
      this.currentSessionId = session.id;
      console.log('选中会话:', session);
      // TODO: 这里可以添加跳转逻辑或加载该会话的历史消息
      // 例如: this.loadSessionMessages(session.id);

      if(!this.userInfo || !this.userInfo.id){
        uni.showToast({title: '请先登录',icon: 'none'});
        return;
      }

      try{
        uni.showLoading({ title: '加载中...' });

        request({
          url: '/chatMessage/get_by_session_id',
          method:"GET",
          data: {session_id: session.id}
        }).then(res => {
          if(res.code === 200 || res.code === '200'){
            console.log('会话消息返回：', res);
            this.messageList = res.data || [];
          }else{
            uni.showToast({title: res.msg || '拉取会话消息失败',icon: 'none'});
          }
        })
      }catch(err){
        console.error('Get Session Messages Error:', err);
      }
      finally{
        uni.hideLoading();
      }
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