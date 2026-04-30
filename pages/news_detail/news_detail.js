import { request } from '@/utils/request.js'
import { addReadHistory } from '@/utils/history.js';

export default {
  data() {
    return {
      news_id: '',
      newsData:{},
      news_title: '',
      // AI核心摘要列表
      aiSummaryList: [],
      // 文章标签
      articleTags: [],
      // 关键词列表
      keywordList: [],
      rss_source_name:'',

      rss_name: '',

      // 关联政策与案例列表
      content:'',
      isContentExpanded: false, 
      displayContent: '' ,
      market_risk: '',
      policy_compliance: '',
      risk: false,
      relationList: [
        {
          type: "政策",
          rate: 98,
          title: "印尼 PMK 96/2023 关税法案",
          desc: "针对书籍、化妆品等 8 类商品降低关税起征点至 3 美元。"
        },
        {
          type: "案例",
          rate: 85,
          title: "某知名 3C 品牌新加坡海外仓案例",
          desc: "通过在前置仓完成预分拣，将清关时间从 3 天缩短至 6 小时。"
        }
      ],
      articleInfo:null,
    };
  },
  onLoad (options){
    this.news_id = options.id;
    console.log('news_id:',this.news_id)

    this.getNewsDetail(this.news_id);
  },
  computed:{
    processedContent() {
      if (!this.content) return '';
      
      // 如果已经展开，或者长度小于等于50，显示全部
      if (this.isContentExpanded || this.content.length <= 50) {
        return this.content;
      }
      
      // 否则显示前50个字 + ...
      return this.content.substring(0, 120) + '...';
    }
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    viewAll() {
      uni.showToast({ title: "查看全部", icon: "none" });
    },
    openSetting() {
      uni.showToast({ title: "配置推送规则", icon: "none" });
    },
    // 显示全文
    toggleContent() {
      this.openInBrowser();
    },
    /**
     * 判断是否应该使用系统浏览器打开
     * @param {String} url 
     * @returns {Boolean}
     */
    shouldOpenInSystemBrowser(url) {
      if (!url) return true;
      
      // 定义不允许 iframe/webview 嵌入的常见域名关键词
      const blockedDomains = [
        'oschina.net',      // 开源中国
        'zhihu.com',        // 知乎
        'github.com',       // GitHub
        'juejin.cn',        // 掘金
        'csdn.net',         // CSDN (部分页面限制)
        'medium.com',       // Medium
        'twitter.com',      // Twitter
        'facebook.com'      // Facebook
      ];

      try {
        // 简单解析域名，兼容 http/https
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        
        // 检查 hostname 是否包含黑名单中的任何一项
        return blockedDomains.some(domain => hostname.includes(domain));
      } catch (e) {
        // 如果 URL 格式错误，保守起见使用系统浏览器
        console.warn('URL解析失败，默认使用系统浏览器', e);
        return true;
      }
    },
    // 新增：打开系统浏览器
     openInBrowser() {
      if (!this.newsData || !this.newsData.url) {
        uni.showToast({ title: '暂无原文链接', icon: 'none' });
        return;
      }

      const targetUrl = this.newsData.url;
      const useSystemBrowser = this.shouldOpenInSystemBrowser(targetUrl);

      if (useSystemBrowser) {
        // --- 策略 A: 使用系统浏览器 ---
        uni.showModal({
          title: '提示',
          content: '该链接需在外部浏览器中查看，是否立即跳转？',
          success: (res) => {
            if (res.confirm) {
              // #ifdef H5
              window.open(targetUrl, '_blank');
              // #endif
              
              // #ifdef APP-PLUS
              plus.runtime.openURL(targetUrl);
              // #endif
              
              // #ifdef MP-WEIXIN
              uni.setClipboardData({
                data: targetUrl,
                success: () => uni.showToast({ title: '链接已复制', icon: 'none' })
              });
              // #endif
            }
          }
        });
      } else {
        // --- 策略 B: 尝试 App 内部打开 ---
        uni.showModal({
          title: '提示',
          content: '将在应用内打开原文链接',
          success: (res) => {
            if (res.confirm) {
              const encodedUrl = encodeURIComponent(targetUrl);
              // 注意：这里路径必须与 pages.json 和实际文件路径完全一致（全小写）
              uni.navigateTo({
                url: `/pages/webView/webView?url=${encodedUrl}`,
                fail: (err) => {
                  console.error('跳转 WebView 失败', err);
                  uni.showToast({ title: '打开失败，请重试', icon: 'none' });
                }
              });
            }
          }
        });
      }
    },

    viewAll() {
      uni.showToast({ title: "查看全部", icon: "none" });
    },
    openSetting() {
      uni.showToast({ title: "配置推送规则", icon: "none" });
    },
    async getNewsDetail(){
      try {
        const res = await request({
          url: '/news_detail/get_detail_by_id?id='+this.news_id,
          
        })
        console.log('接口返回：', res)
        if (res.code === 200 || res.code === '200') {
          this.newsData = res.data
          if(res.data){
            this.news_title = res.data.title;
            this.content = res.data.content || '';
            this.keywordList = res.data.ai_origin_output?.keywords || [];
            if(res.data.ai_origin_output.policy_risk.market_risk !== "未提及"){
              this.market_risk = res.data.ai_origin_output?.policy_risk.market_risk || '';
              this.policy_compliance = res.data.ai_origin_output?.policy_risk.policy_compliance || '';
              this.risk = true;
            }
            const detail = res.data;
            this.articleInfo = detail;
            addReadHistory(detail);

            console.log(res.data);
            
            const abstract = res.data.ai_origin_output?.abstract || '';
            if (abstract) {
              this.aiSummaryList = abstract.match(/[\s\S]*?。/g) || [abstract];
            } else {
              this.aiSummaryList = [];
            }

            try{
              const res_rss = await request({
                url: '/rss/get_by_url?url='+res.data.origin_entry.source,
              })
              if (res_rss.code === 200 || res_rss.code === '200') {
                this.rssData = res_rss.data
                this.rss_name = res_rss.data.name
              }
            }
            catch (err) {
              console.error('请求RSS失败：', err)
            }

          }
        }
        console.log('newsData:',this.newsData)
      } catch (err) {
        console.error('请求新闻失败：', err)
      }
    }
  }
};