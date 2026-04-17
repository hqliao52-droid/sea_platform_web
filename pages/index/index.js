import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      categories: [],
      newsList: [],
    }
  },
  onLoad() {
    this.getNewsList(),
	this.getCatrgories()
	
  },
  methods: {
    async getNewsList() {
      try {
        const res = await request({
          url: '/news_detail/get_news_detail',
        })
        console.log('接口返回：', res)
        if (res.code === 200 || res.code === '200') {
          this.newsList = res.data.result.map(item => {
            return {
              ...item,
              published_at: item.published_at.replace('T', ' ')
            }
          })
        }
      } catch (err) {
        console.error('请求新闻失败：', err)
      }
    },
    async getCatrgories() {
      try{
        const res = await request({
          url:'/category/get_category',
        })
        console.log('分类返回：', res )
        if (res.code === 200 || res.code === '200'){
          this.categories = res.data
        }
      } catch (err){
        console.error("请求失败",err)
      }
    },
    toDetail(item) {
      console.log('点击了：', item.id)
      // 使用 uni.navigateTo 进行跳转，保留当前页面，允许返回
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
    }
  }
}