import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      // 推送数量
      showHint: false,
      hintTimer: null,
      pushCount: 12,

      // ✅ 修复：必须在 data 声明 tempSelectedCategories
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
  onLoad() { },
  methods: {
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

      // ✅ 关键：每次打开弹窗，都将当前已选中的类别复制一份给临时变量
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
      return this.tempSelectedCategories.some(item => item.id === id);
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
      const index = this.selectedCategories.findIndex(item => item.id === id);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      }
    },
    toggleTempCategory(cat) {
      // 使用 findIndex 通过 ID 判断是否存在
      const index = this.tempSelectedCategories.findIndex(item => item.id === cat.id);

      if (index > -1) {
        // 如果存在，移除
        this.tempSelectedCategories.splice(index, 1);
      } else {
        // 如果不存在，添加新对象
        // 确保存入的对象结构一致，方便后续展示和提交
        this.tempSelectedCategories.push({
          id: cat.id,
          tag_name: cat.tag_name,
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
      this.weightList[index].value = e.detail.value
    },
    resetWeight() {
      this.weightList = [
        { name: '全球政策与法规', value: 80, color: '#4080ff', icon: '/static/icons/weight1.png' },
        { name: '行业趋势与洞察', value: 70, color: '#9370db', icon: '/static/icons/weight2.png' },
        { name: '市场机会与商机', value: 60, color: '#39c5bb', icon: '/static/icons/weight3.png' },
        { name: '技术创新与工具', value: 50, color: '#ff9800', icon: '/static/icons/weight4.png' },
        { name: '竞争动态与企业', value: 40, color: '#4080ff', icon: '/static/icons/weight5.png' },
        { name: '重要新闻与事件', value: 30, color: '#7b68ee', icon: '/static/icons/weight6.png' }
      ]
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
      console.log('保存的设置：', {
        pushCount: this.pushCount,
        selectedCategories: this.selectedCategories,
        notifyMethod: this.notifyMethod,
        email: this.email,
        verifyCode: this.verifyCode,
        aiModel: this.aiModel,
        weightList: this.weightList
      })
      uni.showToast({ title: '保存成功', icon: 'success' })
    }
  }
}