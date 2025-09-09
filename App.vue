<script>
	export default {
		onLaunch: function() {
			// 记账APP启动
			this.initApp()
		},
		onShow: function() {
			// 记账APP显示
		},
		onHide: function() {
			// 记账APP隐藏
		},
		methods: {
			initApp() {
				// 检查是否是首次启动
				const isFirstLaunch = uni.getStorageSync('isFirstLaunch')
				if (!isFirstLaunch) {
					// 首次启动，初始化一些演示数据
					this.initDemoData()
					uni.setStorageSync('isFirstLaunch', true)
				}
			},
			
			initDemoData() {
				// 创建一些演示记录
				const demoRecords = [
					{
						id: Date.now().toString() + '1',
						type: 'expense',
						amount: '25.50',
						categoryId: 1,
						categoryName: '餐饮',
						categoryIcon: '🍽️',
						note: '午餐',
						time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
					},
					{
						id: Date.now().toString() + '2',
						type: 'expense',
						amount: '8.00',
						categoryId: 2,
						categoryName: '交通',
						categoryIcon: '🚗',
						note: '地铁',
						time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
					},
					{
						id: Date.now().toString() + '3',
						type: 'income',
						amount: '5000.00',
						categoryId: 11,
						categoryName: '工资',
						categoryIcon: '💰',
						note: '月薪',
						time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
					}
				]
				
				uni.setStorageSync('records', demoRecords)
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
	
	/* 全局样式重置 */
	page {
		background-color: #F5F5F5;
		font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', SimSun, sans-serif;
		overflow-x: hidden;
		width: 100vw;
		max-width: 100vw;
	}
	
	/* 防止整个应用水平滚动 */
	body, 
	uni-page-body {
		overflow-x: hidden !important;
		width: 100vw;
		max-width: 100vw;
	}
	
	/* 强制所有元素不超出屏幕宽度 */
	* {
		max-width: 100vw;
		box-sizing: border-box;
	}
	
	/* TabBar样式优化 */
	.uni-tabbar {
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
		border-top: 1rpx solid #E5E5E5;
	}
	
	.uni-tabbar__item {
		transition: all 0.3s ease;
	}
	
	.uni-tabbar__item.uni-tabbar__item--active {
		transform: scale(1.05);
	}
	
	.uni-tabbar__text {
		font-weight: 500;
		font-size: 24rpx;
	}
	
	.uni-tabbar__item--active .uni-tabbar__text {
		font-weight: 600;
		color: #007AFF;
	}
	
	/* 全局容器样式 */
	.container {
		padding: 20rpx;
		min-height: 100vh;
		padding-bottom: 100rpx; /* 为底部导航留出空间 */
	}
	
	/* 卡片样式 */
	.card {
		background-color: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}
	
	/* 按钮样式 */
	button {
		border-radius: 50rpx;
		font-size: 32rpx;
		font-weight: bold;
		transition: all 0.3s ease;
	}
	
	button[type="primary"] {
		background: linear-gradient(45deg, #667eea, #764ba2);
		border: none;
		box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
	}
	
	button[type="primary"]:active {
		transform: translateY(2rpx);
		box-shadow: 0 2rpx 10rpx rgba(102, 126, 234, 0.3);
	}
	
	/* 输入框样式 */
	input, textarea {
		font-size: 28rpx;
		color: #333;
	}
	
	/* 文本样式 */
	.text-primary {
		color: #007AFF;
	}
	
	.text-success {
		color: #4ECDC4;
	}
	
	.text-danger {
		color: #FF6B6B;
	}
	
	.text-warning {
		color: #FFA500;
	}
	
	.text-muted {
		color: #999;
	}
	
	/* 工具类 */
	.text-center {
		text-align: center;
	}
	
	.text-right {
		text-align: right;
	}
	
	.flex {
		display: flex;
	}
	
	.flex-1 {
		flex: 1;
	}
	
	.justify-center {
		justify-content: center;
	}
	
	.justify-between {
		justify-content: space-between;
	}
	
	.align-center {
		align-items: center;
	}
	
	.margin-bottom {
		margin-bottom: 30rpx;
	}
	
	.padding {
		padding: 30rpx;
	}
	
	/* 页面切换动画 */
	.page-enter-active,
	.page-leave-active {
		transition: all 0.3s ease;
	}
	
	.page-enter-from {
		opacity: 0;
		transform: translateX(100%);
	}
	
	.page-leave-to {
		opacity: 0;
		transform: translateX(-100%);
	}
</style>
