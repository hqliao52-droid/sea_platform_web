import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      // 推送数量
      showHint: false,
      hintTimer: null,
      pushCount: 12,

      tempSelectedCategories: [],
      showCategoryPicker: false,

      // 推送类别
      categoryOptions: [],
      selectedCategories: [],
      showCategoryModal: false,

      // 通知方式
      notifyMethod: '邮箱',
      showNotifyModal: false,

      // 邮箱相关
      email: '',
      verifyCode: '',

      // AI 模型
      aiModel: '豆包-lite',
      showAiModal: false,

      // 权重列表
      weightList: [
        { name: '全球政策与法规', value: 80, color: '#4080ff' }
      ],

      // 预览标签
      previewTags: ['AI营销工具趋势', '东南亚支付政策更新', '跨境电商最新动态']
    }
  },
  async onLoad() {
    await this.getUserConfig();
  },
  methods: {
    async getUserConfig() {
      try {
        uni.showLoading({ title: '加载中...' });
        
        const res = await request({
          url: '/userConfig/get_config',
          method: 'POST',
          // 没有请求参数，token 通常由 request 拦截器自动携带
        });

        // 【关键】先打印返回数据，方便调试和确定下一步逻辑
        console.log('用户配置接口返回：', res);

        if (res.code === 200 || res.code === '200') {
          // TODO: 下一步操作：根据 res.data 初始化页面数据
          // 例如：
          // this.pushCount = res.data.push_count;
          // this.selectedCategories = res.data.categories;
          // this.email = res.data.email;
          // etc.
        } else {
          uni.showToast({ title: res.msg || '获取配置失败', icon: 'none' });
        }
      } catch (err) {
        console.error('获取用户配置失败：', err);
        uni.showToast({ title: '网络异常', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },
    async openCategoryModal() {
      try {
        const res = await request({
          url: '/category/get_category',
        })
        if (res.code === 200 || res.code === '200') {
          this.categoryOptions = res.data;
        }
      } catch (err) {
        console.error('类别请求失败：', err);
      }

      // 使用 JSON.parse(JSON.stringify()) 进行深拷贝，防止引用污染，或者直接展开运算符
      this.tempSelectedCategories = JSON.parse(JSON.stringify(this.selectedCategories));

      this.showCategoryPicker = true;
    },
    isCategorySelected(id) {
      // 确保 tempSelectedCategories 存在且是数组
      if (!this.tempSelectedCategories || !Array.isArray(this.tempSelectedCategories)) {
        return false;
      }
      // 使用 some 查找是否有匹配的 ID
      return this.tempSelectedCategories.some(item => item.category_id === id);
    },
    closeCategoryPicker() {
      this.showCategoryPicker = false;
      // uni.setPageStyle({ scrollBounce: true });
    },

    toggleHint() {
      if (this.hintTimer) {
        clearTimeout(this.hintTimer);
        this.hintTimer = null;
      }
      this.showHint = !this.showHint;
      if (this.showHint) {
        this.hintTimer = setTimeout(() => {
          this.showHint = false;
          this.hintTimer = null;
        }, 1500);
      }
    },
    goBack() {
      uni.navigateBack()
    },
    // 增减推送数量
    decreaseCount() {
      if (this.pushCount > 0) {
        this.pushCount--
      }
    },
    increaseCount() {
      if (this.pushCount < 24) {
        this.pushCount++
      }
    },
    // 类别操作
    removeCategory(id) {
      // 找到该 ID 在数组中的索引
      const index = this.selectedCategories.findIndex(item => item.category_id === id);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      }
    },
    toggleTempCategory(cat) {
      console.log('toggleCategory:', cat);
      // 使用 findIndex 通过 ID 判断是否存在
      const index = this.tempSelectedCategories.findIndex(item => item.category_id === cat.id);

      if (index > -1) {
        // 如果存在，移除
        this.tempSelectedCategories.splice(index, 1);
      } else {
        // 如果不存在，添加新对象
        // 确保存入的对象结构一致，方便后续展示和提交
        this.tempSelectedCategories.push({
          category_id: cat.id,
          category_name: cat.tag_name,
          weight: null,
          example: cat.example // 如果后续需要用到 example 也一起存下来
        });
      }
    },
    confirmCategorySelect() {
      this.selectedCategories = [...this.tempSelectedCategories]
      this.closeCategoryPicker()
    },
    clearCategories() {
      this.selectedCategories = []
    },
    showMoreCategories() {
      uni.showToast({ title: '暂无更多类别', icon: 'none' })
    },
    // 权重滑块
    handleSliderChange(e, index) {
      this.selectedCategories[index].weight = e.detail.weight
    },
    resetWeight() {
      this.selectedCategories = []
      uni.showToast({ title: '已重置', icon: 'success' })
    },
    // 获取验证码
    getVerifyCode() {
      if (!this.email) {
        uni.showToast({ title: '请先输入邮箱', icon: 'none' })
        return
      }
      uni.showToast({ title: '验证码已发送', icon: 'success' })
    },
    // 查看示例
    viewExample() {
      uni.showToast({ title: '示例页面开发中', icon: 'none' })
    },
    // 保存设置
    saveSettings() {
      const params = {
        max_push_amount: this.pushCount,
        selectedCategories: this.selectedCategories,
        notifyMethod: this.notifyMethod,
        email: this.email,
        verifyCode: this.verifyCode,
        aiModel: this.aiModel,
        weightList: this.weightList
      }
      console.log('保存的设置：', params)
      uni.showToast({ title: '保存成功', icon: 'success' })
    }
  }
}