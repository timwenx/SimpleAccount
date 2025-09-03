<template>
	<view class="container">
		<!-- 页面头部 -->
		<view class="header">
			<view class="header-main">
				<text class="header-title">图标管理</text>
				<text class="header-tip">点击编辑，长按删除</text>
			</view>
			<view class="header-actions">
				<button class="reset-btn" @click="resetToDefault">恢复默认</button>
				<button class="add-btn" @click="showAddModal">添加分类</button>
			</view>
		</view>
		
		<!-- 分类切换 -->
		<view class="category-tabs">
			<view 
				class="tab-item" 
				:class="{active: currentTab === 'expense'}"
				@click="switchTab('expense')"
			>
				<text class="tab-text">支出分类</text>
			</view>
			<view 
				class="tab-item" 
				:class="{active: currentTab === 'income'}"
				@click="switchTab('income')"
			>
				<text class="tab-text">收入分类</text>
			</view>
		</view>
		
		<!-- 分类列表 -->
		<view class="category-list">
			<view 
				v-for="category in currentCategories" 
				:key="category.id" 
				class="category-item"
				@click="editCategory(category)"
				@longpress="deleteCategory(category)"
			>
				<view class="category-info">
					<text class="category-icon">{{category.icon}}</text>
					<text class="category-name">{{category.name}}</text>
				</view>
			</view>
		</view>
		
		<!-- 添加/编辑弹窗 -->
		<view class="modal-overlay" v-if="showModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{isEdit ? '编辑分类' : '添加分类'}}</text>
					<text class="modal-close" @click="closeModal">×</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">分类名称：</text>
						<input 
							class="form-input" 
							v-model="formData.name" 
							placeholder="请输入分类名称"
							maxlength="10"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">选择图标：</text>
						<view class="icon-grid">
							<view 
								v-for="icon in availableIcons" 
								:key="icon"
								class="icon-item"
								:class="{selected: formData.icon === icon}"
								@click="selectIcon(icon)"
							>
								<text class="icon-text">{{icon}}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="cancel-btn" @click="closeModal">取消</button>
					<button class="confirm-btn" @click="saveCategory">{{isEdit ? '保存' : '添加'}}</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentTab: 'expense', // expense | income
				expenseCategories: [],
				incomeCategories: [],
				showModal: false,
				isEdit: false,
				editId: null,
				formData: {
					name: '',
					icon: ''
				},
				// 可选图标库
				availableIcons: [
					'🍽️', '🚗', '🛍️', '🎬', '🏠', '💊', '📚', '📱', '👕', '📦',
					'💰', '🎁', '📈', '💼', '🧧', '↩️', '💎', '⚽', '🎵', '🚀',
					'🌟', '🔥', '💡', '🎨', '🏆', '🎯', '🔧', '⚡', '🌈', '🎪',
					'🎭', '🎸', '🎹', '🎤', '🎧', '📷', '🎥', '📺', '💻', '⌚',
					'📞', '💳', '💴', '💵', '💶', '💷', '🏪', '🏬', '🏭', '🏢'
				],
				// 默认分类数据
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
				return this.currentTab === 'expense' ? this.expenseCategories : this.incomeCategories
			}
		},
		onLoad() {
			this.loadCategories()
		},
		methods: {
			// 加载分类数据
			loadCategories() {
				// 从本地存储加载，如果没有则使用默认数据
				let expenseCategories = uni.getStorageSync('expenseCategories')
				let incomeCategories = uni.getStorageSync('incomeCategories')
				
				if (!expenseCategories || expenseCategories.length === 0) {
					expenseCategories = this.defaultExpenseCategories
					uni.setStorageSync('expenseCategories', expenseCategories)
				}
				
				if (!incomeCategories || incomeCategories.length === 0) {
					incomeCategories = this.defaultIncomeCategories
					uni.setStorageSync('incomeCategories', incomeCategories)
				}
				
				this.expenseCategories = expenseCategories
				this.incomeCategories = incomeCategories
			},
			
			// 切换标签页
			switchTab(tab) {
				this.currentTab = tab
			},
			
			// 显示添加弹窗
			showAddModal() {
				this.isEdit = false
				this.editId = null
				this.formData = {
					name: '',
					icon: ''
				}
				this.showModal = true
			},
			
			// 编辑分类
			editCategory(category) {
				this.isEdit = true
				this.editId = category.id
				this.formData = {
					name: category.name,
					icon: category.icon
				}
				this.showModal = true
			},
			
			// 选择图标
			selectIcon(icon) {
				this.formData.icon = icon
			},
			
			// 关闭弹窗
			closeModal() {
				this.showModal = false
				this.formData = {
					name: '',
					icon: ''
				}
			},
			
			// 保存分类
			saveCategory() {
				if (!this.formData.name.trim()) {
					uni.showToast({
						title: '请输入分类名称',
						icon: 'none'
					})
					return
				}
				
				if (!this.formData.icon) {
					uni.showToast({
						title: '请选择图标',
						icon: 'none'
					})
					return
				}
				
				const categories = this.currentTab === 'expense' ? this.expenseCategories : this.incomeCategories
				const storageKey = this.currentTab === 'expense' ? 'expenseCategories' : 'incomeCategories'
				
				if (this.isEdit) {
					// 编辑现有分类
					const index = categories.findIndex(cat => cat.id === this.editId)
					if (index !== -1) {
						categories[index] = {
							...categories[index],
							name: this.formData.name.trim(),
							icon: this.formData.icon
						}
					}
				} else {
					// 添加新分类
					const maxId = Math.max(...categories.map(cat => cat.id), 0)
					const newCategory = {
						id: maxId + 1,
						name: this.formData.name.trim(),
						icon: this.formData.icon
					}
					categories.push(newCategory)
				}
				
				// 更新数据
				if (this.currentTab === 'expense') {
					this.expenseCategories = [...categories]
				} else {
					this.incomeCategories = [...categories]
				}
				
				// 保存到本地存储
				uni.setStorageSync(storageKey, categories)
				
				this.closeModal()
				
				uni.showToast({
					title: this.isEdit ? '修改成功' : '添加成功',
					icon: 'success'
				})
			},
			
			// 删除分类
			deleteCategory(category) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除分类"${category.name}"吗？删除后相关记录将显示为"未知分类"。`,
					confirmColor: '#FF3B30',
					success: (res) => {
						if (res.confirm) {
							const categories = this.currentTab === 'expense' ? this.expenseCategories : this.incomeCategories
							const storageKey = this.currentTab === 'expense' ? 'expenseCategories' : 'incomeCategories'
							
							const filteredCategories = categories.filter(cat => cat.id !== category.id)
							
							// 更新数据
							if (this.currentTab === 'expense') {
								this.expenseCategories = filteredCategories
							} else {
								this.incomeCategories = filteredCategories
							}
							
							// 保存到本地存储
							uni.setStorageSync(storageKey, filteredCategories)
							
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
						}
					}
				})
			},
			
			// 恢复默认分类
			resetToDefault() {
				uni.showModal({
					title: '恢复默认',
					content: '确定要恢复到默认分类吗？这将清除所有自定义分类。',
					success: (res) => {
						if (res.confirm) {
							this.expenseCategories = [...this.defaultExpenseCategories]
							this.incomeCategories = [...this.defaultIncomeCategories]
							
							uni.setStorageSync('expenseCategories', this.expenseCategories)
							uni.setStorageSync('incomeCategories', this.incomeCategories)
							
							uni.showToast({
								title: '已恢复默认分类',
								icon: 'success'
							})
						}
					}
				})
			}
		}
	}
</script>

<style scoped>
	.container {
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
	}
	
	.header {
		background-color: white;
		padding: 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #F0F0F0;
	}
	
	.header-main {
		flex: 1;
	}
	
	.header-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 8rpx;
		display: block;
	}
	
	.header-tip {
		font-size: 24rpx;
		color: #999;
	}
	
	.header-actions {
		display: flex;
		gap: 20rpx;
	}
	
	.reset-btn {
		background-color: #FF9500;
		color: white;
		border: none;
		border-radius: 8rpx;
		padding: 12rpx 24rpx;
		font-size: 24rpx;
	}
	
	.add-btn {
		background-color: #007AFF;
		color: white;
		border: none;
		border-radius: 8rpx;
		padding: 12rpx 24rpx;
		font-size: 24rpx;
	}
	
	.category-tabs {
		background: linear-gradient(145deg, #ffffff, #f8f9fa);
		display: flex;
		margin: 20rpx;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
		border: 1rpx solid rgba(255, 255, 255, 0.8);
	}
	
	.tab-item {
		flex: 1;
		text-align: center;
		padding: 28rpx 0;
		background: transparent;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}
	
	.tab-item::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(0);
		width: 90%;
		height: 80%;
		background: linear-gradient(145deg, #007AFF, #5AC8FA);
		border-radius: 16rpx;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 0;
	}
	
	.tab-item.active::before {
		transform: translate(-50%, -50%) scale(1);
	}
	
	.tab-text {
		font-size: 28rpx;
		color: #666;
		position: relative;
		z-index: 1;
		transition: all 0.3s ease;
		font-weight: 500;
	}
	
	.tab-item.active .tab-text {
		color: white;
		font-weight: 700;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	}
	
	.category-list {
		padding: 40rpx;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 32rpx;
	}
	
	.category-item {
		background: linear-gradient(145deg, #ffffff, #f8f9fa);
		border-radius: 24rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08), 
		           0 2rpx 8rpx rgba(0, 0, 0, 0.04);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		aspect-ratio: 1;
		min-height: 0;
		width: 100%;
		border: 1rpx solid rgba(255, 255, 255, 0.8);
		position: relative;
		overflow: hidden;
	}
	
	.category-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(145deg, transparent, rgba(0, 122, 255, 0.02));
		opacity: 0;
		transition: opacity 0.3s ease;
		border-radius: 24rpx;
	}
	
	.category-item:hover::before,
	.category-item:active::before {
		opacity: 1;
	}
	
	.category-item:active {
		transform: translateY(2rpx) scale(0.98);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12), 
		           0 1rpx 4rpx rgba(0, 0, 0, 0.08);
	}
	
	.category-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		padding: 16rpx;
		position: relative;
		z-index: 1;
	}
	
	.category-icon {
		font-size: 42rpx;
		margin-bottom: 16rpx;
		line-height: 1;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
		transition: transform 0.3s ease, filter 0.3s ease;
	}
	
	.category-item:active .category-icon {
		transform: scale(1.1);
		filter: drop-shadow(0 3rpx 6rpx rgba(0, 0, 0, 0.15));
	}
	
	.category-name {
		font-size: 24rpx;
		color: #333;
		font-weight: 600;
		text-align: center;
		line-height: 1.2;
		word-break: break-all;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		letter-spacing: 0.5rpx;
		transition: color 0.3s ease;
	}
	
	.category-item:active .category-name {
		color: #007AFF;
	}
	
	/* 弹窗样式 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10rpx);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	.modal-content {
		background: linear-gradient(145deg, #ffffff, #f8f9fa);
		border-radius: 32rpx;
		width: 90%;
		max-width: 700rpx;
		max-height: 80vh;
		overflow: hidden;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
		border: 1rpx solid rgba(255, 255, 255, 0.8);
		animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(50rpx);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.modal-header {
		padding: 40rpx 30rpx 30rpx;
		border-bottom: 1rpx solid rgba(240, 240, 240, 0.8);
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.9));
	}
	
	.modal-title {
		font-size: 36rpx;
		font-weight: 700;
		color: #333;
		letter-spacing: 0.5rpx;
	}
	
	.modal-close {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.05);
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 40rpx;
		color: #666;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
	}
	
	.modal-close:active {
		background: rgba(0, 0, 0, 0.1);
		transform: scale(0.9);
	}
	
	.modal-body {
		padding: 40rpx 30rpx;
		max-height: 50vh;
		overflow-y: auto;
	}
	
	.form-item {
		margin-bottom: 40rpx;
	}
	
	.form-label {
		display: block;
		font-size: 30rpx;
		color: #333;
		margin-bottom: 20rpx;
		font-weight: 600;
		letter-spacing: 0.5rpx;
	}
	
	.form-input {
		width: 100%;
		padding: 24rpx;
		border: 2rpx solid #E5E5E5;
		border-radius: 16rpx;
		font-size: 30rpx;
		color: #333;
		background: linear-gradient(145deg, #ffffff, #f8f9fa);
		transition: all 0.3s ease;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
	}
	
	.form-input:focus {
		border-color: #007AFF;
		box-shadow: 0 0 0 6rpx rgba(0, 122, 255, 0.1);
		background: #ffffff;
	}
	
	.icon-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 20rpx;
		padding: 20rpx 0;
		max-height: 40vh;
		overflow-y: auto;
	}
	
	.icon-item {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 2rpx solid #E5E5E5;
		border-radius: 16rpx;
		background: linear-gradient(145deg, #ffffff, #f8f9fa);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		position: relative;
		overflow: hidden;
		justify-self: center;
	}
	
	.icon-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(145deg, transparent, rgba(0, 122, 255, 0.05));
		opacity: 0;
		transition: opacity 0.3s ease;
		border-radius: 14rpx;
	}
	
	.icon-item:active::before {
		opacity: 1;
	}
	
	.icon-item.selected {
		border-color: #007AFF;
		background: linear-gradient(145deg, #E3F2FD, #BBDEFB);
		box-shadow: 0 6rpx 16rpx rgba(0, 122, 255, 0.25);
		transform: translateY(-2rpx);
	}
	
	.icon-item:active {
		transform: translateY(1rpx) scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	}
	
	.icon-text {
		font-size: 36rpx;
		position: relative;
		z-index: 1;
		transition: transform 0.3s ease;
	}
	
	.icon-item.selected .icon-text {
		transform: scale(1.1);
	}
	
	.modal-footer {
		padding: 30rpx 40rpx 40rpx;
		border-top: 1rpx solid rgba(240, 240, 240, 0.8);
		display: flex;
		justify-content: flex-end;
		gap: 24rpx;
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.9));
	}
	
	.cancel-btn {
		background: linear-gradient(145deg, #f8f9fa, #e9ecef);
		color: #666;
		border: 2rpx solid rgba(229, 229, 229, 0.8);
		border-radius: 16rpx;
		padding: 20rpx 40rpx;
		font-size: 30rpx;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	}
	
	.cancel-btn:active {
		transform: translateY(1rpx) scale(0.98);
		background: linear-gradient(145deg, #e9ecef, #dee2e6);
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.12);
	}
	
	.confirm-btn {
		background: linear-gradient(145deg, #007AFF, #5AC8FA);
		color: white;
		border: none;
		border-radius: 16rpx;
		padding: 20rpx 40rpx;
		font-size: 30rpx;
		font-weight: 700;
		box-shadow: 0 6rpx 16rpx rgba(0, 122, 255, 0.3);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	}
	
	.confirm-btn:active {
		transform: translateY(1rpx) scale(0.98);
		background: linear-gradient(145deg, #0056D6, #4A9EF8);
		box-shadow: 0 3rpx 10rpx rgba(0, 122, 255, 0.4);
	}
</style>
