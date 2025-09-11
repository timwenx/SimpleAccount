<template>
	<view class="container">
		<view class="config-card">
			<view class="card-header">
				<text class="card-title">🤖 智能体配置</text>
				<text class="card-subtitle">配置AI模型来实现智能记账功能</text>
			</view>
			
			<view class="form-section">
				<!-- API URL配置 -->
				<view class="form-item">
					<text class="form-label">API 地址</text>
					<input 
						class="form-input" 
						v-model="config.apiUrl" 
						placeholder="请输入API地址，如：https://api.openai.com/v1/chat/completions"
						@input="onConfigChange"
					/>
				</view>
				
				<!-- API Key配置 -->
				<view class="form-item">
					<text class="form-label">API Key</text>
					<input 
						class="form-input" 
						v-model="config.apiKey" 
						placeholder="请输入您的API密钥"
						password="true"
						@input="onConfigChange"
					/>
				</view>
				
				<!-- 模型配置 -->
				<view class="form-item">
					<text class="form-label">模型名称</text>
					<input 
						class="form-input" 
						v-model="config.modelName" 
						placeholder="如：gpt-3.5-turbo, gpt-4等"
						@input="onConfigChange"
					/>
				</view>
				
				<!-- 智能体指令配置 -->
				<view class="form-item">
					<text class="form-label">智能体指令</text>
					<textarea 
						class="form-textarea" 
						v-model="config.systemPrompt" 
						placeholder="请输入智能体系统指令..."
						@input="onConfigChange"
					></textarea>
				</view>
				
				<!-- 预设指令模板 -->
				<view class="template-section">
					<text class="template-title">💡 预设指令模板</text>
					<view class="template-item" @click="useTemplate('accounting')">
						<text class="template-name">智能记账助手</text>
						<text class="template-desc">专门用于解析记账信息的AI助手</text>
					</view>
					<view class="template-item" @click="useTemplate('financial')">
						<text class="template-name">财务顾问</text>
						<text class="template-desc">提供理财建议和财务分析的AI助手</text>
					</view>
				</view>
			</view>
			
			<!-- 操作按钮 -->
			<view class="action-section">
				<button class="test-btn" @click="testConnection" :disabled="isTestingConnection">
					{{ isTestingConnection ? '测试中...' : '🔗 测试连接' }}
				</button>
				<button class="save-btn" @click="saveConfig" type="primary">
					💾 保存配置
				</button>
			</view>
			
			<!-- 连接状态 -->
			<view class="status-section" v-if="connectionStatus">
				<view class="status-item" :class="connectionStatus.success ? 'status-success' : 'status-error'">
					<text class="status-icon">{{ connectionStatus.success ? '✅' : '❌' }}</text>
					<text class="status-text">{{ connectionStatus.message }}</text>
				</view>
			</view>
		</view>
		
		<!-- 使用说明 -->
		<view class="help-card">
			<view class="help-header">
				<text class="help-title">📋 使用说明</text>
			</view>
			<view class="help-content">
				<text class="help-item">• 配置后可以在聊天页面使用AI智能记账</text>
				<text class="help-item">• 支持语音输入："红牛20元"自动识别并记账</text>
				<text class="help-item">• 可以咨询财务问题，获得AI建议</text>
				<text class="help-item">• 建议使用OpenAI GPT或兼容接口</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				config: {
					apiUrl: '',
					apiKey: '',
					modelName: 'gpt-3.5-turbo',
					systemPrompt: ''
				},
				isTestingConnection: false,
				connectionStatus: null,
				templates: {
					accounting: {
						name: '智能记账助手',
						prompt: `你是一个专业的记账助手，主要功能是帮助用户解析和记录财务信息。

请按照以下规则工作：

1. 分类选择原则（重要）：
   - 用户会在对话开始时提供当前可用的分类列表
   - 优先从现有分类中选择最匹配的分类
   - 只有在现有分类都不合适时才创建新分类
   - 例如：如果现有分类有"餐饮"，不要创建"早餐"、"午餐"等细分类别

2. 当用户输入记账信息时（可能包含单笔或多笔记录），你需要：
   - 解析出每笔记录的金额数字
   - 从现有分类中选择最合适的类别，或创建新分类
   - 判断是支出还是收入
   - 提取备注信息和时间信息
   
3. 返回格式规则（极其重要）：
   - 当识别到记账信息时，必须直接返回纯JSON，不能有任何其他内容
   - 绝对禁止使用markdown代码块（如\`\`\`json\`\`\`）包裹JSON
   - 绝对禁止在JSON前后添加任何说明文字
   - 单笔记录：只返回 {"type": "expense/income", "amount": "金额", "category": "分类", "note": "备注", "time": "时间描述"}
   - 多笔记录：只返回 [{"type": "expense", "amount": "20", "category": "餐饮", "note": "早餐", "time": "2025-09-11 18:00:00"}, ...]
   - 时间描述：如"今天早上则为xxxx-xx-xx 08:00:00"、"中午 xxxx-xx-xx 12:00:00"、"下班或者比如昨天赚了等，可以推荐一个下班时间(xxxx-xx-xx 18:00:00)或结合问题来给一个推荐的时间"等，如果没有明确时间则设为"刚才"
   - JSON字符串不得包含转义字符，直接使用标准JSON格式

4. 分类匹配规则：
   - 严格优先使用现有分类
   - 如果用户说"早餐20元"且现有分类有"餐饮"，使用"餐饮"而不是创建"早餐"
   - 如果用户说"打车15元"且现有分类有"交通"，使用"交通"而不是创建"打车"
   - 只有在现有分类完全不匹配时才创建新分类

5. 示例：
   现有分类：[餐饮, 交通, 购物]
   输入："今天早上早餐20元，打车15元"
   输出：[{"type": "expense", "amount": "20", "category": "餐饮", "note": "早餐", "time": "xxxx-xx-xx 08:00:00"}, {"type": "expense", "amount": "15", "category": "交通", "note": "打车", "time": "xxxx-xx-xx 08:00:00"}]

6. 当用户询问财务相关问题时，提供专业的理财建议

7. 保持友好、专业的语调，简洁明了地回复`
					},
					financial: {
						name: '财务顾问',
						prompt: `你是一个专业的个人财务顾问，具备以下能力：

1. 记账功能：
   - 解析用户的消费记录，如"红牛20元"
   - 返回JSON格式：{"type": "expense/income", "amount": "金额", "category": "分类", "note": "备注"}

2. 财务咨询：
   - 分析用户的收支情况
   - 提供预算规划建议
   - 推荐合适的理财产品
   - 帮助制定储蓄目标

3. 理财教育：
   - 普及理财知识
   - 解释投资概念
   - 风险评估建议

请用专业但易懂的语言回复，关注用户的实际情况，提供个性化建议。`
					}
				}
			}
		},
		
		onLoad() {
			this.loadConfig()
		},
		
		methods: {
			// 加载配置
			loadConfig() {
				const savedConfig = uni.getStorageSync('aiConfig') || {}
				this.config = {
					apiUrl: savedConfig.apiUrl || '',
					apiKey: savedConfig.apiKey || '',
					modelName: savedConfig.modelName || 'gpt-3.5-turbo',
					systemPrompt: savedConfig.systemPrompt || ''
				}
			},
			
			// 配置变化
			onConfigChange() {
				// 清除之前的连接状态
				this.connectionStatus = null
			},
			
			// 使用预设模板
			useTemplate(templateKey) {
				uni.showModal({
					title: '使用模板',
					content: `确定要使用"${this.templates[templateKey].name}"模板吗？这将覆盖当前的智能体指令。`,
					success: (res) => {
						if (res.confirm) {
							this.config.systemPrompt = this.templates[templateKey].prompt
							uni.showToast({
								title: '模板已应用',
								icon: 'success'
							})
						}
					}
				})
			},
			
			// 测试连接
			async testConnection() {
				if (!this.config.apiUrl || !this.config.apiKey) {
					uni.showToast({
						title: '请先填写API地址和密钥',
						icon: 'none'
					})
					return
				}
				
				this.isTestingConnection = true
				this.connectionStatus = null
				
				try {
					const response = await uni.request({
						url: this.config.apiUrl,
						method: 'POST',
						header: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${this.config.apiKey}`
						},
						data: {
							model: this.config.modelName,
							messages: [
								{
									role: 'user',
									content: '测试连接'
								}
							],
							max_tokens: 10
						},
						timeout: 10000
					})
					
					if (response.statusCode === 200) {
						this.connectionStatus = {
							success: true,
							message: '连接成功！API配置正确'
						}
						uni.showToast({
							title: '连接测试成功',
							icon: 'success'
						})
					} else {
						throw new Error(`HTTP ${response.statusCode}`)
					}
				} catch (error) {
					console.error('连接测试失败:', error)
					this.connectionStatus = {
						success: false,
						message: `连接失败：${error.message || '请检查API配置'}`
					}
					uni.showToast({
						title: '连接测试失败',
						icon: 'none'
					})
				} finally {
					this.isTestingConnection = false
				}
			},
			
			// 保存配置
			saveConfig() {
				if (!this.config.apiUrl.trim()) {
					uni.showToast({
						title: '请填写API地址',
						icon: 'none'
					})
					return
				}
				
				if (!this.config.apiKey.trim()) {
					uni.showToast({
						title: '请填写API密钥',
						icon: 'none'
					})
					return
				}
				
				// 保存到本地存储
				uni.setStorageSync('aiConfig', this.config)
				
				uni.showToast({
					title: '配置已保存',
					icon: 'success'
				})
				
				// 延迟返回上一页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 20rpx;
		background-color: #F5F5F5;
		min-height: 100vh;
	}
	
	.config-card {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
	}
	
	.card-header {
		margin-bottom: 40rpx;
		text-align: center;
	}
	
	.card-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 15rpx;
	}
	
	.card-subtitle {
		font-size: 26rpx;
		color: #666;
		line-height: 1.5;
	}
	
	.form-section {
		margin-bottom: 40rpx;
	}
	
	.form-item {
		margin-bottom: 30rpx;
	}
	
	.form-label {
		display: block;
		font-size: 28rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 15rpx;
	}
	
	.form-input {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 1px solid #E5E5E5;
		border-radius: 12rpx;
		font-size: 26rpx;
		background: #FAFAFA;
		box-sizing: border-box;
	}
	
	.form-input:focus {
		border-color: #667eea;
		background: white;
	}
	
	.form-textarea {
		width: 100%;
		min-height: 200rpx;
		padding: 20rpx;
		border: 1px solid #E5E5E5;
		border-radius: 12rpx;
		font-size: 26rpx;
		background: #FAFAFA;
		box-sizing: border-box;
		line-height: 1.6;
	}
	
	.form-textarea:focus {
		border-color: #667eea;
		background: white;
	}
	
	.template-section {
		margin-top: 40rpx;
		padding-top: 30rpx;
		border-top: 1px solid #F0F0F0;
	}
	
	.template-title {
		font-size: 28rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 20rpx;
		display: block;
	}
	
	.template-item {
		padding: 20rpx;
		border: 1px solid #E5E5E5;
		border-radius: 12rpx;
		margin-bottom: 15rpx;
		background: #FAFAFA;
		transition: all 0.2s ease;
	}
	
	.template-item:active {
		background: #F0F7FF;
		border-color: #667eea;
		transform: scale(0.98);
	}
	
	.template-name {
		font-size: 28rpx;
		color: #333;
		font-weight: 600;
		display: block;
		margin-bottom: 8rpx;
	}
	
	.template-desc {
		font-size: 24rpx;
		color: #666;
		line-height: 1.4;
	}
	
	.action-section {
		display: flex;
		gap: 20rpx;
	}
	
	.test-btn {
		flex: 1;
		height: 80rpx;
		background: #F8F9FA;
		border: 1px solid #E5E5E5;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #333;
	}
	
	.test-btn:disabled {
		opacity: 0.6;
	}
	
	.save-btn {
		flex: 1;
		height: 80rpx;
		background: linear-gradient(45deg, #667eea, #764ba2);
		border: none;
		border-radius: 12rpx;
		color: white;
		font-size: 28rpx;
		font-weight: 600;
	}
	
	.status-section {
		margin-top: 30rpx;
	}
	
	.status-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		border-radius: 12rpx;
		margin-bottom: 10rpx;
	}
	
	.status-success {
		background: #E8F5E8;
		border: 1px solid #C3E6C3;
	}
	
	.status-error {
		background: #FFF2F2;
		border: 1px solid #FFCCCB;
	}
	
	.status-icon {
		margin-right: 15rpx;
		font-size: 30rpx;
	}
	
	.status-text {
		font-size: 26rpx;
		color: #333;
		line-height: 1.4;
	}
	
	.help-card {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
	}
	
	.help-header {
		margin-bottom: 25rpx;
	}
	
	.help-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.help-content {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}
	
	.help-item {
		font-size: 26rpx;
		color: #666;
		line-height: 1.6;
	}
</style>
