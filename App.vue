<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			
			// 检查本地是否有 token
			const token = uni.getStorageSync('token');
			if (token) {
				// 如果已登录，直接跳转到首页 (TabBar 页面)
				uni.switchTab({
					url: '/pages/index/index'
				});
			} else {
				// 未登录，停留在当前启动页 (login)，或者显式跳转
				// uni.reLaunch({ url: '/pages/login/login' }); 
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
</style>