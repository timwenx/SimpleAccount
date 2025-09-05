<template>
	<view class="container">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">{{isEditMode ? '编辑记录' : '记一笔'}}</text>
		</view>
		
		<!-- 类型切换 -->
		<view class="type-tabs">
			<view class="tab-item" :class="{active: currentType === 'expense'}" @click="switchType('expense')">
				<text class="tab-text">支出</text>
			</view>
			<view class="tab-item" :class="{active: currentType === 'income'}" @click="switchType('income')">
				<text class="tab-text">收入</text>
			</view>
		</view>
		
		<!-- 金额输入 -->
		<view class="amount-section">
			<text class="amount-symbol">¥</text>
			<input class="amount-input" 
				   type="digit" 
				   v-model="amount" 
				   placeholder="0.00" 
				   @input="onAmountInput"/>
		</view>
		
		<!-- 分类选择 -->
		<view class="category-section">
			<text class="section-title">选择分类</text>
			<view class="category-grid">
				<view v-for="category in currentCategories" 
					  :key="category.id" 
					  class="category-item" 
					  :class="{active: selectedCategory && selectedCategory.id === category.id}"
					  @click="selectCategory(category)">
					<text class="category-icon">{{category.icon}}</text>
					<text class="category-name">{{category.name}}</text>
				</view>
			</view>
		</view>
		
		<!-- 时间选择 -->
		<view class="time-section">
			<text class="section-title">时间</text>
			<view class="time-container">
				<!-- 日期选择 -->
				<picker class="date-picker" mode="date" :value="dateValue" @change="onDateChange" :start="getMinDate().split(' ')[0]" :end="getMaxDate().split(' ')[0]">
					<view class="time-picker">
						<text class="time-text">{{dateValue || '选择日期'}}</text>
						<text class="time-arrow">📅</text>
					</view>
				</picker>
				
				<!-- 时间选择 -->
				<picker class="time-picker-only" mode="time" :value="timeValue" @change="onTimeChange">
					<view class="time-picker">
						<text class="time-text">{{timeValue || '选择时间'}}</text>
						<text class="time-arrow">🕐</text>
					</view>
				</picker>
			</view>
		</view>
		
		<!-- 备注输入 -->
		<view class="note-section">
			<text class="section-title">备注</text>
			<textarea class="note-input" 
					  v-model="note" 
					  placeholder="添加备注信息（可选）" 
					  maxlength="100"/>
		</view>
		
		<!-- 保存按钮 -->
		<view class="save-section">
			<button class="save-btn" @click="saveRecord" :disabled="!canSave">
				{{isEditMode ? '更新记录' : '保存记录'}}
			</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentType: 'expense',
				amount: '',
				selectedCategory: null,
				datetime: '',
				dateValue: '',
				timeValue: '',
				note: '',
				expenseCategories: [],
				incomeCategories: [],
				isEditMode: false, // 是否为编辑模式
				editingRecordId: null // 正在编辑的记录ID
			}
		},
		
		computed: {
			currentCategories() {
				return this.currentType === 'expense' ? this.expenseCategories : this.incomeCategories
			},
			
			canSave() {
				return this.amount && parseFloat(this.amount) > 0 && this.selectedCategory
			}
		},
		
		onLoad(options) {
			// 加载分类数据
			this.loadCategories()
			
			// 检查是否为编辑模式
			if (options && options.editId) {
				this.isEditMode = true
				this.editingRecordId = options.editId
				// 设置导航标题
				uni.setNavigationBarTitle({
					title: '编辑记录'
				})
				this.loadEditRecord(options.editId)
			} else {
				// 新增模式：设置默认时间为当前时间
				uni.setNavigationBarTitle({
					title: '记一笔'
				})
				const now = new Date()
				this.dateValue = this.formatDateForPicker(now)
				this.timeValue = this.formatTimeForPicker(now)
				this.datetime = this.formatDatetimeForPicker(now)
				console.log('初始化日期:', this.dateValue, '时间:', this.timeValue)
			}
			
			// 处理预设分类参数（仅在新增模式下有效）
			if (!this.isEditMode && options && options.presetCategory) {
				try {
					const presetCategory = JSON.parse(decodeURIComponent(options.presetCategory))
					console.log('预设分类:', presetCategory)
					
					// 设置类型
					this.currentType = presetCategory.type
					
					// 延迟设置分类，确保分类列表已经计算完成
					this.$nextTick(() => {
						const category = this.currentCategories.find(cat => cat.id === presetCategory.id)
						if (category) {
							this.selectedCategory = category
						}
					})
				} catch (error) {
					console.error('解析预设分类参数失败:', error)
				}
			}
		},
		
		methods: {
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
			
			// 加载编辑的记录数据
			loadEditRecord(recordId) {
				console.log('加载编辑记录ID:', recordId)
				const records = uni.getStorageSync('records') || []
				const record = records.find(item => item.id == recordId)
				
				if (record) {
					// 加载记录数据到表单
					this.currentType = record.type
					this.amount = record.amount
					this.note = record.note || ''
					
					// 设置时间
					const recordDate = new Date(record.time)
					this.dateValue = this.formatDateForPicker(recordDate)
					this.timeValue = this.formatTimeForPicker(recordDate)
					this.datetime = this.formatDatetimeForPicker(recordDate)
					
					// 设置分类（需要等待分类数据加载完成）
					this.$nextTick(() => {
						const category = this.currentCategories.find(cat => cat.id === record.categoryId)
						if (category) {
							this.selectedCategory = category
						} else {
							// 如果找不到对应分类，可能是分类已被删除，创建一个临时分类对象
							this.selectedCategory = {
								id: record.categoryId,
								name: record.categoryName,
								icon: record.categoryIcon
							}
						}
					})
					
					console.log('加载编辑记录:', record)
				} else {
					console.error('找不到要编辑的记录:', recordId)
					uni.showToast({
						title: '记录不存在',
						icon: 'error'
					})
					// 返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				}
			},
			
			switchType(type) {
				this.currentType = type
				this.selectedCategory = null // 切换类型时清除已选分类
			},
			
			onAmountInput(e) {
				let value = e.detail.value
				// 确保只有数字和小数点
				value = value.replace(/[^\d.]/g, '')
				// 确保只有一个小数点
				const dotIndex = value.indexOf('.')
				if (dotIndex !== -1) {
					value = value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replace(/\./g, '')
					// 限制小数点后两位
					if (value.length > dotIndex + 3) {
						value = value.slice(0, dotIndex + 3)
					}
				}
				this.amount = value
			},
			
			selectCategory(category) {
				this.selectedCategory = category
			},
			
			onDatetimeChange(e) {
				console.log('时间选择变更:', e.detail.value) // 调试信息
				this.datetime = e.detail.value
			},
			
			onDateChange(e) {
				console.log('日期选择变更:', e.detail.value)
				this.dateValue = e.detail.value
				this.updateDateTime()
			},
			
			onTimeChange(e) {
				console.log('时间选择变更:', e.detail.value)
				this.timeValue = e.detail.value
				this.updateDateTime()
			},
			
			updateDateTime() {
				if (this.dateValue && this.timeValue) {
					this.datetime = `${this.dateValue} ${this.timeValue}`
					console.log('合并后的时间:', this.datetime)
				}
			},
			
			formatDateTime(datetime) {
				if (!datetime) return ''
				const date = new Date(datetime)
				const year = date.getFullYear()
				const month = (date.getMonth() + 1).toString().padStart(2, '0')
				const day = date.getDate().toString().padStart(2, '0')
				const hours = date.getHours().toString().padStart(2, '0')
				const minutes = date.getMinutes().toString().padStart(2, '0')
				return `${year}-${month}-${day} ${hours}:${minutes}`
			},
			
			formatDatetimeForPicker(date) {
				const year = date.getFullYear()
				const month = (date.getMonth() + 1).toString().padStart(2, '0')
				const day = date.getDate().toString().padStart(2, '0')
				const hours = date.getHours().toString().padStart(2, '0')
				const minutes = date.getMinutes().toString().padStart(2, '0')
				// uni-app picker需要这种格式：YYYY-MM-DD HH:mm
				return `${year}-${month}-${day} ${hours}:${minutes}`
			},
			
			formatDateForPicker(date) {
				const year = date.getFullYear()
				const month = (date.getMonth() + 1).toString().padStart(2, '0')
				const day = date.getDate().toString().padStart(2, '0')
				return `${year}-${month}-${day}`
			},
			
			formatTimeForPicker(date) {
				const hours = date.getHours().toString().padStart(2, '0')
				const minutes = date.getMinutes().toString().padStart(2, '0')
				return `${hours}:${minutes}`
			},
			
			getMinDate() {
				// 设置最早时间为1年前
				const date = new Date()
				date.setFullYear(date.getFullYear() - 1)
				return this.formatDatetimeForPicker(date)
			},
			
			getMaxDate() {
				// 设置最晚时间为当前时间
				const date = new Date()
				return this.formatDatetimeForPicker(date)
			},
			
			saveRecord() {
				if (!this.canSave) {
					uni.showToast({
						title: '请填写完整信息',
						icon: 'none'
					})
					return
				}
				
				if (this.isEditMode) {
					// 编辑模式：更新现有记录
					this.updateRecord()
				} else {
					// 新增模式：创建新记录
					this.createRecord()
				}
			},
			
			// 创建新记录
			createRecord() {
				const record = {
					id: Date.now().toString(),
					type: this.currentType,
					amount: parseFloat(this.amount).toFixed(2),
					categoryId: this.selectedCategory.id,
					categoryName: this.selectedCategory.name,
					categoryIcon: this.selectedCategory.icon,
					note: this.note.trim(),
					time: new Date(this.datetime).toISOString()
				}
				
				// 保存到本地存储
				const records = uni.getStorageSync('records') || []
				records.push(record)
				uni.setStorageSync('records', records)
				
				// 显示成功提示
				uni.showToast({
					title: '记录已保存',
					icon: 'success'
				})
				
				// 返回首页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			},
			
			// 更新现有记录
			updateRecord() {
				const records = uni.getStorageSync('records') || []
				const recordIndex = records.findIndex(item => item.id === this.editingRecordId)
				
				if (recordIndex === -1) {
					uni.showToast({
						title: '记录不存在',
						icon: 'error'
					})
					return
				}
				
				// 更新记录数据
				const updatedRecord = {
					...records[recordIndex], // 保持原有的id和创建时间等信息
					type: this.currentType,
					amount: parseFloat(this.amount).toFixed(2),
					categoryId: this.selectedCategory.id,
					categoryName: this.selectedCategory.name,
					categoryIcon: this.selectedCategory.icon,
					note: this.note.trim(),
					time: new Date(this.datetime).toISOString()
				}
				
				records[recordIndex] = updatedRecord
				uni.setStorageSync('records', records)
				
				// 显示成功提示
				uni.showToast({
					title: '记录已更新',
					icon: 'success'
				})
				
				// 返回首页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
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
	
	.page-header {
		text-align: center;
		padding: 20rpx 0 30rpx 0;
	}
	
	.page-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
	
	.type-tabs {
		display: flex;
		background-color: white;
		border-radius: 50rpx;
		padding: 10rpx;
		margin-bottom: 40rpx;
	}
	
	.tab-item {
		flex: 1;
		text-align: center;
		padding: 20rpx;
		border-radius: 40rpx;
		transition: all 0.3s;
	}
	
	.tab-item.active {
		background: linear-gradient(45deg, #667eea, #764ba2);
	}
	
	.tab-text {
		font-size: 30rpx;
		color: #666;
	}
	
	.tab-item.active .tab-text {
		color: white;
		font-weight: bold;
	}
	
	.amount-section {
		background-color: white;
		border-radius: 20rpx;
		padding: 60rpx 40rpx;
		margin-bottom: 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.amount-symbol {
		font-size: 60rpx;
		color: #333;
		margin-right: 20rpx;
	}
	
	.amount-input {
		font-size: 60rpx;
		color: #333;
		text-align: left;
		border: none;
		outline: none;
		background: transparent;
	}
	
	.category-section, .time-section, .note-section {
		background-color: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
	}
	
	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 30rpx;
		display: block;
	}
	
	.category-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
	}
	
	.category-item {
		width: calc(20% - 16rpx);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 10rpx;
		border-radius: 15rpx;
		transition: all 0.3s;
	}
	
	.category-item.active {
		background: linear-gradient(45deg, #667eea, #764ba2);
	}
	
	.category-icon {
		font-size: 40rpx;
		margin-bottom: 10rpx;
	}
	
	.category-name {
		font-size: 24rpx;
		color: #333;
		text-align: center;
	}
	
	.category-item.active .category-name {
		color: white;
	}
	
	.time-container {
		display: flex;
		gap: 15rpx;
		width: 100%;
	}
	
	/* picker组件的宽度控制 */
	.date-picker {
		flex: 3;
		max-width: none;
	}
	
	.time-picker-only {
		flex: 2;
		max-width: none;
	}
	
	.time-picker {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 25rpx 20rpx;
		background-color: #F8F8F8;
		border-radius: 15rpx;
		border: 2rpx solid #E0E0E0;
		transition: all 0.3s ease;
		box-sizing: border-box;
		width: 100%;
	}
	
	.time-picker:active {
		background-color: #F0F0F0;
		border-color: #667eea;
		transform: scale(0.98);
	}
	
	.time-text {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
	}
	
	.time-arrow {
		font-size: 28rpx;
		color: #667eea;
		font-weight: bold;
	}
	
	.note-input {
		width: 100%;
		min-height: 120rpx;
		font-size: 28rpx;
		line-height: 1.5;
		border: none;
		resize: none;
		outline: none;
		background: transparent;
	}
	
	.save-section {
		margin-top: 40rpx;
	}
	
	.save-btn {
		width: 100%;
		background: linear-gradient(45deg, #4ECDC4, #44A08D);
		color: white;
		border: none;
		border-radius: 50rpx;
		padding: 30rpx;
		font-size: 32rpx;
		font-weight: bold;
	}
	
	.save-btn[disabled] {
		background: #CCC;
		color: #999;
	}
</style>
