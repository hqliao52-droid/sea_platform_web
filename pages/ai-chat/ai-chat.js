import {request} from '@/utils/request.js';
import { getUserInfo } from '@/utils/user.js';
import { getReadHistory } from '@/utils/history.js';
import { streamRequest } from '@/utils/stream-request.js';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-light.css'; 

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
      lastDeletedText:'',

      textareaHeight: 50, 
      maxLines: 4,
      lineHeight: 40, 

      currentSessionId: null,
      isStreaming: false,

      mermaidDiagrams: {},

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
        li: 'margin:4rpx 0;',

        pre: 'background:#f6f8fa;padding:16rpx;border-radius:8rpx;overflow-x:auto;margin:10rpx 0;',
        code: 'font-family:monospace;font-size:24rpx;background:#f0f0f0;padding:2rpx 6rpx;border-radius:4rpx;'
      },

      scrollTop: 0, 
      recentHistory: [], 
      isHistoryExpanded: false,

      selectedNewsIds: [],

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
    toggleNewsSelection(item) {
      const id = item.id;
      const index = this.selectedNewsIds.indexOf(id);
      
      if (index > -1) {
        // 已选中，则取消选中
        this.selectedNewsIds.splice(index, 1);
      } else {
        // 未选中，则加入
        // 可选：限制最大选中数量，例如最多5篇
        if (this.selectedNewsIds.length >= 5) {
          uni.showToast({ title: '最多同时参考5篇文章', icon: 'none' });
          return;
        }
        this.selectedNewsIds.push(id);
      }
    },
    clearSelectedNews() {
      this.selectedNewsIds = [];
    },
    clearInputWithBackup() {
      if (!this.inputText) return;
      
      // 1. 备份当前内容
      this.lastDeletedText = this.inputText;
      
      // 2. 清空输入框
      this.inputText = '';
      
      // 3. 重置高度
      this.textareaHeight = 50;
      
      // 4. 可选：给个轻微提示
      uni.showToast({
        title: '已暂存，可点击恢复',
        icon: 'none',
        duration: 500
      });
    },
    clearInputWithbackUpBar(){
      if (!this.lastDeletedText) return;
      this.lastDeletedText = "";

    },
    restoreDeletedText() {
      if (this.lastDeletedText) {
        this.inputText = this.lastDeletedText;
        // 恢复后清空暂存区，或者保留以便多次粘贴？通常清空比较好，避免混淆
        // 这里选择保留，直到用户再次删除或手动清空，或者你可以选择清空：
        // this.lastDeletedText = ''; 
        
        // 重新计算高度
        this.$nextTick(() => {
           // 触发一次 input 事件来重新计算高度，或者直接调用 onInput 模拟
           const mockEvent = { detail: { value: this.inputText } };
           this.onInput(mockEvent);
        });
      }
    },
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

    // 简易 Markdown -> HTML（只覆盖你当前需求：加粗、换行、编号列表/列表项）
    // 在 renderMarkdownToHtml 方法中，修改代码块和Mermaid的处理逻辑

    renderMarkdownToHtml(md) {
      if (!md) return '';

      const src = String(md)
        .replace(/\[\[END\]\]/g, '')
        .replace(/\[\[ERROR\]\]/g, '')
        .replace(/\r\n/g, '\n');

      // 存储提取的代码块
      const codeBlocks = [];
      const mermaidBlocks = [];
      
      let processed = src;
      
      // 1. 提取Mermaid代码块 - 修复正则表达式，正确匹配结束标记
      processed = processed.replace(/```mermaid\s*\n([\s\S]*?)```/g, (match, code) => {
        const id = `MERMAID_${mermaidBlocks.length}`;
        // 去除可能的尾部空白，但保留缩进
        const cleanCode = code.replace(/\n+$/, '').trimEnd();
        mermaidBlocks.push({
          id,
          code: cleanCode
        });
        // 返回一个占位符，用特殊标记包裹
        return `\n<!--MERMAID_START--><div class="mermaid-placeholder" data-mermaid-id="${id}">${this.escapeHtml(cleanCode)}</div><!--MERMAID_END-->\n`;
      });
      
      // 2. 提取普通代码块 - 同样修复正则表达式
      processed = processed.replace(/```(\w*)\s*\n([\s\S]*?)```/g, (match, lang, code) => {
        // 跳过mermaid（已经在上面处理了）
        if (lang.toLowerCase() === 'mermaid') {
          return match;
        }
        
        const id = `CODE_${codeBlocks.length}`;
        const cleanCode = code.replace(/\n+$/, '').trimEnd();
        
        // 高亮处理
        let highlightedCode = '';
        if (lang && hljs.getLanguage(lang)) {
          try {
            highlightedCode = hljs.highlight(cleanCode, { language: lang }).value;
          } catch (e) {
            highlightedCode = this.escapeHtml(cleanCode);
          }
        } else {
          highlightedCode = this.escapeHtml(cleanCode);
        }
        
        codeBlocks.push({
          id,
          lang: lang || 'text',
          code: cleanCode,
          highlighted: highlightedCode
        });
        
        return `\n<!--CODEBLOCK_START--><div class="code-block-wrapper" data-code-id="${id}">
          <div class="code-block-header">
            <span class="code-lang">${lang || 'text'}</span>
            <span class="code-copy-btn" data-code="${this.escapeHtml(cleanCode).replace(/"/g, '&quot;')}">复制</span>
          </div>
          <pre><code class="hljs ${lang ? 'language-' + lang : ''}">${highlightedCode}</code></pre>
        </div><!--CODEBLOCK_END-->\n`;
      });
      
      // 3. 处理行内代码（注意：不要影响已处理的代码块）
      processed = processed.replace(/(?<!`)`([^`\n]+)`(?!`)/g, '<code inline>$1</code>');

      // 4. 处理其他Markdown元素
      const lines = processed.split('\n');
      let out = [];
      let inOl = false;
      let inBlock = false; // 标记是否在特殊块中

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        
        // 检查是否是特殊块的开始/结束标记
        if (rawLine.includes('<!--MERMAID_START-->') || rawLine.includes('<!--CODEBLOCK_START-->')) {
          // 如果在列表中，先闭合
          if (inOl) {
            inOl = false;
            out.push('</ol>');
          }
          inBlock = true;
          // 移除注释标记，保留实际内容
          const cleanLine = rawLine.replace(/<!--(?:MERMAID|CODEBLOCK)_START-->/g, '');
          out.push(cleanLine);
          continue;
        }
        
        if (rawLine.includes('<!--MERMAID_END-->') || rawLine.includes('<!--CODEBLOCK_END-->')) {
          const cleanLine = rawLine.replace(/<!--(?:MERMAID|CODEBLOCK)_END-->/g, '');
          out.push(cleanLine);
          inBlock = false;
          continue;
        }
        
        // 如果当前在代码块中，直接输出
        if (inBlock) {
          out.push(rawLine);
          continue;
        }
        
        // 标题处理
        const headerMatch = rawLine.match(/^(\#{1,6})\s+(.*)$/);
        if (headerMatch) {
          if (inOl) {
            inOl = false;
            out.push('</ol>');
          }
          const level = headerMatch[1].length;
          const content = this.renderInline(headerMatch[2]);
          out.push(`<h${level}>${content}</h${level}>`);
          continue;
        }
        
        // 有序列表处理
        const line = rawLine || '';
        const m = line.match(/^\s*(\d+)\.\s+(.*)$/);
        if (m) {
          if (!inOl) {
            inOl = true;
            out.push('<ol>');
          }
          const content = m[2] ?? '';
          out.push('<li>' + this.renderInline(content) + '</li>');
          continue;
        }

        // 空行处理
        if (!line.trim()) {
          if (inOl) {
            inOl = false;
            out.push('</ol>');
          }
          out.push('<br/>');
          continue;
        }

        // 非列表行
        if (inOl) {
          inOl = false;
          out.push('</ol>');
        }

        out.push('<p>' + this.renderInline(line) + '</p>');
      }

      if (inOl) out.push('</ol>');
      
      return out.join('');
    },

    /**
     * 行内元素渲染
     */
    renderInline(text) {
      if (!text) return '';
      let t = text;
      // 先转义HTML
      t = this.escapeHtml(t);
      // 加粗：**text**
      t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // 斜体：*text*
      t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
      return t;
    },

    /**
     * HTML转义
     */
    escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /**
     * 渲染Mermaid图表（如果平台支持）
     * 注意：小程序环境可能不支持动态渲染Mermaid
     */
    renderMermaid(id, code) {
      // 在小程序/H5环境中，Mermaid需要特殊处理
      // 这里返回一个包含原始代码的pre标签，或者使用图片替代
      return `<pre class="mermaid-code">${this.escapeHtml(code)}</pre>`;
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
      
      uni.connectSocket({
        // url: `ws://192.168.110.218:8000/chatMessage/ws/chat/${taskId}`,
        url: `ws://106.52.97.98:8000/chatMessage/ws/chat/${taskId}`,
        success() {
          console.log("WS连接发起成功");
        }
      });

      uni.onSocketOpen(() => {
        console.log("WS连接成功");
      });

      uni.onSocketMessage((res) => {
        const delta = res.data;

        if (!that.messageList[aiIndex]) return;

        const msg = that.messageList[aiIndex];
        const newContent = (msg.content || "") + delta;

        that.$set(msg, "content", newContent);
        
        // 流式过程中的渲染（可能会被截断，但整体结构会在结束后重新渲染）
        that.$set(msg, "renderedHtml", that.renderMarkdownToHtml(newContent));

        that.scrollToBottom();

        if (delta.includes("[[END]]")) {
          console.log("WS结束");
          uni.closeSocket();
          that.isStreaming = false;
          
          // 流式结束后，重新完整渲染一次，确保代码块完整
          setTimeout(() => {
            that.$set(msg, "renderedHtml", that.renderMarkdownToHtml(msg.content));
            that.$forceUpdate();
          }, 100);
        }
      });

      uni.onSocketError((err) => {
        console.error("WS错误", err);
      });

      uni.onSocketClose(() => {
        console.log("WS关闭");
      });
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

      const llm_refer_data = this.getReferencedTitles();

      // 1. 先加用户消息到列表
      const userMsg = {
        role: "user",
        content: content,
        created_time: this.formatTimeShort(new Date()),
        llm_refer_data: llm_refer_data, 
        isReferencesExpanded: false
      };
      this.messageList.push(userMsg);
      
      // 2. 加一个空的AI消息（用来流式打字）- 使用 $set 确保响应式
      const aiMsgIndex = this.messageList.length;
      const aiMsg = {
        role: "assistant",
        content: "",
        renderedHtml: "",
        llm_refer_data:[],
        created_time: this.formatTimeShort(new Date()),
        suggestions: [],
        sources: []
      };
      this.messageList.push(aiMsg);
      
      // 确保 AI 消息是响应式的
      this.$set(this.messageList, aiMsgIndex, aiMsg);
      
      const aiIndex = aiMsgIndex; // 保存索引供后续使用

      const currentInput = this.inputText;
      const currentNewsIds = [...this.selectedNewsIds]; // 拷贝一份用于发送
      console.log("发送消息:", currentInput, "关联新闻ID:", currentNewsIds);

      this.inputText = "";
      this.textareaHeight = 50;
      this.selectedNewsIds = [];

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
            "session_id": this.currentSessionId || 0,
            "news_ids": currentNewsIds 
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
        console.error('--- 发送消息详细错误 ---');
        console.error(err);

        if (err.data && err.data.msg) {
          console.error('后端报错信息:', err.data.msg);
          uni.showToast({ title: err.data.msg, icon: 'none' });
        } else if (err.message) {
          console.error('前端捕获错误:', err.message);
          uni.showToast({ title: err.message || '发送失败', icon: 'none' });
        } else {
          uni.showToast({ title: '网络异常或未知错误', icon: 'none' });
        }
        this.isStreaming = false;
        // 移除失败的 AI 消息
        if (this.messageList[aiIndex]) {
          this.messageList.splice(aiIndex, 1);
        }
        uni.showToast({ title: err.data?.msg || '发送失败', icon: 'none' });
      }
    },
    toggleUserReference(index) {
      if (this.messageList[index]) {
        // 使用 $set 确保响应式更新
        this.$set(this.messageList[index], 'isReferencesExpanded', !this.messageList[index].isReferencesExpanded);
      }
    },
    getReferencedTitles() {
      if (!this.selectedNewsIds.length) return [];
      return this.recentHistory
        .filter(item => this.selectedNewsIds.includes(item.id))
        .map(item => item.title);
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