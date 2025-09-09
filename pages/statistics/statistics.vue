<template>
	<view class="container">
		<!-- 时间选择器 -->
		<view class="time-selector">
			<view class="time-tabs">
				<view class="time-tab" 
					  :class="{active: currentPeriod === 'week'}" 
					  @click="switchPeriod('week')">
					<text class="tab-text">本周</text>
				</view>
				<view class="time-tab" 
					  :class="{active: currentPeriod === 'month'}" 
					  @click="switchPeriod('month')">
					<text class="tab-text">本月</text>
				</view>
				<view class="time-tab" 
					  :class="{active: currentPeriod === 'year'}" 
					  @click="switchPeriod('year')">
					<text class="tab-text">本年</text>
				</view>
			</view>
		</view>
		
		<!-- 总览卡片 -->
		<view class="overview-card">
			<view class="overview-item">
				<text class="overview-label">{{periodText}}支出</text>
				<text class="overview-value expense">¥{{totalExpense}}</text>
			</view>
			<view class="overview-item">
				<text class="overview-label">{{periodText}}收入</text>
				<text class="overview-value income">¥{{totalIncome}}</text>
			</view>
			<view class="overview-item">
				<text class="overview-label">净收入</text>
				<text class="overview-value" :class="parseFloat(netIncome) >= 0 ? 'net-positive' : 'net-negative'">
					{{parseFloat(netIncome) >= 0 ? '+' : '-'}}¥{{Math.abs(parseFloat(netIncome)).toFixed(2)}}
				</text>
			</view>
		</view>
		
		<!-- 趋势分析 -->
		<view class="trend-analysis">
			<text class="stats-title">趋势分析</text>
			
			<!-- 支出趋势 -->
			<view class="trend-section">
				<text class="trend-title">支出趋势</text>
				<view v-if="expenseTrendData.length === 0" class="empty-trend">
					<text class="empty-text">暂无数据</text>
				</view>
				<view v-else class="trend-chart">
					<view v-for="(item, index) in expenseTrendData" 
						  :key="index" 
						  class="trend-bar expense-bar"
						  :style="{height: getTrendBarHeight(item.amount, expenseTrendData) + 'rpx'}">
						<text class="trend-label">{{getTrendLabel(item, index)}}</text>
						<view class="trend-value">
							<text class="trend-amount">¥{{item.amount}}</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 收入趋势 -->
			<view class="trend-section">
				<text class="trend-title">收入趋势</text>
				<view v-if="incomeTrendData.length === 0" class="empty-trend">
					<text class="empty-text">暂无数据</text>
				</view>
				<view v-else class="trend-chart">
					<view v-for="(item, index) in incomeTrendData" 
						  :key="index" 
						  class="trend-bar income-bar"
						  :style="{height: getTrendBarHeight(item.amount, incomeTrendData) + 'rpx'}">
						<text class="trend-label">{{getTrendLabel(item, index)}}</text>
						<view class="trend-value">
							<text class="trend-amount">¥{{item.amount}}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 支出分类统计 -->
		<view class="category-stats">
			<text class="stats-title">{{periodText}}支出分类</text>
			<view v-if="expenseStats.length === 0" class="empty-stats">
				<text class="empty-text">暂无支出记录</text>
			</view>
			<view v-else class="stats-content">
				<!-- 饼状图 -->
				<view class="pie-chart-container">
					<view class="pie-chart-wrapper">
						<view class="pie-chart-visual" :style="getPieChartStyle(expenseStats)">
							<!-- 中心文本 -->
							<view class="pie-center">
								<text class="pie-title">支出</text>
								<text class="pie-total">¥{{totalExpense}}</text>
							</view>
						</view>
					</view>
					
					<!-- 图例 -->
					<view class="pie-legend">
						<view v-for="(stat, index) in expenseStats.slice(0, 5)" 
							  :key="stat.categoryId" 
							  class="legend-item">
							<view class="legend-color" :style="{backgroundColor: getPieColor(index)}"></view>
							<view class="legend-text-container">
								<text class="legend-text">{{stat.name}} {{stat.percentage}}%</text>
								<text class="legend-amount">¥{{stat.amount}}</text>
							</view>
						</view>
						<view v-if="expenseStats.length > 5" class="legend-item">
							<view class="legend-color" style="background-color: #E0E0E0;"></view>
							<view class="legend-text-container">
								<text class="legend-text">其他 {{getOtherPercentage(expenseStats)}}%</text>
								<text class="legend-amount">¥{{getOtherAmount(expenseStats)}}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 详细列表 -->
				<view class="stats-list">
					<view v-for="stat in expenseStats" :key="stat.categoryId" class="stat-item">
						<view class="stat-left">
							<text class="stat-icon">{{stat.icon}}</text>
							<view class="stat-info">
								<text class="stat-name">{{stat.name}}</text>
								<text class="stat-count">{{stat.count}}笔</text>
							</view>
						</view>
						<view class="stat-right">
							<text class="stat-amount">¥{{stat.amount}}</text>
							<text class="stat-percent">{{stat.percentage}}%</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 收入分类统计 -->
		<view class="category-stats">
			<text class="stats-title">{{periodText}}收入分类</text>
			<view v-if="incomeStats.length === 0" class="empty-stats">
				<text class="empty-text">暂无收入记录</text>
			</view>
			<view v-else class="stats-content">
				<!-- 饼状图 -->
				<view class="pie-chart-container">
					<view class="pie-chart-wrapper">
						<view class="pie-chart-visual" :style="getPieChartStyle(incomeStats)">
							<!-- 中心文本 -->
							<view class="pie-center">
								<text class="pie-title">收入</text>
								<text class="pie-total">¥{{totalIncome}}</text>
							</view>
						</view>
					</view>
					
					<!-- 图例 -->
					<view class="pie-legend">
						<view v-for="(stat, index) in incomeStats.slice(0, 5)" 
							  :key="stat.categoryId" 
							  class="legend-item">
							<view class="legend-color" :style="{backgroundColor: getPieColor(index)}"></view>
							<view class="legend-text-container">
								<text class="legend-text">{{stat.name}} {{stat.percentage}}%</text>
								<text class="legend-amount">¥{{stat.amount}}</text>
							</view>
						</view>
						<view v-if="incomeStats.length > 5" class="legend-item">
							<view class="legend-color" style="background-color: #E0E0E0;"></view>
							<view class="legend-text-container">
								<text class="legend-text">其他 {{getOtherPercentage(incomeStats)}}%</text>
								<text class="legend-amount">¥{{getOtherAmount(incomeStats)}}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 详细列表 -->
				<view class="stats-list">
					<view v-for="stat in incomeStats" :key="stat.categoryId" class="stat-item">
						<view class="stat-left">
							<text class="stat-icon">{{stat.icon}}</text>
							<view class="stat-info">
								<text class="stat-name">{{stat.name}}</text>
								<text class="stat-count">{{stat.count}}笔</text>
							</view>
						</view>
						<view class="stat-right">
							<text class="stat-amount">¥{{stat.amount}}</text>
							<text class="stat-percent">{{stat.percentage}}%</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentPeriod: 'month',
				totalExpense: 0,
				totalIncome: 0,
				expenseStats: [],
				incomeStats: [],
				expenseTrendData: [],
				incomeTrendData: [],
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
			periodText() {
				switch(this.currentPeriod) {
					case 'week': return '本周'
					case 'month': return '本月'
					case 'year': return '本年'
					default: return '本月'
				}
			},
			
			netIncome() {
				return this.moneyCalculator.format(
					this.moneyCalculator.subtract(parseFloat(this.totalIncome), parseFloat(this.totalExpense))
				)
			}
		},
		
		onLoad() {
			this.calculateStats()
		},
		
		onShow() {
			this.calculateStats()
		},
		
		methods: {
			switchPeriod(period) {
				this.currentPeriod = period
				this.calculateStats()
			},
			
			calculateStats() {
				const records = uni.getStorageSync('records') || []
				const filteredRecords = this.filterRecordsByPeriod(records)
				
				this.calculateTotals(filteredRecords)
				this.calculateCategoryStats(filteredRecords)
				this.calculateTrendData(records)
			},
			
			filterRecordsByPeriod(records) {
				const now = new Date()
				const currentYear = now.getFullYear()
				const currentMonth = now.getMonth()
				const currentWeek = this.getWeekNumber(now)
				
				return records.filter(record => {
					const recordDate = new Date(record.time)
					const recordYear = recordDate.getFullYear()
					const recordMonth = recordDate.getMonth()
					const recordWeek = this.getWeekNumber(recordDate)
					
					switch(this.currentPeriod) {
						case 'week':
							return recordYear === currentYear && recordWeek === currentWeek
						case 'month':
							return recordYear === currentYear && recordMonth === currentMonth
						case 'year':
							return recordYear === currentYear
						default:
							return true
					}
				})
			},
			
			getWeekNumber(date) {
				const yearStart = new Date(date.getFullYear(), 0, 1)
				const weekStart = new Date(yearStart.getTime() - (yearStart.getDay() * 24 * 60 * 60 * 1000))
				return Math.floor((date - weekStart) / (7 * 24 * 60 * 60 * 1000))
			},
			
			calculateTotals(records) {
				let expense = 0
				let income = 0
				
				records.forEach(record => {
					const amount = parseFloat(record.amount)
					if (record.type === 'expense') {
						expense = this.moneyCalculator.add(expense, amount)
					} else {
						income = this.moneyCalculator.add(income, amount)
					}
				})
				
				this.totalExpense = this.moneyCalculator.format(expense)
				this.totalIncome = this.moneyCalculator.format(income)
			},
			
			calculateCategoryStats(records) {
				const expenseRecords = records.filter(r => r.type === 'expense')
				const incomeRecords = records.filter(r => r.type === 'income')
				
				this.expenseStats = this.getCategoryStats(expenseRecords, this.totalExpense)
				this.incomeStats = this.getCategoryStats(incomeRecords, this.totalIncome)
			},
			
			getCategoryStats(records, total) {
				const categoryMap = new Map()
				
				records.forEach(record => {
					const categoryId = record.categoryId
					if (categoryMap.has(categoryId)) {
						const existing = categoryMap.get(categoryId)
						existing.amount = this.moneyCalculator.add(existing.amount, parseFloat(record.amount))
						existing.count += 1
					} else {
						categoryMap.set(categoryId, {
							categoryId: categoryId,
							name: record.categoryName,
							icon: record.categoryIcon,
							amount: parseFloat(record.amount),
							count: 1
						})
					}
				})
				
				const stats = Array.from(categoryMap.values())
				
				// 计算百分比并排序
				stats.forEach(stat => {
					stat.amount = this.moneyCalculator.format(stat.amount)
					stat.percentage = total > 0 ? 
						this.moneyCalculator.format(this.moneyCalculator.multiply(
							this.moneyCalculator.divide(parseFloat(stat.amount), parseFloat(total)), 
							100
						)) : '0.00'
				})
				
				// 按金额降序排列
				stats.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
				
				return stats
			},
			
			// 获取饼状图颜色
			getPieColor(index) {
				const colors = [
					'#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
					'#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
				]
				return colors[index % colors.length]
			},
			
			// 生成饼状图样式
			getPieChartStyle(stats) {
				if (!stats || stats.length === 0) {
					return {
						background: 'conic-gradient(#E0E0E0 0deg 360deg)',
						borderRadius: '50%'
					}
				}
				
				// 只显示前5个分类，其余合并为"其他"
				const displayStats = stats.slice(0, 5)
				let gradientStops = []
				let currentAngle = 0
				
				displayStats.forEach((stat, index) => {
					const percentage = parseFloat(stat.percentage)
					const color = this.getPieColor(index)
					const nextAngle = currentAngle + (percentage / 100) * 360
					
					gradientStops.push(`${color} ${currentAngle}deg ${nextAngle}deg`)
					currentAngle = nextAngle
				})
				
				// 如果还有剩余角度，用"其他"填充
				if (currentAngle < 360) {
					gradientStops.push(`#E0E0E0 ${currentAngle}deg 360deg`)
				}
				
				return {
					background: `conic-gradient(${gradientStops.join(', ')})`,
					borderRadius: '50%',
					transition: 'all 0.3s ease'
				}
			},
			
			// 获取其他分类的百分比
			getOtherPercentage(stats) {
				if (stats.length <= 4) return '0.00'
				
				const otherStats = stats.slice(4)
				let otherTotal = 0
				otherStats.forEach(stat => {
					otherTotal = this.moneyCalculator.add(otherTotal, parseFloat(stat.percentage))
				})
				return this.moneyCalculator.format(otherTotal)
			},
			
			// 获取其他分类的金额
			getOtherAmount(stats) {
				if (stats.length <= 5) return '0.00'
				
				const otherStats = stats.slice(5)
				let otherTotal = 0
				otherStats.forEach(stat => {
					otherTotal = this.moneyCalculator.add(otherTotal, parseFloat(stat.amount))
				})
				return this.moneyCalculator.format(otherTotal)
			},
			
			// 计算趋势数据
			calculateTrendData(records) {
				const now = new Date()
				
				// 根据当前选择的时间段计算趋势数据
				if (this.currentPeriod === 'week') {
					this.calculateWeeklyTrend(records, now)
				} else if (this.currentPeriod === 'month') {
					this.calculateMonthlyTrend(records, now)
				} else if (this.currentPeriod === 'year') {
					this.calculateYearlyTrend(records, now)
				}
			},
			
			// 计算周趋势（显示最近7天，从后往前）
			calculateWeeklyTrend(records, now) {
				const expenseData = {}
				const incomeData = {}
				
				// 初始化最近7天的数据（从今天开始往前）
				for (let i = 0; i < 7; i++) {
					const date = new Date(now)
					date.setDate(date.getDate() - i)
					const dateKey = date.toISOString().split('T')[0]
					expenseData[dateKey] = { date: dateKey, amount: 0, day: date.getDate() }
					incomeData[dateKey] = { date: dateKey, amount: 0, day: date.getDate() }
				}
				
				// 统计数据
				records.forEach(record => {
					const recordDate = new Date(record.time).toISOString().split('T')[0]
					const amount = parseFloat(record.amount)
					
					if (record.type === 'expense' && expenseData[recordDate]) {
						expenseData[recordDate].amount = this.moneyCalculator.add(expenseData[recordDate].amount, amount)
					} else if (record.type === 'income' && incomeData[recordDate]) {
						incomeData[recordDate].amount = this.moneyCalculator.add(incomeData[recordDate].amount, amount)
					}
				})
				
				this.expenseTrendData = Object.values(expenseData).map(item => ({
					...item,
					amount: this.moneyCalculator.format(item.amount)
				}))
				this.incomeTrendData = Object.values(incomeData).map(item => ({
					...item,
					amount: this.moneyCalculator.format(item.amount)
				}))
			},
			
			// 计算月趋势（显示最近12个月，从后往前）
			calculateMonthlyTrend(records, now) {
				const expenseData = {}
				const incomeData = {}
				
				// 初始化最近12个月的数据（从当前月开始往前）
				for (let i = 0; i < 12; i++) {
					const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
					const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
					expenseData[monthKey] = { month: date.getMonth() + 1, year: date.getFullYear(), amount: 0 }
					incomeData[monthKey] = { month: date.getMonth() + 1, year: date.getFullYear(), amount: 0 }
				}
				
				// 统计数据
				records.forEach(record => {
					const recordDate = new Date(record.time)
					const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`
					const amount = parseFloat(record.amount)
					
					if (record.type === 'expense' && expenseData[monthKey]) {
						expenseData[monthKey].amount = this.moneyCalculator.add(expenseData[monthKey].amount, amount)
					} else if (record.type === 'income' && incomeData[monthKey]) {
						incomeData[monthKey].amount = this.moneyCalculator.add(incomeData[monthKey].amount, amount)
					}
				})
				
				this.expenseTrendData = Object.values(expenseData).map(item => ({
					...item,
					amount: this.moneyCalculator.format(item.amount)
				}))
				this.incomeTrendData = Object.values(incomeData).map(item => ({
					...item,
					amount: this.moneyCalculator.format(item.amount)
				}))
			},
			
			// 计算年趋势（显示最近5年，从后往前）
			calculateYearlyTrend(records, now) {
				const expenseData = {}
				const incomeData = {}
				
				// 初始化最近5年的数据（从当前年开始往前）
				for (let i = 0; i < 5; i++) {
					const year = now.getFullYear() - i
					expenseData[year] = { year, amount: 0 }
					incomeData[year] = { year, amount: 0 }
				}
				
				// 统计数据
				records.forEach(record => {
					const recordYear = new Date(record.time).getFullYear()
					const amount = parseFloat(record.amount)
					
					if (record.type === 'expense' && expenseData[recordYear]) {
						expenseData[recordYear].amount = this.moneyCalculator.add(expenseData[recordYear].amount, amount)
					} else if (record.type === 'income' && incomeData[recordYear]) {
						incomeData[recordYear].amount = this.moneyCalculator.add(incomeData[recordYear].amount, amount)
					}
				})
				
				this.expenseTrendData = Object.values(expenseData).map(item => ({
					...item,
					amount: this.moneyCalculator.format(item.amount)
				}))
				this.incomeTrendData = Object.values(incomeData).map(item => ({
					...item,
					amount: this.moneyCalculator.format(item.amount)
				}))
			},
			
			// 获取趋势图柱状图高度
			getTrendBarHeight(amount, trendData) {
				if (!trendData || trendData.length === 0) return 20
				
				const maxAmount = Math.max(...trendData.map(item => parseFloat(item.amount)))
				if (maxAmount === 0) return 20
				
				const ratio = parseFloat(amount) / maxAmount
				return Math.max(20, ratio * 120)
			},
			
			// 获取趋势图标签
			getTrendLabel(item, index) {
				if (this.currentPeriod === 'week') {
					return `${item.day}日`
				} else if (this.currentPeriod === 'month') {
					return `${item.month}月`
				} else if (this.currentPeriod === 'year') {
					return `${item.year}`
				}
				return ''
			}
		}
	}
</script>

<style>
	.container {
		background-color: #F5F5F5;
		min-height: 100vh;
		padding: 20rpx;
	}
	
	.time-selector {
		margin-bottom: 30rpx;
	}
	
	.time-tabs {
		display: flex;
		background-color: white;
		border-radius: 50rpx;
		padding: 10rpx;
	}
	
	.time-tab {
		flex: 1;
		text-align: center;
		padding: 20rpx;
		border-radius: 40rpx;
		transition: all 0.3s;
	}
	
	.time-tab.active {
		background: linear-gradient(45deg, #667eea, #764ba2);
	}
	
	.tab-text {
		font-size: 28rpx;
		color: #666;
	}
	
	.time-tab.active .tab-text {
		color: white;
		font-weight: bold;
	}
	
	.overview-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		padding: 40rpx;
		margin-bottom: 30rpx;
		display: flex;
		justify-content: space-between;
	}
	
	.overview-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
	}
	
	.overview-label {
		color: rgba(255, 255, 255, 0.8);
		font-size: 26rpx;
		margin-bottom: 10rpx;
	}
	
	.overview-value {
		color: white;
		font-size: 32rpx;
		font-weight: bold;
	}
	
	.category-stats {
		background-color: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
	}
	
	.stats-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 30rpx;
		display: block;
	}
	
	.empty-stats {
		text-align: center;
		padding: 60rpx 0;
	}
	
	.empty-text {
		color: #999;
		font-size: 28rpx;
	}
	
	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 25rpx 0;
		border-bottom: 1px solid #F0F0F0;
	}
	
	.stat-item:last-child {
		border-bottom: none;
	}
	
	.stat-left {
		display: flex;
		align-items: center;
		flex: 1;
	}
	
	.stat-icon {
		font-size: 40rpx;
		margin-right: 20rpx;
	}
	
	.stat-info {
		display: flex;
		flex-direction: column;
	}
	
	.stat-name {
		font-size: 30rpx;
		color: #333;
		font-weight: bold;
		margin-bottom: 5rpx;
	}
	
	.stat-count {
		font-size: 24rpx;
		color: #999;
	}
	
	.stat-right {
		text-align: right;
	}
	
	.stat-amount {
		font-size: 30rpx;
		color: #FF4757;
		font-weight: bold;
		display: block;
		margin-bottom: 5rpx;
	}
	
	/* 收入列表金额颜色 */
	.category-stats:last-child .stat-amount {
		color: #2ED573;
	}
	
	.stat-percent {
		font-size: 24rpx;
		color: #999;
	}
	
	.expense {
		color: #FF4757 !important;
	}
	
	.income {
		color: #2ED573 !important;
	}
	
	.net-positive {
		color: #00D68F !important;
		text-shadow: 0 0 10rpx rgba(0, 214, 143, 0.3);
	}
	
	.net-negative {
		color: #FF3838 !important;
		text-shadow: 0 0 10rpx rgba(255, 56, 56, 0.3);
	}
	
	/* 饼状图样式 */
	.stats-content {
		display: flex;
		flex-direction: column;
		gap: 40rpx;
	}
	
	.pie-chart-container {
		display: flex;
		align-items: center;
		gap: 40rpx;
		padding: 20rpx 0;
	}
	
	.pie-chart-wrapper {
		position: relative;
		width: 300rpx;
		height: 300rpx;
		flex-shrink: 0;
	}
	
	.pie-chart {
		width: 300rpx;
		height: 300rpx;
		border-radius: 50%;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
	}
	
	.pie-chart-visual {
		width: 100%;
		height: 100%;
		position: relative;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
	}
	
	.pie-slice {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transition: all 0.3s ease;
	}
	
	.pie-slice:hover {
		filter: brightness(1.1);
		transform: scale(1.02);
	}
	
	.pie-center {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 120rpx;
		height: 120rpx;
		background: white;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
		z-index: 10;
	}
	
	.pie-title {
		font-size: 24rpx;
		color: #666;
		margin-bottom: 8rpx;
	}
	
	.pie-total {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}
	
	.pie-legend {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}
	
	.legend-item {
		display: flex;
		align-items: center;
		gap: 15rpx;
		padding: 12rpx 16rpx;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 12rpx;
		transition: all 0.3s ease;
		margin-bottom: 8rpx;
	}
	
	.legend-item:active {
		background: rgba(255, 255, 255, 0.9);
		transform: scale(0.98);
	}
	
	.legend-color {
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		flex-shrink: 0;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}
	
	.legend-text-container {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.legend-text {
		font-size: 26rpx;
		color: #333;
		font-weight: 500;
	}
	
	.legend-amount {
		font-size: 26rpx;
		color: #FF4757;
		font-weight: 600;
	}
	
	/* 收入图例金额颜色 */
	.category-stats:last-child .legend-amount {
		color: #2ED573;
	}
	
	.stats-list {
		border-top: 1px solid #F0F0F0;
		padding-top: 30rpx;
	}
	
	/* 趋势分析样式 */
	.trend-analysis {
		background-color: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
	}
	
	.trend-section {
		margin-bottom: 40rpx;
	}
	
	.trend-section:last-child {
		margin-bottom: 0;
	}
	
	.trend-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
		display: block;
	}
	
	.empty-trend {
		text-align: center;
		padding: 40rpx 0;
	}
	
	.trend-chart {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		height: 220rpx;
		padding: 20rpx 0;
		border-bottom: 2rpx solid #E5E5E5;
		position: relative;
	}
	
	.trend-bar {
		flex: 1;
		margin: 0 5rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		border-radius: 8rpx 8rpx 0 0;
		transition: all 0.3s ease;
		max-width: 60rpx;
	}
	
	.trend-bar:active {
		transform: scale(0.95);
	}
	
	.expense-bar {
		background: linear-gradient(to top, #FF6B6B, #FF8E8E);
		box-shadow: 0 -2rpx 8rpx rgba(255, 107, 107, 0.3);
	}
	
	.income-bar {
		background: linear-gradient(to top, #4ECDC4, #7ED6CC);
		box-shadow: 0 -2rpx 8rpx rgba(78, 205, 196, 0.3);
	}
	
	.trend-label {
		position: absolute;
		bottom: -40rpx;
		left: 50%;
		transform: translateX(-50%);
		font-size: 22rpx;
		color: #666;
		white-space: nowrap;
		background: white;
		padding: 4rpx 8rpx;
		border-radius: 6rpx;
		border: 1rpx solid #E5E5E5;
	}
	
	.trend-value {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 8rpx;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 8rpx 12rpx;
		border-radius: 8rpx;
		font-size: 20rpx;
		white-space: nowrap;
		opacity: 0;
		transition: opacity 0.3s ease;
	}
	
	.trend-value::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6rpx solid transparent;
		border-top-color: rgba(0, 0, 0, 0.8);
	}
	
	.trend-bar:active .trend-value {
		opacity: 1;
	}
	
	.trend-amount {
		font-size: 20rpx;
		font-weight: bold;
	}
	
	/* 响应式设计 - 小屏幕时垂直排列 */
	@media screen and (max-width: 750rpx) {
		.pie-chart-container {
			flex-direction: column;
			align-items: center;
			gap: 30rpx;
		}
		
		.pie-chart-wrapper {
			width: 250rpx;
			height: 250rpx;
		}
		
		.pie-center {
			width: 100rpx;
			height: 100rpx;
		}
		
		.pie-title {
			font-size: 22rpx;
		}
		
		.pie-total {
			font-size: 24rpx;
		}
		
		.pie-legend {
			width: 100%;
		}
	}
</style>
