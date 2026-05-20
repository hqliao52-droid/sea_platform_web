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
      countdown: 0,
      isCountingDown: false,
      timer: null,
      verifyStatus: null,


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
    this.onUnload();
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
          weight: 0,
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
      console.log('handleSliderChange:', index)
      console.log('handleSliderChange:', e,)
      this.selectedCategories[index].weight = e.detail.value
    },
    resetWeight() {
      if(this.selectedCategories.length === 0){
        uni.showToast({title:"请先选择推送类别", icon: "none"})
        return ;
      }
      // 1. 遍历已选类别，重新分配权重
      this.selectedCategories.forEach((item, index) => {
        // 计算逻辑：首项 80，公差 -8
        // 公式：80 - (index * 8)
        let newWeight = 80 - (index * 8);

        // 2. 确保最低不低于 20%
        if (newWeight < 20) {
          newWeight = 20;
        }

        // 3. 更新权重值
        item.weight = newWeight;
      });
      uni.showToast({ title: '已重置', icon: 'success' })
    },
    onVerifyCodeInput(e) {
      const val = e.detail.value;
      this.verifyCode = val;
      
      // 重置验证状态，因为用户正在修改
      this.verifyStatus = null;

      // 如果长度达到6位，且邮箱已填写，则自动触发验证
      if (val.length === 6 && this.email) {
        this.autoVerifyCode(val);
      }
    },
    async autoVerifyCode(code) {
      try {
        // 可选：显示一个微小的加载提示，或者静默请求
        uni.showLoading({ title: '验证中...', mask: true }); 
        
        const res = await request({
          url: '/email/verify_code',
          method: 'POST',
          data: {
            email: this.email,
            code: code
          }
        });

        // uni.hideLoading();

        if (res.code === 200 || res.code === '200') {
          this.verifyStatus = 'success';
          // uni.showToast({ title: '验证成功', icon: 'none' }); // 可选：是否弹出提示
        } else {
          this.verifyStatus = 'error';
          // uni.showToast({ title: res.msg || '验证码错误', icon: 'none' });
        }
      } catch (err) {
        // uni.hideLoading();
        console.error('自动验证失败：', err);
        this.verifyStatus = 'error';
      }
    },
    // 获取验证码
    async getVerifyCode() {
      // 1. 基础校验
      if (!this.email) {
        uni.showToast({ title: '请先输入邮箱', icon: 'none' })
        return
      }
      
      // 2. 邮箱格式简单校验
      const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailReg.test(this.email)) {
        uni.showToast({ title: '请输入正确的邮箱地址', icon: 'none' });
        return;
      }

      // 3. 如果正在倒计时，直接返回，防止重复点击
      if (this.isCountingDown) {
        return;
      }

      try {
        uni.showLoading({ title: '发送中...' });
        
        const res = await request({
          url: '/email/send_code',
          method: 'POST',
          data: {
            email: this.email
          }
        });

        uni.hideLoading();

        if (res.code === 200 || res.code === '200') {
          uni.showToast({ title: '验证码已发送', icon: 'success' });
          // 4. 启动倒计时
          this.startCountdown();
        } else {
          uni.showToast({ title: res.msg || '发送失败', icon: 'none' });
        }
      } catch (err) {
        uni.hideLoading();
        console.error('获取验证码失败：', err);
        uni.showToast({ title: '网络异常', icon: 'none' });
      }
    },
    startCountdown() {
      this.isCountingDown = true;
      this.countdown = 60;
      
      // 清除可能存在的旧定时器
      if (this.timer) {
        clearInterval(this.timer);
      }

      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          // 倒计时结束
          this.isCountingDown = false;
          clearInterval(this.timer);
          this.timer = null;
        }
      }, 1000);
    },
    onUnload() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
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