<template>
	<scroll-view 
		class="container" 
		scroll-y="true" 
		@scrolltolower="loadMore"
		lower-threshold="100">
		<!-- 顶部统计卡片 -->
		<view class="summary-card">
			<view class="card-decoration"></view>
			<view class="summary-row">
				<view class="summary-item" data-type="expense">
					<view class="summary-icon">💸</view>
					<text class="summary-label">本月支出</text>
					<text class="summary-value expense">¥{{monthExpense}}</text>
				</view>
				<view class="summary-item" data-type="income">
					<view class="summary-icon">💰</view>
					<text class="summary-label">本月收入</text>
					<text class="summary-value income">¥{{monthIncome}}</text>
				</view>
			</view>
			<view class="summary-row">
				<view class="summary-item" data-type="balance">
					<view class="summary-icon">💳</view>
					<text class="summary-label">本月结余</text>
					<text class="summary-value" :class="monthBalance >= 0 ? 'income' : 'expense'">¥{{monthBalance}}</text>
				</view>
				<view class="summary-item" data-type="today">
					<view class="summary-icon">📅</view>
					<text class="summary-label">今日支出</text>
					<text class="summary-value expense">¥{{todayExpense}}</text>
				</view>
			</view>
			<view class="summary-row">
				<view class="summary-item" data-type="records">
					<view class="summary-icon">📊</view>
					<text class="summary-label">总记录数</text>
					<text class="summary-value">{{totalRecords}}条</text>
				</view>
				<view class="summary-item" data-type="average">
					<view class="summary-icon">📈</view>
					<text class="summary-label">平均日支出</text>
					<text class="summary-value expense">¥{{avgDailyExpense}}</text>
				</view>
			</view>
		</view>
		
		<!-- 快捷添加按钮 -->
		<view class="quick-add">
			<button class="add-btn" @click="goToAdd" type="primary">记一笔</button>
		</view>
		
		<!-- 账单列表 -->
		<view class="record-list">
			<view class="record-header">
				<text class="record-title">账目记录</text>
			</view>
			
			<!-- 筛选器 -->
			<view class="filter-section">
				<view class="filter-row">
					<!-- 时间筛选 -->
					<view class="filter-item">
						<text class="filter-label">时间：</text>
						<picker mode="selector" :range="timeOptions" :value="selectedTimeIndex" @change="onTimeChange">
							<view class="picker-text">{{timeOptions[selectedTimeIndex]}}</view>
						</picker>
					</view>
					
					<!-- 类别筛选 -->
					<view class="filter-item">
						<text class="filter-label">类别：</text>
						<picker mode="selector" :range="typeOptions" :value="selectedTypeIndex" @change="onTypeChange">
							<view class="picker-text">{{typeOptions[selectedTypeIndex]}}</view>
						</picker>
					</view>
				</view>
				
				<!-- 自定义时间范围 -->
				<view class="filter-row" v-if="selectedTimeIndex === 5">
					<view class="filter-item">
						<text class="filter-label">开始：</text>
						<picker mode="date" :value="customStartDate" @change="onStartDateChange">
							<view class="picker-text">{{customStartDate || '选择开始日期'}}</view>
						</picker>
					</view>
					<view class="filter-item">
						<text class="filter-label">结束：</text>
						<picker mode="date" :value="customEndDate" @change="onEndDateChange">
							<view class="picker-text">{{customEndDate || '选择结束日期'}}</view>
						</picker>
					</view>
				</view>
				
				<!-- 分类筛选 -->
				<view class="filter-row" v-if="selectedTypeIndex > 0">
					<view class="filter-item full-width">
						<text class="filter-label">分类：</text>
						<picker mode="selector" :range="categoryOptions" :value="selectedCategoryIndex" @change="onCategoryChange">
							<view class="picker-text">{{categoryOptions[selectedCategoryIndex]}}</view>
						</picker>
					</view>
				</view>
			</view>
			
			<view v-if="groupedRecords.length === 0" class="empty-state">
				<text class="empty-text">还没有记录，快去记一笔吧！</text>
			</view>
			
			<!-- 按日期分组显示记录 -->
			<view v-for="(group, groupIndex) in groupedRecords" :key="group.date" class="record-group">
				<!-- 日期分组标题 -->
				<view class="date-group-header">
					<view class="date-info">
						<text class="date-text">{{group.dateText}}</text>
						<text class="date-weekday">{{group.weekday}}</text>
					</view>
					<view class="date-summary">
						<text class="date-expense" v-if="group.totalExpense > 0">支出 ¥{{group.totalExpense}}</text>
						<text class="date-income" v-if="group.totalIncome > 0">收入 ¥{{group.totalIncome}}</text>
					</view>
				</view>
				
				<!-- 该日期下的记录 -->
				<view v-for="record in group.records" :key="record.id" class="record-wrapper">
					<view class="record-item" 
						@click="showRecordDetail(record)"
						@touchstart="onTouchStart($event, record.id)"
						@touchmove="onTouchMove($event, record.id)"
						@touchend="onTouchEnd($event, record.id)"
						:style="{transform: `translateX(${getTranslateX(record.id)}px)`}">
						<view class="record-left">
							<view class="record-category">
								<text class="category-icon">{{record.categoryIcon}}</text>
								<text class="category-name">{{record.categoryName}}</text>
							</view>
							<text class="record-note" v-if="record.note">{{record.note}}</text>
						</view>
						<view class="record-right">
							<text class="record-amount" :class="record.type">
								{{record.type === 'expense' ? '-' : '+'}}¥{{record.amount}}
							</text>
							<text class="record-time">{{formatTimeOnly(record.time)}}</text>
						</view>
					</view>
					<view class="action-buttons">
						<view class="edit-btn" @click="editRecord(record)">
							<text class="edit-text">编辑</text>
						</view>
						<view class="delete-btn" @click="deleteRecord(record)">
							<text class="delete-text">删除</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 加载状态提示 -->
			<view v-if="hasMore && groupedRecords.length > 0 && isLoading" class="loading-indicator">
				<text class="loading-text">加载中...</text>
			</view>
			
			<!-- 没有更多数据提示 -->
			<view v-if="!hasMore && groupedRecords.length > 0" class="no-more">
				<text class="no-more-text">已显示全部记录</text>
			</view>
		</view>
	</scroll-view>
</template>

<script>
	export default {
		data() {
			return {
				records: [],
				allRecords: [], // 存储所有记录
				groupedRecords: [], // 按日期分组的记录
				monthExpense: 0,
				monthIncome: 0,
				monthBalance: 0,
				todayExpense: 0,
				totalRecords: 0,
				avgDailyExpense: 0,
				touchData: {}, // 存储每个item的触摸数据
				// 分页相关
				currentPage: 1,
				pageSize: 20,
				hasMore: true,
				isLoading: false,
				// 筛选相关
				timeOptions: ['全部时间', '今天', '本周', '本月', '本年', '自定义范围'],
				selectedTimeIndex: 0,
				customStartDate: '',
				customEndDate: '',
				typeOptions: ['全部类型', '支出', '收入'],
				selectedTypeIndex: 0,
				categoryOptions: ['全部分类'],
				selectedCategoryIndex: 0,
				// 所有分类数据（从本地存储加载）
				expenseCategories: [],
				incomeCategories: []
			}
		},
		onLoad() {
			this.loadData()
		},
		onShow() {
			this.loadData()
		},
		methods: {
			loadData() {
				// 从本地存储加载数据
				const records = uni.getStorageSync('records') || []
				this.allRecords = records.sort((a, b) => new Date(b.time) - new Date(a.time))
				
				// 加载分类数据
				this.loadCategories()
				
				this.updateCategoryOptions()
				this.filterRecords()
				this.calculateMonthSummary()
			},
			
			// 加载分类数据
			loadCategories() {
				// 默认分类数据
				const defaultExpenseCategories = [
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
				]
				
				const defaultIncomeCategories = [
					{id: 11, name: '工资', icon: '💰'},
					{id: 12, name: '奖金', icon: '🎁'},
					{id: 13, name: '投资', icon: '📈'},
					{id: 14, name: '兼职', icon: '💼'},
					{id: 15, name: '红包', icon: '🧧'},
					{id: 16, name: '退款', icon: '↩️'},
					{id: 17, name: '其他', icon: '💎'}
				]
				
				// 从本地存储加载，如果没有则使用默认数据
				let expenseCategories = uni.getStorageSync('expenseCategories')
				let incomeCategories = uni.getStorageSync('incomeCategories')
				
				if (!expenseCategories || expenseCategories.length === 0) {
					expenseCategories = defaultExpenseCategories
					uni.setStorageSync('expenseCategories', expenseCategories)
				}
				
				if (!incomeCategories || incomeCategories.length === 0) {
					incomeCategories = defaultIncomeCategories
					uni.setStorageSync('incomeCategories', incomeCategories)
				}
				
				this.expenseCategories = expenseCategories
				this.incomeCategories = incomeCategories
			},
			
			// 更新分类选项
			updateCategoryOptions() {
				let categories = ['全部分类']
				
				if (this.selectedTypeIndex === 1) {
					// 支出类型，显示支出分类
					categories = categories.concat(this.expenseCategories.map(cat => cat.name))
				} else if (this.selectedTypeIndex === 2) {
					// 收入类型，显示收入分类
					categories = categories.concat(this.incomeCategories.map(cat => cat.name))
				} else {
					// 全部类型，显示所有分类
					categories = categories.concat(this.expenseCategories.map(cat => cat.name))
					categories = categories.concat(this.incomeCategories.map(cat => cat.name))
				}
				
				this.categoryOptions = categories
				// 如果当前选择的分类不在新的选项中，重置为"全部分类"
				if (this.selectedCategoryIndex >= this.categoryOptions.length) {
					this.selectedCategoryIndex = 0
				}
			},
			
			// 筛选记录
			filterRecords() {
				let filteredRecords = this.allRecords
				
				// 时间筛选
				if (this.selectedTimeIndex > 0) {
					filteredRecords = this.filterByTime(filteredRecords)
				}
				
				// 类型筛选
				if (this.selectedTypeIndex > 0) {
					const type = this.selectedTypeIndex === 1 ? 'expense' : 'income'
					filteredRecords = filteredRecords.filter(record => record.type === type)
				}
				
				// 分类筛选
				if (this.selectedCategoryIndex > 0) {
					const categoryName = this.categoryOptions[this.selectedCategoryIndex]
					filteredRecords = filteredRecords.filter(record => record.categoryName === categoryName)
				}
				
				this.records = filteredRecords
				
				// 重置分页状态
				this.currentPage = 1
				this.hasMore = true
				
				// 按日期分组并分页显示
				this.groupRecordsByDate()
			},
			
			// 按时间筛选
			filterByTime(records) {
				const now = new Date()
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				
				return records.filter(record => {
					const recordDate = new Date(record.time)
					const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate())
					
					switch(this.selectedTimeIndex) {
						case 1: // 今天
							return recordDay.getTime() === today.getTime()
						case 2: // 本周
							const weekStart = new Date(today)
							weekStart.setDate(today.getDate() - today.getDay())
							return recordDate >= weekStart
						case 3: // 本月
							return recordDate.getFullYear() === now.getFullYear() && 
								   recordDate.getMonth() === now.getMonth()
						case 4: // 本年
							return recordDate.getFullYear() === now.getFullYear()
						case 5: // 自定义范围
							if (!this.customStartDate || !this.customEndDate) {
								return true // 如果没有设置日期范围，显示所有记录
							}
							const startDate = new Date(this.customStartDate)
							const endDate = new Date(this.customEndDate + ' 23:59:59') // 包含结束日期的全天
							return recordDate >= startDate && recordDate <= endDate
						default:
							return true
					}
				})
			},
			
			// 时间筛选变化
			onTimeChange(e) {
				this.selectedTimeIndex = e.detail.value
				// 如果切换到非自定义范围，清空自定义日期
				if (this.selectedTimeIndex !== 5) {
					this.customStartDate = ''
					this.customEndDate = ''
				}
				this.filterRecords()
			},
			
			// 按日期分组记录
			groupRecordsByDate() {
				const groupedMap = new Map()
				
				// 获取当前页应该显示的记录
				const totalRecords = this.records
				const startIndex = 0
				const endIndex = this.currentPage * this.pageSize
				const displayRecords = totalRecords.slice(startIndex, endIndex)
				
				// 检查是否还有更多数据
				this.hasMore = endIndex < totalRecords.length
				
				// 按日期分组
				displayRecords.forEach(record => {
					const date = new Date(record.time)
					const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
					
					if (!groupedMap.has(dateKey)) {
						groupedMap.set(dateKey, {
							date: dateKey,
							dateText: this.formatDateText(date),
							weekday: this.getWeekday(date),
							records: [],
							totalExpense: 0,
							totalIncome: 0
						})
					}
					
					const group = groupedMap.get(dateKey)
					group.records.push(record)
					
					if (record.type === 'expense') {
						group.totalExpense += parseFloat(record.amount)
					} else {
						group.totalIncome += parseFloat(record.amount)
					}
				})
				
				// 转换为数组并按日期倒序排列
				this.groupedRecords = Array.from(groupedMap.values()).map(group => ({
					...group,
					totalExpense: group.totalExpense.toFixed(2),
					totalIncome: group.totalIncome.toFixed(2)
				})).sort((a, b) => new Date(b.date) - new Date(a.date))
			},
			
			// 格式化日期显示文本
			formatDateText(date) {
				const now = new Date()
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
				const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
				
				if (recordDate.getTime() === today.getTime()) {
					return '今天'
				} else if (recordDate.getTime() === yesterday.getTime()) {
					return '昨天'
				} else if (now.getFullYear() === date.getFullYear()) {
					return `${date.getMonth() + 1}月${date.getDate()}日`
				} else {
					return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
				}
			},
			
			// 获取星期几
			getWeekday(date) {
				const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
				return weekdays[date.getDay()]
			},
			
			// 加载更多数据（滚动到底部自动触发）
			loadMore() {
				if (this.isLoading || !this.hasMore) return
				
				this.isLoading = true
				
				// 模拟网络延迟，实际项目中这里是网络请求
				setTimeout(() => {
					this.currentPage++
					this.groupRecordsByDate()
					this.isLoading = false
				}, 800) // 增加一点延迟，让用户看到加载状态
			},
			
			// 只格式化时间部分（不包括日期）
			formatTimeOnly(timeStr) {
				const date = new Date(timeStr)
				return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
			},
			
			// 开始日期选择
			onStartDateChange(e) {
				this.customStartDate = e.detail.value
				this.filterRecords()
			},
			
			// 结束日期选择
			onEndDateChange(e) {
				this.customEndDate = e.detail.value
				this.filterRecords()
			},
			
			// 类型筛选变化
			onTypeChange(e) {
				this.selectedTypeIndex = e.detail.value
				this.selectedCategoryIndex = 0 // 重置分类选择
				this.updateCategoryOptions()
				this.filterRecords()
			},
			
			// 分类筛选变化
			onCategoryChange(e) {
				this.selectedCategoryIndex = e.detail.value
				this.filterRecords()
			},
			
			calculateMonthSummary() {
				const now = new Date()
				const currentYear = now.getFullYear()
				const currentMonth = now.getMonth()
				const today = new Date(currentYear, currentMonth, now.getDate())
				
				const records = uni.getStorageSync('records') || []
				let monthExpense = 0
				let monthIncome = 0
				let todayExpense = 0
				let monthExpenseDays = new Set() // 记录本月有支出的天数
				
				records.forEach(record => {
					const recordDate = new Date(record.time)
					const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate())
					
					// 本月统计
					if (recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth) {
						if (record.type === 'expense') {
							monthExpense += parseFloat(record.amount)
							monthExpenseDays.add(recordDate.getDate())
						} else {
							monthIncome += parseFloat(record.amount)
						}
					}
					
					// 今日统计
					if (recordDay.getTime() === today.getTime() && record.type === 'expense') {
						todayExpense += parseFloat(record.amount)
					}
				})
				
				this.monthExpense = monthExpense.toFixed(2)
				this.monthIncome = monthIncome.toFixed(2)
				this.monthBalance = (monthIncome - monthExpense).toFixed(2)
				this.todayExpense = todayExpense.toFixed(2)
				this.totalRecords = records.length
				
				// 计算平均日支出（基于有支出记录的天数）
				const expenseDaysCount = monthExpenseDays.size
				this.avgDailyExpense = expenseDaysCount > 0 ? (monthExpense / expenseDaysCount).toFixed(2) : '0.00'
			},
			
			goToAdd() {
				uni.navigateTo({
					url: '/pages/add/add'
				})
			},
			
			showRecordDetail(record) {
				uni.showModal({
					title: '记录详情',
					content: `分类：${record.categoryName}\n金额：${record.type === 'expense' ? '-' : '+'}¥${record.amount}\n备注：${record.note || '无'}\n时间：${this.formatTime(record.time)}`,
					showCancel: false
				})
			},
			
			formatTime(timeStr) {
				const date = new Date(timeStr)
				const now = new Date()
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
				const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
				
				if (recordDate.getTime() === today.getTime()) {
					return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
				} else if (recordDate.getTime() === yesterday.getTime()) {
					return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
				} else {
					return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
				}
			},
			
			// 触摸开始
			onTouchStart(e, id) {
				this.touchData[id] = {
					startX: e.touches[0].clientX,
					startY: e.touches[0].clientY,
					translateX: this.touchData[id] ? this.touchData[id].translateX || 0 : 0
				}
			},
			
			// 触摸移动
			onTouchMove(e, id) {
				if (!this.touchData[id]) return
				
				const touch = e.touches[0]
				const deltaX = touch.clientX - this.touchData[id].startX
				const deltaY = touch.clientY - this.touchData[id].startY
				
				// 如果垂直滑动距离大于水平滑动距离，则不处理（让页面正常滚动）
				if (Math.abs(deltaY) > Math.abs(deltaX)) {
					return
				}
				
				// 阻止默认滚动
				e.preventDefault()
				
				let newTranslateX = this.touchData[id].translateX + deltaX
				
				// 限制滑动范围：向左滑动最多露出编辑和删除按钮（-160px），向右滑动不能超过原位置（0px）
				if (newTranslateX > 0) {
					newTranslateX = 0
				} else if (newTranslateX < -160) {
					newTranslateX = -160
				}
				
				this.$set(this.touchData, id, {
					...this.touchData[id],
					translateX: newTranslateX
				})
			},
			
			// 触摸结束
			onTouchEnd(e, id) {
				if (!this.touchData[id]) return
				
				const translateX = this.touchData[id].translateX
				
				// 根据滑动距离决定最终位置
				if (translateX < -80) {
					// 滑动距离超过一半，显示编辑和删除按钮
					this.$set(this.touchData, id, {
						...this.touchData[id],
						translateX: -160
					})
				} else {
					// 滑动距离不够，回到原位置
					this.$set(this.touchData, id, {
						...this.touchData[id],
						translateX: 0
					})
				}
			},
			
			// 获取translateX值
			getTranslateX(id) {
				return this.touchData[id] ? this.touchData[id].translateX || 0 : 0
			},
			
			// 编辑记录
			editRecord(record) {
				// 收回滑动状态
				this.$set(this.touchData, record.id, { translateX: 0 })
				
				// 跳转到添加页面，传递记录ID进行编辑
				uni.navigateTo({
					url: `/pages/add/add?editId=${record.id}`
				})
			},
			
			// 删除记录
			deleteRecord(record) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除这条记录吗？\n${record.categoryName} ${record.type === 'expense' ? '-' : '+'}¥${record.amount}`,
					success: (res) => {
						if (res.confirm) {
							// 从存储中删除
							let records = uni.getStorageSync('records') || []
							records = records.filter(item => item.id !== record.id)
							uni.setStorageSync('records', records)
							
							// 重置该项的滑动状态
							this.$set(this.touchData, record.id, { translateX: 0 })
							
							// 重新加载数据
							this.loadData()
							
							uni.showToast({
								title: '删除成功',
								icon: 'success',
								duration: 1500
							})
						} else {
							// 取消删除，收回删除按钮
							this.$set(this.touchData, record.id, { translateX: 0 })
						}
					}
				})
			}
		}
	}
</script>

<style>
	.container {
		padding: 20rpx 60rpx 20rpx 20rpx;
		background-color: #F5F5F5;
		height: 100vh;
	}
	
	.summary-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 30rpx;
		margin-right: 40rpx;
		position: relative;
		overflow: hidden;
		box-shadow: 0 10rpx 30rpx rgba(102, 126, 234, 0.3);
	}
	
	.card-decoration {
		position: absolute;
		top: -100rpx;
		right: -100rpx;
		width: 200rpx;
		height: 200rpx;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		z-index: 0;
	}
	
	.card-decoration::before {
		content: '';
		position: absolute;
		top: 50rpx;
		left: 50rpx;
		width: 80rpx;
		height: 80rpx;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 50%;
	}
	
	.summary-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 20rpx;
		position: relative;
		z-index: 1;
	}
	
	.summary-row:last-child {
		margin-bottom: 0;
	}
	
	.summary-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		padding: 15rpx;
		border-radius: 15rpx;
		background: rgba(255, 255, 255, 0.08);
		margin: 0 8rpx;
		transition: all 0.3s ease;
		backdrop-filter: blur(10rpx);
		position: relative;
		overflow: hidden;
	}
	
	.summary-item:first-child {
		margin-left: 0;
	}
	
	.summary-item:last-child {
		margin-right: 0;
	}
	
	.summary-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
		pointer-events: none;
	}
	
	.summary-item:active {
		transform: scale(0.95);
		background: rgba(255, 255, 255, 0.15);
	}
	
	.summary-icon {
		font-size: 32rpx;
		margin-bottom: 8rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0,0,0,0.1));
	}
	
	.summary-label {
		color: rgba(255, 255, 255, 0.8);
		font-size: 24rpx;
		margin-bottom: 8rpx;
		font-weight: 500;
		text-shadow: 0 1rpx 2rpx rgba(0,0,0,0.1);
	}
	
	.summary-value {
		color: white;
		font-size: 32rpx;
		font-weight: bold;
		text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.2);
		letter-spacing: 0.5rpx;
	}
	
	.summary-value.expense {
		color: #FFE5E5;
		text-shadow: 0 2rpx 4rpx rgba(255, 107, 107, 0.3);
	}
	
	.summary-value.income {
		color: #E5FFF9;
		text-shadow: 0 2rpx 4rpx rgba(78, 205, 196, 0.3);
	}
	
	.quick-add {
		margin-bottom: 30rpx;
		margin-right: 40rpx;
	}
	
	.add-btn {
		border-radius: 50rpx;
		font-size: 32rpx;
		background: linear-gradient(45deg, #FF6B6B, #FF8E53);
		border: none;
		box-shadow: 0 8rpx 25rpx rgba(255, 107, 107, 0.3);
		transition: all 0.3s ease;
	}
	
	.add-btn:active {
		transform: translateY(2rpx);
		box-shadow: 0 4rpx 15rpx rgba(255, 107, 107, 0.4);
	}
	
	.record-list {
		background-color: white;
		border-radius: 20rpx;
		margin-right: 40rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
	}
	
	.record-header {
		padding: 30rpx;
		border-bottom: 1px solid #F0F0F0;
	}
	
	.record-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	/* 筛选器样式 */
	.filter-section {
		padding: 20rpx 30rpx;
		background-color: #F8F9FA;
		border-bottom: 1px solid #F0F0F0;
	}
	
	.filter-row {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}
	
	.filter-row:last-child {
		margin-bottom: 0;
	}
	
	.filter-item {
		display: flex;
		align-items: center;
		flex: 1;
		margin-right: 30rpx;
	}
	
	.filter-item:last-child {
		margin-right: 0;
	}
	
	.filter-item.full-width {
		flex: none;
		width: 100%;
		margin-right: 0;
	}
	
	.filter-label {
		font-size: 26rpx;
		color: #666;
		margin-right: 10rpx;
		white-space: nowrap;
	}
	
	.picker-text {
		flex: 1;
		padding: 12rpx 20rpx;
		background-color: white;
		border: 1px solid #E5E5E5;
		border-radius: 8rpx;
		font-size: 26rpx;
		color: #333;
		text-align: center;
		min-width: 120rpx;
		transition: all 0.2s ease;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
	}
	
	.picker-text:active {
		border-color: #667eea;
		background-color: #F8F9FF;
		transform: scale(0.98);
	}
	
	.empty-state {
		padding: 100rpx 30rpx;
		text-align: center;
	}
	
	.empty-text {
		color: #999;
		font-size: 28rpx;
	}
	
	/* 日期分组样式 */
	.record-group {
		margin-bottom: 20rpx;
	}
	
	.date-group-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx 15rpx;
		background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
		border-top: 1px solid #E5E5E5;
		position: sticky;
		top: 0;
		z-index: 10;
	}
	
	.date-info {
		display: flex;
		align-items: center;
	}
	
	.date-text {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		margin-right: 15rpx;
	}
	
	.date-weekday {
		font-size: 24rpx;
		color: #666;
		background: rgba(102, 126, 234, 0.1);
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
		border: 1px solid rgba(102, 126, 234, 0.2);
	}
	
	.date-summary {
		display: flex;
		align-items: center;
		gap: 15rpx;
	}
	
	.date-expense {
		font-size: 24rpx;
		color: #FF6B6B;
		background: rgba(255, 107, 107, 0.1);
		padding: 6rpx 12rpx;
		border-radius: 12rpx;
		font-weight: 500;
	}
	
	.date-income {
		font-size: 24rpx;
		color: #4ECDC4;
		background: rgba(78, 205, 196, 0.1);
		padding: 6rpx 12rpx;
		border-radius: 12rpx;
		font-weight: 500;
	}
	
	/* 加载指示器样式 */
	.loading-indicator {
		padding: 40rpx;
		text-align: center;
		background-color: white;
		border-top: 1px solid #F0F0F0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20rpx;
	}
	
	.loading-text {
		color: #667eea;
		font-size: 28rpx;
		font-weight: 500;
	}
	
	.loading-indicator::before {
		content: '';
		width: 20rpx;
		height: 20rpx;
		border: 2rpx solid #E5E5E5;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	
	.no-more {
		padding: 30rpx;
		text-align: center;
		background-color: white;
		border-top: 1px solid #F0F0F0;
	}
	
	.no-more-text {
		color: #999;
		font-size: 24rpx;
	}
	
	.record-left {
		flex: 1;
	}
	
	.record-category {
		display: flex;
		align-items: center;
		margin-bottom: 10rpx;
	}
	
	.category-icon {
		font-size: 36rpx;
		margin-right: 15rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0,0,0,0.1));
		display: inline-block;
		transform: translateZ(0);
		transition: transform 0.2s ease;
	}
	
	.category-name {
		font-size: 30rpx;
		color: #333;
		font-weight: 600;
		letter-spacing: 0.5rpx;
	}
	
	.record-note {
		font-size: 24rpx;
		color: #999;
		margin-top: 4rpx;
		opacity: 0.8;
	}
	
	.record-right {
		text-align: right;
	}
	
	.record-amount {
		font-size: 32rpx;
		font-weight: bold;
		display: block;
		margin-bottom: 5rpx;
		letter-spacing: 0.5rpx;
	}
	
	.record-amount.expense {
		color: #FF6B6B;
		text-shadow: 0 1rpx 2rpx rgba(255, 107, 107, 0.2);
	}
	
	.record-amount.income {
		color: #4ECDC4;
		text-shadow: 0 1rpx 2rpx rgba(78, 205, 196, 0.2);
	}
	
	.record-time {
		font-size: 24rpx;
		color: #999;
		opacity: 0.8;
	}
	
	/* 右滑删除相关样式 */
	.record-wrapper {
		position: relative;
		overflow: hidden;
	}
	
	.record-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 25rpx 30rpx;
		border-bottom: 1px solid #F8F8F8;
		background-color: white;
		transition: all 0.3s ease;
		position: relative;
		z-index: 1;
	}
	
	.record-group .record-item:first-child {
		border-top: none;
	}
	
	.record-group .record-item:last-child {
		border-bottom: 1px solid #F0F0F0;
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
	
	.record-item:hover {
		background-color: #FAFAFA;
	}
	
	.record-item:active {
		background-color: #F5F5F5;
		transform: scale(0.995);
	}
	
	.record-item:active .category-icon {
		transform: scale(1.1);
	}
	
	.record-item:last-child {
		border-bottom: none;
	}
	
	.action-buttons {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		display: flex;
		z-index: 0;
	}
	
	.edit-btn {
		width: 80px;
		background: linear-gradient(135deg, #4ECDC4, #44A08D);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}
	
	.edit-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
		transition: left 0.5s ease;
	}
	
	.edit-btn:active::before {
		left: 100%;
	}
	
	.edit-text {
		color: white;
		font-size: 28rpx;
		font-weight: bold;
		text-shadow: 0 1rpx 2rpx rgba(0,0,0,0.1);
	}
	
	.delete-btn {
		width: 80px;
		background: linear-gradient(135deg, #FF4757, #FF3742);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}
	
	.delete-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
		transition: left 0.5s ease;
	}
	
	.delete-btn:active::before {
		left: 100%;
	}
	
	.delete-text {
		color: white;
		font-size: 28rpx;
		font-weight: bold;
		text-shadow: 0 1rpx 2rpx rgba(0,0,0,0.1);
	}
</style>
