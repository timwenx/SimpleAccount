<template>
	<view class="container">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">预算管理</text>
			<text class="page-subtitle">合理规划支出，掌控财务状况</text>
		</view>
		
		<!-- 预算概览 -->
		<view class="budget-overview">
			<view class="overview-card">
				<view class="overview-item">
					<text class="overview-label">本月总预算</text>
					<text class="overview-value total">¥{{ totalBudget.toFixed(2) }}</text>
					<text class="budget-source">来自{{ categoryBudgets.length }}个分类预算</text>
				</view>
				<view class="overview-item">
					<text class="overview-label">已使用</text>
					<text class="overview-value used">¥{{ usedAmount.toFixed(2) }}</text>
				</view>
				<view class="overview-item">
					<text class="overview-label">剩余</text>
					<text class="overview-value remaining" :style="{color: remainingAmount >= 0 ? '#4CAF50' : '#FF6B6B'}">
						¥{{ remainingAmount.toFixed(2) }}
					</text>
				</view>
			</view>
			<view class="progress-card">
				<view class="progress-bar">
					<view class="progress-fill" :style="{width: progressPercentage + '%', backgroundColor: progressColor}"></view>
				</view>
				<text class="progress-text">已使用 {{ progressPercentage.toFixed(1) }}%</text>
				<text class="data-info">基于 {{ currentMonthRecords.filter(r => r.type === 'expense').length }} 条支出记录</text>
				<text class="unit-info">总预算由各分类预算换算累加而成 | 数据来源: {{ getCurrentDataSource() }}</text>
			</view>
		</view>
		
		<!-- 快速设置 -->
		<view class="quick-actions">
			<view class="action-button" @click="showAddCategoryBudgetDialog">
				<text class="action-icon">📋</text>
				<text class="action-text">添加分类预算</text>
			</view>
			<view class="action-button" @click="refreshBudgetData">
				<text class="action-icon">🔄</text>
				<text class="action-text">刷新数据</text>
			</view>
		</view>
		
		<!-- 分类预算列表 -->
		<view class="budget-list">
			<view class="list-header">
				<text class="list-title">分类预算</text>
				<text class="list-subtitle">{{ categoryBudgets.length }}个分类</text>
			</view>
			
			<view v-if="categoryBudgets.length === 0" class="empty-state">
				<text class="empty-icon">📊</text>
				<text class="empty-title">暂无预算设置</text>
				<text class="empty-desc">为不同支出分类设置预算，更好地控制开支</text>
				<view class="empty-action" @click="showAddCategoryBudgetDialog">
					<text class="empty-action-text">添加第一个预算</text>
				</view>
			</view>
			
			<view v-for="budget in categoryBudgets" :key="budget.categoryId" class="budget-item">
				<view class="budget-header">
					<view class="category-info">
						<text class="category-icon">{{ budget.categoryIcon }}</text>
						<view class="category-details">
							<text class="category-name">{{ budget.categoryName }}</text>
							<text class="category-unit">{{ getTimeUnitName(budget.timeUnit || 'month') }}预算</text>
						</view>
					</view>
					<view class="budget-actions">
						<text class="action-edit" @click="editCategoryBudget(budget)">编辑</text>
						<text class="action-delete" @click="deleteCategoryBudget(budget.categoryId)">删除</text>
					</view>
				</view>
				<view class="budget-details">
					<view class="budget-amounts">
						<text class="budget-amount">
							{{ getTimeUnitName(budget.timeUnit || 'month') }}预算：¥{{ budget.budgetAmount.toFixed(2) }}
						</text>
						<text class="spent-amount">
							{{ getSpentAmountLabel(budget.timeUnit || 'month') }}：¥{{ budget.spentAmount.toFixed(2) }}
						</text>
						<text class="remaining-amount" 
							  :style="{color: (getBudgetBaseline(budget.budgetAmount, budget.timeUnit || 'month') - budget.spentAmount) >= 0 ? '#4CAF50' : '#FF6B6B'}">
							剩余：¥{{ (getBudgetBaseline(budget.budgetAmount, budget.timeUnit || 'month') - budget.spentAmount).toFixed(2) }}
						</text>
					</view>
					<view class="budget-progress">
						<view class="progress-bar">
							<view class="progress-fill" 
								  :style="{
									  width: Math.min((budget.spentAmount / getBudgetBaseline(budget.budgetAmount, budget.timeUnit || 'month') * 100), 100) + '%',
									  backgroundColor: getBudgetProgressColor(budget.spentAmount, budget.budgetAmount, budget.timeUnit || 'month')
								  }">
							</view>
						</view>
						<text class="progress-percent">
							{{ getBudgetProgressText(budget.spentAmount, budget.budgetAmount, budget.timeUnit || 'month') }}
						</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 预算分析 -->
		<view class="budget-analysis">
			<text class="analysis-title">预算分析</text>
			
			<!-- 预警提醒 -->
			<view v-if="budgetWarnings.length > 0" class="warning-section">
				<view class="warning-header">
					<text class="warning-icon">⚠️</text>
					<text class="warning-title">预算提醒</text>
				</view>
				<view v-for="warning in budgetWarnings" :key="warning.categoryId" class="warning-item">
					<text class="warning-text">{{ warning.message }}</text>
				</view>
			</view>
			
			<!-- 健康度评分 -->
			<view class="health-score">
				<view class="score-header">
					<text class="score-label">预算健康度</text>
					<text class="score-value" :style="{color: healthScoreColor}">{{ healthScore }}/100</text>
				</view>
				<view class="score-bar">
					<view class="score-fill" :style="{width: healthScore + '%', backgroundColor: healthScoreColor}"></view>
				</view>
				<text class="score-desc">{{ healthScoreDesc }}</text>
			</view>
			
			<!-- 支出趋势 -->
			<view class="trend-section">
				<text class="trend-title">本月支出趋势</text>
				<view class="trend-info">
					<view class="trend-item">
						<text class="trend-label">日均支出</text>
						<text class="trend-value">¥{{ dailyAverage.toFixed(2) }}</text>
					</view>
					<view class="trend-item">
						<text class="trend-label">预计月末</text>
						<text class="trend-value" :style="{color: projectedAmount > totalBudget ? '#FF6B6B' : '#4CAF50'}">
							¥{{ projectedAmount.toFixed(2) }}
						</text>
					</view>
				</view>
				<text class="trend-tip" :class="projectedAmount > totalBudget ? 'trend-warning' : 'trend-good'">
					<text class="trend-icon">{{ projectedAmount > totalBudget ? '⚠️' : '✅' }}</text>
					{{ projectedAmount > totalBudget ? '按当前速度可能超出预算' : '支出控制良好' }}
				</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			categoryBudgets: [], // 分类预算列表
			currentMonthRecords: [], // 当前月份的记录
			editingBudget: null, // 正在编辑的预算
			timeUnits: [
				{ key: 'day', name: '日', factor: 30 }, // 日预算 × 30 = 月预算
				{ key: 'month', name: '月', factor: 1 }, // 月预算 × 1 = 月预算
				{ key: 'quarter', name: '季', factor: 1/3 }, // 季预算 × 1/3 = 月预算
				{ key: 'year', name: '年', factor: 1/12 } // 年预算 × 1/12 = 月预算
			]
		}
	},
	
	computed: {
		// 总预算 - 从各分类预算总和计算
		totalBudget() {
			return this.categoryBudgets.reduce((sum, budget) => {
				// 将各种时间单位的预算转换为月预算后累加
				const monthlyBudget = this.convertToMonthlyBudget(budget.budgetAmount, budget.timeUnit || 'month')
				return sum + monthlyBudget
			}, 0)
		},
		
		// 已使用金额
		usedAmount() {
			const total = this.currentMonthRecords
				.filter(record => record.type === 'expense')
				.reduce((sum, record) => {
					const amount = parseFloat(record.amount) || 0
					return sum + amount
				}, 0)
			
			console.log('计算已使用金额:', total)
			return total
		},
		
		// 剩余金额
		remainingAmount() {
			return this.totalBudget - this.usedAmount
		},
		
		// 使用进度百分比
		progressPercentage() {
			if (this.totalBudget === 0) return 0
			return Math.min((this.usedAmount / this.totalBudget) * 100, 100)
		},
		
		// 进度条颜色
		progressColor() {
			if (this.progressPercentage <= 70) return '#4CAF50'
			if (this.progressPercentage <= 90) return '#FF9800'
			return '#FF6B6B'
		},
		
		// 超预算分类数量
		overBudgetCount() {
			return this.categoryBudgets.filter(budget => {
				const budgetBaseline = this.getBudgetBaseline(budget.budgetAmount, budget.timeUnit || 'month')
				return budget.spentAmount > budgetBaseline
			}).length
		},
		
		// 节省金额
		savedAmount() {
			return this.categoryBudgets.reduce((sum, budget) => {
				const budgetBaseline = this.getBudgetBaseline(budget.budgetAmount, budget.timeUnit || 'month')
				const saved = budgetBaseline - budget.spentAmount
				return sum + (saved > 0 ? saved : 0)
			}, 0)
		},
		
		// 预算预警信息
		budgetWarnings() {
			const warnings = []
			
			this.categoryBudgets.forEach(budget => {
				const budgetBaseline = this.getBudgetBaseline(budget.budgetAmount, budget.timeUnit || 'month')
				const percentage = budgetBaseline > 0 ? (budget.spentAmount / budgetBaseline) * 100 : 0
				const timeUnitName = this.getTimeUnitName(budget.timeUnit || 'month')
				
				if (budget.spentAmount > budgetBaseline) {
					warnings.push({
						categoryId: budget.categoryId,
						message: `${budget.categoryIcon} ${budget.categoryName} 已超出${timeUnitName}预算 ¥${(budget.spentAmount - budgetBaseline).toFixed(2)}`
					})
				} else if (percentage >= 100) {
					warnings.push({
						categoryId: budget.categoryId,
						message: `${budget.categoryIcon} ${budget.categoryName} ${timeUnitName}预算已用完`
					})
				} else if (percentage >= 80) {
					warnings.push({
						categoryId: budget.categoryId,
						message: `${budget.categoryIcon} ${budget.categoryName} ${timeUnitName}预算即将用完 (${percentage.toFixed(1)}%)`
					})
				}
			})
			
			return warnings
		},
		
		// 预算健康度评分
		healthScore() {
			if (this.categoryBudgets.length === 0) return 100
			
			let totalScore = 0
			let scoreCount = 0
			
			this.categoryBudgets.forEach(budget => {
				const budgetBaseline = this.getBudgetBaseline(budget.budgetAmount, budget.timeUnit || 'month')
				if (budgetBaseline > 0) {
					const percentage = (budget.spentAmount / budgetBaseline) * 100
					let score = 100
					
					if (percentage > 100) {
						score = Math.max(0, 50 - (percentage - 100) * 2)
					} else if (percentage > 90) {
						score = 60
					} else if (percentage > 80) {
						score = 80
					} else if (percentage > 70) {
						score = 90
					}
					
					totalScore += score
					scoreCount++
				}
			})
			
			return scoreCount > 0 ? Math.round(totalScore / scoreCount) : 100
		},
		
		// 健康度评分颜色
		healthScoreColor() {
			if (this.healthScore >= 80) return '#4CAF50'
			if (this.healthScore >= 60) return '#FF9800'
			return '#FF6B6B'
		},
		
		// 健康度描述
		healthScoreDesc() {
			if (this.healthScore >= 90) return '预算控制优秀，继续保持！'
			if (this.healthScore >= 80) return '预算控制良好'
			if (this.healthScore >= 60) return '预算控制一般，需要注意'
			return '预算控制较差，建议调整支出'
		},
		
		// 日均支出
		dailyAverage() {
			if (this.currentMonthRecords.length === 0) return 0
			
			const currentDate = new Date()
			const currentDay = currentDate.getDate()
			
			return this.usedAmount / currentDay
		},
		
		// 预计月末支出
		projectedAmount() {
			if (this.dailyAverage === 0) return this.usedAmount
			
			const currentDate = new Date()
			const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
			
			return this.dailyAverage * daysInMonth
		}
	},
	
	onLoad() {
		console.log('=== 预算管理页面加载 ===')
		this.loadBudgetData()
		this.loadCurrentMonthRecords()
		this.calculateCategorySpending()
		
		// 调试信息
		console.log('总预算:', this.totalBudget)
		console.log('分类预算数量:', this.categoryBudgets.length)
		console.log('本月记录数量:', this.currentMonthRecords.length)
	},
	
	onShow() {
		console.log('=== 预算管理页面显示 ===')
		this.loadCurrentMonthRecords()
		this.calculateCategorySpending()
		
		// 显示最新计算结果
		this.$nextTick(() => {
			console.log('已使用金额:', this.usedAmount)
			console.log('剩余金额:', this.remainingAmount)
		})
	},
	
	methods: {
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
					// 例如：日预算20元，本月30天，基准=600元
					const currentDate = new Date()
					const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
					return amount * daysInMonth
				case 'month':
					// 月预算：直接使用
					// 例如：月预算1000元，基准=1000元
					return amount
				case 'quarter':
					// 季预算：直接使用原始金额
					// 例如：季预算10000元，本季花费10000元 = 100%
					return amount
				case 'year':
					// 年预算：直接使用原始金额
					// 例如：年预算2400元，本年花费2400元 = 100%
					return amount
				default:
					return amount
			}
		},
		
		// 获取时间单位名称
		getTimeUnitName(timeUnit) {
			const unit = this.timeUnits.find(u => u.key === timeUnit)
			return unit ? unit.name : '月'
		},
		
		// 获取支出统计标签
		getSpentAmountLabel(timeUnit) {
			switch(timeUnit) {
				case 'day':
					return '本月已用'
				case 'month':
					return '本月已用'
				case 'quarter':
					return '本季已用'
				case 'year':
					return '本年已用'
				default:
					return '本月已用'
			}
		},
		
		// 获取时间范围描述（用于调试）
		getTimeRangeDesc(timeUnit) {
			const currentDate = new Date()
			const currentYear = currentDate.getFullYear()
			const currentMonth = currentDate.getMonth() + 1
			
			switch(timeUnit) {
				case 'day':
				case 'month':
					return `${currentYear}年${currentMonth}月`
				case 'quarter':
					const quarter = Math.floor((currentMonth - 1) / 3) + 1
					const quarterStart = (quarter - 1) * 3 + 1
					const quarterEnd = quarter * 3
					return `${currentYear}年第${quarter}季度(${quarterStart}-${quarterEnd}月)`
				case 'year':
					return `${currentYear}年`
				default:
					return `${currentYear}年${currentMonth}月`
			}
		},
		
		// 加载预算数据
		loadBudgetData() {
			const savedCategoryBudgets = uni.getStorageSync('categoryBudgets')
			
			if (savedCategoryBudgets && Array.isArray(savedCategoryBudgets) && savedCategoryBudgets.length > 0) {
				this.categoryBudgets = savedCategoryBudgets
			} else {
				// 第一次使用，创建默认分类预算
				this.createDefaultCategoryBudgets()
			}
		},
		
		// 创建默认分类预算
		createDefaultCategoryBudgets() {
			// 获取支出分类
			const expenseCategories = uni.getStorageSync('expenseCategories') || [
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
			
			if (expenseCategories.length === 0) {
				console.log('没有找到支出分类，跳过创建默认预算')
				return
			}
			
			// 创建几个常用分类的默认预算
			const defaultBudgets = [
				{ categoryName: '餐饮', budgetAmount: 600, timeUnit: 'month' },
				{ categoryName: '交通', budgetAmount: 200, timeUnit: 'month' },
				{ categoryName: '购物', budgetAmount: 300, timeUnit: 'month' },
				{ categoryName: '娱乐', budgetAmount: 200, timeUnit: 'month' },
				{ categoryName: '住房', budgetAmount: 1500, timeUnit: 'quarter' } // 季度预算示例
			]
			
			const newCategoryBudgets = []
			
			defaultBudgets.forEach(defaultBudget => {
				// 查找对应的分类
				const category = expenseCategories.find(cat => cat.name === defaultBudget.categoryName)
				if (category) {
					newCategoryBudgets.push({
						categoryId: category.id,
						categoryName: category.name,
						categoryIcon: category.icon,
						budgetAmount: defaultBudget.budgetAmount,
						timeUnit: defaultBudget.timeUnit,
						spentAmount: 0
					})
				}
			})
			
			if (newCategoryBudgets.length > 0) {
				this.categoryBudgets = newCategoryBudgets
				uni.setStorageSync('categoryBudgets', this.categoryBudgets)
				console.log('创建了默认分类预算:', newCategoryBudgets.length, '个')
			}
		},
		
		// 加载当前月份的记录
		loadCurrentMonthRecords() {
			const allRecords = uni.getStorageSync('records') || []
			console.log('加载所有记录:', allRecords.length, '条')
			
			const currentDate = new Date()
			const currentYear = currentDate.getFullYear()
			const currentMonth = currentDate.getMonth()
			
			this.currentMonthRecords = allRecords.filter(record => {
				const recordDate = new Date(record.time)
				const isCurrentMonth = recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth
				
				if (isCurrentMonth) {
					console.log('本月记录:', {
						date: record.time,
						type: record.type,
						amount: record.amount,
						category: record.categoryName
					})
				}
				
				return isCurrentMonth
			})
			
			console.log('本月记录总数:', this.currentMonthRecords.length)
			console.log('本月支出记录数:', this.currentMonthRecords.filter(r => r.type === 'expense').length)
		},
		
		// 根据时间单位获取相应时间范围的记录
		getRecordsByTimeUnit(timeUnit) {
			const allRecords = uni.getStorageSync('records') || []
			const currentDate = new Date()
			
			switch(timeUnit) {
				case 'day':
					// 日预算：本月所有记录（日累计）
					return this.currentMonthRecords
				
				case 'month':
					// 月预算：本月记录
					return this.currentMonthRecords
				
				case 'quarter':
					// 季预算：本季度记录（当前季度的3个月）
					const currentYear = currentDate.getFullYear()
					const currentMonth = currentDate.getMonth()
					const quarterStartMonth = Math.floor(currentMonth / 3) * 3 // 0, 3, 6, 9
					
					return allRecords.filter(record => {
						const recordDate = new Date(record.time)
						const recordYear = recordDate.getFullYear()
						const recordMonth = recordDate.getMonth()
						
						return recordYear === currentYear && 
							   recordMonth >= quarterStartMonth && 
							   recordMonth < quarterStartMonth + 3
					})
				
				case 'year':
					// 年预算：本年度记录
					const yearStart = currentDate.getFullYear()
					
					return allRecords.filter(record => {
						const recordDate = new Date(record.time)
						return recordDate.getFullYear() === yearStart
					})
				
				default:
					return this.currentMonthRecords
			}
		},
		
		// 计算各分类的支出
		calculateCategorySpending() {
			console.log('开始计算分类支出，预算分类数量:', this.categoryBudgets.length)
			
			// 为每个预算分类计算相应时间范围的支出
			this.categoryBudgets.forEach(budget => {
				// 确保有时间单位，默认为月
				if (!budget.timeUnit) {
					budget.timeUnit = 'month'
				}
				
				// 根据时间单位获取相应时间范围的记录
				const timeRangeRecords = this.getRecordsByTimeUnit(budget.timeUnit)
				const timeRangeDesc = this.getTimeRangeDesc(budget.timeUnit)
				
				console.log(`计算分类 ${budget.categoryName} (${this.getTimeUnitName(budget.timeUnit)}) 在 ${timeRangeDesc} 的支出`)
				console.log(`时间范围内记录数:`, timeRangeRecords.length)
				
				const categorySpending = timeRangeRecords
					.filter(record => {
						const isExpense = record.type === 'expense'
						const isSameCategory = record.categoryId == budget.categoryId || record.categoryName === budget.categoryName
						
						if (isExpense && isSameCategory) {
							console.log(`匹配到${this.getTimeUnitName(budget.timeUnit)}支出记录:`, {
								amount: record.amount,
								category: record.categoryName,
								date: record.time,
								timeUnit: budget.timeUnit,
								timeRange: timeRangeDesc
							})
						}
						
						return isExpense && isSameCategory
					})
					.reduce((sum, record) => {
						const amount = parseFloat(record.amount) || 0
						return sum + amount
					}, 0)
				
				const timeUnitName = this.getTimeUnitName(budget.timeUnit)
				console.log(`分类 ${budget.categoryName} ${timeRangeDesc} ${timeUnitName}支出:`, categorySpending)
				budget.spentAmount = categorySpending
			})
			
			// 保存更新后的数据
			this.saveCategoryBudgets()
		},
		
		// 显示添加分类预算对话框
		showAddCategoryBudgetDialog() {
			// 获取所有支出分类
			const expenseCategories = uni.getStorageSync('expenseCategories') || [
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
			
			if (expenseCategories.length === 0) {
				uni.showToast({
					title: '暂无支出分类',
					icon: 'none'
				})
				return
			}
			
			// 过滤出还没有设置预算的分类
			const availableCategories = expenseCategories.filter(category => 
				!this.categoryBudgets.some(budget => budget.categoryId === category.id)
			)
			
			if (availableCategories.length === 0) {
				uni.showToast({
					title: '所有分类都已设置预算',
					icon: 'none'
				})
				return
			}
			
			const categoryNames = availableCategories.map(cat => `${cat.icon} ${cat.name}`)
			
			uni.showActionSheet({
				itemList: categoryNames,
				success: (res) => {
					const selectedCategory = availableCategories[res.tapIndex]
					this.showBudgetAmountDialog(selectedCategory)
				}
			})
		},
		
		// 显示预算金额输入对话框
		showBudgetAmountDialog(category, isEdit = false) {
			const title = isEdit ? '编辑预算' : '设置预算'
			const currentAmount = isEdit ? this.editingBudget.budgetAmount : 0
			const currentTimeUnit = isEdit ? this.editingBudget.timeUnit || 'month' : 'month'
			
			// 先选择时间单位
			const timeUnitNames = this.timeUnits.map(unit => {
				if (isEdit && unit.key === currentTimeUnit) {
					return `${unit.name} (当前)`
				}
				return unit.name
			})
			
			uni.showActionSheet({
				itemList: timeUnitNames,
				success: (res) => {
					const selectedTimeUnit = this.timeUnits[res.tapIndex]
					
					// 然后输入金额
					uni.showModal({
						title: `${title} - ${category.name} (${selectedTimeUnit.name}预算)`,
						content: isEdit ? `${currentAmount.toFixed(2)}` : '',
						editable: true,
						placeholderText: isEdit ? currentAmount.toString() : `请输入${selectedTimeUnit.name}预算金额`,
						success: (res) => {
							if (res.confirm && res.content) {
								const amount = parseFloat(res.content)
								if (isNaN(amount) || amount < 0) {
									uni.showToast({
										title: '请输入有效金额',
										icon: 'none'
									})
									return
								}
								
								if (isEdit) {
									this.updateCategoryBudget(category, amount, selectedTimeUnit.key)
								} else {
									this.addCategoryBudget(category, amount, selectedTimeUnit.key)
								}
							}
						}
					})
				}
			})
		},
		
		// 添加分类预算
		addCategoryBudget(category, amount, timeUnit) {
			const newBudget = {
				categoryId: category.id,
				categoryName: category.name,
				categoryIcon: category.icon,
				budgetAmount: amount,
				timeUnit: timeUnit,
				spentAmount: 0
			}
			
			this.categoryBudgets.push(newBudget)
			this.calculateCategorySpending()
			
			const timeUnitName = this.getTimeUnitName(timeUnit)
			uni.showToast({
				title: `${timeUnitName}预算添加成功`,
				icon: 'success'
			})
		},
		
		// 编辑分类预算
		editCategoryBudget(budget) {
			this.editingBudget = budget
			const category = {
				id: budget.categoryId,
				name: budget.categoryName,
				icon: budget.categoryIcon
			}
			this.showBudgetAmountDialog(category, true)
		},
		
		// 更新分类预算
		updateCategoryBudget(category, amount, timeUnit) {
			const index = this.categoryBudgets.findIndex(budget => budget.categoryId === category.id)
			if (index !== -1) {
				this.categoryBudgets[index].budgetAmount = amount
				this.categoryBudgets[index].timeUnit = timeUnit
				this.saveCategoryBudgets()
				
				const timeUnitName = this.getTimeUnitName(timeUnit)
				uni.showToast({
					title: `${timeUnitName}预算更新成功`,
					icon: 'success'
				})
			}
			this.editingBudget = null
		},
		
		// 删除分类预算
		deleteCategoryBudget(categoryId) {
			uni.showModal({
				title: '删除预算',
				content: '确定要删除这个分类的预算设置吗？',
				confirmColor: '#FF6B6B',
				success: (res) => {
					if (res.confirm) {
						this.categoryBudgets = this.categoryBudgets.filter(budget => budget.categoryId !== categoryId)
						this.saveCategoryBudgets()
						
						uni.showToast({
							title: '预算删除成功',
							icon: 'success'
						})
					}
				}
			})
		},
		
		// 保存分类预算数据
		saveCategoryBudgets() {
			uni.setStorageSync('categoryBudgets', this.categoryBudgets)
		},
		
		// 获取预算进度颜色
		getBudgetProgressColor(spent, budget, timeUnit = 'month') {
			const budgetBaseline = this.getBudgetBaseline(budget, timeUnit)
			if (budgetBaseline === 0) return '#E0E0E0'
			const percentage = (spent / budgetBaseline) * 100
			if (percentage <= 70) return '#4CAF50'
			if (percentage <= 90) return '#FF9800'
			return '#FF6B6B'
		},
		
		// 获取预算进度文本
		getBudgetProgressText(spent, budget, timeUnit = 'month') {
			const budgetBaseline = this.getBudgetBaseline(budget, timeUnit)
			if (budgetBaseline === 0) return '0%'
			
			const percentage = (spent / budgetBaseline) * 100
			const timeUnitName = this.getTimeUnitName(timeUnit)
			
			console.log(`预算进度计算 - ${timeUnitName}预算: ${budget}, 已花费: ${spent}, 基准: ${budgetBaseline}, 百分比: ${percentage.toFixed(1)}%`)
			
			if (percentage >= 100) {
				return '已用完'
			} else {
				return percentage.toFixed(1) + '%'
			}
		},
		
		// 获取当前数据统计来源
		getCurrentDataSource() {
			const currentDate = new Date()
			const currentYear = currentDate.getFullYear()
			const currentMonth = currentDate.getMonth() + 1
			return `${currentYear}年${currentMonth}月`
		},
		
		// 刷新预算数据
		refreshBudgetData() {
			uni.showLoading({
				title: '刷新中...'
			})
			
			// 重新加载数据
			this.loadCurrentMonthRecords()
			this.calculateCategorySpending()
			
			setTimeout(() => {
				uni.hideLoading()
				uni.showToast({
					title: '数据已刷新',
					icon: 'success',
					duration: 1000
				})
				
				// 显示刷新后的统计信息
				console.log('刷新后统计:')
				console.log('- 本月记录数:', this.currentMonthRecords.length)
				console.log('- 已使用金额:', this.usedAmount)
				console.log('- 剩余预算:', this.remainingAmount)
				console.log('- 分类预算详情:', this.categoryBudgets.map(b => ({
					name: b.categoryName,
					budget: b.budgetAmount,
					spent: b.spentAmount,
					remaining: b.budgetAmount - b.spentAmount
				})))
			}, 500)
		}
	}
}
</script>

<style scoped>
.container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.page-header {
	text-align: center;
	margin-bottom: 30rpx;
}

.page-title {
	font-size: 48rpx;
	font-weight: bold;
	color: #333;
	display: block;
}

.page-subtitle {
	font-size: 28rpx;
	color: #666;
	margin-top: 10rpx;
	display: block;
}

/* 预算概览 */
.budget-overview {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}

.overview-card {
	display: flex;
	justify-content: space-between;
	margin-bottom: 30rpx;
}

.overview-item {
	text-align: center;
	flex: 1;
}

.overview-label {
	font-size: 26rpx;
	color: #666;
	display: block;
	margin-bottom: 10rpx;
}

.overview-value {
	font-size: 32rpx;
	font-weight: bold;
	display: block;
}

.overview-value.total {
	color: #2196F3;
}

.overview-value.used {
	color: #FF9800;
}

.overview-value.remaining {
	color: #4CAF50;
}

.budget-source {
	font-size: 20rpx;
	color: #999;
	margin-top: 5rpx;
	display: block;
}

.progress-card {
	text-align: center;
}

.progress-bar {
	width: 100%;
	height: 12rpx;
	background-color: #E0E0E0;
	border-radius: 6rpx;
	overflow: hidden;
	margin-bottom: 15rpx;
}

.progress-fill {
	height: 100%;
	border-radius: 6rpx;
	transition: all 0.3s ease;
}

.progress-text {
	font-size: 24rpx;
	color: #666;
	margin-bottom: 8rpx;
}

.data-info {
	font-size: 20rpx;
	color: #999;
	margin-bottom: 5rpx;
}

.unit-info {
	font-size: 20rpx;
	color: #2196F3;
	font-style: italic;
}

/* 快速操作 */
.quick-actions {
	display: flex;
	gap: 15rpx;
	margin-bottom: 30rpx;
	flex-wrap: wrap;
}

.action-button {
	flex: 1;
	min-width: 200rpx;
	background: white;
	border-radius: 16rpx;
	padding: 25rpx 20rpx;
	text-align: center;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}

.action-icon {
	font-size: 36rpx;
	display: block;
	margin-bottom: 12rpx;
}

.action-text {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
	white-space: nowrap;
}

/* 预算列表 */
.budget-list {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}

.list-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
	padding-bottom: 20rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.list-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.list-subtitle {
	font-size: 26rpx;
	color: #666;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 60rpx 0;
}

.empty-icon {
	font-size: 80rpx;
	display: block;
	margin-bottom: 20rpx;
}

.empty-title {
	font-size: 32rpx;
	color: #333;
	font-weight: 500;
	display: block;
	margin-bottom: 15rpx;
}

.empty-desc {
	font-size: 26rpx;
	color: #666;
	display: block;
	margin-bottom: 40rpx;
	line-height: 1.5;
}

.empty-action {
	background: #2196F3;
	color: white;
	padding: 20rpx 40rpx;
	border-radius: 50rpx;
	display: inline-block;
}

.empty-action-text {
	color: white;
	font-size: 28rpx;
}

/* 预算项目 */
.budget-item {
	margin-bottom: 30rpx;
	padding: 25rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
	border-left: 6rpx solid #2196F3;
}

.budget-item:last-child {
	margin-bottom: 0;
}

.budget-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.category-info {
	display: flex;
	align-items: center;
}

.category-icon {
	font-size: 32rpx;
	margin-right: 15rpx;
}

.category-details {
	display: flex;
	flex-direction: column;
}

.category-name {
	font-size: 30rpx;
	font-weight: 500;
	color: #333;
}

.category-unit {
	font-size: 22rpx;
	color: #666;
	margin-top: 2rpx;
}

.budget-actions {
	display: flex;
	gap: 20rpx;
}

.action-edit, .action-delete {
	font-size: 24rpx;
	padding: 8rpx 16rpx;
	border-radius: 8rpx;
}

.action-edit {
	background: #E3F2FD;
	color: #2196F3;
}

.action-delete {
	background: #FFEBEE;
	color: #FF6B6B;
}

.budget-details {
	margin-top: 20rpx;
}

.budget-amounts {
	display: flex;
	justify-content: space-between;
	margin-bottom: 15rpx;
}

.budget-amount, .spent-amount, .remaining-amount {
	font-size: 24rpx;
}

.budget-amount {
	color: #2196F3;
}

.spent-amount {
	color: #FF9800;
}

.budget-progress {
	display: flex;
	align-items: center;
	gap: 15rpx;
}

.budget-progress .progress-bar {
	flex: 1;
	height: 8rpx;
	background-color: #E0E0E0;
	border-radius: 4rpx;
	overflow: hidden;
}

.budget-progress .progress-fill {
	height: 100%;
	border-radius: 4rpx;
	transition: all 0.3s ease;
}

.progress-percent {
	font-size: 22rpx;
	color: #666;
	min-width: 60rpx;
	text-align: right;
}

/* 预算分析 */
.budget-analysis {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}

.analysis-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 30rpx;
	text-align: center;
}

/* 预警提醒 */
.warning-section {
	margin-bottom: 30rpx;
	padding: 25rpx;
	background: linear-gradient(135deg, #FFF3E0 0%, #FFEFE0 100%);
	border-radius: 16rpx;
	border: 2rpx solid #FFB74D;
	box-shadow: 0 4rpx 15rpx rgba(255, 152, 0, 0.1);
}

.warning-header {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.warning-icon {
	font-size: 36rpx;
	margin-right: 12rpx;
}

.warning-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #E65100;
}

.warning-item {
	margin-bottom: 12rpx;
	padding: 15rpx;
	background: rgba(255,255,255,0.7);
	border-radius: 10rpx;
	border-left: 4rpx solid #FF9800;
}

.warning-text {
	font-size: 28rpx;
	color: #F57C00;
	line-height: 1.4;
	font-weight: 500;
}

/* 健康度评分 */
.health-score {
	margin-bottom: 30rpx;
	padding: 30rpx;
	background: linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%);
	border-radius: 16rpx;
	border: 2rpx solid #E0E0E0;
}

.score-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.score-label {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.score-value {
	font-size: 40rpx;
	font-weight: bold;
}

.score-bar {
	height: 16rpx;
	background-color: #E0E0E0;
	border-radius: 8rpx;
	overflow: hidden;
	margin-bottom: 20rpx;
	box-shadow: inset 0 2rpx 4rpx rgba(0,0,0,0.1);
}

.score-fill {
	height: 100%;
	border-radius: 8rpx;
	transition: all 0.3s ease;
	box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.2);
}

.score-desc {
	font-size: 26rpx;
	color: #666;
	text-align: center;
	font-weight: 500;
	padding: 15rpx;
	background: rgba(255,255,255,0.8);
	border-radius: 8rpx;
}

/* 支出趋势 */
.trend-section {
	padding: 30rpx;
	background: linear-gradient(135deg, #F0F7FF 0%, #F8FBFF 100%);
	border-radius: 16rpx;
	border: 2rpx solid #E3F2FD;
}

.trend-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1976D2;
	display: block;
	margin-bottom: 25rpx;
	text-align: center;
}

.trend-info {
	display: flex;
	justify-content: space-around;
	margin-bottom: 25rpx;
	background: white;
	padding: 25rpx;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.trend-item {
	text-align: center;
	flex: 1;
}

.trend-label {
	font-size: 26rpx;
	color: #666;
	display: block;
	margin-bottom: 10rpx;
	font-weight: 500;
}

.trend-value {
	font-size: 36rpx;
	font-weight: bold;
	color: #1976D2;
}

.trend-tip {
	font-size: 28rpx;
	text-align: center;
	padding: 20rpx 25rpx;
	border-radius: 12rpx;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.trend-tip.trend-good {
	background: linear-gradient(135deg, #E8F5E8 0%, #F0F9F0 100%);
	color: #2E7D32;
	border: 2rpx solid #4CAF50;
}

.trend-tip.trend-warning {
	background: linear-gradient(135deg, #FFF3E0 0%, #FFEFE0 100%);
	color: #E65100;
	border: 2rpx solid #FF9800;
}

.trend-icon {
	font-size: 32rpx;
	margin-right: 12rpx;
}
</style>
