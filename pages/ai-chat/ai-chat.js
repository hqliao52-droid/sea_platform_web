import {request} from '@/utils/request.js';
import { getUserInfo } from '@/utils/user.js';
import { getReadHistory } from '@/utils/history.js';
import { streamRequest } from '@/utils/stream-request.js';

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
      textareaHeight: 50, 
      maxLines: 4,
      lineHeight: 40, 

      currentSessionId: null,
      isStreaming: false,

      // u-parse 的标签样式，用于在富文本里保持与气泡一致的字体/换行/列表展示
      bubbleTagStyle: {
        h1: 'margin:10rpx 0;padding:0;font-size:34rpx;font-weight:700;line-height:1.4;',
        h2: 'margin:8rpx 0;padding:0;font-size:32rpx;font-weight:600;line-height:1.4;',
        h3: 'margin:6rpx 0;padding:0;font-size:30rpx;font-weight:600;line-height:1.4;',
        h4: 'margin:4rpx 0;padding:0;font-size:28rpx;font-weight:600;line-height:1.4;',
        h5: 'margin:4rpx 0;padding:0;font-size:26rpx;font-weight:600;line-height:1.4;',
        h6: 'margin:4rpx 0;padding:0;font-size:24rpx;font-weight:600;line-height:1.4;color:#666;',

        p: 'margin:0;padding:0;font-size:28rpx;line-height:1.6;word-break:break-all;',
        br: 'display:block;',
        strong: 'font-weight:700;',
        em: 'font-style:italic;',
        ol: 'margin:0;padding-left:44rpx;',
        ul: 'margin:0;padding-left:44rpx;',
        li: 'margin:4rpx 0;'
      },

      scrollTop: 0, 
      recentHistory: [], 
      isHistoryExpanded: false,

    };
  },
  onShow(){
    this.loadUserInfo();
    this.loadRecentHistory();
    this.$nextTick(() => {
      this.initDefaultSession();
    });
  },

  methods: {
    onInput(e) {
      const value = e.detail.value;
      this.inputText = value;
      
      // 简单估算行数：根据换行符 \n 和 字符长度
      // 这里做一个简化的估算，更精确的需要获取光标位置或渲染后测量
      // 假设每行约 20 个中文字符（根据字体大小调整）
      const lines = value.split('\n');
      let estimatedLines = 0;
      
      lines.forEach(line => {
        // 每 25 个字符算一行（根据实际字体大小微调）
        estimatedLines += Math.ceil(line.length / 25) || 1;
      });
      
      // 限制最大行数
      if (estimatedLines > this.maxLines) {
        estimatedLines = this.maxLines;
      }
      
      // 计算新高度：基础 padding + 行数 * 行高
      // 假设 padding 上下各 20rpx，行高 40rpx
      const newHeight = 40 + (estimatedLines * this.lineHeight); 
      
      // 更新高度
      this.textareaHeight = newHeight;
    },
    toggleHistory() {
      this.isHistoryExpanded = !this.isHistoryExpanded;
    },
    loadRecentHistory() {
      this.recentHistory = getReadHistory();
    },
    testUpdate() {
      // 测试响应式更新
      if (this.messageList.length > 0) {
        const lastMsg = this.messageList[this.messageList.length - 1];
        if (lastMsg.role === 'assistant') {
          lastMsg.content += '测试文本';
          lastMsg.renderedHtml = this.renderMarkdownToHtml(lastMsg.content);
          this.$forceUpdate();
          console.log('测试更新后的内容:', lastMsg.content);
        }
      }
    },

    // 简易 Markdown -> HTML（只覆盖你当前需求：加粗、换行、编号列表/列表项）
    renderMarkdownToHtml(md) {
      if (!md) return '';

      // 移除服务端控制标记，避免渲染成正文
      const src = String(md)
        .replace(/\[\[END\]\]/g, '')
        .replace(/\[\[ERROR\]\]/g, '')
        .replace(/\r\n/g, '\n');

      const escapeHtml = (s) => {
        return s
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      const renderInline = (s) => {
        let t = s;
        // 加粗：**text**
        t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // 斜体：*text*
        t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
        return t;
      };

      // 行级解析：编号列表（1. xxx）优先，其它行默认当作普通文本逐行换行展示
      const lines = src.split('\n');
      let out = [];
      let inOl = false;

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const headerMatch = rawLine.match(/^(\#{1,6})\s+(.*)$/);
        if (headerMatch) {
          // 如果之前在列表中，先闭合列表
          if (inOl) {
            inOl = false;
            out.push('</ol>');
          }

          const level = headerMatch[1].length; // # 的数量即级别
          const content = headerMatch[2];
          // 对标题内容进行 inline 渲染（支持加粗等）并转义
          const safeContent = renderInline(escapeHtml(content));
          out.push(`<h${level}>${safeContent}</h${level}>`);
          continue;
        }
        const line = rawLine || '';
        const m = line.match(/^\s*(\d+)\.\s+(.*)$/);

        if (m) {
          if (!inOl) {
            inOl = true;
            out.push('<ol>');
          }
          const content = m[2] ?? '';
          const rawContent = rawLine.match(/^\s*\d+\.\s+(.*)$/)[1];
          out.push('<li>' + renderInline(content) + '</li>');
          continue;
        }

        // 空行：如果在列表中就先结束列表
        if (!line.trim()) {
          if (inOl) {
            inOl = false;
            out.push('</ol>');
          }
          out.push('<br/>');
          continue;
        }

        // 非列表行：列表结束后，普通段落逐行显示
        if (inOl) {
          inOl = false;
          out.push('</ol>');
        }

        const rawContent = rawLine;
        out.push('<p>' + renderInline(line) + '</p>');
      }

      if (inOl) out.push('</ol>');
      return out.join('');
    },

    // 流式渲染结束后，用后端“最终消息”刷新当前 assistant 气泡
    // 目的：修复 H5 下流式分片导致 markdown 换行语义不一致的问题
    async refreshAssistantMessageFromServer(aiIndex) {
      try {
        if (this.currentSessionId === null || this.currentSessionId === undefined) return;
        const res = await request({
          url: '/chatMessage/get_by_session_id',
          method: 'GET',
          data: { session_id: this.currentSessionId }
        });
        if (!(res && (res.code === 200 || res.code === '200'))) return;

        const list = res.data || [];
        const serverAssistant = [...list].reverse().find(m => m && m.role === 'assistant');
        if (!serverAssistant) return;
        if (!this.messageList[aiIndex] || this.messageList[aiIndex].role !== 'assistant') return;

        const content = serverAssistant.content || '';
        this.$set(this.messageList[aiIndex], 'content', content);
        this.$set(this.messageList[aiIndex], 'renderedHtml', this.renderMarkdownToHtml(content));
        if (serverAssistant.created_time) {
          this.$set(this.messageList[aiIndex], 'created_time', serverAssistant.created_time);
        }
      } catch (e) {
        console.error('refreshAssistantMessageFromServer error:', e);
      }
    },

    // 流式接收 LLM 输出
    startWS(taskId, aiIndex) {
      const that = this;

      const ws = uni.connectSocket({
        url: `ws://192.168.110.218:8000/chatMessage/ws/chat/${taskId}`,
        success() {
          console.log("WS连接发起成功");
        }
      });

      // ❗注意：不是 ws.onOpen
      uni.onSocketOpen(() => {
        console.log("WS连接成功");
      });

      uni.onSocketMessage((res) => {
        const delta = res.data;

        if (!that.messageList[aiIndex]) return;

        const msg = that.messageList[aiIndex];
        const newContent = (msg.content || "") + delta;

        that.$set(msg, "content", newContent);
        that.$set(msg, "renderedHtml", that.renderMarkdownToHtml(newContent));

        that.scrollToBottom();

        if (delta.includes("[[END]]")) {
          console.log("WS结束");
          uni.closeSocket();
          that.isStreaming = false;
        }
      });

      uni.onSocketError((err) => {
        console.error("WS错误", err);
      });

      uni.onSocketClose(() => {
        console.log("WS关闭");
      });

      return ws;
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
        await this.createAndInitNewSession();
        if (!this.currentSessionId) return; // 创建失败则中止
      }

      // 1. 先加用户消息到列表
      const userMsg = {
        role: "user",
        content: content,
        created_time: this.formatTimeShort(new Date())
      };
      this.messageList.push(userMsg);
      
      // 2. 加一个空的AI消息（用来流式打字）- 使用 $set 确保响应式
      const aiMsgIndex = this.messageList.length;
      const aiMsg = {
        role: "assistant",
        content: "",
        renderedHtml: "",
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

      this.inputText = "";
      this.textareaHeight = 50;

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

        if (!res || (res.code !== 200 && res.code !== '200')) {
          throw new Error("发送失败");
        }
        console.log('insert_message 返回:', res);

        const task_id = res.data.task_id;
        
        // 开始流式接收
        this.startWS(task_id, aiIndex);

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
      });
    },
    async initDefaultSession() {
      if (!this.userInfo || !this.userInfo.id) {
        // 如果未登录，可能无法获取会话，视情况而定
        console.log('用户未登录，跳过会话初始化');
        return;
      }

      try {
        uni.showLoading({ title: '加载中...' });
        
        // 1. 获取所有会话
        const res = await request({
          url: '/session/get_sessions',
          method: "GET",
          data: { user_id: parseInt(this.userInfo.id) }
        });

        if (res.code === 200 || res.code === '200') {
          const sessions = res.data || [];
          
          if (sessions && sessions.length > 0) {
            // 2. 按 update_time 降序排列，取第一个（最新的）
            // 注意：确保后端返回的时间格式能被 Date 解析，通常是 ISO 字符串或时间戳
            sessions.sort((a, b) => {
              const timeA = new Date(a.update_time || a.created_time).getTime();
              const timeB = new Date(b.update_time || b.created_time).getTime();
              return timeB - timeA; // 降序
            });

            const latestSession = sessions[0];
            console.log('加载最新会话:', latestSession);
            
            // 3. 设置当前会话 ID 并加载消息
            this.currentSessionId = latestSession.id;
            
            // 更新侧边栏数据（可选，为了保持状态一致）
            this.sessionList = sessions;
            this.groupSessionsByDate(this.sessionList);

            // 4. 加载该会话的消息
            await this.loadSessionMessages(latestSession.id);
          } else {
            // 如果没有历史会话，则创建一个新会话
            console.log('无历史会话，创建新会话');
            await this.createAndInitNewSession();
          }
        } else {
          // 获取列表失败，降级处理：创建新会话
          console.warn('获取会话列表失败，创建新会话');
          await this.createAndInitNewSession();
        }
      } catch (err) {
        console.error('初始化会话失败:', err);
        // 异常情况下，也尝试创建新会话，保证用户可用
        await this.createAndInitNewSession();
      } finally {
        uni.hideLoading();
        this.newSessionWindowLoading = true; // 恢复按钮状态
      }
    },

    // 【新增】加载指定会话的消息
    async loadSessionMessages(sessionId) {
      if (!sessionId) return;
      
      try {
        const res = await request({
          url: '/chatMessage/get_by_session_id',
          method: "GET",
          data: { session_id: sessionId }
        });

        if (res.code === 200 || res.code === '200') {
          const rawList = res.data || [];
          // 处理消息，生成 renderedHtml
          this.messageList = rawList.map(m => {
            if (m && m.role === 'assistant') {
              return { 
                ...m, 
                renderedHtml: this.renderMarkdownToHtml(m.content || '') 
              };
            }
            return m;
          });
          
          // 滚动到底部
          this.scrollToBottom();
          console.log('会话消息加载完成，数量:', this.messageList.length);
        } else {
          uni.showToast({ title: res.msg || '拉取会话消息失败', icon: 'none' });
          this.messageList = []; // 失败则清空
        }
      } catch (err) {
        console.error('Load Session Messages Error:', err);
        uni.showToast({ title: '网络请求失败', icon: 'none' });
        this.messageList = [];
      }
    },

    // 【修改】创建新会话并初始化（不直接操作 messageList，由调用者决定）
    async createAndInitNewSession() {
      if (!this.userInfo || !this.userInfo.id) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      try {
        const res = await request({
          url: '/session/new_session',
          method: 'PUT',
          data: { user_id: parseInt(this.userInfo.id) }
        });

        if (res.code === 200 || res.code === '200') {
          this.currentSessionId = res.data.id;
          this.messageList = []; // 新会话当然没有消息
          console.log('新会话创建成功 ID:', this.currentSessionId);
        } else {
          uni.showToast({ title: res.msg || '创建新会话失败', icon: 'none' });
        }
      } catch (err) {
        console.error('New Session Error:', err);
        uni.showToast({ title: '网络请求失败', icon: 'none' });
      }
    },
    async newSession(){
      this.newSessionWindowLoading = false;
      this.messageList = [];
      this.currentSessionId = null;

      await this.createAndInitNewSession();

      this.newSessionWindowLoading = true;
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
            this.messageList = (res.data || []).map(m => {
              if (m && m.role === 'assistant') {
                return { ...m, renderedHtml: this.renderMarkdownToHtml(m.content || '') };
              }
              return m;
            });
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