<template>
	<view class="container">
		<!-- 页面标题 -->
		<view class="header">
			<text class="title">语音识别配置</text>
			<text class="subtitle">配置字节跳动语音识别服务</text>
		</view>
		
		<!-- 配置表单 -->
		<view class="config-form">
			<!-- API配置区域 -->
			<view class="form-section">
				<text class="section-title">API配置</text>
				
				<view class="form-item">
					<text class="label">App ID</text>
					<input 
						class="input" 
						v-model="config.appId"
						placeholder="请输入字节跳动App ID"
						type="text"
					/>
				</view>
				
				<view class="form-item">
					<text class="label">Access Key</text>
					<input 
						class="input" 
						v-model="config.accessKey"
						placeholder="请输入Access Key"
						type="text"
					/>
				</view>
			</view>
			
			<!-- 识别配置区域 -->
			<view class="form-section">
				<text class="section-title">识别配置</text>
				
				<view class="form-item">
					<text class="label">模型名称</text>
					<picker 
						mode="selector" 
						:value="modelIndex" 
						:range="modelOptions"
						@change="onModelChange">
						<view class="picker">{{modelOptions[modelIndex]}}</view>
					</picker>
				</view>
				
				<view class="form-item switch-item">
					<text class="label">启用标点符号</text>
					<switch 
						:checked="config.enablePunc"
						@change="onSwitchChange"
						data-field="enablePunc"
						color="#667eea"
					/>
				</view>
				
				<view class="form-item switch-item">
					<text class="label">启用数字转换</text>
					<switch 
						:checked="config.enableItn"
						@change="onSwitchChange"
						data-field="enableItn"
						color="#667eea"
					/>
				</view>
				
				<view class="form-item switch-item">
					<text class="label">说话人识别</text>
					<switch 
						:checked="config.enableSpeakerInfo"
						@change="onSwitchChange"
						data-field="enableSpeakerInfo"
						color="#667eea"
					/>
				</view>
			</view>
			
			<!-- 使用说明 -->
			<view class="form-section">
				<text class="section-title">使用说明</text>
				<view class="help-content">
					<text class="help-text">🎪 演示模式：无需配置，可直接体验语音录制功能</text>
					<text class="help-text">� 火山引擎：需申请API密钥，支持真实语音识别</text>
					<text class="help-text">🎤 在聊天页面长按语音按钮开始录音</text>
					<text class="help-text">✨ 松开按钮自动识别并转换为文字</text>
				</view>
				
				<view class="error-help" v-if="testResult && !testResult.success">
					<text class="error-title">⚠️ 常见问题解决方案：</text>
					<text class="error-text">• grant not found: App ID或Access Key错误</text>
					<text class="error-text">• 权限不足: 请确认已开通语音识别服务</text>
					<text class="error-text">• 网络超时: 检查网络连接状况</text>
					<text class="error-text">• 建议先尝试演示模式体验功能</text>
				</view>
				
				<button class="help-btn" @click="openHelp">
					📖 查看详细配置指南
				</button>
			</view>
		</view>
		
		<!-- 操作按钮 -->
		<view class="actions">
			<button class="test-btn" @click="testConfiguration" :disabled="!canTest">
				🧪 测试配置
			</button>
			<button class="save-btn" @click="saveConfiguration" :disabled="!canSave">
				✅ 保存配置
			</button>
		</view>
		
		<!-- 测试结果显示 -->
		<view v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
			<text class="result-title">{{ testResult.success ? '✅ 测试成功' : '❌ 测试失败' }}</text>
			<text class="result-message">{{ testResult.message }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				config: {
					appId: '',
					accessKey: '',
					modelName: 'bigmodel',
					enablePunc: true,
					enableItn: true,
					enableSpeakerInfo: false
				},
				modelOptions: ['bigmodel', 'general'],
				modelIndex: 0,
				testResult: null
			}
		},
		
		computed: {
			canSave() {
				// 需要配置完整才能保存
				return this.config.appId.trim() && this.config.accessKey.trim()
			},
			
			canTest() {
				// 需要配置完整才能测试
				return this.config.appId.trim() && this.config.accessKey.trim()
			}
		},
		
		onLoad() {
			this.loadConfiguration()
		},
		
		methods: {
			// 加载配置
			loadConfiguration() {
				const saved = uni.getStorageSync('voiceConfig')
				if (saved) {
					this.config = { ...this.config, ...saved }
					
					// 设置模型选择器
					const modelIndex = this.modelOptions.indexOf(this.config.modelName)
					this.modelIndex = modelIndex >= 0 ? modelIndex : 0
				}
			},
			
			// 模型选择变化
			onModelChange(e) {
				this.modelIndex = e.detail.value
				this.config.modelName = this.modelOptions[this.modelIndex]
			},
			
			// 开关变化
			onSwitchChange(e) {
				const field = e.currentTarget.dataset.field
				this.config[field] = e.detail.value
			},
			
			// 测试配置
			async testConfiguration() {
				if (!this.canTest) return
				
				uni.showLoading({
					title: '测试中...'
				})
				
				try {
					// 火山引擎API测试
					await this.testVolcengineMode()
					
				} catch (error) {
					console.error('测试失败:', error)
					let errorMessage = '未知错误'
					
					// 详细的错误分类
					if (error.message.includes('grant not found')) {
						errorMessage = 'App ID 或 Access Key 无效，请检查配置是否正确'
					} else if (error.message.includes('timeout')) {
						errorMessage = '网络超时，请检查网络连接'
					} else if (error.message.includes('unauthorized') || error.message.includes('403')) {
						errorMessage = '权限不足，请确认账号已开通语音识别服务'
					} else if (error.message.includes('400')) {
						errorMessage = '请求参数错误，请检查配置信息'
					} else {
						errorMessage = error.message || '服务调用失败'
					}
					
					this.testResult = {
						success: false,
						message: `测试失败：${errorMessage}`
					}
					
					// 显示详细的帮助信息
					uni.showModal({
						title: '测试失败',
						content: `${errorMessage}\n\n建议：\n1. 确认App ID和Access Key正确\n2. 确认已开通火山引擎语音识别服务\n3. 检查网络连接\n4. 可尝试使用演示模式体验功能`,
						showCancel: false
					})
				} finally {
					uni.hideLoading()
				}
			},
			
			// 测试火山引擎模式
			async testVolcengineMode() {
				// 先进行简单的API连通性测试
				uni.showLoading({
					title: '检查API连接...'
				})
				
				const connectivityTest = await this.testApiConnectivity()
				
				if (!connectivityTest.success) {
					throw new Error(connectivityTest.message)
				}
				
				// 尝试获取测试音频数据
				uni.showLoading({
					title: '准备测试音频...'
				})
				
				const audioData = await this.getTestAudioData();
				if (!audioData) {
					// 如果没有音频数据，只进行API连通性测试
					this.testResult = {
						success: true,
						message: 'API配置正确，连接测试成功！（未找到测试音频文件，但API连通性正常）'
					}
					
					uni.showToast({
						title: 'API连接成功',
						icon: 'success'
					})
					return
				}
				
				// 使用音频数据进行完整测试
				uni.showLoading({
					title: '正在识别语音...'
				})
				
				// 直接调用Flash API，使用audioData
				const result = await this.callFlashAPI(null, audioData)
				
				this.testResult = {
					success: true,
					message: result ? `识别成功：${result}` : 'API配置正确，但测试音频无法识别内容'
				}
				
				uni.showToast({
					title: '测试成功',
					icon: 'success'
				})
			},
			
			// API连通性测试
			async testApiConnectivity() {
				try {
					// 简单的API测试请求
					const response = await uni.request({
						url: "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash",
						method: 'POST',
						header: {
							"X-Api-App-Key": this.config.appId,
							"X-Api-Access-Key": this.config.accessKey,
							"X-Api-Resource-Id": "volc.bigasr.auc_turbo",
							"X-Api-Request-Id": "test-connectivity",
							"X-Api-Sequence": "-1",
							"Content-Type": "application/json"
						},
						data: {
							user: { uid: "test" },
							audio: { url: "test" },
							request: { model_name: "bigmodel" }
						},
						timeout: 10000
					})
					
					// 检查响应状态
					if (response.statusCode === 200) {
						const statusCode = response.header['X-Api-Status-Code']
						if (statusCode === '20000000' || statusCode === '40000001') {
							// 连接成功（即使参数错误也说明认证通过）
							return { success: true }
						} else if (statusCode === '40000003' || statusCode === '40000004') {
							// 认证失败
							return { 
								success: false, 
								message: 'App ID 或 Access Key 验证失败'
							}
						}
					}
					
					return { success: true } // 其他情况认为连接正常
				} catch (error) {
					return { 
						success: false, 
						message: `连接失败：${error.message}`
					}
				}
			},
			
			// 调用Flash API进行语音识别
			async callFlashAPI(audioUrl, audioData = null) {
				const requestId = this.generateUUID()
				const recognizeUrl = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash"
				
				const headers = {
					"X-Api-App-Key": this.config.appId,
					"X-Api-Access-Key": this.config.accessKey,
					"X-Api-Resource-Id": "volc.bigasr.auc_turbo",
					"X-Api-Request-Id": requestId,
					"X-Api-Sequence": "-1",
					"Content-Type": "application/json"
				}
				
				// 构建音频数据
				let audio_data = null
				if (audioUrl) {
					audio_data = { "url": audioUrl }
				} else if (audioData) {
					audio_data = { "data": audioData } // Base64编码的音频数据
				} else {
					// 如果没有音频数据，使用一个极小的测试音频数据
					// 这主要用于测试API的连通性和权限
					audio_data = { "data": "" }
				}
				
				const requestData = {
					user: {
						uid: this.config.appId
					},
					audio: audio_data,
					request: {
						model_name: this.config.modelName,
						enable_itn: this.config.enableItn,
						enable_punc: this.config.enablePunc,
						enable_ddc: true,
						enable_speaker_info: this.config.enableSpeakerInfo
					}
				}
				
				console.log('Flash API 请求数据:', requestData)
				
				const response = await uni.request({
					url: recognizeUrl,
					method: 'POST',
					header: headers,
					data: requestData,
					timeout: 30000
				})
				
				console.log('Flash API 响应:', JSON.stringify(response))
				
				if (response.statusCode === 200) {
					const statusCode = response.header['X-Api-Status-Code']
					if (statusCode === '20000000') {
						// 识别成功，直接返回结果
						const result = response.data
						
						// 解析识别结果
						let recognizedText = ''
						
						// 支持多种返回格式
						if (result && result.data && result.data.result && result.data.result.text) {
							recognizedText = result.data.result.text
						} else if (result && result.result && result.result.text) {
							recognizedText = result.result.text
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
			
			// 保存配置
			saveConfiguration() {
				if (!this.canSave) return
				
				try {
					uni.setStorageSync('voiceConfig', this.config)
					
					uni.showToast({
						title: '保存成功',
						icon: 'success'
					})
					
					// 延迟返回
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
					
				} catch (error) {
					uni.showToast({
						title: '保存失败',
						icon: 'error'
					})
				}
			},
			
			// 打开帮助文档
			openHelp() {
				uni.showModal({
					title: '火山引擎语音识别配置指南',
					content: '1. 访问 console.volcengine.com\n2. 开通"语音技术-语音识别"服务\n3. 创建应用，获取App ID\n4. 在"访问管理"中创建Access Key\n5. 确保账号有足够余额或已购买套餐\n6. 将获取的App ID和Access Key填入配置\n\n注意：请确保服务已正常开通并有使用权限',
					confirmText: '明白了',
					showCancel: false
				})
			},
			
			// 获取测试音频数据
			async getTestAudioData() {
				try {
					console.log('开始获取测试音频数据...');
					
					// 获取static目录下的test.mp3文件
					const audioPath = '/static/test.mp3';
					
					// #ifdef APP-PLUS
					// App环境下使用plus.io
					return new Promise((resolve, reject) => {
						console.log('App环境：尝试读取音频文件');
						try {
							const filePath = plus.io.convertLocalFileSystemURL(audioPath);
							plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
								entry.file((file) => {
									const reader = new plus.io.FileReader();
									reader.onloadend = (e) => {
										const base64 = e.target.result.split(',')[1];
										console.log('App环境成功读取音频文件:', audioPath);
										resolve(base64);
									};
									reader.onerror = () => {
										console.error('App环境读取音频文件失败');
										resolve('');
									};
									reader.readAsDataURL(file);
								});
							}, () => {
								console.error('App环境：文件不存在');
								resolve('');
							});
						} catch (error) {
							console.error('App环境获取音频文件出错:', error);
							resolve('');
						}
					});
					// #endif
					
					// #ifndef APP-PLUS
					// 非App环境处理
					console.log('非App环境：检查可用的API');
					
					// 检查是否支持文件系统管理器（小程序环境）
					if (typeof uni.getFileSystemManager === 'function') {
						console.log('小程序环境：使用getFileSystemManager');
						const fs = uni.getFileSystemManager();
						return new Promise((resolve) => {
							fs.readFile({
								filePath: audioPath,
								encoding: 'base64',
								success: (res) => {
									console.log('小程序环境成功读取音频文件:', audioPath);
									resolve(res.data);
								},
								fail: (error) => {
									console.error('小程序环境读取音频文件失败:', error);
									resolve('');
								}
							});
						});
					} 
					// H5环境或其他环境
					else if (typeof fetch !== 'undefined') {
						console.log('H5环境：使用fetch API');
						try {
							const response = await fetch(audioPath);
							if (!response.ok) {
								throw new Error(`HTTP ${response.status}: ${response.statusText}`);
							}
							
							const blob = await response.blob();
							
							return new Promise((resolve) => {
								const reader = new FileReader();
								reader.onload = function() {
									const base64 = reader.result.split(',')[1]; // 去掉data:audio/mp3;base64,前缀
									console.log('H5环境成功读取音频文件:', audioPath);
									resolve(base64);
								};
								reader.onerror = function() {
									console.error('H5环境读取音频文件失败');
									resolve('');
								};
								reader.readAsDataURL(blob);
							});
						} catch (error) {
							console.error('H5环境获取音频文件失败:', error);
							console.log('H5环境：无法获取音频文件，跳过音频测试');
							return '';
						}
					} 
					// 其他环境
					else {
						console.log('当前环境不支持文件读取，跳过音频测试');
						return '';
					}
					// #endif
					
				} catch (error) {
					console.error('获取测试音频数据出错:', error);
					return '';
				}
			},
			
			// 生成UUID
			generateUUID() {
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					const r = Math.random() * 16 | 0
					const v = c === 'x' ? r : (r & 0x3 | 0x8)
					return v.toString(16)
				})
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 30rpx;
		background-color: #F5F5F5;
		min-height: 100vh;
	}
	
	.header {
		text-align: center;
		margin-bottom: 50rpx;
	}
	
	.title {
		display: block;
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 10rpx;
	}
	
	.subtitle {
		font-size: 26rpx;
		color: #666;
	}
	
	.config-form {
		margin-bottom: 50rpx;
	}
	
	.form-section {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	
	.section-title {
		display: block;
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 30rpx;
		padding-bottom: 15rpx;
		border-bottom: 2rpx solid #F0F0F0;
	}
	
	.form-item {
		margin-bottom: 30rpx;
	}
	
	.form-item:last-child {
		margin-bottom: 0;
	}
	
	.label {
		display: block;
		font-size: 28rpx;
		color: #333;
		margin-bottom: 15rpx;
		font-weight: 500;
	}
	
	.input {
		width: 100%;
		height: 80rpx;
		background: #F8F9FA;
		border: 2rpx solid #E9ECEF;
		border-radius: 15rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
		color: #333;
		box-sizing: border-box;
	}
	
	.input:focus {
		border-color: #667eea;
		background: white;
	}
	
	.picker {
		height: 80rpx;
		background: #F8F9FA;
		border: 2rpx solid #E9ECEF;
		border-radius: 15rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
		color: #333;
		display: flex;
		align-items: center;
		position: relative;
	}
	
	.picker::after {
		content: '>';
		position: absolute;
		right: 20rpx;
		color: #999;
		transform: rotate(90deg);
	}
	
	.switch-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.switch-item .label {
		margin-bottom: 0;
		flex: 1;
	}
	
	.help-content {
		margin-bottom: 30rpx;
	}
	
	.help-text {
		display: block;
		font-size: 26rpx;
		color: #666;
		line-height: 1.6;
		margin-bottom: 15rpx;
		padding-left: 20rpx;
		position: relative;
	}
	
	.help-text::before {
		content: '•';
		position: absolute;
		left: 0;
		color: #667eea;
	}
	
	.error-help {
		background: #FFF3E0;
		border: 2rpx solid #FFB74D;
		border-radius: 15rpx;
		padding: 20rpx;
		margin: 20rpx 0 30rpx 0;
	}
	
	.error-title {
		display: block;
		font-size: 28rpx;
		font-weight: bold;
		color: #E65100;
		margin-bottom: 15rpx;
	}
	
	.error-text {
		display: block;
		font-size: 24rpx;
		color: #BF360C;
		line-height: 1.5;
		margin-bottom: 10rpx;
		padding-left: 15rpx;
		position: relative;
	}
	
	.error-text::before {
		content: '•';
		position: absolute;
		left: 0;
		color: #FF9800;
	}
	
	.help-btn {
		width: 100%;
		height: 80rpx;
		background: linear-gradient(45deg, #E3F2FD, #BBDEFB);
		color: #1976D2;
		border: 2rpx solid #BBDEFB;
		border-radius: 15rpx;
		font-size: 28rpx;
		font-weight: 500;
	}
	
	.actions {
		display: flex;
		gap: 20rpx;
		margin-bottom: 30rpx;
	}
	
	.test-btn {
		flex: 1;
		height: 90rpx;
		background: linear-gradient(45deg, #FF9800, #FFB74D);
		color: white;
		border: none;
		border-radius: 25rpx;
		font-size: 30rpx;
		font-weight: bold;
	}
	
	.test-btn:disabled {
		opacity: 0.5;
	}
	
	.save-btn {
		flex: 1;
		height: 90rpx;
		background: linear-gradient(45deg, #667eea, #764ba2);
		color: white;
		border: none;
		border-radius: 25rpx;
		font-size: 30rpx;
		font-weight: bold;
	}
	
	.save-btn:disabled {
		opacity: 0.5;
	}
	
	.test-result {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	
	.test-result.success {
		border-left: 8rpx solid #4CAF50;
	}
	
	.test-result.error {
		border-left: 8rpx solid #F44336;
	}
	
	.result-title {
		display: block;
		font-size: 30rpx;
		font-weight: bold;
		margin-bottom: 15rpx;
	}
	
	.test-result.success .result-title {
		color: #4CAF50;
	}
	
	.test-result.error .result-title {
		color: #F44336;
	}
	
	.result-message {
		font-size: 26rpx;
		color: #666;
		line-height: 1.5;
	}
</style>
