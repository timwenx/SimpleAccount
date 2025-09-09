<template>
	<view class="container">
		<!-- 分类头部信息 -->
		<view class="category-header">
			<view class="category-info">
				<text class="category-icon">{{categoryInfo.icon}}</text>
				<text class="category-name">{{categoryInfo.name}}</text>
			</view>
			<view class="category-type">
				<text class="type-text">{{categoryInfo.type === 'expense' ? '支出分类' : '收入分类'}}</text>
			</view>
		</view>
		
		
		
		<!-- 年度统计 -->
		<view class="yearly-stats">
			<text class="section-title">今年数据</text>
			<view class="yearly-overview">
				<view class="yearly-summary">
					<view class="yearly-item">
						<text class="yearly-label">年度总次数</text>
						<text class="yearly-value">{{yearlyCount}}次</text>
					</view>
					<view class="yearly-item">
						<text class="yearly-label">年度总金额</text>
						<text class="yearly-value">¥{{yearlyAmount}}</text>
					</view>
				</view>
				
				<!-- 与去年对比 -->
				<view class="year-comparison-section" v-if="lastYearCount > 0 || yearlyCount > 0">
					<text class="comparison-title">与去年对比</text>
					<view class="comparison-grid">
						<view class="comparison-item">
							<text class="comparison-label">次数变化</text>
							<text class="comparison-value" :class="getComparisonClass(yearlyCount, lastYearCount)">
								{{getComparisonText(yearlyCount, lastYearCount, '次')}}
							</text>
						</view>
						<view class="comparison-item">
							<text class="comparison-label">金额变化</text>
							<text class="comparison-value" :class="getComparisonClass(parseFloat(yearlyAmount), parseFloat(lastYearAmount))">
								{{getComparisonText(parseFloat(yearlyAmount), parseFloat(lastYearAmount), '元')}}
							</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		<!-- 月度统计 -->
		<view class="monthly-stats">
			<text class="section-title">本月数据</text>
			<view class="monthly-info">
				<view class="monthly-item">
					<text class="monthly-label">使用次数</text>
					<text class="monthly-value">{{monthlyCount}}次</text>
				</view>
				<view class="monthly-item">
					<text class="monthly-label">总金额</text>
					<text class="monthly-value">¥{{monthlyAmount}}</text>
				</view>
			</view>
			
			<!-- 与上月对比 -->
			<view class="comparison-section" v-if="lastMonthCount > 0 || monthlyCount > 0">
				<text class="comparison-title">与上月对比</text>
				<view class="comparison-grid">
					<view class="comparison-item">
						<text class="comparison-label">次数变化</text>
						<text class="comparison-value" :class="getComparisonClass(monthlyCount, lastMonthCount)">
							{{getComparisonText(monthlyCount, lastMonthCount, '次')}}
						</text>
					</view>
					<view class="comparison-item">
						<text class="comparison-label">金额变化</text>
						<text class="comparison-value" :class="getComparisonClass(parseFloat(monthlyAmount), parseFloat(lastMonthAmount))">
							{{getComparisonText(parseFloat(monthlyAmount), parseFloat(lastMonthAmount), '元')}}
						</text>
					</view>
				</view>
			</view>
		</view>
        
		<!-- 趋势分析 -->
		<view class="trend-analysis">
			<text class="section-title">趋势分析</text>
			<view class="trend-overview">
				<!-- 年度趋势 -->
				<view class="yearly-trend" v-if="yearlyTrend.length > 0">
					<text class="trend-title">年度趋势</text>
					<view class="year-trend-chart">
						<view v-for="(year, index) in yearlyTrend" 
							  :key="index" 
							  class="year-trend-bar"
							  :style="{height: getYearTrendBarHeight(year.amount) + 'rpx'}">
							<text class="trend-year">{{year.year}}</text>
							<view class="year-trend-value">
								<text class="trend-amount">¥{{year.amount}}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 月度趋势 -->
				<view class="monthly-trend" v-if="monthlyTrend.length > 0">
					<text class="trend-title">月度趋势</text>
					<view class="trend-chart">
						<view v-for="(month, index) in monthlyTrend" 
							  :key="index" 
							  class="trend-bar"
							  :style="{height: getTrendBarHeight(month.amount) + 'rpx'}">
							<text class="trend-month">{{getMonthLabel(month)}}</text>
							<view class="trend-value">
								<text class="trend-amount">¥{{month.amount}}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
		
        

        <!-- 统计概览 -->
		<view class="stats-overview">
			<text class="section-title">统计概览</text>
			<view class="stats-grid">
				<view class="stat-item">
					<text class="stat-value">{{totalCount}}</text>
					<text class="stat-label">使用次数</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">¥{{totalAmount}}</text>
					<text class="stat-label">总金额</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">¥{{avgAmount}}</text>
					<text class="stat-label">平均金额</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">¥{{maxAmount}}</text>
					<text class="stat-label">最高单笔</text>
				</view>
			</view>
		</view>
		
		<!-- 时间统计 -->
		<view class="time-stats">
			<text class="section-title">使用时间</text>
			<view class="time-info">
				<view class="time-item">
					<text class="time-label">首次使用</text>
					<text class="time-value">{{firstUseDate}}</text>
				</view>
				<view class="time-item">
					<text class="time-label">最近使用</text>
					<text class="time-value">{{lastUseDate}}</text>
				</view>
			</view>
		</view>

		<!-- 记录列表 -->
		<view class="records-section">
			<view class="section-header">
				<text class="section-title">使用记录</text>
				<text class="record-count">共{{records.length}}条</text>
			</view>
			
			<view v-if="records.length === 0" class="empty-records">
				<text class="empty-text">暂无使用记录</text>
				<button class="add-record-btn" @click="goToAdd" type="primary">记一笔</button>
			</view>
			
			<view v-else class="records-list">
				<view v-for="record in displayRecords" :key="record.id" class="record-item" @click="showRecordDetail(record)">
					<view class="record-left">
						<view class="record-date">
							<text class="date-text">{{formatDate(record.time)}}</text>
							<text class="time-text">{{formatTime(record.time)}}</text>
						</view>
						<text class="record-note" v-if="record.note">{{record.note}}</text>
						<text class="record-note empty-note" v-else>无备注</text>
					</view>
					<view class="record-right">
						<text class="record-amount" :class="record.type">
							{{record.type === 'expense' ? '-' : '+'}}¥{{record.amount}}
						</text>
					</view>
				</view>
				
				<view v-if="records.length > displayRecords.length" class="load-more">
					<button class="load-more-btn" @click="loadMoreRecords">
						加载更多 (还有{{records.length - displayRecords.length}}条)
					</button>
				</view>
			</view>
		</view>
		
		<!-- 操作按钮 -->
		<view class="actions">
			<button class="action-btn primary" @click="goToAdd">添加{{categoryInfo.name}}记录</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				categoryInfo: {},
				records: [],
				displayRecords: [],
				pageSize: 10,
				totalCount: 0,
				totalAmount: '0.00',
				avgAmount: '0.00',
				maxAmount: '0.00',
				minAmount: '0.00',
				firstUseDate: '暂无',
				lastUseDate: '暂无',
				monthlyCount: 0,
				monthlyAmount: '0.00',
				lastMonthCount: 0,
				lastMonthAmount: '0.00',
				yearlyCount: 0,
				yearlyAmount: '0.00',
				lastYearCount: 0,
				lastYearAmount: '0.00',
				monthlyTrend: [],
				yearlyTrend: [],
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
		
		onLoad(options) {
			if (options.category) {
				try {
					this.categoryInfo = JSON.parse(decodeURIComponent(options.category))
					this.loadCategoryData()
				} catch (e) {
					console.error('解析分类信息失败:', e)
					uni.showToast({
						title: '数据加载失败',
						icon: 'none'
					})
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				}
			}
		},
		
		methods: {
			loadCategoryData() {
				const allRecords = uni.getStorageSync('records') || []
				this.records = allRecords.filter(record => 
					record.categoryId === this.categoryInfo.id && record.type === this.categoryInfo.type
				).sort((a, b) => new Date(b.time) - new Date(a.time))
				
				this.calculateStats()
				this.loadMoreRecords(true)
			},
			
			calculateStats() {
				if (this.records.length === 0) {
					this.totalCount = 0
					this.totalAmount = '0.00'
					this.avgAmount = '0.00'
					this.maxAmount = '0.00'
					this.minAmount = '0.00'
					this.firstUseDate = '暂无'
					this.lastUseDate = '暂无'
					this.monthlyCount = 0
					this.monthlyAmount = '0.00'
					return
				}
				
				// 基础统计
				this.totalCount = this.records.length
				let totalAmount = 0
				let maxAmount = 0
				let minAmount = Infinity
				
				this.records.forEach(record => {
					const amount = parseFloat(record.amount)
					totalAmount = this.moneyCalculator.add(totalAmount, amount)
					if (amount > maxAmount) maxAmount = amount
					if (amount < minAmount) minAmount = amount
				})
				
				this.totalAmount = this.moneyCalculator.format(totalAmount)
				this.avgAmount = this.moneyCalculator.format(this.moneyCalculator.divide(totalAmount, this.records.length))
				this.maxAmount = this.moneyCalculator.format(maxAmount)
				this.minAmount = minAmount === Infinity ? '0.00' : this.moneyCalculator.format(minAmount)
				
				// 时间统计
				const sortedByTime = [...this.records].sort((a, b) => new Date(a.time) - new Date(b.time))
				this.firstUseDate = this.formatDate(sortedByTime[0].time)
				this.lastUseDate = this.formatDate(sortedByTime[sortedByTime.length - 1].time)
				
				// 月度统计
				this.calculateMonthlyStats()
				
				// 年度统计
				this.calculateYearlyStats()
			},
			
			calculateMonthlyStats() {
				const now = new Date()
				const currentYear = now.getFullYear()
				const currentMonth = now.getMonth()
				
				// 本月统计
				const monthRecords = this.records.filter(record => {
					const recordDate = new Date(record.time)
					return recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth
				})
				
				this.monthlyCount = monthRecords.length
				if (monthRecords.length > 0) {
					let monthTotal = 0
					monthRecords.forEach(record => {
						monthTotal = this.moneyCalculator.add(monthTotal, parseFloat(record.amount))
					})
					this.monthlyAmount = this.moneyCalculator.format(monthTotal)
				} else {
					this.monthlyAmount = '0.00'
				}
				
				// 上月统计
				const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
				const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
				
				const lastMonthRecords = this.records.filter(record => {
					const recordDate = new Date(record.time)
					return recordDate.getFullYear() === lastMonthYear && recordDate.getMonth() === lastMonth
				})
				
				this.lastMonthCount = lastMonthRecords.length
				if (lastMonthRecords.length > 0) {
					let lastMonthTotal = 0
					lastMonthRecords.forEach(record => {
						lastMonthTotal = this.moneyCalculator.add(lastMonthTotal, parseFloat(record.amount))
					})
					this.lastMonthAmount = this.moneyCalculator.format(lastMonthTotal)
				} else {
					this.lastMonthAmount = '0.00'
				}
			},
			
			calculateYearlyStats() {
				const now = new Date()
				const currentYear = now.getFullYear()
				
				// 年度统计
				const yearRecords = this.records.filter(record => {
					const recordDate = new Date(record.time)
					return recordDate.getFullYear() === currentYear
				})
				
				this.yearlyCount = yearRecords.length
				if (yearRecords.length > 0) {
					let yearTotal = 0
					yearRecords.forEach(record => {
						yearTotal = this.moneyCalculator.add(yearTotal, parseFloat(record.amount))
					})
					this.yearlyAmount = this.moneyCalculator.format(yearTotal)
				} else {
					this.yearlyAmount = '0.00'
				}
				
				// 去年统计
				const lastYear = currentYear - 1
				const lastYearRecords = this.records.filter(record => {
					const recordDate = new Date(record.time)
					return recordDate.getFullYear() === lastYear
				})
				
				this.lastYearCount = lastYearRecords.length
				if (lastYearRecords.length > 0) {
					let lastYearTotal = 0
					lastYearRecords.forEach(record => {
						lastYearTotal = this.moneyCalculator.add(lastYearTotal, parseFloat(record.amount))
					})
					this.lastYearAmount = this.moneyCalculator.format(lastYearTotal)
				} else {
					this.lastYearAmount = '0.00'
				}
				
				// 月度趋势数据（当前月份及前11个月）
				this.calculateMonthlyTrend()
				
				// 年度趋势数据
				this.calculateYearlyTrend()
			},
			
			calculateMonthlyTrend() {
				const monthlyData = []
				const now = new Date()
				const allRecords = uni.getStorageSync('records') || []
				const categoryRecords = allRecords.filter(record => 
					record.categoryId === this.categoryInfo.id && record.type === this.categoryInfo.type
				)
				
				// 初始化最近12个月的数据（从当前月往前）
				for (let i = 0; i < 12; i++) {
					const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
					const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
					
					monthlyData.push({
						month: date.getMonth() + 1,
						year: date.getFullYear(),
						monthKey: monthKey,
						count: 0,
						amount: '0.00'
					})
				}
				
				// 统计每月数据
				categoryRecords.forEach(record => {
					const recordDate = new Date(record.time)
					const recordYear = recordDate.getFullYear()
					const recordMonth = recordDate.getMonth() + 1
					const monthKey = `${recordYear}-${String(recordMonth).padStart(2, '0')}`
					
					const monthData = monthlyData.find(m => m.monthKey === monthKey)
					if (monthData) {
						monthData.count += 1
						const currentAmount = parseFloat(monthData.amount)
						const recordAmount = parseFloat(record.amount)
						monthData.amount = (currentAmount + recordAmount).toFixed(2)
					}
				})
				
				this.monthlyTrend = monthlyData
			},
			
			getComparisonClass(current, previous) {
				if (current > previous) return 'positive'
				if (current < previous) return 'negative'
				return 'neutral'
			},
			
			getComparisonText(current, previous, unit) {
				const diff = current - previous
				const percentage = previous > 0 ? ((diff / previous) * 100).toFixed(1) : '0.0'
				
				if (diff > 0) {
					return `↗ +${Math.abs(diff).toFixed(unit === '元' ? 2 : 0)}${unit} (+${percentage}%)`
				} else if (diff < 0) {
					return `↘ -${Math.abs(diff).toFixed(unit === '元' ? 2 : 0)}${unit} (-${Math.abs(percentage)}%)`
				} else {
					return `→ 持平 (0%)`
				}
			},
			
			calculateYearlyTrend() {
				const yearlyData = []
				const now = new Date()
				const currentYear = now.getFullYear()
				
				// 初始化最近4年的数据（从当前年往前）
				for (let i = 0; i < 4; i++) {
					const year = currentYear - i
					yearlyData.push({
						year: year,
						count: 0,
						amount: '0.00'
					})
				}
				
				// 统计每年数据
				this.records.forEach(record => {
					const recordYear = new Date(record.time).getFullYear()
					const yearData = yearlyData.find(y => y.year === recordYear)
					
					if (yearData) {
						yearData.count += 1
						const currentAmount = parseFloat(yearData.amount)
						const recordAmount = parseFloat(record.amount)
						yearData.amount = (currentAmount + recordAmount).toFixed(2)
					}
				})
				
				this.yearlyTrend = yearlyData
			},
			
			getYearTrendBarHeight(amount) {
				if (this.yearlyTrend.length === 0) return 0
				
				// 找出最大金额用于计算比例
				const maxAmount = Math.max(...this.yearlyTrend.map(y => parseFloat(y.amount)))
				if (maxAmount === 0) return 20
				
				// 计算高度，最小20rpx，最大150rpx
				const ratio = parseFloat(amount) / maxAmount
				return Math.max(20, ratio * 150)
			},
			
			getTrendBarHeight(amount) {
				if (this.monthlyTrend.length === 0) return 0
				
				// 找出最大金额用于计算比例
				const maxAmount = Math.max(...this.monthlyTrend.map(m => parseFloat(m.amount)))
				if (maxAmount === 0) return 20
				
				// 计算高度，最小20rpx，最大120rpx
				const ratio = parseFloat(amount) / maxAmount
				return Math.max(20, ratio * 120)
			},
			
			loadMoreRecords(reset = false) {
				if (reset) {
					this.displayRecords = []
				}
				
				const startIndex = this.displayRecords.length
				const endIndex = startIndex + this.pageSize
				const newRecords = this.records.slice(startIndex, endIndex)
				
				this.displayRecords.push(...newRecords)
			},
			
			getMonthLabel(month) {
				return `${month.month}月`
			},
			
			formatDate(timeStr) {
				const date = new Date(timeStr)
				const now = new Date()
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
				const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
				
				if (recordDate.getTime() === today.getTime()) {
					return '今天'
				} else if (recordDate.getTime() === yesterday.getTime()) {
					return '昨天'
				} else {
					return `${date.getMonth() + 1}月${date.getDate()}日`
				}
			},
			
			formatTime(timeStr) {
				const date = new Date(timeStr)
				return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
			},
			
			showRecordDetail(record) {
				uni.showModal({
					title: '记录详情',
					content: `分类：${record.categoryName}\n金额：${record.type === 'expense' ? '-' : '+'}¥${record.amount}\n备注：${record.note || '无'}\n时间：${new Date(record.time).toLocaleString('zh-CN')}`,
					showCancel: false
				})
			},
			
			goToAdd() {
				const categoryParam = encodeURIComponent(JSON.stringify(this.categoryInfo))
				uni.navigateTo({
					url: `/pages/add/add?presetCategory=${categoryParam}`
				})
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
	
	.category-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 24rpx;
		padding: 40rpx;
		margin-bottom: 30rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.3);
	}
	
	.category-info {
		display: flex;
		align-items: center;
	}
	
	.category-icon {
		font-size: 64rpx;
		margin-right: 20rpx;
		filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.2));
	}
	
	.category-name {
		font-size: 40rpx;
		font-weight: bold;
		color: white;
	}
	
	.category-type {
		background: rgba(255, 255, 255, 0.2);
		padding: 12rpx 24rpx;
		border-radius: 20rpx;
		backdrop-filter: blur(10rpx);
	}
	
	.type-text {
		color: white;
		font-size: 24rpx;
		font-weight: 500;
	}
	
	.stats-overview, .time-stats, .monthly-stats, .yearly-stats, .trend-analysis, .records-section {
		background-color: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10rpx);
		border-radius: 24rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
	}
	
	.section-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 30rpx;
		display: block;
		position: relative;
	}
	
	.section-title::after {
		content: '';
		position: absolute;
		bottom: -10rpx;
		left: 0;
		width: 60rpx;
		height: 4rpx;
		background: linear-gradient(45deg, #667eea, #764ba2);
		border-radius: 2rpx;
	}
	
	.stats-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
	}
	
	.stat-item {
		flex: 1;
		min-width: 160rpx;
		text-align: center;
		padding: 30rpx 20rpx;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
		border-radius: 16rpx;
		border: 1px solid rgba(102, 126, 234, 0.2);
	}
	
	.stat-value {
		display: block;
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 8rpx;
		background: linear-gradient(135deg, #667eea, #764ba2);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	
	.stat-label {
		font-size: 24rpx;
		color: #666;
	}
	
	.time-info, .monthly-info {
		display: flex;
		gap: 30rpx;
	}
	
	.time-item, .monthly-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 20rpx;
		background: rgba(102, 126, 234, 0.05);
		border-radius: 12rpx;
	}
	
	.time-label, .monthly-label {
		font-size: 24rpx;
		color: #666;
		margin-bottom: 8rpx;
	}
	
	.time-value, .monthly-value {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
	}
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}
	
	.record-count {
		font-size: 26rpx;
		color: #666;
		background: rgba(102, 126, 234, 0.1);
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
	}
	
	.empty-records {
		text-align: center;
		padding: 80rpx 0;
	}
	
	.empty-text {
		display: block;
		color: #999;
		font-size: 28rpx;
		margin-bottom: 30rpx;
	}
	
	.add-record-btn {
		background: linear-gradient(45deg, #FF6B6B, #FF8E53);
		border-radius: 50rpx;
		font-size: 28rpx;
		border: none;
	}
	
	.records-list {
		background: white;
		border-radius: 16rpx;
		overflow: hidden;
	}
	
	.record-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1px solid #F0F0F0;
		transition: background-color 0.3s;
	}
	
	.record-item:active {
		background-color: #F8F9FA;
	}
	
	.record-item:last-child {
		border-bottom: none;
	}
	
	.record-left {
		flex: 1;
	}
	
	.record-date {
		display: flex;
		align-items: center;
		margin-bottom: 10rpx;
	}
	
	.date-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		margin-right: 15rpx;
	}
	
	.time-text {
		font-size: 24rpx;
		color: #666;
		background: rgba(102, 126, 234, 0.1);
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
	}
	
	.record-note {
		font-size: 26rpx;
		color: #666;
	}
	
	.empty-note {
		color: #999;
		font-style: italic;
	}
	
	.record-right {
		text-align: right;
	}
	
	.record-amount {
		font-size: 32rpx;
		font-weight: bold;
	}
	
	.record-amount.expense {
		color: #FF6B6B;
	}
	
	.record-amount.income {
		color: #4ECDC4;
	}
	
	.load-more {
		padding: 30rpx;
		text-align: center;
		background: #F8F9FA;
	}
	
	.load-more-btn {
		background: transparent;
		border: 2rpx solid #667eea;
		color: #667eea;
		border-radius: 50rpx;
		font-size: 26rpx;
		padding: 15rpx 40rpx;
	}
	
	.actions {
		padding: 30rpx 0;
	}
	
	.action-btn {
		width: 100%;
		background: linear-gradient(45deg, #667eea, #764ba2);
		color: white;
		border-radius: 50rpx;
		font-size: 32rpx;
		font-weight: 600;
		border: none;
		box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.3);
	}
	
	/* 对比分析样式 */
	.comparison-section, .year-comparison-section {
		margin-top: 30rpx;
		padding-top: 30rpx;
		border-top: 1px solid rgba(240, 240, 240, 0.6);
	}
	
	.comparison-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #666;
		margin-bottom: 20rpx;
		display: block;
	}
	
	.comparison-grid {
		display: flex;
		gap: 20rpx;
	}
	
	.comparison-item {
		flex: 1;
		text-align: center;
		padding: 20rpx;
		background: rgba(102, 126, 234, 0.05);
		border-radius: 12rpx;
		border: 1px solid rgba(102, 126, 234, 0.1);
	}
	
	.comparison-label {
		font-size: 24rpx;
		color: #666;
		margin-bottom: 8rpx;
		display: block;
	}
	
	.comparison-value {
		font-size: 26rpx;
		font-weight: 600;
	}
	
	.comparison-value.positive {
		color: #4ECDC4;
	}
	
	.comparison-value.negative {
		color: #FF6B6B;
	}
	
	.comparison-value.neutral {
		color: #999;
	}
	
	/* 年度统计样式 */
	.yearly-overview, .trend-overview {
		display: flex;
		flex-direction: column;
		gap: 30rpx;
	}
	
	.yearly-summary {
		display: flex;
		gap: 20rpx;
	}
	
	.yearly-item {
		flex: 1;
		text-align: center;
		padding: 25rpx 20rpx;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
		border-radius: 16rpx;
		border: 1px solid rgba(102, 126, 234, 0.2);
	}
	
	.yearly-label {
		font-size: 24rpx;
		color: #666;
		margin-bottom: 8rpx;
		display: block;
	}
	
	.yearly-value {
		font-size: 32rpx;
		font-weight: bold;
		background: linear-gradient(135deg, #667eea, #764ba2);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	
	/* 趋势分析样式 */
	.monthly-trend, .yearly-trend {
		background: rgba(255, 255, 255, 0.8);
		border-radius: 16rpx;
		padding: 30rpx;
		border: 1px solid rgba(102, 126, 234, 0.1);
	}
	
	.monthly-trend:not(:last-child) {
		margin-bottom: 20rpx;
	}
	
	.trend-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #666;
		margin-bottom: 20rpx;
		display: block;
		position: relative;
	}
	
	.trend-title::before {
		content: '';
		position: absolute;
		left: -15rpx;
		top: 50%;
		transform: translateY(-50%);
		width: 6rpx;
		height: 20rpx;
		background: linear-gradient(45deg, #667eea, #764ba2);
		border-radius: 3rpx;
	}
	
	.yearly-trend .trend-title::before {
		background: linear-gradient(45deg, #FF6B6B, #FF8E53);
	}
	
	.trend-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #666;
		margin-bottom: 20rpx;
		display: block;
	}
	
	.trend-chart, .year-trend-chart {
		display: flex;
		align-items: flex-end;
		gap: 15rpx;
		height: 260rpx;
		padding: 20rpx 0 40rpx 0;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		position: relative;
	}
	
	.year-trend-chart {
		gap: 40rpx;
		justify-content: center;
	}
	
	.trend-bar, .year-trend-bar {
		flex: 0 0 60rpx;
		min-width: 60rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		position: relative;
		background: linear-gradient(to top, #667eea, #764ba2);
		border-radius: 8rpx 8rpx 0 0;
		min-height: 20rpx;
		transition: all 0.3s ease;
	}
	
	.year-trend-bar {
		background: linear-gradient(to top, #FF6B6B, #FF8E53);
		flex: 0 0 80rpx;
		min-width: 80rpx;
	}
	
	.trend-bar:active, .year-trend-bar:active {
		transform: scale(1.05);
		box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
	}
	
	.trend-month, .trend-year {
		position: absolute;
		bottom: -35rpx;
		left: 50%;
		transform: translateX(-50%);
		font-size: 22rpx;
		color: #666;
		white-space: nowrap;
		background: rgba(255, 255, 255, 0.9);
		padding: 4rpx 8rpx;
		border-radius: 6rpx;
		border: 1px solid rgba(102, 126, 234, 0.2);
	}
	
	.trend-value, .year-trend-value {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(255, 255, 255, 0.95);
		padding: 8rpx 12rpx;
		border-radius: 8rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		display: none;
		flex-direction: column;
		align-items: center;
		min-width: 120rpx;
		z-index: 10;
	}
	
	.trend-bar:active .trend-value, .year-trend-bar:active .year-trend-value {
		display: flex;
	}
	
	.trend-amount {
		font-size: 24rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 4rpx;
	}
	
	.trend-count {
		font-size: 20rpx;
		color: #666;
	}
</style>
