<template>
	<scroll-view 
		class="container" 
		scroll-y="true" 
		@scrolltolower="loadMore"
		lower-threshold="100">
		<!-- 顶部统计卡片 -->
		<view class="summary-card">
			<view class="card-decoration"></view>
			
			<!-- 时间范围显示 -->
			<view class="time-range-header" @click="toggleTimeFilter">
				<text class="time-range-text">{{getCurrentTimeRangeText()}}</text>
				<view class="time-range-icon">📅</view>
			</view>
			
			<!-- 主要信息区域 -->
			<view class="main-info-section">
				<view class="left-info">
					<view class="expense-section">
						<text class="expense-label">支出</text>
						<view class="expense-icon">⊖</view>
					</view>
					<text class="main-amount">¥{{monthExpense}}</text>
					<view class="sub-amounts">
						<view class="amount-item">
							<text class="amount-label">收入</text>
							<text class="amount-value">¥{{monthIncome}}</text>
						</view>
						<view class="amount-item">
							<text class="amount-label">结余</text>
							<text class="amount-value" :class="monthBalance >= 0 ? 'positive' : 'negative'">¥{{monthBalance}}</text>
						</view>
					</view>
				</view>
				
				<view class="right-info">
					<view class="chat-bubble">
						<text class="chat-text">来和我聊天记账吧~</text>
						<view class="bubble-tail"></view>
					</view>
					<view class="avatar-container" @click="goToChat">
						<view class="avatar">
							<text class="avatar-emoji">🤖</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 预算进度区域 -->
			<view class="budget-section">
					<view class="progress-container">
						<view class="progress-circle">
							<view class="progress-ring" 
								:style="{background: `conic-gradient(#4A90E2 0deg, #4A90E2 ${calculateBudgetInfo.progress * 3.6}deg, rgba(255,255,255,0.2) ${calculateBudgetInfo.progress * 3.6}deg, rgba(255,255,255,0.2) 360deg)`}">
								<view class="progress-inner">
									<text class="progress-text">{{ getBudgetProgressDisplayText() }}</text>
								</view>
							</view>
						</view>
					</view>				<view class="budget-details">
					<view class="budget-item">
						<text class="budget-label">总预算</text>
						<text class="budget-value">¥{{calculateBudgetInfo.totalBudget}}</text>
						<text class="budget-source">来自{{categoryBudgets.length}}个分类预算</text>
					</view>
					<view class="budget-item">
						<text class="budget-label">已使用预算</text>
						<text class="budget-value">¥{{calculateBudgetInfo.usedAmount.toFixed(2)}}</text>
					</view>
					<view class="budget-item">
						<text class="budget-label">剩余预算</text>
						<text class="budget-value positive">¥{{calculateBudgetInfo.remainingAmount.toFixed(2)}}</text>
					</view>
				</view>
			</view>
			
			<!-- 其他统计信息 -->
			<view class="other-stats">
				<view class="stat-item">
					<text class="stat-label">今日支出</text>
					<text class="stat-value expense">¥{{todayExpense}}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">总记录数</text>
					<text class="stat-value">{{totalRecords}}条</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">平均日支出</text>
					<text class="stat-value expense">¥{{avgDailyExpense}}</text>
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
				// 预算相关 - 与预算管理页面保持一致
				categoryBudgets: [], // 分类预算列表
				currentMonthRecords: [], // 当前月份的记录
				// 时间单位定义
				timeUnits: [
					{ key: 'day', name: '日', factor: 30 }, // 日预算 × 30 = 月预算
					{ key: 'month', name: '月', factor: 1 }, // 月预算 × 1 = 月预算
					{ key: 'quarter', name: '季', factor: 1/3 }, // 季预算 × 1/3 = 月预算
					{ key: 'year', name: '年', factor: 1/12 } // 年预算 × 1/12 = 月预算
				],
				monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
				touchData: {}, // 存储每个item的触摸数据
				// 分页相关
				currentPage: 1,
				pageSize: 20,
				hasMore: true,
				isLoading: false,
				// 筛选相关
				timeOptions: ['全部时间', '今天', '本周', '本月', '本年', '自定义范围'],
				selectedTimeIndex: 3, // 默认选择本月
				customStartDate: '',
				customEndDate: '',
				typeOptions: ['全部类型', '支出', '收入'],
				selectedTypeIndex: 0,
				categoryOptions: ['全部分类'],
				selectedCategoryIndex: 0,
				// 所有分类数据（从本地存储加载）
				expenseCategories: [],
				incomeCategories: [],
				// 金额计算工具函数，解决浮点数精度问题
				moneyCalculator: {
					// 金额加法
					add(a, b) {
						const factor = 100
						return Math.round((parseFloat(a) * factor + parseFloat(b) * factor)) / factor
					},
					
					// 金额减法
					subtract(a, b) {
						const factor = 100
						return Math.round((parseFloat(a) * factor - parseFloat(b) * factor)) / factor
					},
					
					// 金额乘法
					multiply(a, b) {
						const factor = 100
						return Math.round(parseFloat(a) * parseFloat(b) * factor) / factor
					},
					
					// 金额除法
					divide(a, b) {
						if (parseFloat(b) === 0) return 0
						const factor = 100
						return Math.round((parseFloat(a) / parseFloat(b)) * factor) / factor
					},
					
					// 格式化金额，保留两位小数
					format(amount) {
						return parseFloat(amount).toFixed(2)
					}
				}
			}
		},
		
		computed: {
			// 总预算 - 直接计算各分类预算的总和（与预算管理页面保持一致）
			totalBudget() {
				return this.categoryBudgets.reduce((sum, budget) => {
					// 直接累加预算金额，不进行时间单位转换
					return sum + (budget.budgetAmount || 0)
				}, 0)
			},
			
			// 已使用金额 - 统一使用分类预算的计算方式
			usedAmount() {
				// 直接使用各分类预算的已使用金额总和
				// 这样确保首页和预算管理页面的计算方式完全一致
				const total = this.categoryBudgets.reduce((sum, budget) => {
					return sum + (budget.spentAmount || 0)
				}, 0)
				console.log('首页计算已使用金额(统一方式):', total)
				return total
			},
			
			// 剩余金额 - 与预算管理页面保持一致
			remainingAmount() {
				return this.totalBudget - this.usedAmount
			},
			
			// 使用进度百分比 - 与预算管理页面保持一致
			progressPercentage() {
				if (this.totalBudget === 0) return 0
				return Math.min((this.usedAmount / this.totalBudget) * 100, 100)
			},
			
			// 计算预算信息（始终基于本月数据，不受筛选条件影响）
			calculateBudgetInfo() {
				// 计算本月剩余天数
				const now = new Date()
				const year = now.getFullYear()
				const month = now.getMonth()
				const lastDay = new Date(year, month + 1, 0).getDate()
				const currentDay = now.getDate()
				const remainingDays = lastDay - currentDay + 1
				
				// 计算日均可花费
				const dailyAverage = remainingDays > 0 ? this.remainingAmount / remainingDays : 0
				
				return {
					totalBudget: this.totalBudget,
					usedAmount: this.usedAmount,
					remainingAmount: this.remainingAmount,
					progress: this.progressPercentage,
					remainingDays,
					dailyAverage: Math.max(dailyAverage, 0)
				}
			}
		},
		
		onLoad() {
			this.loadData()
		},
		onShow() {
			this.loadData()
		},
		methods: {
			// 获取预算进度显示文本
			getBudgetProgressDisplayText() {
				const progress = this.calculateBudgetInfo.progress
				if (progress >= 100) {
					return '已用完'
				} else {
					return Math.round(progress) + '%'
				}
			},
			
			loadData() {
				// 从本地存储加载数据
				const records = uni.getStorageSync('records') || []
				this.allRecords = records.sort((a, b) => new Date(b.time) - new Date(a.time))
				
				// 加载预算数据 - 与预算管理页面保持一致
				this.loadBudgetData()
				
				// 加载当前月份的记录 - 与预算管理页面保持一致
				this.loadCurrentMonthRecords()
				
				// 计算各分类的支出 - 与预算管理页面保持一致
				this.calculateCategorySpending()
				
				// 加载分类数据
				this.loadCategories()
				
				// 默认筛选本月数据
				this.selectedTimeIndex = 3 // 本月
				
				this.updateCategoryOptions()
				this.filterRecords()
				this.calculateMonthSummary()
			},
			
			// 加载预算数据 - 与预算管理页面保持一致
			loadBudgetData() {
				const savedCategoryBudgets = uni.getStorageSync('categoryBudgets')
				
				if (savedCategoryBudgets && Array.isArray(savedCategoryBudgets)) {
					this.categoryBudgets = savedCategoryBudgets
				}
			},
			
			// 加载当前月份的记录 - 与预算管理页面保持一致
			loadCurrentMonthRecords() {
				const allRecords = uni.getStorageSync('records') || []
				
				const currentDate = new Date()
				const currentYear = currentDate.getFullYear()
				const currentMonth = currentDate.getMonth()
				
				this.currentMonthRecords = allRecords.filter(record => {
					const recordDate = new Date(record.time)
					return recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth
				})
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
				
				// 重新计算统计数据（包括预算数据）
				this.calculateMonthSummary()
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
				} else {
					// 如果选择自定义范围，弹出日期选择器
					this.showCustomDatePicker()
				}
				this.filterRecords()
			},
			
			// 显示自定义日期选择器
			showCustomDatePicker() {
				// 先选择开始日期
				uni.showModal({
					title: '选择时间范围',
					content: '请先选择开始日期，然后选择结束日期',
					showCancel: false,
					success: () => {
						// 可以在这里添加日期选择逻辑，或者让用户在筛选区域手动选择
						// 由于uni-app的限制，这里主要是提示用户
					}
				})
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
						group.totalExpense = this.moneyCalculator.add(group.totalExpense, parseFloat(record.amount))
					} else {
						group.totalIncome = this.moneyCalculator.add(group.totalIncome, parseFloat(record.amount))
					}
				})
				
				// 转换为数组并按日期倒序排列
				this.groupedRecords = Array.from(groupedMap.values()).map(group => ({
					...group,
					totalExpense: this.moneyCalculator.format(group.totalExpense),
					totalIncome: this.moneyCalculator.format(group.totalIncome)
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
				// 如果结束日期早于开始日期，自动调整结束日期
				if (this.customEndDate && this.customEndDate < this.customStartDate) {
					this.customEndDate = this.customStartDate
				}
				this.filterRecords()
			},
			
			// 结束日期选择
			onEndDateChange(e) {
				this.customEndDate = e.detail.value
				// 如果结束日期早于开始日期，自动调整开始日期
				if (this.customStartDate && this.customEndDate < this.customStartDate) {
					this.customStartDate = this.customEndDate
				}
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
				// 根据筛选条件获取记录
				let filteredRecords = this.allRecords
				
				// 应用时间筛选
				if (this.selectedTimeIndex > 0) {
					filteredRecords = this.filterByTime(filteredRecords)
				}
				
				// 应用类型筛选
				if (this.selectedTypeIndex > 0) {
					const type = this.selectedTypeIndex === 1 ? 'expense' : 'income'
					filteredRecords = filteredRecords.filter(record => record.type === type)
				}
				
				// 应用分类筛选
				if (this.selectedCategoryIndex > 0) {
					const categoryName = this.categoryOptions[this.selectedCategoryIndex]
					filteredRecords = filteredRecords.filter(record => record.categoryName === categoryName)
				}
				
				let filteredExpense = 0
				let filteredIncome = 0
				let todayExpense = 0
				let expenseDays = new Set() // 记录有支出的天数
				
				// 计算筛选后的统计数据
				filteredRecords.forEach(record => {
					const recordDate = new Date(record.time)
					const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate())
					
					if (record.type === 'expense') {
						filteredExpense = this.moneyCalculator.add(filteredExpense, parseFloat(record.amount))
						expenseDays.add(recordDay.getTime()) // 使用时间戳确保唯一性
					} else {
						filteredIncome = this.moneyCalculator.add(filteredIncome, parseFloat(record.amount))
					}
				})
				
				// 计算今日支出（基于原始数据，不受筛选影响）
				const now = new Date()
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				this.allRecords.forEach(record => {
					const recordDate = new Date(record.time)
					const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate())
					if (recordDay.getTime() === today.getTime() && record.type === 'expense') {
						todayExpense = this.moneyCalculator.add(todayExpense, parseFloat(record.amount))
					}
				})
				
				this.monthExpense = this.moneyCalculator.format(filteredExpense)
				this.monthIncome = this.moneyCalculator.format(filteredIncome)
				this.monthBalance = this.moneyCalculator.format(this.moneyCalculator.subtract(filteredIncome, filteredExpense))
				this.todayExpense = this.moneyCalculator.format(todayExpense)
				this.totalRecords = filteredRecords.length
				
				// 计算平均日支出（基于筛选后的数据）
				const expenseDaysCount = expenseDays.size
				this.avgDailyExpense = expenseDaysCount > 0 ? 
					this.moneyCalculator.format(this.moneyCalculator.divide(filteredExpense, expenseDaysCount)) : '0.00'
				
				// 预算进度区域不受筛选条件影响，始终使用本月数据
				// 重新加载本月记录并计算预算数据
				this.loadCurrentMonthRecords()
				this.calculateCategorySpending()
		},
		
			
			// 获取当前时间范围文本（根据筛选条件）
			getCurrentTimeRangeText() {
				switch(this.selectedTimeIndex) {
					case 0: // 全部时间
						return this.getCurrentMonthRange()
					case 1: // 今天
						const today = new Date()
						return this.formatSingleDate(today)
					case 2: // 本周
						return this.getCurrentWeekRange()
					case 3: // 本月
						return this.getCurrentMonthRange()
					case 4: // 本年
						return this.getCurrentYearRange()
					case 5: // 自定义范围
						if (this.customStartDate && this.customEndDate) {
							return this.formatCustomRange()
						} else {
							return '请选择时间范围'
						}
					default:
						return this.getCurrentMonthRange()
				}
			},
			
			// 获取当前月份范围
			getCurrentMonthRange() {
				const now = new Date()
				const year = now.getFullYear()
				const month = now.getMonth()
				
				const firstDay = new Date(year, month, 1)
				const lastDay = new Date(year, month + 1, 0)
				
				const formatDate = (date) => {
					const y = date.getFullYear()
					const m = String(date.getMonth() + 1).padStart(2, '0')
					const d = String(date.getDate()).padStart(2, '0')
					return `${y}年${m}月${d}日`
				}
				
				return `${formatDate(firstDay)}-${formatDate(lastDay)}`
			},
			
			// 获取本周范围
			getCurrentWeekRange() {
				const now = new Date()
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const weekStart = new Date(today)
				weekStart.setDate(today.getDate() - today.getDay())
				const weekEnd = new Date(weekStart)
				weekEnd.setDate(weekStart.getDate() + 6)
				
				const formatDate = (date) => {
					const y = date.getFullYear()
					const m = String(date.getMonth() + 1).padStart(2, '0')
					const d = String(date.getDate()).padStart(2, '0')
					return `${y}年${m}月${d}日`
				}
				
				return `${formatDate(weekStart)}-${formatDate(weekEnd)}`
			},
			
			// 获取本年范围
			getCurrentYearRange() {
				const now = new Date()
				const year = now.getFullYear()
				return `${year}年全年`
			},
			
			// 格式化单个日期
			formatSingleDate(date) {
				const y = date.getFullYear()
				const m = String(date.getMonth() + 1).padStart(2, '0')
				const d = String(date.getDate()).padStart(2, '0')
				return `${y}年${m}月${d}日 (今天)`
			},
			
			// 格式化自定义范围
			formatCustomRange() {
				const startDate = new Date(this.customStartDate)
				const endDate = new Date(this.customEndDate)
				
				const formatDate = (date) => {
					const y = date.getFullYear()
					const m = String(date.getMonth() + 1).padStart(2, '0')
					const d = String(date.getDate()).padStart(2, '0')
					return `${y}年${m}月${d}日`
				}
				
				if (this.customStartDate === this.customEndDate) {
					return formatDate(startDate)
				} else {
					return `${formatDate(startDate)}-${formatDate(endDate)}`
				}
			},
			
			// 切换时间筛选器
			toggleTimeFilter() {
				// 创建一个动作表，让用户选择时间范围
				uni.showActionSheet({
					itemList: this.timeOptions,
					success: (res) => {
						if (res.tapIndex !== this.selectedTimeIndex) {
							this.selectedTimeIndex = res.tapIndex
							this.onTimeChange({ detail: { value: res.tapIndex } })
						}
					}
				})
			},
			
			goToAdd() {
				uni.navigateTo({
					url: '/pages/add/add'
				})
			},
			
			goToChat() {
				uni.switchTab({
					url: '/pages/chat/chat'
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
			},
			
			// ============= 预算相关方法 (与budget-manage.vue保持一致) =============
			
			// 将不同时间单位的预算转换为月预算
			convertToMonthlyBudget(amount, timeUnit) {
				const unit = this.timeUnits.find(u => u.key === timeUnit) || this.timeUnits.find(u => u.key === 'month')
				return amount * unit.factor
			},
			
			// 获取用于比较当期支出的预算基准
			getBudgetBaseline(amount, timeUnit) {
				switch(timeUnit) {
					case 'day':
						// 日预算：当月天数 × 日预算
						const currentDate = new Date()
						const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
						return amount * daysInMonth
					case 'month':
						// 月预算：直接使用
						return amount
					case 'quarter':
						// 季预算：直接使用原始金额
						return amount
					case 'year':
						// 年预算：直接使用原始金额
						return amount
					default:
						return amount
				}
			},
			
			// 计算各分类的支出 - 与预算管理页面保持一致
			calculateCategorySpending() {
				console.log('首页开始计算分类支出，预算分类数量:', this.categoryBudgets.length)
				
				// 为每个预算分类计算相应时间范围的支出
				this.categoryBudgets.forEach(budget => {
					// 确保有时间单位，默认为月
					if (!budget.timeUnit) {
						budget.timeUnit = 'month'
					}
					
					let categorySpending = 0
					
					// 根据新的计算规则计算已使用金额
					if (budget.timeUnit === 'month') {
						// 月度分类：单月支出
						const timeRangeRecords = this.getRecordsByTimeUnit(budget.timeUnit)
						categorySpending = this.calculateCategorySpendingFromRecords(timeRangeRecords, budget)
					} else if (budget.timeUnit === 'quarter') {
						// 季度分类：从开始月份算起这个季度的整个支出
						const timeRangeRecords = this.getRecordsByTimeUnit(budget.timeUnit, budget.quarterStartMonth)
						categorySpending = this.calculateCategorySpendingFromRecords(timeRangeRecords, budget)
					} else if (budget.timeUnit === 'year') {
						// 年度分类：这一年的年度支出(1月1日开始)
						const timeRangeRecords = this.getRecordsByTimeUnit(budget.timeUnit)
						categorySpending = this.calculateCategorySpendingFromRecords(timeRangeRecords, budget)
					} else {
						// 其他类型（如日）
						const timeRangeRecords = this.getRecordsByTimeUnit(budget.timeUnit)
						categorySpending = this.calculateCategorySpendingFromRecords(timeRangeRecords, budget)
					}
					
					const timeUnitName = this.getTimeUnitName(budget.timeUnit)
					const timeRangeDesc = this.getTimeRangeDesc(budget.timeUnit, budget.quarterStartMonth)
					console.log(`首页分类 ${budget.categoryName} ${timeRangeDesc} ${timeUnitName}支出:`, categorySpending)
					budget.spentAmount = categorySpending
				})
				
				// 保存更新后的数据 - 与预算管理页面保持一致
				this.saveCategoryBudgets()
			},
			
			// 根据时间单位获取相应时间范围的记录 - 与预算管理页面保持一致
			getRecordsByTimeUnit(timeUnit, quarterStartMonth = null) {
				const allRecords = uni.getStorageSync('records') || []
				const currentDate = new Date()
				const currentYear = currentDate.getFullYear()
				const currentMonth = currentDate.getMonth() + 1 // 1-12
				
				switch(timeUnit) {
					case 'day':
						// 日预算：本月所有记录（日累计）
						return this.currentMonthRecords
					
					case 'month':
						// 月分类：从每个月1号开始计算支出
						return allRecords.filter(record => {
							const recordDate = new Date(record.time)
							const recordYear = recordDate.getFullYear()
							const recordMonth = recordDate.getMonth() + 1
							
							// 只统计当前年月的记录
							return recordYear === currentYear && recordMonth === currentMonth
						})
					
					case 'quarter':
						// 季分类：连续季度计算，从开始月份开始每3个月为一个季度
						if (!quarterStartMonth) {
							// 如果没有指定开始月份，使用当前月份作为开始月份
							quarterStartMonth = currentMonth
						}
						
						// 计算当前月份属于第几个季度（从开始月份算起）
						let quarterNumber = 0
						if (currentMonth >= quarterStartMonth) {
							// 同一年内
							quarterNumber = Math.floor((currentMonth - quarterStartMonth) / 3)
						} else {
							// 跨年情况
							quarterNumber = Math.floor((12 - quarterStartMonth + currentMonth) / 3)
						}
						
						// 计算当前季度对应的3个月
						const currentQuarterStartMonth = (quarterStartMonth + quarterNumber * 3 - 1) % 12 + 1
						const month1 = currentQuarterStartMonth
						const month2 = currentQuarterStartMonth + 1 > 12 ? currentQuarterStartMonth + 1 - 12 : currentQuarterStartMonth + 1
						const month3 = currentQuarterStartMonth + 2 > 12 ? currentQuarterStartMonth + 2 - 12 : currentQuarterStartMonth + 2
						
						console.log(`首页季度计算: 开始月份${quarterStartMonth}, 当前月份${currentMonth}, 第${quarterNumber + 1}季度(${month1}-${month2}-${month3})`)
						
						return allRecords.filter(record => {
							const recordDate = new Date(record.time)
							const recordYear = recordDate.getFullYear()
							const recordMonth = recordDate.getMonth() + 1
							
							// 计算记录属于第几个季度
							let recordQuarterNumber = 0
							if (recordMonth >= quarterStartMonth) {
								// 同一年内
								recordQuarterNumber = Math.floor((recordMonth - quarterStartMonth) / 3)
							} else {
								// 跨年情况
								recordQuarterNumber = Math.floor((12 - quarterStartMonth + recordMonth) / 3)
							}
							
							// 只统计当前季度的记录
							const isCurrentQuarter = recordQuarterNumber === quarterNumber
							
							// 处理跨年的情况
							let isInQuarterRange = false
							if (currentQuarterStartMonth <= 10) {
								// 不跨年的季度 (如1-3月, 4-6月等)
								isInQuarterRange = recordYear === currentYear && 
												   (recordMonth === month1 || recordMonth === month2 || recordMonth === month3)
							} else {
								// 跨年的季度 (如11-1月, 12-2月)
								isInQuarterRange = ((recordYear === currentYear && recordMonth >= currentQuarterStartMonth) ||
												    (recordYear === currentYear + 1 && recordMonth <= month3))
							}
							
							return isCurrentQuarter && isInQuarterRange
						})
					
					case 'year':
						// 年分类：从1月1日开始计算
						return allRecords.filter(record => {
							const recordDate = new Date(record.time)
							const recordYear = recordDate.getFullYear()
							
							// 只统计当前年度的记录
							return recordYear === currentYear
						})
					
					default:
						return this.currentMonthRecords
				}
			},
			
			// 从记录中计算特定分类的支出 - 与预算管理页面保持一致
			calculateCategorySpendingFromRecords(records, budget) {
				return records
					.filter(record => {
						const isExpense = record.type === 'expense'
						const isSameCategory = record.categoryId == budget.categoryId || record.categoryName === budget.categoryName
						
						if (isExpense && isSameCategory) {
							console.log(`首页匹配到${this.getTimeUnitName(budget.timeUnit)}支出记录:`, {
								amount: record.amount,
								category: record.categoryName,
								date: record.time,
								timeUnit: budget.timeUnit
							})
						}
						
						return isExpense && isSameCategory
					})
					.reduce((sum, record) => {
						const amount = parseFloat(record.amount) || 0
						return sum + amount
					}, 0)
			},
			
			// 获取时间范围描述（用于调试）- 与预算管理页面保持一致
			getTimeRangeDesc(timeUnit, quarterStartMonth = null) {
				const currentDate = new Date()
				const currentYear = currentDate.getFullYear()
				const currentMonth = currentDate.getMonth() + 1
				
				switch(timeUnit) {
					case 'day':
					case 'month':
						return `${currentYear}年${currentMonth}月`
					case 'quarter':
					   if (quarterStartMonth) {
						   const m1 = this.monthNames[quarterStartMonth-1]
						   const m2 = this.monthNames[(quarterStartMonth) % 12]
						   const m3 = this.monthNames[(quarterStartMonth + 1) % 12]
						   return `${currentYear}年自定义季度(${m1}-${m2}-${m3})`
					} else {
						const quarter = Math.floor((currentMonth - 1) / 3) + 1
						const quarterStart = (quarter - 1) * 3 + 1
						const quarterEnd = quarter * 3
						return `${currentYear}年第${quarter}季度(${quarterStart}-${quarterEnd}月)`
					}
					case 'year':
						return `${currentYear}年`
					default:
						return `${currentYear}年${currentMonth}月`
				}
			},
			
			// 获取时间单位名称
			getTimeUnitName(timeUnit) {
				const unit = this.timeUnits.find(u => u.key === timeUnit)
				return unit ? unit.name : '月'
			},
			
			// 保存分类预算数据 - 与预算管理页面保持一致
			saveCategoryBudgets() {
				uni.setStorageSync('categoryBudgets', this.categoryBudgets)
			},
			
			
			// 获取预算进度文本
			getBudgetProgressText(spent, budget, timeUnit = 'month') {
				const budgetBaseline = this.getBudgetBaseline(budget, timeUnit)
				if (budgetBaseline === 0) return '0%'
				
				const percentage = (spent / budgetBaseline) * 100
				
				if (percentage >= 100) {
					return '已用完'
				} else {
					return percentage.toFixed(1) + '%'
				}
			}
		}
	}
</script>

<style>
	/* 全局防止水平溢出 */
	* {
		max-width: 100%;
		box-sizing: border-box;
	}
	
	.container {
		padding: 20rpx;
		background-color: #F5F5F5;
		height: 100vh;
		max-width: 100vw;
		overflow-x: hidden;
	}
	
	.summary-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		position: relative;
		overflow: hidden;
		box-shadow: 0 10rpx 30rpx rgba(102, 126, 234, 0.3);
		width: 100%;
		max-width: 100%;
	}
	
	/* 时间范围头部 */
	.time-range-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 25rpx;
		background: rgba(255, 255, 255, 0.15);
		padding: 15rpx 20rpx;
		border-radius: 25rpx;
		backdrop-filter: blur(10rpx);
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.time-range-header:active {
		transform: scale(0.98);
		background: rgba(255, 255, 255, 0.2);
	}
	
	.time-range-text {
		color: white;
		font-size: 24rpx;
		font-weight: 500;
		text-shadow: 0 1rpx 2rpx rgba(0,0,0,0.1);
	}
	
	.time-range-icon {
		width: 30rpx;
		height: 30rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 16rpx;
		transition: all 0.3s ease;
	}
	
	.time-range-header:active .time-range-icon {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.1);
	}
	
	/* 主要信息区域 */
	.main-info-section {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 30rpx;
	}
	
	.left-info {
		flex: 1;
		margin-right: 20rpx;
	}
	
	.expense-section {
		display: flex;
		align-items: center;
		margin-bottom: 10rpx;
	}
	
	.expense-label {
		color: #FFB3B3;
		font-size: 28rpx;
		margin-right: 10rpx;
	}
	
	.expense-icon {
		width: 35rpx;
		height: 35rpx;
		background: #FF6B6B;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 20rpx;
		font-weight: bold;
	}
	
	.main-amount {
		color: white;
		font-size: 48rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
		text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.2);
	}
	
	.sub-amounts {
		display: flex;
		gap: 30rpx;
	}
	
	.amount-item {
		display: flex;
		flex-direction: column;
	}
	
	.amount-label {
		color: rgba(255, 255, 255, 0.7);
		font-size: 22rpx;
		margin-bottom: 5rpx;
	}
	
	.amount-value {
		color: white;
		font-size: 26rpx;
		font-weight: 500;
	}
	
	.amount-value.positive {
		color: #B3FFD9;
	}
	
	.amount-value.negative {
		color: #FFB3B3;
	}
	
	/* 右侧聊天区域 */
	.right-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}
	
	.chat-bubble {
		background: rgba(255, 255, 255, 0.9);
		padding: 15rpx 20rpx;
		border-radius: 20rpx;
		margin-bottom: 15rpx;
		position: relative;
		box-shadow: 0 4rpx 15rpx rgba(0,0,0,0.1);
		max-width: 200rpx;
	}
	
	.chat-text {
		color: #333;
		font-size: 22rpx;
		line-height: 1.4;
	}
	
	.bubble-tail {
		position: absolute;
		bottom: -8rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 10rpx solid transparent;
		border-right: 10rpx solid transparent;
		border-top: 10rpx solid rgba(255, 255, 255, 0.9);
	}
	
	.avatar-container {
		position: relative;
	}
	
	.avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background: linear-gradient(45deg, #FFD93D, #FF6B6B);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 6rpx 20rpx rgba(255, 107, 107, 0.3);
		border: 4rpx solid rgba(255, 255, 255, 0.3);
		transition: all 0.3s ease;
	}
	
	.avatar:active {
		transform: scale(0.95);
	}
	
	.avatar-emoji {
		font-size: 35rpx;
	}
	
	/* 预算进度区域 */
	.budget-section {
		display: flex;
		align-items: center;
		margin-bottom: 25rpx;
		background: rgba(255, 255, 255, 0.1);
		padding: 25rpx;
		border-radius: 20rpx;
		backdrop-filter: blur(10rpx);
	}
	
	.progress-container {
		margin-right: 30rpx;
	}
	
	.progress-circle {
		width: 120rpx;
		height: 120rpx;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.progress-ring {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		padding: 8rpx;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.progress-inner {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2);
	}
	
	.progress-text {
		color: white;
		font-size: 22rpx;
		font-weight: bold;
		text-shadow: 0 1rpx 2rpx rgba(0,0,0,0.3);
	}
	
	.budget-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}
	
	.budget-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.budget-label {
		color: rgba(255, 255, 255, 0.8);
		font-size: 24rpx;
	}
	
	.budget-value {
		color: white;
		font-size: 26rpx;
		font-weight: 500;
	}
	
	.budget-value.positive {
		color: #B3FFD9;
	}
	
	.budget-source {
		font-size: 18rpx;
		color: rgba(255, 255, 255, 0.6);
		margin-top: 3rpx;
		display: block;
	}
	
	/* 其他统计信息 */
	.other-stats {
		display: flex;
		justify-content: space-between;
		background: rgba(255, 255, 255, 0.08);
		padding: 20rpx;
		border-radius: 15rpx;
		backdrop-filter: blur(10rpx);
	}
	
	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
	}
	
	.stat-label {
		color: rgba(255, 255, 255, 0.7);
		font-size: 22rpx;
		margin-bottom: 8rpx;
	}
	
	.stat-value {
		color: white;
		font-size: 26rpx;
		font-weight: 500;
	}
	
	.stat-value.expense {
		color: #FFB3B3;
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
	
	.quick-add {
		margin-bottom: 30rpx;
		width: 100%;
		box-sizing: border-box;
	}
	
	.add-btn {
		border-radius: 50rpx;
		font-size: 32rpx;
		background: linear-gradient(45deg, #FF6B6B, #FF8E53);
		border: none;
		box-shadow: 0 8rpx 25rpx rgba(255, 107, 107, 0.3);
		transition: all 0.3s ease;
		width: 100%;
		box-sizing: border-box;
	}
	
	.add-btn:active {
		transform: translateY(2rpx);
		box-shadow: 0 4rpx 15rpx rgba(255, 107, 107, 0.4);
	}
	
	.record-list {
		background-color: white;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
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
		box-sizing: border-box;
		width: 100%;
	}
	
	.filter-row {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
		width: 100%;
		box-sizing: border-box;
		flex-wrap: wrap;
		gap: 10rpx;
	}
	
	.filter-row:last-child {
		margin-bottom: 0;
	}
	
	.filter-item {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 140rpx;
		margin-right: 20rpx;
		box-sizing: border-box;
	}
	
	.filter-item:last-child {
		margin-right: 0;
	}
	
	.filter-item.full-width {
		flex: none;
		width: 100%;
		margin-right: 0;
		min-width: auto;
	}
	
	.filter-label {
		font-size: 26rpx;
		color: #666;
		margin-right: 10rpx;
		white-space: nowrap;
	}
	
	.picker-text {
		flex: 1;
		min-width: 0;
		padding: 12rpx 20rpx;
		background-color: white;
		border: 1px solid #E5E5E5;
		border-radius: 8rpx;
		font-size: 26rpx;
		color: #333;
		text-align: center;
		min-width: 100rpx;
		transition: all 0.2s ease;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
		box-sizing: border-box;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
		width: 100%;
		box-sizing: border-box;
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
		width: 100%;
		box-sizing: border-box;
	}
	
	.date-info {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
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
		flex-wrap: wrap;
		justify-content: flex-end;
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
		min-width: 0;
		overflow: hidden;
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
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	
	.record-note {
		font-size: 24rpx;
		color: #999;
		margin-top: 4rpx;
		opacity: 0.8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	
	.record-right {
		text-align: right;
		flex-shrink: 0;
		margin-left: 15rpx;
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
		width: 100%;
		box-sizing: border-box;
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
		width: 100%;
		box-sizing: border-box;
		min-width: 0;
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
