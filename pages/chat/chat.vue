<template>
	<view class="container">
		<!-- 聊天记录区域 -->
		<scroll-view 
			class="chat-container" 
			scroll-y="true" 
			:scroll-top="scrollTop"
			scroll-with-animation="true">
			
			<!-- 欢迎消息 -->
			<view class="message-item assistant-message" v-if="messages.length === 0">
				<view class="avatar assistant-avatar">🤖</view>
				<view class="message-content">
					<text class="message-text">你好！我是你的智能记账助手。你可以：</text>
					<text class="message-text">💰 说"红牛20元"来快速记账</text>
					<text class="message-text">📊 询问理财建议和账目分析</text>
					<text class="message-text">💡 咨询任何财务相关问题</text>
				</view>
			</view>
			
			<!-- 聊天消息列表 -->
			<view v-for="(message, index) in messages" :key="index" 
				class="message-item" 
				:class="message.role === 'user' ? 'user-message' : 'assistant-message'">
				
				<!-- AI消息：头像在左边 -->
				<template v-if="message.role === 'assistant'">
					<view class="avatar assistant-avatar">🤖</view>
					<view class="message-content">
						<text class="message-text">{{ message.content }}</text>
						<text class="message-time">{{ formatTime(message.timestamp) }}</text>
						
						<!-- 记账信息每笔单独显示确认按钮 -->
						<view v-if="message.recordsData && message.recordsData.length > 0" class="records-action">
							<!-- 每笔记录单独显示 -->
							<view v-for="(record, recordIndex) in message.recordsData" :key="recordIndex" class="single-record-confirm">
								<view class="record-card">
									<view class="record-header">
										<text class="record-type-icon">{{ record.type === 'expense' ? '💸' : '💰' }}</text>
										<text class="record-type-text">{{ record.type === 'expense' ? '支出' : '收入' }}</text>
										<text class="record-amount">¥{{ record.amount }}</text>
									</view>
									<view class="record-details">
										<text class="record-category">分类: {{ record.category }}</text>
										<text class="record-time" v-if="record.time">时间: {{ record.time }}</text>
										<text class="record-note" v-if="record.note">备注: {{ record.note }}</text>
									</view>
									
									<!-- 每笔记录的独立确认按钮 -->
									<button 
										class="confirm-single-btn" 
										@click="confirmSingleRecord(record, recordIndex, message)"
										v-if="!record.recorded">
										✅ 确认此笔记账
									</button>
									<view class="recorded-single-status" v-else>
										<text class="recorded-text">✅ 已记录</text>
									</view>
								</view>
							</view>
						</view>
					</view>
				</template>
				
				<!-- 用户消息：头像在右边 -->
				<template v-else>
					<view class="message-content">
						<text class="message-text">{{ message.content }}</text>
						<text class="message-time">{{ formatTime(message.timestamp) }}</text>
					</view>
					<view class="avatar user-avatar">👤</view>
				</template>
			</view>
			
			<!-- 加载状态 -->
			<view v-if="isLoading" class="message-item assistant-message">
				<view class="avatar assistant-avatar">🤖</view>
				<view class="message-content loading-content">
					<view class="loading-dots">
						<view class="dot"></view>
						<view class="dot"></view>
						<view class="dot"></view>
					</view>
					<text class="loading-text">AI正在思考...</text>
				</view>
			</view>
		</scroll-view>
		
		<!-- 固定在底部的输入区域 -->
		<view class="input-container-fixed">
			<!-- 功能按钮区域 -->
			<view class="function-buttons">
				<button class="clear-btn" @click="clearChatHistory">
					🗑️ 清空记录
				</button>
			</view>
			
			<view class="input-row">
				<input 
					class="chat-input" 
					v-model="inputText" 
					placeholder="说说你的消费，或问我理财问题..." 
					@confirm="sendMessage"
					:disabled="isLoading"
					confirm-type="send"
				/>
				<button 
					class="send-btn" 
					@click="sendMessage"
					:disabled="isLoading || !inputText.trim()">
					{{ isLoading ? '⏳' : '发送' }}
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				messages: [],
				inputText: '',
				isLoading: false,
				scrollTop: 0,
				aiConfig: null
			}
		},
		
		onLoad() {
			this.loadAIConfig()
			this.loadChatHistory()
		},
		
		methods: {
			// 加载AI配置
			loadAIConfig() {
				this.aiConfig = uni.getStorageSync('aiConfig')
				if (!this.aiConfig || !this.aiConfig.apiUrl || !this.aiConfig.apiKey) {
					uni.showModal({
						title: '需要配置AI',
						content: '请先在"我的"页面配置智能体，才能使用聊天记账功能',
						confirmText: '去配置',
						success: (res) => {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/ai-config/ai-config'
								})
							} else {
								uni.navigateBack()
							}
						}
					})
				}
			},
			
			// 加载聊天历史
			loadChatHistory() {
				const history = uni.getStorageSync('chatHistory') || []
				this.messages = history
				this.$nextTick(() => {
					this.scrollToBottom()
				})
			},
			
			// 保存聊天历史
			saveChatHistory() {
				// 只保存最近50条消息
				const historyToSave = this.messages.slice(-50)
				uni.setStorageSync('chatHistory', historyToSave)
			},
			
			// 快捷输入
			quickInput(text) {
				this.inputText = text
				this.sendMessage()
			},
			
			// 清空聊天记录
			clearChatHistory() {
				uni.showModal({
					title: '清空聊天记录',
					content: '确定要清空所有聊天记录吗？此操作不可恢复。',
					confirmText: '确定清空',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							this.messages = []
							uni.removeStorageSync('chatHistory')
							uni.showToast({
								title: '聊天记录已清空',
								icon: 'success'
							})
						}
					}
				})
			},
			
			// 发送消息
			async sendMessage() {
				const message = this.inputText.trim()
				if (!message || this.isLoading) return
				
				// 添加用户消息
				this.addMessage('user', message)
				this.inputText = ''
				
				// 检查AI配置
				if (!this.aiConfig) {
					this.addMessage('assistant', '抱歉，AI配置未找到，请在设置中重新配置')
					return
				}
				
				this.isLoading = true
				
				try {
					const response = await this.callAI(message)
					this.handleAIResponse(response, message)
				} catch (error) {
					console.error('AI调用失败:', error)
					this.addMessage('assistant', '抱歉，AI服务暂时不可用，请稍后再试或检查网络连接')
				} finally {
					this.isLoading = false
				}
			},
			
			// 调用AI接口
			async callAI(userMessage) {
				// 获取当前可用的分类信息
				const expenseCategories = uni.getStorageSync('expenseCategories') || []
				const incomeCategories = uni.getStorageSync('incomeCategories') || []
				
				// 构建分类信息文本
				const expenseNames = expenseCategories.map(cat => cat.name).join('、')
				const incomeNames = incomeCategories.map(cat => cat.name).join('、')
				
				let categoryInfo = ''
				if (expenseNames || incomeNames) {
					categoryInfo = '\n\n当前可用分类：'
					if (expenseNames) {
						categoryInfo += `\n支出类别：${expenseNames}`
					}
					if (incomeNames) {
						categoryInfo += `\n收入类别：${incomeNames}`
					}
					categoryInfo += '\n\n请优先从上述分类中选择最合适的，避免创建重复或相似的分类。'
				}
				
				const systemPrompt = (this.aiConfig.systemPrompt || '你是一个智能记账助手') + categoryInfo
				
				const messages = [
					{
						role: 'system',
						content: systemPrompt
					},
					// 包含最近的对话历史（最多10条）
					...this.messages.slice(-10).map(msg => ({
						role: msg.role,
						content: msg.content
					})),
					{
						role: 'user',
						content: userMessage
					}
				]
				
				const requestData = {
					model: this.aiConfig.modelName || 'gpt-3.5-turbo',
					messages: messages,
					max_tokens: 500,
					temperature: 0.7
				}
				
				const response = await uni.request({
					url: this.aiConfig.apiUrl,
					method: 'POST',
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${this.aiConfig.apiKey}`
					},
					data: requestData,
					timeout: 30000
				})
				
				if (response.statusCode !== 200) {
					throw new Error(`HTTP ${response.statusCode}: ${response.data?.error?.message || '请求失败'}`)
				}
				
				return response.data
			},
			
			// 处理AI响应
			handleAIResponse(response, userMessage) {
				const aiReply = response.choices?.[0]?.message?.content || '抱歉，我没有理解你的意思'
				
				// 尝试解析记账信息（支持单笔或多笔）
				const recordsData = this.parseRecordsData(aiReply)
				
				if (recordsData && recordsData.length > 0) {
					// 包含记账信息的回复
					const replyText = aiReply.replace(/\[[^\]]*\]|\{[^}]*\}/g, '').trim() || 
						`我帮你识别了${recordsData.length}笔记录：`
					this.addMessage('assistant', replyText, recordsData)
				} else {
					// 普通对话回复
					this.addMessage('assistant', aiReply)
				}
			},
			
			// 解析记账数据（支持单笔和多笔）
			parseRecordsData(text) {
				try {
					// 首先尝试解析数组格式（多笔记录）
					const arrayMatch = text.match(/\[[^\]]*\]/);
					if (arrayMatch) {
						const arrayStr = arrayMatch[0]
						const dataArray = JSON.parse(arrayStr)
						if (Array.isArray(dataArray) && dataArray.length > 0) {
							return dataArray.filter(item => this.validateRecordData(item))
						}
					}
					
					// 然后尝试解析对象格式（单笔记录）
					const objectMatch = text.match(/\{[^}]*\}/);
					if (objectMatch) {
						const objectStr = objectMatch[0]
						const data = JSON.parse(objectStr)
						if (this.validateRecordData(data)) {
							return [data]
						}
					}
				} catch (error) {
					console.log('JSON解析失败:', error)
				}
				return null
			},
			
			// 验证记录数据
			validateRecordData(data) {
				return data && data.type && data.amount && data.category
			},
			
			// 添加消息
			addMessage(role, content, recordsData = null) {
				const message = {
					role,
					content,
					timestamp: Date.now(),
					recordsData,
					recorded: false
				}
				
				this.messages.push(message)
				this.saveChatHistory()
				
				this.$nextTick(() => {
					this.scrollToBottom()
				})
			},
			
			// 确认多笔记录
			async confirmMultipleRecords(recordsData) {
				const results = []
				const newCategories = []
				
				for (const recordData of recordsData) {
					try {
						const result = await this.processRecord(recordData)
						results.push(result)
						
						// 检查是否有新分类
						if (result.isNewCategory) {
							newCategories.push(result.category)
						}
					} catch (error) {
						console.error('处理记录失败:', error)
						results.push({ success: false, error: error.message })
					}
				}
				
				// 处理新分类
				if (newCategories.length > 0) {
					await this.handleNewCategories(newCategories)
				}
				
				// 更新UI状态
				const messageIndex = this.messages.findIndex(msg => 
					msg.recordsData === recordsData
				)
				if (messageIndex !== -1) {
					this.messages[messageIndex].recorded = true
					this.saveChatHistory()
				}
				
				// 显示结果
				const successCount = results.filter(r => r.success).length
				if (successCount === recordsData.length) {
					uni.showToast({
						title: `成功记录${successCount}笔！`,
						icon: 'success'
					})
					this.addMessage('assistant', `✅ 记账成功！已记录${successCount}笔账目`)
				} else {
					uni.showToast({
						title: `记录${successCount}/${recordsData.length}笔`,
						icon: 'none'
					})
				}
			},
			
			// 处理单条记录
			async processRecord(recordData) {
				return new Promise((resolve) => {
					// 解析时间
					const recordTime = this.parseRecordTime(recordData.time)
					
					// 检查分类是否存在
					const { categoryIcon, isNewCategory, categoryId } = this.getCategoryIconWithCheck(
						recordData.category, 
						recordData.type
					)
					
					// 生成记录ID
					const recordId = Date.now() + Math.random() * 1000
					
					// 创建记录对象
					const newRecord = {
						id: recordId,
						type: recordData.type,
						amount: parseFloat(recordData.amount).toString(),
						categoryName: recordData.category,
						categoryId: categoryId, // 添加分类ID关联
						categoryIcon: categoryIcon,
						note: recordData.note || '',
						time: recordTime.toISOString()
					}
					
					// 保存到本地存储
					const records = uni.getStorageSync('records') || []
					records.push(newRecord)
					uni.setStorageSync('records', records)
					
					resolve({ 
						success: true, 
						record: newRecord,
						isNewCategory,
						category: isNewCategory ? {
							name: recordData.category,
							icon: categoryIcon,
							type: recordData.type
						} : null
					})
				})
			},
			
			// 解析记录时间
			parseRecordTime(timeDescription) {
				const now = new Date()
				
				if (!timeDescription || timeDescription === '刚才') {
					return now
				}
				
				// 解析相对时间
				if (timeDescription.includes('今天')) {
					if (timeDescription.includes('早上') || timeDescription.includes('上午')) {
						return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0)
					} else if (timeDescription.includes('中午')) {
						return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0)
					} else if (timeDescription.includes('下午')) {
						return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0)
					} else if (timeDescription.includes('晚上')) {
						return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0)
					}
				} else if (timeDescription.includes('昨天')) {
					const yesterday = new Date(now)
					yesterday.setDate(now.getDate() - 1)
					
					if (timeDescription.includes('早上') || timeDescription.includes('上午')) {
						return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 8, 0)
					} else if (timeDescription.includes('中午')) {
						return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 12, 0)
					} else if (timeDescription.includes('下午')) {
						return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 15, 0)
					} else if (timeDescription.includes('晚上')) {
						return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 19, 0)
					}
				} else if (timeDescription.includes('前天')) {
					const dayBeforeYesterday = new Date(now)
					dayBeforeYesterday.setDate(now.getDate() - 2)
					return new Date(dayBeforeYesterday.getFullYear(), dayBeforeYesterday.getMonth(), dayBeforeYesterday.getDate(), 12, 0)
				}
				
				// 默认返回当前时间
				return now
			},
			
			// 确认单笔记录（从多笔记录中）
			async confirmSingleRecord(record, recordIndex, message) {
				try {
					// 检查分类是否存在并获取图标
					const { categoryIcon, isNewCategory, categoryId } = this.getCategoryIconWithCheck(
						record.category, 
						record.type
					)
					
					// 如果是新分类，询问是否添加
					let finalCategoryId = categoryId
					if (isNewCategory) {
						const newCategory = {
							name: record.category,
							icon: categoryIcon,
							type: record.type
						}
						const addedCategories = await this.handleNewCategories([newCategory])
						// 获取新添加分类的ID
						if (addedCategories && addedCategories.length > 0) {
							finalCategoryId = addedCategories[0].id
						}
					}
					
					// 解析时间
					const recordTime = this.parseRecordTime(record.time)
					
					// 生成记录ID
					const recordId = Date.now() + Math.random() * 1000
					
					// 创建记录对象
					const newRecord = {
						id: recordId,
						type: record.type,
						amount: parseFloat(record.amount).toString(),
						categoryName: record.category,
						categoryId: finalCategoryId, // 添加分类ID关联
						categoryIcon: categoryIcon,
						note: record.note || '',
						time: recordTime.toISOString()
					}
					
					// 保存到本地存储
					const records = uni.getStorageSync('records') || []
					records.push(newRecord)
					uni.setStorageSync('records', records)
					
					// 标记这笔记录为已记录
					message.recordsData[recordIndex].recorded = true
					
					// 检查是否所有记录都已处理
					const allRecorded = message.recordsData.every(r => r.recorded)
					if (allRecorded) {
						message.recorded = true
					}
					
					// 保存聊天历史
					this.saveChatHistory()
					
					// 显示成功提示
					uni.showToast({
						title: '记账成功！',
						icon: 'success'
					})
					
					// 添加确认消息
					this.addMessage('assistant', `✅ 已记录${record.type === 'expense' ? '支出' : '收入'}¥${record.amount} (${record.category})`)
					
				} catch (error) {
					console.error('确认单笔记录失败:', error)
					uni.showToast({
						title: '记账失败，请重试',
						icon: 'error'
					})
				}
			},
			
			// 获取分类图标并检查是否为新分类
			getCategoryIconWithCheck(categoryName, type) {
				const expenseCategories = uni.getStorageSync('expenseCategories') || []
				const incomeCategories = uni.getStorageSync('incomeCategories') || []
				
				const allCategories = [...expenseCategories, ...incomeCategories]
				const existingCategory = allCategories.find(cat => cat.name === categoryName)
				
				if (existingCategory) {
					return { 
						categoryIcon: existingCategory.icon, 
						categoryId: existingCategory.id,
						isNewCategory: false 
					}
				}
				
				// 新分类，生成图标
				const newIcon = this.generateCategoryIcon(categoryName, type)
				return { 
					categoryIcon: newIcon, 
					categoryId: null, // 新分类暂时没有ID，需要在添加后获取
					isNewCategory: true 
				}
			},
			
			// 生成新分类图标
			generateCategoryIcon(categoryName, type) {
				// 智能匹配图标
				const iconMap = {
					// 餐饮相关
					'早餐': '🥞', '午餐': '🍱', '晚餐': '🍽️', '夜宵': '🌙',
					'咖啡': '☕', '奶茶': '🧋', '饮料': '🥤',
					// 交通相关  
					'打车': '🚗', '地铁': '🚇', '公交': '🚌', '油费': '⛽',
					// 购物相关
					'零食': '🍿', '水果': '🍎', '蔬菜': '🥬', '肉类': '🥩',
					// 生活相关
					'洗衣': '👕', '理发': '💇', '美容': '💄', '健身': '💪',
					'宠物': '🐱', '花卉': '🌸', '书籍': '📚', 
					// 收入相关
					'兼职': '💼', '奖励': '🎁', '补贴': '💰'
				}
				
				// 先尝试精确匹配
				if (iconMap[categoryName]) {
					return iconMap[categoryName]
				}
				
				// 模糊匹配
				for (const [key, icon] of Object.entries(iconMap)) {
					if (categoryName.includes(key) || key.includes(categoryName)) {
						return icon
					}
				}
				
				// 根据类型返回默认图标
				return type === 'expense' ? '💰' : '💎'
			},
			
			// 处理新分类
			async handleNewCategories(newCategories) {
				if (newCategories.length === 0) return null
				
				const categoryNames = newCategories.map(cat => cat.name).join('、')
				
				return new Promise((resolve) => {
					uni.showModal({
						title: '发现新分类',
						content: `检测到新的消费分类：${categoryNames}\n\n是否要添加到分类管理中？`,
						confirmText: '添加',
						cancelText: '跳过',
						success: (res) => {
							if (res.confirm) {
								const addedCategories = this.addNewCategoriesToStorage(newCategories)
								uni.showToast({
									title: '分类已添加',
									icon: 'success'
								})
								resolve(addedCategories) // 返回添加的分类信息（包含ID）
							} else {
								resolve(null) // 用户取消添加
							}
						}
					})
				})
			},
			
			// 添加新分类到存储
			addNewCategoriesToStorage(newCategories) {
				const expenseCategories = uni.getStorageSync('expenseCategories') || []
				const incomeCategories = uni.getStorageSync('incomeCategories') || []
				const addedCategories = []
				
				newCategories.forEach((category, index) => {
					// 确保每个分类有唯一ID
					const uniqueId = Date.now() + index * 1000 + Math.floor(Math.random() * 1000)
					
					const newCategoryItem = {
						id: uniqueId,
						name: category.name,
						icon: category.icon
					}
					
					if (category.type === 'expense') {
						expenseCategories.push(newCategoryItem)
					} else {
						incomeCategories.push(newCategoryItem)
					}
					
					// 记录添加的分类信息
					addedCategories.push({
						...category,
						id: uniqueId
					})
				})
				
				uni.setStorageSync('expenseCategories', expenseCategories)
				uni.setStorageSync('incomeCategories', incomeCategories)
				
				// 返回新添加的分类信息，包含生成的ID
				return addedCategories
			},
			
			// 获取分类图标
			getCategoryIcon(categoryName, type) {
				const expenseIcons = {
					'餐饮': '🍽️', '交通': '🚗', '购物': '🛍️', '娱乐': '🎬', '住房': '🏠',
					'医疗': '💊', '教育': '📚', '通讯': '📱', '服装': '👕', '其他': '📦'
				}
				
				const incomeIcons = {
					'工资': '💰', '奖金': '🎁', '投资': '📈', '兼职': '💼', 
					'红包': '🧧', '退款': '↩️', '其他': '💎'
				}
				
				if (type === 'expense') {
					return expenseIcons[categoryName] || '📦'
				} else {
					return incomeIcons[categoryName] || '💎'
				}
			},
			
			// 格式化时间
			formatTime(timestamp) {
				const date = new Date(timestamp)
				const hours = date.getHours().toString().padStart(2, '0')
				const minutes = date.getMinutes().toString().padStart(2, '0')
				return `${hours}:${minutes}`
			},
			
			// 滚动到底部
			scrollToBottom() {
				const query = uni.createSelectorQuery().in(this)
				query.select('.chat-container').boundingClientRect((rect) => {
					if (rect) {
						this.scrollTop = rect.height
					}
				}).exec()
			}
		}
	}
</script>

<style scoped>
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #F5F5F5;
	}
	
	.chat-container {
		flex: 1;
		padding: 20rpx;
		padding-bottom: 180rpx; /* 调整为更小的空间，因为移除了快捷输入按钮 */
		overflow-y: auto;
	}
	
	.message-item {
		display: flex;
		margin-bottom: 30rpx;
		animation: fadeIn 0.3s ease-in;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(20rpx); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	.user-message {
		justify-content: flex-end;  /* 用户消息整体靠右 */
	}
	
	.assistant-message {
		justify-content: flex-start;  /* AI消息整体靠左 */
	}
	
	.avatar {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		flex-shrink: 0;
	}
	
	.user-avatar {
		background: linear-gradient(45deg, #667eea, #764ba2);
		color: white;
		margin-left: 20rpx;  /* 用户头像在右边，左边有margin */
	}
	
	.assistant-avatar {
		background: linear-gradient(45deg, #4ECDC4, #44A08D);
		color: white;
		margin-right: 20rpx;  /* AI头像在左边，右边有margin */
	}
	
	.message-content {
		max-width: 500rpx;
		padding: 20rpx 25rpx;
		border-radius: 20rpx;
		position: relative;
		display: flex;
		flex-direction: column;
	}
	
	.user-message .message-content {
		background: linear-gradient(45deg, #667eea, #764ba2);
		color: white;
		border-bottom-right-radius: 8rpx;
	}
	
	.assistant-message .message-content {
		background: white;
		color: #333;
		border-bottom-left-radius: 8rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.message-text {
		font-size: 28rpx;
		line-height: 1.6;
		margin-bottom: 8rpx;
		word-wrap: break-word;
	}
	
	.message-time {
		font-size: 22rpx;
		opacity: 0.6;
		align-self: flex-end;
		margin-top: 5rpx;
	}
	
	/* 用户消息时间左对齐 */
	.user-message .message-time {
		align-self: flex-start;
	}
	
	/* 记录卡片样式 */
	.records-action {
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 1px solid rgba(0,0,0,0.1);
	}
	
	.single-record-confirm {
		margin-bottom: 20rpx;
	}
	
	.record-card {
		background: #f8f9ff;
		border: 1px solid #e5e8ff;
		border-radius: 15rpx;
		padding: 20rpx;
		margin-bottom: 15rpx;
	}
	
	.record-header {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 15rpx;
	}
	
	.record-type-icon {
		font-size: 32rpx;
	}
	
	.record-type-text {
		font-size: 24rpx;
		color: #666;
		flex: 1;
	}
	
	.record-amount {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.record-details {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		margin-bottom: 15rpx;
	}
	
	.record-category,
	.record-time,
	.record-note {
		font-size: 24rpx;
		color: #666;
		line-height: 1.4;
	}
	
	.confirm-single-btn {
		width: 100%;
		background: linear-gradient(45deg, #4ECDC4, #44A08D);
		color: white;
		border: none;
		border-radius: 25rpx;
		padding: 15rpx 20rpx;
		font-size: 26rpx;
		font-weight: 600;
	}
	
	.recorded-single-status {
		width: 100%;
		text-align: center;
		padding: 15rpx;
	}
	
	.recorded-text {
		color: #4ECDC4;
		font-size: 26rpx;
		font-weight: 600;
	}
	
	.loading-content {
		background: white !important;
		display: flex;
		align-items: center;
		gap: 15rpx;
	}
	
	.loading-dots {
		display: flex;
		gap: 8rpx;
	}
	
	.dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background: #4ECDC4;
		animation: bounce 1.4s ease-in-out infinite both;
	}
	
	.dot:nth-child(1) { animation-delay: -0.32s; }
	.dot:nth-child(2) { animation-delay: -0.16s; }
	
	@keyframes bounce {
		0%, 80%, 100% { transform: scale(0); }
		40% { transform: scale(1); }
	}
	
	.loading-text {
		font-size: 26rpx;
		color: #666;
	}
	
	/* 固定在底部的输入区域 */
	.input-container-fixed {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: white;
		padding: 20rpx;
		border-top: 1px solid #E5E5E5;
		box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.1);
		z-index: 999;
	}
	
	.function-buttons {
		margin-bottom: 20rpx;
		display: flex;
		justify-content: flex-end;
	}
	
	.clear-btn {
		padding: 10rpx 20rpx;
		background: #FFF2F2;
		border: 1px solid #FFCCCB;
		border-radius: 20rpx;
		font-size: 22rpx;
		color: #E74C3C;
		line-height: 1;
	}
	
	.clear-btn:active {
		background: #FFE5E5;
		transform: scale(0.95);
	}
	
	.input-row {
		display: flex;
		align-items: center;
		gap: 15rpx;
	}
	
	.chat-input {
		flex: 1;
		height: 80rpx;
		padding: 0 25rpx;
		border: 1px solid #E5E5E5;
		border-radius: 40rpx;
		font-size: 28rpx;
		background: #FAFAFA;
	}
	
	.chat-input:focus {
		border-color: #667eea;
		background: white;
	}
	
	.send-btn {
		width: 120rpx;
		height: 80rpx;
		background: linear-gradient(45deg, #667eea, #764ba2);
		color: white;
		border: none;
		border-radius: 40rpx;
		font-size: 28rpx;
		font-weight: 600;
	}
	
	.send-btn:disabled {
		opacity: 0.5;
	}
</style>
