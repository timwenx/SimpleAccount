<template>
	<view class="container">
		
		<!-- 图标管理入口 -->
		<view class="icon-manage-entry" @click="goToIconManage">
			<view class="entry-content">
				<text class="entry-icon">🎨</text>
				<view class="entry-text">
					<text class="entry-title">图标管理</text>
					<text class="entry-desc">管理分类图标</text>
				</view>
				<text class="entry-arrow">→</text>
			</view>
		</view>
		
		<!-- 类型切换 -->
		<view class="type-tabs">
			<view class="tab-item" :class="{active: currentType === 'expense'}" @click="switchType('expense')">
				<text class="tab-text">支出分类</text>
			</view>
			<view class="tab-item" :class="{active: currentType === 'income'}" @click="switchType('income')">
				<text class="tab-text">收入分类</text>
			</view>
		</view>
		
		<!-- 分类列表 -->
		<view class="category-list">
			<view v-for="category in currentCategories" 
				  :key="category.id" 
				  class="category-item"
				  @click="showCategoryDetail(category)">
				<view class="category-info">
					<text class="category-icon">{{category.icon}}</text>
					<text class="category-name">{{category.name}}</text>
				</view>
				<view class="category-usage">
					<text class="usage-text">已使用{{getCategoryUsage(category.id)}}次</text>
					<text class="view-hint">点击查看</text>
				</view>
			</view>
		</view>
		
		<!-- 使用统计 -->
		<view class="usage-stats">
			<text class="stats-title">使用频率统计</text>
			<view v-if="usageStats.length === 0" class="empty-stats">
				<text class="empty-text">暂无使用记录</text>
			</view>
			<view v-for="(stat, index) in usageStats" :key="stat.categoryId" class="usage-item">
				<view class="usage-rank">
					<text class="rank-number">{{index + 1}}</text>
				</view>
				<view class="usage-info">
					<text class="usage-icon">{{stat.icon}}</text>
					<view class="usage-details">
						<text class="usage-name">{{stat.name}}</text>
						<text class="usage-count">使用{{stat.count}}次</text>
					</view>
				</view>
				<view class="usage-amount">
					<text class="amount-text">¥{{stat.totalAmount}}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentType: 'expense',
				usageStats: [],
				expenseCategories: [],
				incomeCategories: [],
				// 默认分类数据（作为备用）
				defaultExpenseCategories: [
					{id: 1, name: '餐饮', icon: '🍽️'},
					{id: 2, name: '交通', icon: '🚗'},
					{id: 3, name: '购物', icon: '🛍️'},
					{id: 4, name: '娱乐', icon: '🎬'},
					{id: 5, name: '住房', icon: '🏠'},
					{id: 6, name: '医疗', icon: '💊'},
					{id: 7, name: '教育', icon: '📚'},
					{id: 8, name: '通讯', icon: '📱'},
					{id: 9, name: '服装', icon: '👕'},
					{id: 10, name: '其他', icon: '📦'}
				],
				defaultIncomeCategories: [
					{id: 11, name: '工资', icon: '💰'},
					{id: 12, name: '奖金', icon: '🎁'},
					{id: 13, name: '投资', icon: '📈'},
					{id: 14, name: '兼职', icon: '💼'},
					{id: 15, name: '红包', icon: '🧧'},
					{id: 16, name: '退款', icon: '↩️'},
					{id: 17, name: '其他', icon: '💎'}
				]
			}
		},
		
		computed: {
			currentCategories() {
				return this.currentType === 'expense' ? this.expenseCategories : this.incomeCategories
			}
		},
		
		onLoad() {
			this.loadCategories()
			this.calculateUsageStats()
		},
		
		onShow() {
			this.loadCategories()
			this.calculateUsageStats()
		},
		
		methods: {
			// 动态加载分类数据
			loadCategories() {
				// 从本地存储加载，如果没有则使用默认数据
				let expenseCategories = uni.getStorageSync('expenseCategories')
				let incomeCategories = uni.getStorageSync('incomeCategories')
				
				if (!expenseCategories || expenseCategories.length === 0) {
					expenseCategories = [...this.defaultExpenseCategories]
					this.$saveStorageAndFile('expenseCategories', expenseCategories)
				}
				
				if (!incomeCategories || incomeCategories.length === 0) {
					incomeCategories = [...this.defaultIncomeCategories]
					this.$saveStorageAndFile('incomeCategories', incomeCategories)
				}
				
				this.expenseCategories = expenseCategories
				this.incomeCategories = incomeCategories
			},
			
			switchType(type) {
				this.currentType = type
				this.loadCategories() // 切换类型时重新加载分类数据
				this.calculateUsageStats()
			},
			
			getCategoryUsage(categoryId) {
				const records = uni.getStorageSync('records') || []
				return records.filter(record => 
					record.categoryId === categoryId && record.type === this.currentType
				).length
			},
			
			calculateUsageStats() {
				const records = uni.getStorageSync('records') || []
				const filteredRecords = records.filter(record => record.type === this.currentType)
				
				const categoryMap = new Map()
				
				filteredRecords.forEach(record => {
					const categoryId = record.categoryId
					if (categoryMap.has(categoryId)) {
						const existing = categoryMap.get(categoryId)
						existing.count += 1
						existing.totalAmount += parseFloat(record.amount)
					} else {
						categoryMap.set(categoryId, {
							categoryId: categoryId,
							name: record.categoryName,
							icon: record.categoryIcon,
							count: 1,
							totalAmount: parseFloat(record.amount)
						})
					}
				})
				
				const stats = Array.from(categoryMap.values())
				stats.forEach(stat => {
					stat.totalAmount = stat.totalAmount.toFixed(2)
				})
				
				// 按使用次数降序排列，相同次数时按总金额降序排列
				stats.sort((a, b) => {
					if (b.count !== a.count) {
						return b.count - a.count; // 先按次数降序
					}
					return b.totalAmount - a.totalAmount; // 次数相同时按金额降序
				})
				
				this.usageStats = stats
			},
			
			showCategoryDetail(category) {
				// 跳转到分类详情页面
				const categoryParam = encodeURIComponent(JSON.stringify({
					id: category.id,
					name: category.name,
					icon: category.icon,
					type: this.currentType
				}))
				uni.navigateTo({
					url: `/pages/category-detail/category-detail?category=${categoryParam}`
				})
			},
			
			goToIconManage() {
				// 跳转到图标管理页面
				uni.navigateTo({
					url: '/pages/icon-manage/icon-manage'
				})
			},
			
			refreshCategories() {
				// 手动刷新分类数据
				this.loadCategories()
				this.calculateUsageStats()
				
				// uni.showToast({
				// 	title: '分类已刷新',
				// 	icon: 'success',
				// 	duration: 1500
				// })
			}
		}
	}
</script>

<style>
	.container {
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
		padding: 20rpx;
	}
	
	.type-tabs {
		display: flex;
		background-color: white;
		border-radius: 50rpx;
		padding: 10rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
		backdrop-filter: blur(10rpx);
	}
	
	.tab-item {
		flex: 1;
		text-align: center;
		padding: 20rpx;
		border-radius: 40rpx;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}
	
	.tab-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(45deg, #667eea, #764ba2);
		transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: -1;
	}
	
	.tab-item.active::before {
		left: 0;
	}
	
	.tab-item.active {
		box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
		transform: translateY(-2rpx);
	}
	
	.tab-text {
		font-size: 28rpx;
		color: #666;
		transition: color 0.3s ease;
	}
	
	.tab-item.active .tab-text {
		color: white;
		font-weight: bold;
	}
	
	.icon-manage-entry {
		background-color: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10rpx);
		border-radius: 20rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.2);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}
	
	.icon-manage-entry::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
		transition: left 0.3s ease;
	}
	
	.icon-manage-entry:active::before {
		left: 0;
	}
	
	.icon-manage-entry:active {
		transform: scale(0.98);
		box-shadow: 0 6rpx 24rpx rgba(102, 126, 234, 0.2);
	}
	
	.entry-content {
		display: flex;
		align-items: center;
		padding: 30rpx 25rpx;
		position: relative;
		z-index: 1;
	}
	
	.entry-icon {
		font-size: 40rpx;
		margin-right: 25rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
	}
	
	.entry-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}
	
	.entry-title {
		font-size: 32rpx;
		color: #333;
		font-weight: 600;
	}
	
	.entry-desc {
		font-size: 24rpx;
		color: #999;
		opacity: 0.8;
	}
	
	.entry-arrow {
		font-size: 28rpx;
		color: #667eea;
		font-weight: bold;
		transition: transform 0.3s ease;
	}
	
	.icon-manage-entry:active .entry-arrow {
		transform: translateX(5rpx);
	}
	
	.category-list, .usage-stats {
		background-color: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10rpx);
		border-radius: 24rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}
	
	.stats-title {
		font-size: 34rpx;
		font-weight: 600;
		background: linear-gradient(135deg, #667eea, #764ba2);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		margin-bottom: 30rpx;
		display: block;
		position: relative;
	}
	
	.stats-title::after {
		content: '';
		position: absolute;
		bottom: -10rpx;
		left: 0;
		width: 60rpx;
		height: 4rpx;
		background: linear-gradient(45deg, #667eea, #764ba2);
		border-radius: 2rpx;
	}
	
	.category-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx 20rpx;
		border-bottom: 1px solid rgba(240, 240, 240, 0.6);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 16rpx;
		margin-bottom: 8rpx;
		position: relative;
		overflow: hidden;
		cursor: pointer;
	}
	
	.category-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
		transition: left 0.3s ease;
	}
	
	.category-item:active::before {
		left: 0;
	}
	
	.category-item:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.2);
	}
	
	.category-item:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}
	
	.category-info {
		display: flex;
		align-items: center;
		z-index: 1;
	}
	
	.category-icon {
		font-size: 40rpx;
		margin-right: 25rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
	}
	
	.category-name {
		font-size: 32rpx;
		color: #333;
		font-weight: 600;
	}
	
	.category-usage, .usage-amount {
		text-align: right;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8rpx;
	}
	
	.usage-text {
		font-size: 26rpx;
		color: #999;
		background: rgba(102, 126, 234, 0.1);
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		font-weight: 500;
	}
	
	.view-hint {
		font-size: 22rpx;
		color: #667eea;
		background: rgba(102, 126, 234, 0.08);
		padding: 6rpx 12rpx;
		border-radius: 16rpx;
		font-weight: 500;
		opacity: 0.7;
		transition: all 0.3s ease;
	}
	
	.click-hint {
		font-size: 28rpx;
		color: #667eea;
		font-weight: bold;
		opacity: 0.7;
		transition: all 0.3s ease;
	}
	
	.category-item:active .click-hint {
		opacity: 1;
		transform: translateX(5rpx);
	}
	
	.empty-stats {
		text-align: center;
		padding: 80rpx 0;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
		border-radius: 20rpx;
	}
	
	.empty-text {
		color: #999;
		font-size: 28rpx;
		font-weight: 500;
	}
	
	.usage-item {
		display: flex;
		align-items: center;
		padding: 30rpx 20rpx;
		border-bottom: 1px solid rgba(240, 240, 240, 0.6);
		border-radius: 16rpx;
		margin-bottom: 8rpx;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}
	
	.usage-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
		transition: left 0.3s ease;
	}
	
	.usage-item:hover::before {
		left: 0;
	}
	
	.usage-item:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}
	
	.usage-rank {
		width: 70rpx;
		height: 70rpx;
		border-radius: 35rpx;
		background: linear-gradient(135deg, #667eea, #764ba2);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 25rpx;
		box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
		position: relative;
		overflow: hidden;
	}
	
	.usage-rank::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
		border-radius: 35rpx;
	}
	
	.rank-number {
		color: white;
		font-size: 28rpx;
		font-weight: bold;
		z-index: 1;
	}
	
	.usage-info {
		flex: 1;
		display: flex;
		align-items: center;
		z-index: 1;
	}
	
	.usage-icon {
		font-size: 40rpx;
		margin-right: 25rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
	}
	
	.usage-details {
		display: flex;
		flex-direction: column;
	}
	
	.usage-name {
		font-size: 32rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 8rpx;
	}
	
	.usage-count {
		font-size: 24rpx;
		color: #999;
		background: rgba(153, 153, 153, 0.1);
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
		align-self: flex-start;
	}
	
	.amount-text {
		font-size: 30rpx;
		font-weight: bold;
		background: linear-gradient(135deg, #667eea, #764ba2);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		z-index: 1;
	}
</style>
