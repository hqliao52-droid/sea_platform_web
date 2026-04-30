import {request} from '@/utils/request.js';
import { getUserInfo } from '@/utils/user.js';
import { getReadHistory } from '@/utils/history.js';

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
        // 找到后端最后一条 assistant
        const serverAssistant = [...list].reverse().find(m => m && m.role === 'assistant');
        if (!serverAssistant) return;

        if (!this.messageList[aiIndex] || this.messageList[aiIndex].role !== 'assistant') return;

        const content = serverAssistant.content || '';
        this.$set(this.messageList[aiIndex], 'content', content);
        this.$set(this.messageList[aiIndex], 'renderedHtml', this.renderMarkdownToHtml(content));
        if (serverAssistant.created_time) {
          this.$set(this.messageList[aiIndex], 'created_time', serverAssistant.created_time);
        }
        console.log('assistant 气泡已从后端刷新（markdown恢复）');
      } catch (e) {
        console.error('refreshAssistantMessageFromServer error:', e);
      }
    },

    // 流式接收 LLM 输出
    startStream(taskId, aiIndex) {
      const that = this;  // 关键：保存 Vue 实例
      let buffer = "";
      let contentUpdateCount = 0;
      let finished = false;
      let lastRenderedUpdateCount = 0;
      const decoder = new TextDecoder("utf-8");
      const isH5Env = (typeof window !== 'undefined');
      let didServerRefresh = false;

      // 将 uni.request 的分块数据/最终响应统一解码成文本
      const decodeToText = (data) => {
        if (typeof data === "string") return data;
        if (data instanceof ArrayBuffer) return decoder.decode(new Uint8Array(data), { stream: true });
        if (ArrayBuffer.isView(data)) return decoder.decode(data, { stream: true });
        // 兼容某些环境下包装结构：{ data: ArrayBuffer }
        if (data && typeof data === "object" && data.data instanceof ArrayBuffer) {
          return decoder.decode(new Uint8Array(data.data), { stream: true });
        }
        return String(data || "");
      };
      
      if (!this.messageList[aiIndex]) {
        console.error('AI消息对象不存在, aiIndex:', aiIndex);
        return;
      }

      console.log('开始流式接收, taskId:', taskId, 'aiIndex:', aiIndex);

      // 解析 SSE 文本行（只关心 data: xxx）
      const processLine = (rawLine) => {
        if (finished) return;

        let line = (rawLine || "").trim();
        if (!line || line.startsWith(":")) return;

        // 服务端结束/错误标记可能不是 data: 前缀形式
        if (line.includes("[[END]]")) {
          finished = true;
          that.isStreaming = false;
          if (that.messageList[aiIndex]) {
            const finalContent = that.messageList[aiIndex].content || '';
            that.$set(that.messageList[aiIndex], 'renderedHtml', that.renderMarkdownToHtml(finalContent));
          }
          console.log("流结束，总更新次数:", contentUpdateCount);
          that.$forceUpdate();
          // H5 环境下，流式分片可能导致 markdown 换行语义不一致
          // 用一次“后端最终内容”刷新当前 assistant 气泡，恢复样式
          if (isH5Env && !didServerRefresh) {
            didServerRefresh = true;
            that.refreshAssistantMessageFromServer(aiIndex);
          }
          return;
        }

        if (line.includes("[[ERROR]]")) {
          finished = true;
          that.isStreaming = false;
          uni.showToast({ title: '生成失败', icon: 'none' });
          if (that.messageList[aiIndex] && !that.messageList[aiIndex].content) {
            that.messageList.splice(aiIndex, 1);
          }
          if (that.messageList[aiIndex]) {
            const finalContent = that.messageList[aiIndex].content || '';
            that.$set(that.messageList[aiIndex], 'renderedHtml', that.renderMarkdownToHtml(finalContent));
          }
          that.$forceUpdate();
          return;
        }

        if (!line.startsWith("data:")) return;

        // 兼容 data: 后面可能有空格的情况
        // 关键：服务端可能用 `data:` 空行表示换行/段落分隔，这里要保留为 '\n'
        const deltaRaw = line.substring(5); // data: 后面的原始字符串（可能为空）
        let delta = deltaRaw.trim();
        if (deltaRaw === '') {
          delta = '\n';
        }

        // 服务端结束标记
        if (delta.includes("[[END]]")) {
          finished = true;
          that.isStreaming = false;
          if (that.messageList[aiIndex]) {
            const finalContent = that.messageList[aiIndex].content || '';
            that.$set(that.messageList[aiIndex], 'renderedHtml', that.renderMarkdownToHtml(finalContent));
          }
          console.log("流结束，总更新次数:", contentUpdateCount);
          that.$forceUpdate();
          if (isH5Env && !didServerRefresh) {
            didServerRefresh = true;
            that.refreshAssistantMessageFromServer(aiIndex);
          }
          return;
        }

        // 服务端错误标记
        if (delta.includes("[[ERROR]]")) {
          finished = true;
          that.isStreaming = false;
          uni.showToast({ title: '生成失败', icon: 'none' });
          if (that.messageList[aiIndex] && !that.messageList[aiIndex].content) {
            that.messageList.splice(aiIndex, 1);
          }
          if (that.messageList[aiIndex]) {
            const finalContent = that.messageList[aiIndex].content || '';
            that.$set(that.messageList[aiIndex], 'renderedHtml', that.renderMarkdownToHtml(finalContent));
          }
          that.$forceUpdate();
          return;
        }

        // 避免把仅空格的 data: 当成正文
        if (delta === '') return;

        contentUpdateCount++;
        if (!that.messageList[aiIndex]) {
          console.error('AI消息对象在更新时丢失');
          return;
        }

        const currentContent = that.messageList[aiIndex].content || '';
        const newContent = currentContent + delta;
        that.$set(that.messageList[aiIndex], 'content', newContent);

        // 流式渲染时并不需要每次都全量 markdown->html（会更卡），这里每追加两段再更新一次富文本
        const shouldRenderNow =
          contentUpdateCount === 1 ||
          (contentUpdateCount - lastRenderedUpdateCount) >= 2;

        if (shouldRenderNow) {
          that.$set(that.messageList[aiIndex], 'renderedHtml', that.renderMarkdownToHtml(newContent));
          lastRenderedUpdateCount = contentUpdateCount;
        }

        console.log(`更新 #${contentUpdateCount}:`, delta, '当前长度:', newContent.length);
        that.scrollToBottom();
      };

      const processTextChunk = (textChunk) => {
        if (finished) return;
        if (!textChunk) return;

        buffer += textChunk;
        // 兼容 \n / \r\n / \r
        const lines = buffer.split(/\r\n|\n|\r/);
        // 最后一行可能是不完整的，先留到下次拼接
        buffer = lines.pop() || "";
        for (let line of lines) {
          processLine(line);
          if (finished) return;
        }
      };

      const startByUniRequest = () => {
        const requestTask = uni.request({
          url: `/chatMessage/chat_stream/${taskId}`,
          method: "GET",
          enableChunkedResponse: true,
          responseType: "text",
          header: {
            'Accept': 'text/event-stream'
          },
          onChunkReceived: (res) => {
            try {
              // 部分环境下 res.data 可能是 string，也可能是 ArrayBuffer/TypedArray
              const chunkText = decodeToText(res?.data);

              if (chunkText) {
                console.log('收到数据块, 长度:', chunkText.length);
              }
              processTextChunk(chunkText);
            } catch (e) {
              console.error('解析流数据出错', e);
            }
          },
          success: (res) => {
            that.isStreaming = false;
            console.log('流请求完成');
            // 解析最后残留的 buffer（onChunkReceived 可能留了最后一行未以换行结尾）
            try {
              // H5/部分端可能不触发 onChunkReceived，这里用 success(res.data) 做兜底
              const shouldFallbackParse =
                !finished &&
                contentUpdateCount === 0 &&
                res && res.data;

              if (shouldFallbackParse) {
                const fullText = decodeToText(res.data);
                if (fullText && fullText.trim()) {
                  console.log('onChunkReceived 未增量更新，使用 success(res.data) 兜底解析');
                  processTextChunk(fullText);
                }
              }

              if (!finished && buffer && buffer.trim()) {
                // 直接按“data:”行规则处理，避免把原始 SSE 内容（包含 data: 前缀）塞进正文
                processLine(buffer);
              }
              // decoder flush（如果上面使用了 stream: true）
              if (!finished) {
                const tail = decoder.decode(); // flush
                if (tail && tail.trim()) processLine(tail);
              }
            } catch (e) {
              console.error('解析 success 阶段残留失败', e);
            } finally {
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
      };

      // H5：优先用 fetch + ReadableStream 真正逐块读取 SSE，避免 onChunkReceived 只在 success 才回调
      const canUseFetchStream =
        typeof window !== 'undefined' &&
        typeof window.fetch === 'function' &&
        typeof window.ReadableStream !== 'undefined';

      if (canUseFetchStream) {
        const url = `/chatMessage/chat_stream/${taskId}`;
        (async () => {
          let usedFallback = false;
          try {
            const resp = await fetch(url, {
              method: "GET",
              headers: {
                'Accept': 'text/event-stream'
              }
            });

            if (!resp || !resp.body) {
              console.warn('fetch streaming 不支持（resp.body 为空），回退 uni.request');
              usedFallback = true;
              startByUniRequest();
              return;
            }

            const reader = resp.body.getReader();
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              if (finished) break;

              const chunkText = decoder.decode(value, { stream: true });
              processTextChunk(chunkText);

              if (finished) {
                try { reader.cancel && reader.cancel(); } catch (e) {}
                break;
              }
            }

            // 兜底：如果没有 [[END]]，至少关闭流状态并处理尾部残留
            if (!finished) {
              that.isStreaming = false;
              if (buffer && buffer.trim()) processLine(buffer);
              const tail = decoder.decode(); // flush
              if (tail && tail.trim()) processLine(tail);
            }

            // 如果服务端没有发 [[END]]，走兜底也刷新一次当前气泡
            if (isH5Env && !finished && !didServerRefresh) {
              didServerRefresh = true;
              that.refreshAssistantMessageFromServer(aiIndex);
            }
          } catch (e) {
            console.error('fetch SSE 流式读取失败，回退 uni.request', e);
            // 重置状态再启动回退请求，避免污染 uni.request 的解析
            buffer = "";
            contentUpdateCount = 0;
            finished = false;
            that.isStreaming = true;
            usedFallback = true;
            startByUniRequest();
          } finally {
            that.$forceUpdate();
            that.scrollToBottom();
          }
        })();

        return;
      }

      return startByUniRequest();
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