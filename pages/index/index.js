import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      categories: [],
      newsList: [],

      // 分页状态
      page: 1,
      pageSize: 10,
      total: 0,
      isLoading: false,
      isFinished: false,

      showBackToTop: false,
    }
  },
  onLoad() {
    this.getNewsList() // 首次加载
    this.getCategories() // 获取分类
  },
  
  // 页面触底自动触发
  onReachBottom() {
    if (this.isLoading || this.isFinished) {
      return
    }
    
    console.log('触发上拉加载，准备加载第', this.page + 1, '页')
    this.page++ 
    this.getNewsList(true) // 传入 true，表示是“加载更多”
  },  onPageScroll(e) {
    // e.scrollTop 是当前滚动条距离顶部的距离 (px)
    // 当滚动超过 300px (约半屏) 时显示按钮
    this.showBackToTop = e.scrollTop > 300
  },
  

  methods: {
    backToTop() {
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 300 // 动画时长，单位 ms
      })
    },
    /**
     * 获取新闻列表
     * @param {Boolean} isLoadMore - 是否为加载更多模式（默认为 false，即首次加载）
     */
    async getNewsList(isLoadMore = false) {
      // 1. 如果正在加载中，直接返回，防止重复请求
      if (this.isLoading) return
      
      this.isLoading = true

      // 2. 如果是加载更多，显示 Loading 提示
      if (isLoadMore) {
        uni.showLoading({
          title: '加载中...',
          mask: true
        })
      }

      try {
        const res = await request({
          url: '/news_detail/get_news_detail',
          data: {
            page: this.page,
            page_size: this.pageSize // 注意：通常后端 Python/FastAPI 喜欢用下划线 page_size
          }
        })
        
        console.log('接口返回：', res)
        
        if (res.code === 200 || res.code === '200') {
          const newList = res.data.result.map(item => ({
            ...item,
            published_at: item.published_at.replace('T', ' ')
          }))

          // 3. 根据模式处理数据
          if (isLoadMore) {
            // 【关键修复】这里是 this.newsList，不是 this.newList
            this.newsList = [...this.newsList, ...newList]

            // 4. 判断是否还有更多数据
            const total = res.data.total || 0
            
            // 策略A：如果后端返回了 total
            if (total > 0) {
              if (this.newsList.length >= total) {
                this.isFinished = true
                uni.showToast({ title: '没有更多数据了', icon: 'none' })
              }
            } 
            // 策略B：如果后端没返回 total，靠返回数量判断
            else {
              if (newList.length < this.pageSize) {
                this.isFinished = true
                uni.showToast({ title: '没有更多了', icon: 'none' })
              }
            }
          } else {
            // 5. 首次加载：直接赋值
            this.newsList = newList
            
            // 如果第一页数据就不够一页，说明也没更多了
            if (newList.length < this.pageSize) {
               this.isFinished = true
            }
          }
        }
      } catch (err) {
        console.error('请求新闻失败：', err)
        uni.showToast({ title: '请求失败，请重试', icon: 'none' })
        
        // 6. 失败回退页码，方便用户再次触底重试
        if (isLoadMore) {
          this.page-- 
        }
      } finally {
        // 7. 无论成功失败，都结束 loading 状态
        this.isLoading = false
        if (isLoadMore) {
          uni.hideLoading()
        }
      }
    },

    async getCategories() { // 修正方法名拼写
      try {
        const res = await request({
          url: '/category/get_category',
        })
        console.log('分类返回：', res)
        if (res.code === 200 || res.code === '200') {
          this.categories = res.data
        }
      } catch (err) {
        console.error("请求分类失败", err)
      }
    },

    toDetail(item) {
      console.log('点击了：', item.id)
      uni.navigateTo({
        url: `/pages/news_detail/news_detail?id=${item.id}`,
        success: (res) => {
          console.log('跳转成功', res);
        },
        fail: (err) => {
          console.error('跳转失败', err);
        }
      });
    },

    switchTab(index) {
      console.log('切换tab：', index)
      // 如果需要切换分类刷新列表，可在此重置分页
      // this.page = 1
      // this.isFinished = false
      // this.newsList = []
      // this.getNewsList()
    }
  }
}