export default {
  data() {
    return {
      // 推送数量
      showHint: false,
      hintTimer:null,
      pushCount: 12,
      // 推送类别
      categoryOptions: [
        '科技与数字服务',
        '消费与零售',
        '工业与制造',
        '金融与保险',
        '医疗与健康',
        '跨境电商与贸易',
        '物流与供应链'
      ],
      selectedCategories: ['科技与数字服务', '消费与零售'],
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
        { name: '全球政策与法规', value: 80, color: '#4080ff', icon: '/static/icons/weight1.png' },
        { name: '行业趋势与洞察', value: 70, color: '#9370db', icon: '/static/icons/weight2.png' },
        { name: '市场机会与商机', value: 60, color: '#39c5bb', icon: '/static/icons/weight3.png' },
        { name: '技术创新与工具', value: 50, color: '#ff9800', icon: '/static/icons/weight4.png' },
        { name: '竞争动态与企业', value: 40, color: '#4080ff', icon: '/static/icons/weight5.png' },
        { name: '重要新闻与事件', value: 30, color: '#7b68ee', icon: '/static/icons/weight6.png' }
      ],
      // 预览标签
      previewTags: ['AI营销工具趋势', '东南亚支付政策更新', '跨境电商最新动态']
    }
  },
  onLoad() {
    // 初始化弹窗
    this.$refs.categoryPopup && this.$refs.categoryPopup.close()
  },
  methods: {
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
        }, 1500); // 3000毫秒 = 3秒
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
    removeCategory(index) {
      this.selectedCategories.splice(index, 1)
    },
    toggleCategory(cat) {
      const index = this.selectedCategories.indexOf(cat)
      if (index > -1) {
        this.selectedCategories.splice(index, 1)
      } else {
        this.selectedCategories.push(cat)
      }
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
      // 重置为默认值
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
      // 这里可以调用接口保存数据
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