import { request } from '@/utils/request.js'
import { sendVerifyCode, verifyCode } from '@/utils/email.js'

export default {
  data() {
    return {
      updated_at: null,
      isUpdate: true,
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

      isFirstEdit: true,
      configId: null,
      isChannelEdit: false,
      channelTextStatus: false,

      // 邮箱相关
      email: '',
      verifyCode: '',
      countdown: 0,
      isCountingDown: false,
      timer: null,
      isChanged: true,
      verifyStatus: null,
      clearVerifyStatus: false,
      tempEmail: '',

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
    this.clearTimers();
  },
  onUnload() {
    this.clearTimers();
  },
  methods: {
    enableEdit() {
      this.isChanged = true;
      // 可选：聚焦后自动清空验证状态，因为邮箱可能要改
      this.verifyStatus = null;
      this.verifyCode = '';
      this.tempEmail = this.email;
    },
    disableEdit() {
      this.isChanged = false;
      this.email = this.tempEmail;
      this.verifyStatus = 'success';
    },
    clearTimers() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      if (this.hintTimer) {
        clearTimeout(this.hintTimer);
        this.hintTimer = null;
      }
      this.isCountingDown = false;
      this.countdown = 0;
    },
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
          if (res.data != null) {
            this.pushCount = res.data.max_push_amount;
            this.selectedCategories = res.data.weights || [];
            this.email = res.data.channels[0].channel_address || '';
            this.updated_at = res.data.updated_at;
            if (res.data.channels[0].channel_address != null) {
              this.isChanged = false;
              this.verifyStatus = 'success';
            }
            this.isUpdate = false;
          }

        } else {
          uni.showToast({ title: res.msg || '获取配置失败', icon: 'none' });
        }
      } catch (err) {
        console.error('获取用户配置失败：', err);
        uni.showToast({ title: '网络异常', icon: 'none' });
        this.isFirstEdit = true;
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
      if (this.selectedCategories.length === 0) {
        uni.showToast({ title: "请先选择推送类别", icon: "none" })
        return;
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
    onCodeFocus() {
      this.clearVerifyStatus = true;
    },
    onCodeBlur() {
      this.clearVerifyStatus = false;
    },
    clearVerifyCode() {
      this.verifyCode = '';
      this.verifyStatus = null; // 清除验证状态
      // 如果需要在清除后立即触发某些逻辑，可以在这里调用
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
        // 调用工具函数
        await verifyCode(this.email, code);

        // 成功逻辑
        this.verifyStatus = 'success';

      } catch (err) {
        // 失败逻辑
        this.verifyStatus = 'error';
        // 可选：如果希望验证失败也弹出提示，可以在这里加
        uni.showToast({ title: err.message || '验证码错误', icon: 'none' });
      }
    },
    // 获取验证码
    async getVerifyCode() {
      if (this.isCountingDown) {
        return;
      }

      try {
        // 调用工具函数，内部已包含校验和 Loading
        await sendVerifyCode(this.email);
        // 成功后的逻辑：提示成功 & 启动倒计时
        uni.showToast({ title: '验证码已发送', icon: 'success' });
        this.startCountdown();

      } catch (err) {
        // 错误已在工具函数中处理（Toast），这里只需记录或做额外处理
        console.log('发送验证码流程结束');
      }
    },
    startCountdown() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.isCountingDown = true;
      this.countdown = 60;

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
    async saveSettings() {
      // 1. 邮箱验证逻辑保持不变
      if (this.notifyMethod === '邮箱' && this.verifyStatus !== "success") {
        uni.showToast({ title: '请先完成邮箱验证', icon: 'none' })
        return
      }

      // 2. 检查是否选择了类别
      if (this.isUpdate) {
        if (this.selectedCategories.length === 0) {
          // 【修改】使用 showModal 弹出确认框
          uni.showModal({
            title: '提示',
            content: '您当前没有制定任何推送类别，将为您保存为草稿',
            confirmText: '确定',
            cancelText: '取消',
            success: async (res) => {
              if (res.confirm) {
                // 用户点击确定，执行保存草稿逻辑
                await this.saveDraftConfig();
              } else if (res.cancel) {
                // 用户点击取消，不做任何操作
                console.log('用户取消了保存');
              }
            }
          });
          return; // 注意：这里直接 return，等待弹窗回调
        }
      }


      // 3. 如果选择了类别，执行正常的保存逻辑（假设已有逻辑或复用下面的保存方法）
      await this.submitFullConfig();
    },

    async saveDraftConfig() {
      try {
        uni.showLoading({ title: '保存中...' });

        // 构建 weights 数组
        // 根据 selectedCategories 生成，如果没有选择则为空数组
        const weights = this.selectedCategories.map(item => ({
          category_id: item.category_id,
          category_name: item.category_name,
          weight: item.weight || 0 // 默认权重为0，或者你可以保留之前设置的权重
        }));

        // 构建 channels 数组
        // 根据当前选择的 notifyMethod 和 email 构建
        const channels = [];
        if (this.notifyMethod === '邮箱' && this.email) {
          channels.push({
            channel_address: this.email,
            channel_type: 'email', // 假设类型为 email，根据后端定义调整
            is_enabled: 1, // 草稿状态可能设为0或1，视业务而定，这里暂设1表示配置了该渠道
            priority: 1
          });
        }

        // 构建完整参数
        const params = {
          user_id: 0, // 实际项目中通常从登录信息获取，或者后端从Token解析，这里按示例填0
          max_push_amount: this.pushCount,
          is_enabled: 0, // 草稿状态通常设为未启用 (0)
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          weights: weights,
          channels: channels
        };

        console.log('保存草稿参数：', params);

        const res = await request({
          url: '/userConfig/insert_config',
          method: 'PUT', // 注意：这里是 PUT 请求
          data: params
        });

        uni.hideLoading();

        if (res.code === 200 || res.code === '200') {
          uni.showToast({ title: '草稿保存成功', icon: 'success' });
          // 可选：保存成功后返回上一页或刷新页面
          // setTimeout(() => { uni.navigateBack(); }, 1500);
        } else {
          uni.showToast({ title: res.msg || '保存失败', icon: 'none' });
        }

      } catch (err) {
        uni.hideLoading();
        console.error('保存草稿失败：', err);
        uni.showToast({ title: '网络异常', icon: 'none' });
      }
    },
    async submitFullConfig() {
      try {
        uni.showLoading({ title: '保存中...' });

        // 构建 weights 数组
        const weights = this.selectedCategories.map(item => ({
          category_id: item.category_id,
          category_name: item.category_name,
          weight: item.weight || 80 // 正常保存时可能有默认权重
        }));

        // 构建 channels 数组
        const channels = [];
        if (this.notifyMethod === '邮箱' && this.email) {
          channels.push({
            channel_address: this.email,
            channel_type: 'email',
            is_enabled: 1,
            priority: 1
          });
        }

        const params = {
          user_id: 0,
          max_push_amount: this.pushCount,
          is_enabled: 1, // 正常保存通常设为启用 (1)
          updated_at: new Date().toISOString(),
          weights: weights,
          channels: channels
        };

        console.log('保存完整配置参数：', params);

        // 假设完整保存也是调用同一个接口，或者是另一个接口？
        // 如果接口相同，只是 is_enabled 不同，则复用上面的逻辑即可。
        // 如果接口不同，请替换 url
        const res = await request({
          url: '/userConfig/update_config',
          method: 'PUT',
          data: params
        });

        uni.hideLoading();

        if (res.code === 200 || res.code === '200') {
          uni.showToast({ title: '保存成功', icon: 'success' });
        } else {
          uni.showToast({ title: res.msg || '保存失败', icon: 'none' });
        }

      } catch (err) {
        uni.hideLoading();
        console.error('保存配置失败：', err);
        uni.showToast({ title: '网络异常', icon: 'none' });
      }
    }
  }
}