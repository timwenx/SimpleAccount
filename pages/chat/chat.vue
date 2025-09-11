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
						<text 
							class="message-text"
							@longpress="copyUserMessage(message.content)"
						>{{ message.content }}</text>
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
			<!-- 滚动锚点 -->
  			<view id="bottomAnchor" style="height:1px;"></view>
		</scroll-view>
		
		<!-- 固定在底部的输入区域 -->
		<view class="input-container-fixed">
			<!-- 功能按钮区域 -->
			<view class="function-buttons">
				<button class="clear-btn" @click="clearChatHistory">
					🗑️ 清空记录
				</button>
			</view>
			
			<!-- 录音状态遮罩 -->
			<view class="recording-overlay" v-if="isRecording">
				<view class="recording-content">
					<view class="voice-animation">
						<view class="voice-icon">🎤</view>
						<view class="wave-container">
							<view class="wave wave1"></view>
							<view class="wave wave2"></view>
							<view class="wave wave3"></view>
							<view class="wave wave4"></view>
							<view class="wave wave5"></view>
						</view>
					</view>
					<text class="recording-text">松开 结束</text>
					<text class="recording-hint">正在录音...</text>
				</view>
			</view>
			
			<view class="input-row">
				<!-- 语音按钮 -->
				<button class="voice-toggle-btn" @click="toggleInputMode" v-if="!isVoiceMode">
					🎤
				</button>
				
				<!-- 键盘按钮 -->
				<button class="keyboard-toggle-btn" @click="toggleInputMode" v-if="isVoiceMode">
					⌨️
				</button>
				
				<!-- 文本输入模式 -->
				<template v-if="!isVoiceMode">
					<input 
						class="chat-input" 
						v-model="inputText" 
						placeholder="输入消息..." 
						@confirm="sendMessage"
						:disabled="isLoading"
						confirm-type="send"
					/>
					<button 
						class="send-btn" 
						@click="sendMessage"
						:disabled="isLoading || !inputText.trim()">
						<text class="send-text">{{ isLoading ? '发送中' : '发送' }}</text>
					</button>
				</template>
				
				<!-- 语音输入模式 -->
				<template v-if="isVoiceMode">
					<button 
						class="voice-btn" 
						@touchstart="startVoiceRecording"
						@touchend="stopVoiceRecording"
						@touchcancel="stopVoiceRecording"
						:disabled="isLoading"
						:class="{ 'recording': isRecording }">
						<text class="voice-text">{{ isRecording ? '松开 结束' : '按住 说话' }}</text>
					</button>
				</template>
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
				aiConfig: null,
				// 语音识别相关
				isRecording: false,
				isVoiceMode: false, // 语音输入模式切换
				voiceConfig: null,
				recordManager: null,
				tempAudioPath: ''
			}
		},
		
		onLoad() {
			this.loadAIConfig()
			this.loadVoiceConfig()
			this.loadChatHistory()
		},
		
		methods: {
		// 长按复制用户消息内容
		copyUserMessage(content) {
			if (!content) return;
			uni.setClipboardData({
				data: content,
				success: () => {
					uni.showToast({
						title: '已复制',
						icon: 'success',
						duration: 1200
					});
				},
				fail: () => {
					uni.showToast({
						title: '复制失败',
						icon: 'none',
						duration: 1200
					});
				}
			});
		},
			// 申请麦克风权限
			async requestMicrophonePermission() {
				return new Promise((resolve, reject) => {
					// 检查是否支持权限申请API
					if (uni.authorize) {
						uni.authorize({
							scope: 'scope.record',
							success: () => {
								console.log('麦克风权限获取成功')
								resolve()
							},
							fail: (error) => {
								console.log('麦克风权限获取失败:', error)
								// 权限被拒绝，引导用户手动开启
								reject(new Error('permission_denied'))
							}
						})
					} else if (uni.getSetting && uni.authorize) {
						// 先检查当前权限状态
						uni.getSetting({
							success: (res) => {
								if (res.authSetting['scope.record']) {
									// 已有权限
									resolve()
								} else if (res.authSetting['scope.record'] === false) {
									// 权限被拒绝，需要引导用户手动开启
									reject(new Error('permission_denied'))
								} else {
									// 尚未授权，主动申请
									uni.authorize({
										scope: 'scope.record',
										success: () => {
											resolve()
										},
										fail: () => {
											reject(new Error('permission_denied'))
										}
									})
								}
							},
							fail: () => {
								// 降级处理，直接尝试申请权限
								uni.authorize({
									scope: 'scope.record',
									success: () => {
										resolve()
									},
									fail: () => {
										reject(new Error('permission_denied'))
									}
								})
							}
						})
					} else {
						// 在不支持权限API的环境中，直接通过
						console.log('当前环境不支持权限检查，直接通过')
						resolve()
					}
				})
			},
			
			// 切换输入模式
			toggleInputMode() {
				this.isVoiceMode = !this.isVoiceMode
			},
			
			// 加载语音识别配置
			loadVoiceConfig() {
				this.voiceConfig = uni.getStorageSync('voiceConfig')
			},
			
			// 开始语音录制
			async startVoiceRecording() {
				// 首先申请麦克风权限
				try {
					await this.requestMicrophonePermission()
				} catch (error) {
					let title = '需要麦克风权限'
					let content = '使用语音记账功能需要麦克风权限'
					
					if (error.message === 'permission_denied') {
						title = '麦克风权限被拒绝'
						content = '检测到麦克风权限被拒绝，请手动开启权限后重试'
					}
					
					uni.showModal({
						title: title,
						content: content,
						confirmText: '了解',
						showCancel: false,
						success: () => {
							// 显示操作指引
							const systemInfo = uni.getSystemInfoSync()
							let guide = ''
							
							if (systemInfo.platform === 'ios') {
								guide = 'iOS用户：设置 → 隐私与安全 → 麦克风 → 找到本应用并开启'
							} else if (systemInfo.platform === 'android') {
								guide = 'Android用户：设置 → 应用管理 → 本应用 → 权限管理 → 开启麦克风权限'
							} else {
								guide = '请在系统设置中为本应用开启麦克风权限'
							}
							
							uni.showToast({
								title: guide,
								icon: 'none',
								duration: 4000
							})
						}
					})
					return
				}
				this.loadVoiceConfig();
				if (!this.voiceConfig) {
					uni.showModal({
						title: '需要配置语音识别',
						content: '请先在"我的"页面配置语音识别服务，才能使用语音记账功能',
						confirmText: '去配置',
						success: (res) => {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/voice-config/voice-config'
								})
							}
						}
					})
					return
				}
				
				if (!this.voiceConfig.appId || !this.voiceConfig.accessKey) {
					uni.showModal({
						title: '配置不完整',
						content: '需要配置App ID和Access Key才能使用语音识别功能',
						confirmText: '去配置',
						success: (res) => {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/voice-config/voice-config'
								})
							}
						}
					})
					return
				}
				
				if (!uni.getRecorderManager) {
					uni.showToast({
						title: '当前环境不支持录音功能',
						icon: 'error'
					})
					return
				}
				
				this.isRecording = true
				this.recordManager = uni.getRecorderManager()
				
				this.recordManager.onStart(() => {
					uni.showToast({
						title: '开始录音...',
						icon: 'none',
						duration: 1000
					})
				})
				
				this.recordManager.onStop((res) => {
					this.tempAudioPath = res.tempFilePath
					if (!res.tempFilePath) {
						uni.showToast({
							title: '录音文件无效，请重试',
							icon: 'error'
						})
						this.isRecording = false
						return
					}
					this.processVoiceRecording()
				})
				
				this.recordManager.onError((error) => {
					this.isRecording = false
					uni.showToast({
						title: '录音失败，请重试',
						icon: 'error'
					})
				})
				
				this.recordManager.start({
					duration: 60000,
					sampleRate: 16000,
					numberOfChannels: 1,
					encodeBitRate: 96000,
					format: 'wav'
				})
			},
			
			// 停止语音录制
			stopVoiceRecording() {
				if (!this.isRecording) return
				this.isRecording = false
				if (this.recordManager) {
					this.recordManager.stop()
				}
			},
			
			// 处理语音录制结果
			async processVoiceRecording() {
				if (!this.tempAudioPath) {
					uni.showToast({
						title: '录音文件无效',
						icon: 'error'
					})
					return
				}
				
				uni.showLoading({
					title: '正在识别语音...'
				})
				
				try {
					const recognizedText = await this.callFlashAPI()
					uni.hideLoading()
					
					if (recognizedText) {
						uni.showToast({
							title: '语音识别成功',
							icon: 'success'
						})
						await this.sendMessage(null,recognizedText)
					} else {
						uni.showToast({
							title: '未识别到有效内容',
							icon: 'none'
						})
					}
				} catch (error) {
					uni.hideLoading()
					
					let errorMessage = '语音识别失败，请重试'
					let showConfigModal = false
					
					if (error.message.includes('grant not found') || error.message.includes('验证失败')) {
						errorMessage = '语音识别配置错误，请前往设置页面重新配置'
						showConfigModal = true
					} else if (error.message.includes('不支持') || error.message.includes('无法读取')) {
						errorMessage = '当前环境不支持语音功能，建议使用文字输入'
					} else if (error.message.includes('网络') || error.message.includes('timeout')) {
						errorMessage = '网络连接问题，请检查网络后重试'
					}
					
					if (showConfigModal) {
						uni.showModal({
							title: '配置错误',
							content: errorMessage + '\n\n点击确认前往配置页面',
							confirmText: '去配置',
							success: (res) => {
								if (res.confirm) {
									uni.navigateTo({
										url: '/pages/voice-config/voice-config'
									})
								}
							}
						})
					} else {
						uni.showToast({
							title: errorMessage,
							icon: 'error'
						})
					}
				}
			},
			
			// 使用Flash API进行语音识别
			async callFlashAPI() {
				const recognizeUrl = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash"
				const audioBase64 = await this.getAudioBase64()
				
				const headers = {
					"X-Api-App-Key": this.voiceConfig.appId,
					"X-Api-Access-Key": this.voiceConfig.accessKey,
					"X-Api-Resource-Id": "volc.bigasr.auc_turbo",
					"X-Api-Request-Id": this.generateUUID(),
					"X-Api-Sequence": "-1",
					"Content-Type": "application/json"
				}
				
				const requestData = {
					user: {
						uid: this.voiceConfig.appId
					},
					audio: {
						data: audioBase64
					},
					request: {
						model_name: this.voiceConfig.modelName || "bigmodel",
						enable_itn: this.voiceConfig.enableItn !== false,
						enable_punc: this.voiceConfig.enablePunc !== false,
						enable_ddc: true,
						enable_speaker_info: this.voiceConfig.enableSpeakerInfo || false
					}
				}
				
				const response = await uni.request({
					url: recognizeUrl,
					method: 'POST',
					header: headers,
					data: requestData,
					timeout: 30000
				})
				
				if (response.statusCode === 200) {
					const statusCode = response.header['X-Api-Status-Code']
					if (statusCode === '20000000') {
						const result = response.data
						let recognizedText = ''
						
						if (result && result.result && result.result.text) {
							recognizedText = result.result.text
						} else if (result && result.data && result.data.result && result.data.result.text) {
							recognizedText = result.data.result.text
						} else if (result && result.utterances && result.utterances.length > 0) {
							recognizedText = result.utterances.map(item => item.text).join('')
						} else if (result && result.text) {
							recognizedText = result.text
						}
						
						return recognizedText.trim() || null
					} else {
						throw new Error(`语音识别失败: ${response.header['X-Api-Message'] || '未知错误'}`)
					}
				} else {
					throw new Error(`API调用失败: HTTP ${response.statusCode}`)
				}
			},
			
			// 获取录音文件的Base64编码
			async getAudioBase64() {
				return new Promise((resolve, reject) => {
					if (uni.getFileSystemManager) {
						uni.getFileSystemManager().readFile({
							filePath: this.tempAudioPath,
							encoding: 'base64',
							success: (res) => {
								resolve(res.data)
							},
							fail: (error) => {
								this.getAudioBase64Fallback().then(resolve).catch(reject)
							}
						})
					} else {
						this.getAudioBase64Fallback().then(resolve).catch(reject)
					}
				})
			},
			
			// 备用方案：使用 plus.io 读取文件
			async getAudioBase64Fallback() {
				return new Promise((resolve, reject) => {
					if (typeof plus !== 'undefined' && plus.io) {
						plus.io.resolveLocalFileSystemURL(this.tempAudioPath, (entry) => {
							entry.file((file) => {
								const reader = new plus.io.FileReader()
								reader.onloadend = (evt) => {
									if (evt.target.result) {
										const base64Data = evt.target.result.split(',')[1] || evt.target.result
										resolve(base64Data)
									} else {
										reject(new Error('文件读取结果为空'))
									}
								}
								reader.onerror = () => {
									reject(new Error('FileReader读取失败'))
								}
								reader.readAsDataURL(file)
							}, () => {
								reject(new Error('获取文件对象失败'))
							})
						}, () => {
							reject(new Error('解析文件路径失败'))
						})
					} else {
						reject(new Error('当前环境无法读取录音文件，建议使用文字输入'))
					}
				})
			},
			
			// 生成UUID
			generateUUID() {
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					const r = Math.random() * 16 | 0
					const v = c === 'x' ? r : (r & 0x3 | 0x8)
					return v.toString(16)
				})
			},
			
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
			async sendMessage(dom,messageText = null) {
				const message = (messageText || this.inputText).trim()
				if (!message || this.isLoading) {
					return
				}
				
				this.addMessage('user', message)

				// 发送后滚动到底部
				this.$nextTick(() => {
					this.scrollToBottom()
				})

				if (!messageText) {
					this.inputText = ''
				}
				this.loadAIConfig()
				if (!this.aiConfig) {
					this.addMessage('assistant', '抱歉，AI配置未找到，请在设置中重新配置')
					return
				}
				
				this.isLoading = true
				
				try {
					const response = await this.callAI(message)
					this.handleAIResponse(response, message)
				} catch (error) {
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
				categoryInfo+="\n\n当前时间："+(new Date()).toLocaleString();

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
					timeout: 120000
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
					// 包含记账信息的回复 - 清理掉JSON代码块和对象
					let replyText = aiReply
						.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '') // 移除JSON代码块
						.replace(/```(?:json)?\s*\[[\s\S]*?\]\s*```/g, '') // 移除JSON数组代码块
						.replace(/\{[\s\S]*?"type"\s*:\s*"(expense|income)"[\s\S]*?\}/g, '') // 移除JSON对象
						.replace(/\n\s*\n/g, '\n') // 清理多余的空行
						.trim()
					
					// 如果清理后没有文本，使用默认文本
					if (!replyText) {
						replyText = `我帮你识别了${recordsData.length}笔记录：`
					}
					
					this.addMessage('assistant', replyText, recordsData)
				} else {
					// 普通对话回复
					this.addMessage('assistant', aiReply)
				}
			},
			
			// 解析记账数据（支持单笔和多笔）
			parseRecordsData(text) {
				try {
					// 先尝试提取markdown代码块中的JSON
					const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
					if (codeBlockMatch) {
						let jsonStr = codeBlockMatch[1].trim()
						// 处理转义字符
						jsonStr = this.unescapeJsonString(jsonStr)
						const data = JSON.parse(jsonStr)
						if (Array.isArray(data)) {
							const validRecords = data.filter(item => this.validateRecordData(item))
							return validRecords.length > 0 ? validRecords : null
						} else if (this.validateRecordData(data)) {
							return [data]
						}
					}
					
					// 尝试使用更强的正则表达式提取JSON对象
					const strongObjectMatch = text.match(/\{[\s\S]*?"type"\s*:\s*"(expense|income)"[\s\S]*?\}/);
					if (strongObjectMatch) {
						let objectStr = strongObjectMatch[0]
						objectStr = this.unescapeJsonString(objectStr)
						const data = JSON.parse(objectStr)
						if (this.validateRecordData(data)) {
							return [data]
						}
					}
					
					// 尝试匹配更宽松的JSON对象（包含换行符）
					const flexibleObjectMatch = text.match(/\{[^{}]*?"type"[^{}]*?"(expense|income)"[^{}]*?\}/s);
					if (flexibleObjectMatch) {
						let objectStr = flexibleObjectMatch[0]
						objectStr = this.unescapeJsonString(objectStr)
						const data = JSON.parse(objectStr)
						if (this.validateRecordData(data)) {
							return [data]
						}
					}
					
					// 尝试匹配数组格式
					const arrayMatch = text.match(/\[[^\]]*\]/);
					if (arrayMatch) {
						let arrayStr = arrayMatch[0]
						arrayStr = this.unescapeJsonString(arrayStr)
						const dataArray = JSON.parse(arrayStr)
						if (Array.isArray(dataArray) && dataArray.length > 0) {
							const validRecords = dataArray.filter(item => this.validateRecordData(item))
							return validRecords.length > 0 ? validRecords : null
						}
					}
					
					// 尝试匹配对象格式（最后尝试，较宽松）
					const objectMatch = text.match(/\{[^}]*\}/);
					if (objectMatch) {
						let objectStr = objectMatch[0]
						objectStr = this.unescapeJsonString(objectStr)
						const data = JSON.parse(objectStr)
						if (this.validateRecordData(data)) {
							return [data]
						}
					}
				} catch (error) {
					console.log('JSON解析失败:', error.message)
				}
				
				return null
			},
			
			// 处理JSON字符串中的转义字符
			unescapeJsonString(str) {
				// 将常见的转义字符还原
				return str.replace(/\\"/g, '"')
						  .replace(/\\'/g, "'")
						  .replace(/\\n/g, '\n')
						  .replace(/\\t/g, '\t')
						  .replace(/\\r/g, '\r')
						  .replace(/\\\\/g, '\\')
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
						
						if (result.isNewCategory) {
							newCategories.push(result.category)
						}
					} catch (error) {
						results.push({ success: false, error: error.message })
					}
				}
				
				if (newCategories.length > 0) {
					await this.handleNewCategories(newCategories)
				}
				
				const messageIndex = this.messages.findIndex(msg => 
					msg.recordsData === recordsData
				)
				if (messageIndex !== -1) {
					this.messages[messageIndex].recorded = true
					this.saveChatHistory()
				}
				
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

				// 检查是否为具体时间格式：YYYY-MM-DD HH:mm:ss
				const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
				if (dateTimePattern.test(timeDescription)) {
					// 直接解析为Date对象
					const [datePart, timePart] = timeDescription.split(' ')
					const [year, month, day] = datePart.split('-').map(Number)
					const [hour, minute, second] = timePart.split(':').map(Number)
					return new Date(year, month - 1, day, hour, minute, second)
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
					const { categoryIcon, isNewCategory, categoryId } = this.getCategoryIconWithCheck(
						record.category, 
						record.type
					)
					
					let finalCategoryId = categoryId
					if (isNewCategory) {
						const newCategory = {
							name: record.category,
							icon: categoryIcon,
							type: record.type
						}
						const addedCategories = await this.handleNewCategories([newCategory])
						if (addedCategories && addedCategories.length > 0) {
							finalCategoryId = addedCategories[0].id
						}
					}
					
					const recordTime = this.parseRecordTime(record.time)
					const recordId = Date.now() + Math.random() * 1000
					
					const newRecord = {
						id: recordId,
						type: record.type,
						amount: parseFloat(record.amount).toString(),
						categoryName: record.category,
						categoryId: finalCategoryId,
						categoryIcon: categoryIcon,
						note: record.note || '',
						time: recordTime.toISOString()
					}
					
					const records = uni.getStorageSync('records') || []
					records.push(newRecord)
					uni.setStorageSync('records', records)
					
					message.recordsData[recordIndex].recorded = true
					
					const allRecorded = message.recordsData.every(r => r.recorded)
					if (allRecorded) {
						message.recorded = true
					}
					
					this.saveChatHistory()
					
					uni.showToast({
						title: '记账成功！',
						icon: 'success'
					})
					
					this.addMessage('assistant', `✅ 已记录${record.type === 'expense' ? '支出' : '收入'}¥${record.amount} (${record.category})`)
					
				} catch (error) {
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
				
				const newIcon = this.generateCategoryIcon(categoryName, type)
				return { 
					categoryIcon: newIcon, 
					categoryId: null,
					isNewCategory: true 
				}
			},
			
			// 生成新分类图标
			generateCategoryIcon(categoryName, type) {
				const iconMap = {
					'早餐': '🥞', '午餐': '🍱', '晚餐': '🍽️', '夜宵': '🌙',
					'咖啡': '☕', '奶茶': '🧋', '饮料': '🥤',
					'打车': '🚗', '地铁': '🚇', '公交': '🚌', '油费': '⛽',
					'零食': '🍿', '水果': '🍎', '蔬菜': '🥬', '肉类': '🥩',
					'洗衣': '👕', '理发': '💇', '美容': '💄', '健身': '💪',
					'宠物': '🐱', '花卉': '🌸', '书籍': '📚', 
					'兼职': '💼', '奖励': '🎁', '补贴': '💰'
				}
				
				if (iconMap[categoryName]) {
					return iconMap[categoryName]
				}
				
				for (const [key, icon] of Object.entries(iconMap)) {
					if (categoryName.includes(key) || key.includes(categoryName)) {
						return icon
					}
				}
				
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
					
					addedCategories.push({
						...category,
						id: uniqueId
					})
				})
				
				uni.setStorageSync('expenseCategories', expenseCategories)
				uni.setStorageSync('incomeCategories', incomeCategories)
				
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
				const now = new Date()
				
				// 获取今天、昨天、前天的日期（只比较年月日）
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
				const dayBeforeYesterday = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
				
				const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
				
				// 格式化时分
				const hours = date.getHours().toString().padStart(2, '0')
				const minutes = date.getMinutes().toString().padStart(2, '0')
				const timeStr = `${hours}:${minutes}`
				
				// 根据日期判断显示格式
				if (messageDate.getTime() === today.getTime()) {
					return `今天 ${timeStr}`
				} else if (messageDate.getTime() === yesterday.getTime()) {
					return `昨天 ${timeStr}`
				} else if (messageDate.getTime() === dayBeforeYesterday.getTime()) {
					return `前天 ${timeStr}`
				} else if (date.getFullYear() === now.getFullYear()) {
					// 同年但不是近三天，显示月日
					const month = (date.getMonth() + 1).toString().padStart(2, '0')
					const day = date.getDate().toString().padStart(2, '0')
					return `${month}-${day} ${timeStr}`
				} else {
					// 不同年，显示完整日期
					const year = date.getFullYear()
					const month = (date.getMonth() + 1).toString().padStart(2, '0')
					const day = date.getDate().toString().padStart(2, '0')
					return `${year}-${month}-${day} ${timeStr}`
				}
			},
			
			// 滚动到底部
			scrollToBottom() {
				this.$nextTick(() => {
					// #ifdef H5
					const anchor = document.getElementById && document.getElementById('bottomAnchor')
					if (anchor && anchor.scrollIntoView) {
						anchor.scrollIntoView({behavior: 'smooth'})
					}
					// #endif
					// #ifndef H5
					this.scrollTop = (this.scrollTop || 99999) + 1
					// #endif
				})
			}
		}
	}
</script>

<style scoped>
	/* 全局防止水平溢出 */
	* {
		max-width: 100%;
		box-sizing: border-box;
	}
	
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #FAFAFA;
		max-width: 100vw;
		overflow-x: hidden;
	}
	
	.chat-container {
		flex: 1;
		/* padding: 30rpx 20rpx; */
		padding-bottom: 160rpx;
		overflow-y: auto;
		overflow-x: hidden;
		box-sizing: border-box;
	}
	
	.message-item {
		display: flex;
		margin-bottom: 35rpx;
		animation: fadeIn 0.3s ease-in;
		max-width: 100%;
		box-sizing: border-box;
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
		width: 55rpx;
		height: 55rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26rpx;
		flex-shrink: 0;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
	}
	
	.user-avatar {
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: white;
		margin-left: 15rpx;
	}
	
	.assistant-avatar {
		background: linear-gradient(135deg, #4ECDC4, #44A08D);
		color: white;
		margin-right: 15rpx;
	}
	
	.message-content {
		max-width: calc(100vw - 150rpx);
		min-width: 100rpx;
		padding: 18rpx 22rpx;
		border-radius: 18rpx;
		position: relative;
		display: flex;
		flex-direction: column;
		word-wrap: break-word;
		overflow-wrap: break-word;
		box-sizing: border-box;
	}
	
	.user-message .message-content {
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: white;
		border-bottom-right-radius: 6rpx;
		box-shadow: 0 3rpx 12rpx rgba(102, 126, 234, 0.25);
	}
	
	.assistant-message .message-content {
		background: white;
		color: #333;
		border-bottom-left-radius: 6rpx;
		box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
	}
	
	.message-text {
		font-size: 28rpx;
		line-height: 1.6;
		margin-bottom: 8rpx;
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: pre-wrap;
		max-width: 100%;
	}
	
	.message-time {
		font-size: 20rpx;
		opacity: 0.5;
		align-self: flex-end;
		margin-top: 8rpx;
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
		border-radius: 12rpx;
		padding: 18rpx;
		margin-bottom: 12rpx;
		max-width: 100%;
		box-sizing: border-box;
		overflow-wrap: break-word;
		box-shadow: 0 1rpx 6rpx rgba(0,0,0,0.04);
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
		background: linear-gradient(135deg, #4ECDC4, #44A08D);
		color: white;
		border: none;
		border-radius: 20rpx;
		padding: 12rpx 20rpx;
		font-size: 24rpx;
		font-weight: 500;
		box-shadow: 0 2rpx 8rpx rgba(78, 205, 196, 0.25);
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
		background: linear-gradient(to bottom, #FAFAFA, #F5F5F5);
		padding: 15rpx 20rpx 50rpx;
		z-index: 999;
		box-sizing: border-box;
		max-width: 100vw;
		box-shadow: 0 -2rpx 15rpx rgba(0,0,0,0.05);
		border-top: 1rpx solid rgba(0,0,0,0.05);
	}
	
	/* 录音遮罩层 */
	.recording-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.recording-content {
		background: rgba(0, 0, 0, 0.8);
		border-radius: 20rpx;
		padding: 60rpx 40rpx;
		text-align: center;
		color: white;
	}
	
	.voice-animation {
		margin-bottom: 30rpx;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.voice-icon {
		font-size: 60rpx;
		margin-right: 20rpx;
	}
	
	.wave-container {
		display: flex;
		align-items: center;
		gap: 6rpx;
	}
	
	.wave {
		width: 6rpx;
		background: #1AAD19;
		border-radius: 3rpx;
		animation: wave-animation 1.2s ease-in-out infinite;
	}
	
	.wave1 { height: 20rpx; animation-delay: 0s; }
	.wave2 { height: 35rpx; animation-delay: 0.1s; }
	.wave3 { height: 50rpx; animation-delay: 0.2s; }
	.wave4 { height: 35rpx; animation-delay: 0.3s; }
	.wave5 { height: 20rpx; animation-delay: 0.4s; }
	
	@keyframes wave-animation {
		0%, 100% { transform: scaleY(0.3); }
		50% { transform: scaleY(1); }
	}
	
	.recording-text {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 10rpx;
		display: block;
	}
	
	.recording-hint {
		font-size: 24rpx;
		opacity: 0.8;
		display: block;
	}
	
	.function-buttons {
		margin-bottom: 15rpx;
		display: flex;
		justify-content: flex-end;
		width: 100%;
		box-sizing: border-box;
	}
	
	.clear-btn {
		padding: 12rpx 22rpx;
		background: linear-gradient(135deg, #FFF5F5, #FFEBEB);
		border-radius: 15rpx;
		font-size: 22rpx;
		color: #E74C3C;
		line-height: 1;
		border: none;
		box-shadow: 0 2rpx 6rpx rgba(231, 76, 60, 0.12);
	}
	
	.clear-btn:active {
		background: #FFE5E5;
		transform: scale(0.95);
	}
	
	.input-row {
		display: flex;
		align-items: center;
		gap: 15rpx;
		width: 100%;
		box-sizing: border-box;
	}
	
	/* 切换按钮 */
	.voice-toggle-btn,
	.keyboard-toggle-btn {
		width: 68rpx;
		height: 68rpx;
		background: linear-gradient(135deg, #FFFFFF, #F8F9FA);
		border-radius: 12rpx;
		font-size: 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		border: none;
		box-shadow: 0 3rpx 10rpx rgba(0,0,0,0.08);
	}
	
	.voice-toggle-btn:active,
	.keyboard-toggle-btn:active {
		background: linear-gradient(135deg, #F0F0F0, #E9ECEF);
		transform: scale(0.95);
	}
	
	/* 语音输入按钮 */
	.voice-btn {
		flex: 1;
		min-width: 0;
		height: 68rpx;
		background: linear-gradient(135deg, #FFFFFF, #F8F9FA);
		color: #333;
		border-radius: 12rpx;
		font-size: 28rpx;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		box-sizing: border-box;
		border: none;
		box-shadow: 0 3rpx 10rpx rgba(0,0,0,0.08);
	}
	
	.voice-btn.recording {
		background: linear-gradient(135deg, #6C757D, #5A6268);
		color: white;
		box-shadow: 0 3rpx 12rpx rgba(108, 117, 125, 0.3);
	}
	
	.voice-btn:disabled {
		opacity: 0.6;
	}
	
	.voice-text {
		font-size: 28rpx;
		font-weight: 500;
	}
	
	/* 文本输入框 */
	.chat-input {
		flex: 1;
		min-width: 0;
		height: 68rpx;
		padding: 0 22rpx;
		border-radius: 12rpx;
		font-size: 28rpx;
		background: linear-gradient(135deg, #FFFFFF, #F8F9FA);
		transition: all 0.2s ease;
		box-sizing: border-box;
		border: none;
		box-shadow: 0 3rpx 10rpx rgba(0,0,0,0.08);
	}
	
	/* 发送按钮 */
	.send-btn {
		min-width: 110rpx;
		width: auto;
		height: 68rpx;
		padding: 0 28rpx;
		background: linear-gradient(135deg, #1AAD19, #179B16);
		color: white;
		border: none;
		border-radius: 12rpx;
		font-size: 26rpx;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		flex-shrink: 0;
		box-shadow: 0 3rpx 12rpx rgba(26, 173, 25, 0.3);
	}
	
	.send-btn:disabled {
		background: linear-gradient(135deg, #E9ECEF, #DEE2E6);
		color: #ADB5BD;
		box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.06);
	}
	
	.send-btn:active:not(:disabled) {
		background: linear-gradient(135deg, #179B16, #148A13);
		transform: scale(0.98);
		box-shadow: 0 2rpx 8rpx rgba(26, 173, 25, 0.35);
	}
	
	.send-text {
		font-size: 26rpx;
		font-weight: 500;
	}
</style>
