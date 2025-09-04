<template>
	<view class="container">
		<!-- 用户信息区域 -->
		<view class="user-info">
			<view class="avatar-section">
				<image class="avatar" src="/static/logo.png" mode="aspectFit"></image>
				<text class="username">我的账本</text>
				<text class="user-desc">记录每一笔收支，管理美好生活</text>
			</view>
		</view>
		
		<!-- AI功能 -->
		<view class="data-management">
			<text class="management-title">AI智能功能</text>
			<!-- <view class="management-item ai-chat-item" @click="goToChat">
				<view class="management-left">
					<text class="management-icon">💬</text>
					<text class="management-text">智能记账聊天</text>
				</view>
				<text class="management-arrow">></text>
			</view> -->
			<view class="management-item ai-config-item" @click="goToAIConfig">
				<view class="management-left">
					<text class="management-icon">🤖</text>
					<text class="management-text">智能体配置</text>
				</view>
				<text class="management-arrow">></text>
			</view>
		</view>
		
		<!-- 数据管理 -->
		<view class="data-management">
			<text class="management-title">数据管理</text>
			<view class="management-item icon-manage-item" @click="goToIconManage">
				<view class="management-left">
					<text class="management-icon">🎨</text>
					<text class="management-text">图标管理</text>
				</view>
				<text class="management-arrow">></text>
			</view>
			<view class="management-item refresh-item" @click="refreshCategories">
				<view class="management-left">
					<text class="management-icon">🔄</text>
					<text class="management-text">刷新分类</text>
				</view>
				<text class="management-arrow">></text>
			</view>
			<view class="management-item import-item" @click="importData">
				<view class="management-left">
					<text class="management-icon">📥</text>
					<text class="management-text">导入数据</text>
				</view>
				<text class="management-arrow">></text>
			</view>
			<view class="management-item export-item" @click="exportData">
				<view class="management-left">
					<text class="management-icon">📤</text>
					<text class="management-text">导出数据</text>
				</view>
				<text class="management-arrow">></text>
			</view>
			<view class="management-item danger-item" @click="clearAllData">
				<view class="management-left">
					<text class="management-icon">🗑️</text>
					<text class="management-text">清空所有记录</text>
				</view>
				<text class="management-arrow">></text>
			</view>
		</view>
		
		<!-- 应用信息 -->
		<view class="app-info">
			<text class="info-title">关于应用</text>
			<view class="info-item">
				<text class="info-label">版本号：</text>
				<text class="info-value">1.0.0</text>
			</view>
			<view class="info-item">
				<text class="info-label">更新时间：</text>
				<text class="info-value">2025-09-02</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// 从category.vue移过来的默认分类数据
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
		
		methods: {
			// 跳转到智能记账聊天
			goToChat() {
				uni.navigateTo({
					url: '/pages/chat/chat'
				})
			},
			
			// 跳转到AI配置页面
			goToAIConfig() {
				uni.navigateTo({
					url: '/pages/ai-config/ai-config'
				})
			},
			
			goToIconManage() {
				// 跳转到图标管理页面
				uni.navigateTo({
					url: '/pages/icon-manage/icon-manage'
				})
			},
			
			refreshCategories() {
				// 刷新分类数据 - 重新加载默认分类
				uni.setStorageSync('expenseCategories', [...this.defaultExpenseCategories])
				uni.setStorageSync('incomeCategories', [...this.defaultIncomeCategories])
				
				uni.showToast({
					title: '分类已刷新',
					icon: 'success',
					duration: 500
				})
			},
			
			clearAllData() {
				uni.showModal({
					title: '确认清空',
					content: '此操作将清空所有记账记录，且不可恢复。确定要继续吗？',
					confirmColor: '#FF6B6B',
					success: (res) => {
						if (res.confirm) {
							uni.removeStorageSync('records')
							uni.showToast({
								title: '数据已清空',
								icon: 'success'
							})
						}
					}
				})
			},
			
			importData() {
				// 检查平台支持
				// #ifdef APP-PLUS
				if (typeof plus === 'undefined') {
					uni.showToast({
						title: '当前环境不支持文件系统访问',
						icon: 'none'
					})
					return
				}
				
				uni.showActionSheet({
					itemList: ['从下载目录导入', '从文档目录导入', '手动输入路径', '从剪切板导入'],
					success: (res) => {
						if (res.tapIndex === 0) {
							this.selectFromDownloads()
						} else if (res.tapIndex === 1) {
							this.selectFromDocuments()
						} else if (res.tapIndex === 2) {
							this.manualInputPath()
						} else if (res.tapIndex === 3) {
							this.importFromClipboard()
						}
					}
				})
				// #endif
				
				// #ifndef APP-PLUS
				uni.showActionSheet({
					itemList: ['从剪切板导入'],
					success: (res) => {
						if (res.tapIndex === 0) {
							this.importFromClipboard()
						}
					}
				})
				// #endif
			},
			
			showCsvImportDialog() {
				console.log('=== 显示CSV数据输入对话框 ===')
				// 使用 prompt 来获取用户输入的CSV数据
				uni.showModal({
					title: '粘贴CSV数据',
					content: '请将CSV数据粘贴到下方：\n格式：时间,类型,分类,金额,备注\n\n示例：\n"2024-01-01 12:00","支出","餐饮","25.50","午餐"',
					editable: true,
					placeholderText: '请粘贴CSV数据...',
					confirmText: '导入',
					success: (res) => {
						console.log('CSV输入对话框结果:', res)
						if (res.confirm && res.content && res.content.trim()) {
							console.log('用户输入CSV数据长度:', res.content.trim().length)
							console.log('CSV数据内容预览:', res.content.trim().substring(0, 200) + (res.content.trim().length > 200 ? '...' : ''))
							this.parseCsvData(res.content.trim())
						} else if (res.confirm) {
							console.log('用户确认但未输入数据')
							uni.showToast({
								title: '请输入数据',
								icon: 'none'
							})
						} else {
							console.log('用户取消CSV数据输入')
						}
					}
				})
			},
			
			importFromClipboard() {
				console.log('=== 开始从剪切板导入 ===')
				
				// #ifdef H5
				// 浏览器环境使用现代Clipboard API
				if (navigator.clipboard && window.isSecureContext) {
					console.log('使用现代Clipboard API读取')
					navigator.clipboard.readText().then(clipboardData => {
						console.log('现代Clipboard API读取成功')
						this.processClipboardData(clipboardData)
					}).catch(err => {
						console.error('现代Clipboard API读取失败:', err)
						this.showManualPasteDialog()
					})
				} else {
					console.log('现代Clipboard API不可用，显示手动粘贴对话框')
					this.showManualPasteDialog()
				}
				// #endif
				
				// #ifndef H5
				// 非浏览器环境使用uni-app API
				uni.getClipboardData({
					success: (res) => {
						console.log('uni-app剪切板读取成功:', res)
						this.processClipboardData(res.data)
					},
					fail: (err) => {
						console.error('uni-app读取剪切板失败:', err)
						uni.showModal({
							title: '读取失败',
							content: '无法读取剪切板内容，请检查权限设置或手动粘贴数据。',
							showCancel: true,
							confirmText: '手动输入',
							cancelText: '取消',
							success: (modalRes) => {
								if (modalRes.confirm) {
									this.showCsvImportDialog()
								}
							}
						})
					}
				})
				// #endif
			},
			
			processClipboardData(clipboardData) {
				console.log('=== 处理剪切板数据 ===')
				console.log('剪切板数据类型:', typeof clipboardData)
				console.log('剪切板数据长度:', clipboardData ? clipboardData.length : 0)
				console.log('剪切板数据预览:', clipboardData ? clipboardData.substring(0, 200) + (clipboardData.length > 200 ? '...' : '') : '无内容')
				
				if (!clipboardData || !clipboardData.trim()) {
					uni.showModal({
						title: '剪切板为空',
						content: '剪切板中没有找到数据，请先复制CSV格式的数据到剪切板。\n\n格式：时间,类型,分类,金额,备注',
						showCancel: false,
						confirmText: '知道了'
					})
					return
				}
				
				// 检查数据格式
				const trimmedData = clipboardData.trim()
				if (!trimmedData.includes(',')) {
					uni.showModal({
						title: '数据格式错误',
						content: '剪切板中的数据不是CSV格式，请确保数据包含逗号分隔的字段。\n\n正确格式：\n时间,类型,分类,金额,备注',
						showCancel: false,
						confirmText: '知道了'
					})
					return
				}
				
				// 显示确认对话框
				const lines = trimmedData.split('\n').filter(line => line.trim())
				uni.showModal({
					title: '确认导入',
					content: `检测到剪切板中有${lines.length}行数据，是否导入？\n\n数据预览：\n${trimmedData.substring(0, 100)}${trimmedData.length > 100 ? '...' : ''}`,
					confirmText: '导入',
					cancelText: '取消',
					success: (modalRes) => {
						if (modalRes.confirm) {
							console.log('用户确认导入剪切板数据')
							this.parseCsvData(trimmedData)
						} else {
							console.log('用户取消导入剪切板数据')
						}
					}
				})
			},
			
			showManualPasteDialog() {
				console.log('=== 显示手动粘贴对话框 ===')
				uni.showModal({
					title: '手动粘贴数据',
					content: '无法自动读取剪切板，请手动粘贴CSV数据。点击确定后将显示输入框。\n\n格式：时间,类型,分类,金额,备注',
					showCancel: true,
					confirmText: '输入数据',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							this.showCsvImportDialog()
						}
					}
				})
			},
			
			exportToClipboard(csvContent, recordCount) {
				console.log('=== 开始导出到剪切板 ===')
				console.log('记录数量:', recordCount)
				console.log('CSV内容长度:', csvContent.length)
				console.log('CSV内容预览:', csvContent.substring(0, 200))
				
				// #ifdef H5
				// 浏览器环境使用现代Clipboard API
				if (navigator.clipboard && window.isSecureContext) {
					console.log('使用现代Clipboard API')
					navigator.clipboard.writeText(csvContent).then(() => {
						console.log('现代Clipboard API写入成功')
						uni.showModal({
							title: '导出成功',
							content: `已将${recordCount}条记录复制到剪切板\n\n您可以粘贴到任意文本编辑器中保存为CSV文件，或直接在其他应用中使用。`,
							showCancel: false,
							confirmText: '知道了'
						})
					}).catch(err => {
						console.error('现代Clipboard API失败:', err)
						this.fallbackCopyToClipboard(csvContent, recordCount)
					})
				} else {
					console.log('现代Clipboard API不可用，使用后备方案')
					this.fallbackCopyToClipboard(csvContent, recordCount)
				}
				// #endif
				
				// #ifndef H5
				// 非浏览器环境使用uni-app API
				uni.setClipboardData({
					data: csvContent,
					success: () => {
						console.log('uni-app剪切板写入成功')
						uni.showModal({
							title: '导出成功',
							content: `已将${recordCount}条记录复制到剪切板\n\n您可以粘贴到任意文本编辑器中保存为CSV文件，或直接在其他应用中使用。`,
							showCancel: false,
							confirmText: '知道了'
						})
					},
					fail: (err) => {
						console.error('uni-app剪切板写入失败:', err)
						uni.showModal({
							title: '导出失败',
							content: '无法将数据复制到剪切板，请检查权限设置。\n\n您可以尝试其他导出方式。',
							showCancel: false,
							confirmText: '知道了'
						})
					}
				})
				// #endif
			},
			
			fallbackCopyToClipboard(csvContent, recordCount) {
				console.log('=== 使用后备剪切板方案 ===')
				try {
					// 创建临时textarea元素
					const textArea = document.createElement('textarea')
					textArea.value = csvContent
					textArea.style.position = 'fixed'
					textArea.style.left = '-999999px'
					textArea.style.top = '-999999px'
					document.body.appendChild(textArea)
					textArea.focus()
					textArea.select()
					
					// 尝试复制
					const successful = document.execCommand('copy')
					document.body.removeChild(textArea)
					
					if (successful) {
						console.log('后备方案复制成功')
						uni.showModal({
							title: '导出成功',
							content: `已将${recordCount}条记录复制到剪切板\n\n您可以粘贴到任意文本编辑器中保存为CSV文件，或直接在其他应用中使用。`,
							showCancel: false,
							confirmText: '知道了'
						})
					} else {
						throw new Error('execCommand copy failed')
					}
				} catch (err) {
					console.error('后备方案也失败了:', err)
					// 最终后备方案：显示文本让用户手动复制
					this.showManualCopyDialog(csvContent, recordCount)
				}
			},
			
			showManualCopyDialog(csvContent, recordCount) {
				console.log('=== 显示手动复制对话框 ===')
				const previewContent = csvContent.length > 500 ? 
					csvContent.substring(0, 500) + '\n...(数据已截断，请复制完整内容)' : 
					csvContent
				
				uni.showModal({
					title: '请手动复制',
					content: `自动复制失败，请手动复制以下内容：\n\n${previewContent}`,
					showCancel: true,
					confirmText: '已复制',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							uni.showToast({
								title: '操作完成',
								icon: 'success'
							})
						}
					}
				})
			},
			
			parseCsvData(csvText) {
				console.log('=== 开始解析CSV数据 ===')
				console.log('输入数据类型:', typeof csvText)
				console.log('输入数据长度:', csvText ? csvText.length : 'undefined')
				
				try {
					// 检查输入数据
					if (!csvText || typeof csvText !== 'string') {
						console.error('数据检查失败: 数据为空或不是字符串类型')
						uni.showToast({
							title: '数据为空或格式错误',
							icon: 'none'
						})
						return
					}
					
					console.log('开始分割数据行...')
					const lines = csvText.split('\n').filter(line => line.trim())
					console.log('总行数:', lines.length, '有效行数:', lines.filter(line => line.trim()).length)
					
					if (lines.length === 0) {
						console.error('数据检查失败: 文件内容为空')
						uni.showToast({
							title: '文件内容为空',
							icon: 'none'
						})
						return
					}
					
					const records = []
					const existingRecords = uni.getStorageSync('records') || []
					console.log('现有记录数量:', existingRecords.length)
					
					// 跳过标题行（如果有的话）
					let startIndex = 0
					if (lines.length > 0 && lines[0]) {
						const firstLine = lines[0].toLowerCase()
						console.log('第一行内容:', lines[0])
						console.log('第一行小写:', firstLine)
						if (firstLine.includes('时间') && firstLine.includes('类型')) {
							startIndex = 1
							console.log('检测到标题行，从第二行开始解析')
						} else {
							console.log('未检测到标题行，从第一行开始解析')
						}
					}
					
					console.log('开始逐行解析数据，起始行:', startIndex)
					for (let i = startIndex; i < lines.length; i++) {
						const line = lines[i].trim()
						console.log(`处理第${i+1}行:`, line.substring(0, 100) + (line.length > 100 ? '...' : ''))
						
						if (!line) {
							console.log(`第${i+1}行为空，跳过`)
							continue
						}
						
						// 解析CSV行（处理带引号的字段）
						console.log(`开始解析第${i+1}行的CSV字段...`)
						const fields = this.parseCSVLine(line)
						console.log(`第${i+1}行解析得到${fields.length}个字段:`, fields)
						
						if (fields.length >= 4) {
							const timeStr = fields[0]
							const typeStr = fields[1]
							const categoryStr = fields[2]
							const amountStr = fields[3]
							const noteStr = fields[4] || ''
							
							console.log(`第${i+1}行字段详情:`, {
								time: timeStr,
								type: typeStr,
								category: categoryStr,
								amount: amountStr,
								note: noteStr
							})
							
							// 验证和转换数据
							console.log(`验证第${i+1}行数据类型...`)
							const type = typeStr === '支出' ? 'expense' : typeStr === '收入' ? 'income' : null
							if (!type) {
								console.log(`第${i+1}行类型无效:`, typeStr, '跳过此行')
								continue
							}
							console.log(`第${i+1}行类型验证通过:`, type)
							
							console.log(`解析第${i+1}行金额:`, amountStr)
							const amount = parseFloat(amountStr.replace(/[^\d.]/g, ''))
							if (isNaN(amount) || amount <= 0) {
								console.log(`第${i+1}行金额无效:`, amountStr, '=>', amount, '跳过此行')
								continue
							}
							console.log(`第${i+1}行金额验证通过:`, amount)
							
							// 查找对应的分类
							console.log(`查找第${i+1}行分类:`, categoryStr, type)
							const category = this.findCategoryByName(categoryStr, type)
							if (!category) {
								console.log(`第${i+1}行找不到对应分类:`, categoryStr, '跳过此行')
								continue
							}
							console.log(`第${i+1}行分类匹配成功:`, category)
							
							// 解析时间
							console.log(`解析第${i+1}行时间:`, timeStr)
							let time
							try {
								time = new Date(timeStr).toISOString()
								console.log(`第${i+1}行时间解析成功:`, time)
							} catch (e) {
								console.log(`第${i+1}行时间解析失败，使用当前时间:`, e.message)
								time = new Date().toISOString()
							}
							
							const record = {
								id: Date.now().toString() + '_import_' + i,
								type: type,
								amount: amount.toFixed(2),
								categoryId: category.id,
								categoryName: category.name,
								categoryIcon: category.icon,
								note: noteStr,
								time: time
							}
							
							console.log(`第${i+1}行记录创建成功:`, record)
							records.push(record)
						} else {
							console.log(`第${i+1}行字段数量不足(${fields.length}/4)，跳过此行`)
						}
					}
					
					console.log('数据解析完成，有效记录数:', records.length)
					
					if (records.length > 0) {
						// 合并到现有数据
						console.log('开始合并数据到本地存储...')
						const allRecords = [...existingRecords, ...records]
						console.log('合并后总记录数:', allRecords.length)
						
						uni.setStorageSync('records', allRecords)
						console.log('数据保存成功')
						
						uni.showModal({
							title: '导入成功',
							content: `成功导入 ${records.length} 条记录！`,
							showCancel: false
						})
						console.log('=== CSV导入流程完成 ===')
					} else {
						console.log('没有有效数据可导入')
						uni.showToast({
							title: '没有有效数据可导入',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('=== CSV解析出现异常 ===')
					console.error('错误类型:', error.name)
					console.error('错误信息:', error.message)
					console.error('错误堆栈:', error.stack)
					console.error('输入数据:', csvText)
					
					uni.showModal({
						title: '数据格式错误',
						content: '请检查CSV数据格式是否正确\n\n正确格式：\n时间,类型,分类,金额,备注\n\n示例：\n"2024-01-01 12:00","支出","餐饮","25.50","午餐"',
						showCancel: false,
						confirmText: '知道了'
					})
				}
			},
			
			importFromFile() {
				console.log('=== 开始文件导入流程 ===')
				console.log('检测当前平台...')
				
				// 运行时平台检测
				console.log('运行时环境信息:')
				console.log('- uni 对象存在:', typeof uni !== 'undefined')
				console.log('- wx 对象存在:', typeof wx !== 'undefined')
				console.log('- plus 对象存在:', typeof plus !== 'undefined')
				console.log('- document 对象存在:', typeof document !== 'undefined')
				console.log('- window 对象存在:', typeof window !== 'undefined')
				
				// uni-app 平台信息
				if (typeof uni !== 'undefined' && uni.getSystemInfoSync) {
					try {
						const systemInfo = uni.getSystemInfoSync()
						console.log('系统信息:', systemInfo)
						console.log('平台:', systemInfo.platform)
						console.log('系统:', systemInfo.system)
						console.log('品牌:', systemInfo.brand)
						console.log('型号:', systemInfo.model)
					} catch (e) {
						console.log('获取系统信息失败:', e)
					}
				}
				
				// 检查平台和API支持
				// #ifdef H5
				console.log('编译平台: H5，使用文件选择器')
				// H5平台使用input file
				this.importFromFileH5()
				// #endif
				
				// #ifdef APP-PLUS
				console.log('编译平台: APP-PLUS，使用plus.io')
				// App平台使用plus.io
				this.importFromFileApp()
				// #endif
				
				// #ifdef MP-WEIXIN
				console.log('编译平台: 微信小程序，使用wx.chooseMessageFile')
				// 微信小程序平台的处理
				this.importFromFileWx()
				// #endif
				
				// #ifdef MP && !MP-WEIXIN
				console.log('编译平台: 其他小程序，降级处理')
				// 其他小程序平台处理
				this.fallbackImport()
				// #endif
				
				// #ifndef H5 || APP-PLUS || MP
				console.log('编译平台: 未知平台，降级处理')
				// 其他平台降级处理
				this.fallbackImport()
				// #endif
			},
			
			importFromFileWx() {
				console.log('=== 微信小程序文件选择流程 ===')
				// 微信小程序选择文件
				wx.chooseMessageFile({
					count: 1,
					type: 'file',
					success: (res) => {
						console.log('文件选择成功:', res)
						const file = res.tempFiles[0]
						console.log('选择的文件:', file)
						console.log('文件名:', file.name)
						console.log('文件大小:', file.size)
						console.log('文件路径:', file.path)
						
						if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
							console.log('文件类型检查失败:', file.name)
							uni.showToast({
								title: '请选择CSV或TXT文件',
								icon: 'none'
							})
							return
						}
						console.log('文件类型检查通过')
						
						console.log('开始读取文件内容...')
						const fs = wx.getFileSystemManager()
						
						if (!fs) {
							console.error('无法获取文件系统管理器')
							uni.showToast({
								title: '文件系统不可用',
								icon: 'error'
							})
							return
						}
						
						console.log('文件系统管理器获取成功，开始读取文件:', file.path)
						
						fs.readFile({
							filePath: file.path,
							encoding: 'utf8',
							success: (fileRes) => {
								console.log('文件读取成功！')
								console.log('读取结果:', fileRes)
								console.log('数据类型:', typeof fileRes.data)
								console.log('数据长度:', fileRes.data ? fileRes.data.length : 'undefined')
								console.log('文件内容预览:', fileRes.data ? fileRes.data.substring(0, 200) + (fileRes.data.length > 200 ? '...' : '') : '无内容')
								
								if (!fileRes.data) {
									console.error('读取到的文件内容为空')
									uni.showToast({
										title: '文件内容为空',
										icon: 'error'
									})
									return
								}
								
								if (typeof fileRes.data !== 'string') {
									console.error('读取到的内容不是字符串类型:', typeof fileRes.data)
									uni.showToast({
										title: '文件格式错误',
										icon: 'error'
									})
									return
								}
								
								console.log('文件内容有效，开始解析CSV...')
								this.parseCsvData(fileRes.data)
							},
							fail: (err) => {
								console.error('读取文件失败:', err)
								console.error('错误对象完整信息:', JSON.stringify(err, null, 2))
								console.error('错误消息:', err.errMsg || err.message || '未知错误')
								console.error('错误代码:', err.errCode || err.code || '无代码')
								
								uni.showToast({
									title: '读取文件失败: ' + (err.errMsg || err.message || '未知错误'),
									icon: 'error'
								})
							}
						})
					},
					fail: (err) => {
						console.log('文件选择失败:', err)
						// 检查是否是用户取消操作
						if (err.errMsg && err.errMsg.includes('cancel')) {
							console.log('用户取消文件选择(通过errMsg检测)')
							// 用户取消选择，不显示错误提示
							return
						}
						if (err.code === 12 || (err.message && err.message.includes('cancelled'))) {
							console.log('用户取消文件选择(通过code/message检测)')
							// 用户取消选择，不显示错误提示
							return
						}
						// 其他错误才提示降级
						console.log('文件选择出现其他错误，启动降级方案')
						this.fallbackImport()
					}
				})
			},
			
			importFromFileApp() {
				// App平台使用文档选择器
				if (typeof plus !== 'undefined') {
					// 使用文档选择器
					plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
						// 直接调用系统文件选择器
						plus.gallery.pick((path) => {
							// 这里可能需要特殊处理，因为gallery主要用于图片
							// 改用更通用的方法
							this.showFilePickerApp()
						}, (err) => {
							console.error('选择文件失败:', err)
							this.showFilePickerApp()
						}, {
							filter: "file"
						})
					})
				} else {
					this.fallbackImport()
				}
			},
			
			showFilePickerApp() {
				// App平台的文件选择实现
				if (typeof plus !== 'undefined') {
					// 显示选择方式
					uni.showActionSheet({
						itemList: ['从下载目录选择', '从文档目录选择', '手动输入路径'],
						success: (res) => {
							if (res.tapIndex === 0) {
								this.selectFromDownloads()
							} else if (res.tapIndex === 1) {
								this.selectFromDocuments()
							} else if (res.tapIndex === 2) {
								this.manualInputPath()
							}
						}
					})
				} else {
					this.fallbackImport()
				}
			},
			
			selectFromDownloads() {
				plus.io.requestFileSystem(plus.io.PUBLIC_DOWNLOADS, (fs) => {
					fs.root.createReader().readEntries((entries) => {
						const csvFiles = entries.filter(entry => 
							entry.name.toLowerCase().endsWith('.csv') || 
							entry.name.toLowerCase().endsWith('.txt')
						)
						
						if (csvFiles.length === 0) {
							uni.showToast({
								title: '下载目录中没有找到CSV文件',
								icon: 'none'
							})
							return
						}
						
						// 显示文件选择列表
						const fileNames = csvFiles.map(file => file.name)
						uni.showActionSheet({
							itemList: fileNames,
							success: (res) => {
								const selectedFile = csvFiles[res.tapIndex]
								this.readFileContent(selectedFile)
							}
						})
					})
				}, (err) => {
					console.error('访问下载目录失败:', err)
					this.fallbackImport()
				})
			},
			
			selectFromDocuments() {
				plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
					fs.root.createReader().readEntries((entries) => {
						const csvFiles = entries.filter(entry => 
							entry.name.toLowerCase().endsWith('.csv') || 
							entry.name.toLowerCase().endsWith('.txt')
						)
						
						if (csvFiles.length === 0) {
							uni.showToast({
								title: '文档目录中没有找到CSV文件',
								icon: 'none'
							})
							return
						}
						
						// 显示文件选择列表
						const fileNames = csvFiles.map(file => file.name)
						uni.showActionSheet({
							itemList: fileNames,
							success: (res) => {
								const selectedFile = csvFiles[res.tapIndex]
								this.readFileContent(selectedFile)
							}
						})
					})
				}, (err) => {
					console.error('访问文档目录失败:', err)
					this.fallbackImport()
				})
			},
			
			manualInputPath() {
				uni.showModal({
					title: '输入文件路径',
					content: '请输入CSV文件的完整路径：',
					editable: true,
					placeholderText: '/storage/emulated/0/Download/data.csv',
					success: (res) => {
						if (res.confirm && res.content && res.content.trim()) {
							this.readFileFromPath(res.content.trim())
						}
					}
				})
			},
			
			readFileFromPath(filePath) {
				plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
					this.readFileContent(entry)
				}, (err) => {
					console.error('文件路径错误:', err)
					uni.showToast({
						title: '文件不存在或路径错误',
						icon: 'none'
					})
				})
			},
			
			readFileContent(fileEntry) {
				fileEntry.file((file) => {
					const reader = new plus.io.FileReader()
					reader.onload = (e) => {
						this.parseCsvData(e.target.result)
					}
					reader.onerror = (err) => {
						console.error('读取文件失败:', err)
						uni.showToast({
							title: '读取文件失败',
							icon: 'none'
						})
					}
					reader.readAsText(file, 'UTF-8')
				}, (err) => {
					console.error('获取文件内容失败:', err)
					uni.showToast({
						title: '获取文件内容失败',
						icon: 'none'
					})
				})
			},
			
			fallbackImport() {
				uni.showModal({
					title: '导入提示',
					content: '当前环境不支持文件选择，请使用"粘贴CSV数据导入"功能',
					showCancel: false,
					success: () => {
						this.showCsvImportDialog()
					}
				})
			},
			
			importFromFileH5() {
				console.log('=== H5平台文件选择流程 ===')
				// H5平台的文件选择实现
				const input = document.createElement('input')
				input.type = 'file'
				input.accept = '.csv,.txt'
				input.style.display = 'none'
				console.log('创建文件选择元素:', input)
				
				input.onchange = (event) => {
					console.log('=== H5文件选择change事件触发 ===')
					console.log('事件对象:', event)
					console.log('target:', event.target)
					console.log('files:', event.target.files)
					console.log('files长度:', event.target.files ? event.target.files.length : 0)
					
					const file = event.target.files[0]
					console.log('选择的文件对象:', file)
					
					if (!file) {
						console.log('未选择文件或文件为空')
						uni.showToast({
							title: '未选择文件',
							icon: 'none'
						})
						return
					}
					
					console.log('文件基本信息:', {
						name: file.name,
						size: file.size,
						type: file.type,
						lastModified: file.lastModified,
						lastModifiedDate: file.lastModifiedDate
					})
					
					// 检查文件大小
					if (file.size === 0) {
						console.error('文件大小为0')
						uni.showToast({
							title: '文件为空',
							icon: 'error'
						})
						return
					}
					
					if (file.size > 5 * 1024 * 1024) { // 5MB限制
						console.error('文件过大:', file.size)
						uni.showToast({
							title: '文件不能超过5MB',
							icon: 'error'
						})
						return
					}
					
					console.log('文件大小检查通过，开始读取文件内容...')
					const reader = new FileReader()
					
					reader.onload = (e) => {
						console.log('=== FileReader读取完成 ===')
						console.log('读取事件:', e)
						console.log('读取目标:', e.target)
						console.log('读取状态:', e.target.readyState)
						
						const content = e.target.result
						console.log('读取结果类型:', typeof content)
						console.log('内容是否为null:', content === null)
						console.log('内容是否为undefined:', content === undefined)
						
						if (!content) {
							console.error('读取到的内容为空')
							uni.showToast({
								title: '文件内容为空',
								icon: 'error'
							})
							return
						}
						
						if (typeof content !== 'string') {
							console.error('读取到的内容不是字符串:', typeof content)
							uni.showToast({
								title: '文件格式错误',
								icon: 'error'
							})
							return
						}
						
						console.log('文件读取成功！')
						console.log('内容长度:', content.length)
						console.log('内容预览:', content.substring(0, 200) + (content.length > 200 ? '...' : ''))
						console.log('开始解析CSV数据...')
						
						this.parseCsvData(content)
					}
					
					reader.onerror = (e) => {
						console.error('=== FileReader读取失败 ===')
						console.error('错误事件:', e)
						console.error('错误目标:', e.target)
						console.error('错误状态:', e.target.readyState)
						console.error('错误详情:', e.target.error)
						
						uni.showToast({
							title: '读取文件失败: ' + (e.target.error ? e.target.error.message : '未知错误'),
							icon: 'error'
						})
					}
					
					reader.onabort = (e) => {
						console.log('=== FileReader读取被中止 ===')
						console.log('中止事件:', e)
						uni.showToast({
							title: '文件读取被中止',
							icon: 'none'
						})
					}
					
					console.log('开始FileReader.readAsText操作...')
					reader.readAsText(file, 'UTF-8')
					
					// 清理DOM元素
					console.log('清理文件选择元素')
					document.body.removeChild(input)
				}
				
				// 用户取消选择文件时的处理
				input.oncancel = () => {
					console.log('文件选择cancel事件触发')
					document.body.removeChild(input)
				}
				
				// 监听窗口焦点变化来检测用户是否取消了文件选择
				let timeoutId = null
				const handleFocus = () => {
					console.log('窗口获得焦点，检查文件选择状态')
					// 延迟检查，给文件选择一些时间
					timeoutId = setTimeout(() => {
						if (input.files.length === 0) {
							console.log('用户可能取消了文件选择，清理DOM')
							// 用户可能取消了选择，清理DOM
							try {
								document.body.removeChild(input)
							} catch (e) {
								console.log('DOM元素已被移除')
								// DOM元素可能已经被移除
							}
						}
						window.removeEventListener('focus', handleFocus)
					}, 100)
				}
				
				window.addEventListener('focus', handleFocus)
				
				console.log('添加文件选择元素到DOM并触发点击')
				document.body.appendChild(input)
				input.click()
			},
			
			parseCSVLine(line) {
				console.log('开始解析CSV行:', line)
				// 防止空行或undefined
				if (!line || typeof line !== 'string') {
					console.log('CSV行无效，返回空数组')
					return []
				}
				
				const result = []
				let current = ''
				let inQuotes = false
				let i = 0
				
				console.log('开始逐字符解析，总长度:', line.length)
				while (i < line.length) {
					const char = line[i]
					
					if (char === '"') {
						inQuotes = !inQuotes
						console.log(`字符${i}: 引号，inQuotes=${inQuotes}`)
					} else if (char === ',' && !inQuotes) {
						result.push(current.trim())
						console.log(`字符${i}: 逗号(非引号内)，添加字段: "${current.trim()}"`)
						current = ''
					} else {
						current += char
					}
					i++
				}
				
				result.push(current.trim())
				console.log(`解析完成，最后添加字段: "${current.trim()}"`)
				
				// 移除引号
				const finalResult = result.map(field => field.replace(/^"|"$/g, ''))
				console.log('移除引号后的最终结果:', finalResult)
				return finalResult
			},
			
			findCategoryByName(categoryName, type) {
				console.log('查找分类:', categoryName, '类型:', type)
				// 从存储中加载分类数据
				const expenseCategories = uni.getStorageSync('expenseCategories') || this.defaultExpenseCategories
				const incomeCategories = uni.getStorageSync('incomeCategories') || this.defaultIncomeCategories
				const categories = type === 'expense' ? expenseCategories : incomeCategories
				
				console.log('可用分类列表:', categories.map(cat => cat.name))
				
				// 精确匹配
				let category = categories.find(cat => cat.name === categoryName)
				if (category) {
					console.log('精确匹配成功:', category)
					return category
				}
				
				// 找不到则使用"其他"
				category = categories.find(cat => cat.name === '其他')
				console.log('使用默认分类"其他":', category)
				return category
			},
			
			createSampleData() {
				console.log('=== 开始创建示例数据 ===')
				const existingRecords = uni.getStorageSync('records') || []
				console.log('当前已有记录数:', existingRecords.length)
				
				// 创建一些示例数据
				const sampleData = [
					{
						id: Date.now().toString() + '_sample1',
						type: 'expense',
						amount: '35.80',
						categoryId: 1,
						categoryName: '餐饮',
						categoryIcon: '🍽️',
						note: '午餐 - 示例数据',
						time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
					},
					{
						id: Date.now().toString() + '_sample2',
						type: 'expense',
						amount: '12.00',
						categoryId: 2,
						categoryName: '交通',
						categoryIcon: '🚗',
						note: '地铁费 - 示例数据',
						time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
					},
					{
						id: Date.now().toString() + '_sample3',
						type: 'expense',
						amount: '199.00',
						categoryId: 3,
						categoryName: '购物',
						categoryIcon: '🛍️',
						note: '买衣服 - 示例数据',
						time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
					},
					{
						id: Date.now().toString() + '_sample4',
						type: 'income',
						amount: '3000.00',
						categoryId: 11,
						categoryName: '工资',
						categoryIcon: '💰',
						note: '部分工资 - 示例数据',
						time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
					},
					{
						id: Date.now().toString() + '_sample5',
						type: 'expense',
						amount: '88.50',
						categoryId: 4,
						categoryName: '娱乐',
						categoryIcon: '🎬',
						note: '电影票 - 示例数据',
						time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
					},
					{
						id: Date.now().toString() + '_sample6',
						type: 'income',
						amount: '200.00',
						categoryId: 15,
						categoryName: '红包',
						categoryIcon: '🧧',
						note: '生日红包 - 示例数据',
						time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
					}
				]
				
				console.log('创建的示例数据:', sampleData)
				
				// 合并数据
				const allRecords = [...existingRecords, ...sampleData]
				console.log('合并后总记录数:', allRecords.length)
				
				uni.setStorageSync('records', allRecords)
				console.log('示例数据保存成功')
				
				uni.showToast({
					title: `成功导入${sampleData.length}条示例数据`,
					icon: 'success',
					duration: 2000
				})
				console.log('=== 示例数据创建流程完成 ===')
			},
			
			exportData() {
				const records = uni.getStorageSync('records') || []
				if (records.length === 0) {
					uni.showToast({
						title: '暂无数据可导出',
						icon: 'none'
					})
					return
				}
				
				// 格式化数据为CSV格式（所有平台都需要）
				let csvContent = '时间,类型,分类,金额,备注\n'
				records.forEach(record => {
					const time = new Date(record.time).toLocaleString('zh-CN')
					const type = record.type === 'expense' ? '支出' : '收入'
					const category = record.categoryName
					const amount = record.amount
					const note = record.note || ''
					csvContent += `"${time}","${type}","${category}","${amount}","${note}"\n`
				})
				
				// 检查平台支持
				// #ifdef APP-PLUS
				if (typeof plus === 'undefined') {
					uni.showToast({
						title: '当前环境不支持文件系统访问',
						icon: 'none'
					})
					return
				}
				
				// 显示选择导出方式
				uni.showActionSheet({
					itemList: ['保存到下载目录', '保存到文档目录', '手动输入路径', '复制到剪切板'],
					success: (res) => {
						const now = new Date()
						const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
						const fileName = `记账数据_${dateStr}.csv`
						
						if (res.tapIndex === 0) {
							this.saveToDownloads(csvContent, records.length, fileName)
						} else if (res.tapIndex === 1) {
							this.saveToDocuments(csvContent, records.length, fileName)
						} else if (res.tapIndex === 2) {
							this.saveToCustomLocation(csvContent, records.length, fileName)
						} else if (res.tapIndex === 3) {
							this.exportToClipboard(csvContent, records.length)
						}
					}
				})
				// #endif
				
				// #ifndef APP-PLUS
				uni.showActionSheet({
					itemList: ['复制到剪切板'],
					success: (res) => {
						if (res.tapIndex === 0) {
							this.exportToClipboard(csvContent, records.length)
						}
					}
				})
				// #endif
			},
			
			saveToFile(csvContent, recordCount) {
				// 生成文件名（包含当前日期）
				const now = new Date()
				const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
				const fileName = `记账数据_${dateStr}.csv`
				
				// #ifdef H5
				// H5平台直接下载
				this.downloadFileH5(csvContent, fileName, recordCount)
				// #endif
				
				// #ifdef APP-PLUS
				// App平台选择保存位置
				this.selectSaveLocationApp(csvContent, recordCount, fileName)
				// #endif
				
				// #ifdef MP-WEIXIN
				// 微信小程序保存到相册或分享
				this.saveFileWx(csvContent, recordCount, fileName)
				// #endif
				
				// #ifdef MP && !MP-WEIXIN
				// 其他小程序平台
				this.fallbackExport(csvContent, recordCount)
				// #endif
				
				// #ifndef H5 || APP-PLUS || MP
				// 其他平台降级到复制
				this.fallbackExport(csvContent, recordCount)
				// #endif
			},
			
			selectSaveLocationApp(csvContent, recordCount, fileName) {
				// App平台选择保存位置
				if (typeof plus !== 'undefined') {
					uni.showActionSheet({
						itemList: ['保存到下载目录', '保存到文档目录', '选择自定义目录'],
						success: (res) => {
							if (res.tapIndex === 0) {
								this.saveToDownloads(csvContent, recordCount, fileName)
							} else if (res.tapIndex === 1) {
								this.saveToDocuments(csvContent, recordCount, fileName)
							} else if (res.tapIndex === 2) {
								this.saveToCustomLocation(csvContent, recordCount, fileName)
							}
						}
					})
				} else {
					this.fallbackExport(csvContent, recordCount)
				}
			},
			
			saveToDownloads(csvContent, recordCount, fileName) {
				console.log('=== 开始保存到下载目录 ===')
				console.log('文件名:', fileName)
				console.log('记录数量:', recordCount)
				console.log('CSV内容长度:', csvContent.length)
				console.log('CSV内容预览:', csvContent.substring(0, 200))
				
				plus.io.requestFileSystem(plus.io.PUBLIC_DOWNLOADS, (fs) => {
					console.log('获取下载目录文件系统成功')
					fs.root.getFile(fileName, {create: true}, (fileEntry) => {
						console.log('创建文件成功:', fileEntry.fullPath)
						fileEntry.createWriter((writer) => {
							console.log('创建写入器成功')
							
							writer.onwrite = (e) => {
								console.log('文件写入完成事件:', e)
								console.log('写入器位置:', writer.position)
								console.log('写入器长度:', writer.length)
								uni.showModal({
									title: '导出成功',
									content: `文件已保存到下载目录：\n${fileName}\n\n共${recordCount}条记录\n文件大小：${writer.length}字节`,
									showCancel: false,
									confirmText: '知道了'
								})
							}
							
							writer.onerror = (err) => {
								console.error('写入失败:', err)
								uni.showToast({
									title: '文件写入失败',
									icon: 'error'
								})
							}
							
							writer.onwriteend = () => {
								console.log('写入结束，最终文件大小:', writer.length)
							}
							
							// 创建带BOM的UTF-8 CSV内容
							const bom = '\ufeff'
							const fullContent = bom + csvContent
							console.log('完整内容长度(含BOM):', fullContent.length)
							
							// 写入数据
							console.log('开始写入数据...')
							writer.write(fullContent)
						}, (err) => {
							console.error('创建写入器失败:', err)
							uni.showToast({
								title: '创建写入器失败',
								icon: 'error'
							})
						})
					}, (err) => {
						console.error('创建文件失败:', err)
						uni.showToast({
							title: '创建文件失败',
							icon: 'error'
						})
					})
				}, (err) => {
					console.error('获取下载目录失败:', err)
					uni.showToast({
						title: '获取下载目录失败',
						icon: 'error'
					})
				})
			},
			
			saveToDocuments(csvContent, recordCount, fileName) {
				console.log('=== 开始保存到文档目录 ===')
				console.log('文件名:', fileName)
				console.log('记录数量:', recordCount)
				console.log('CSV内容长度:', csvContent.length)
				console.log('CSV内容预览:', csvContent.substring(0, 200))
				
				plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
					console.log('获取文档目录文件系统成功')
					fs.root.getFile(fileName, {create: true}, (fileEntry) => {
						console.log('创建文件成功:', fileEntry.fullPath)
						fileEntry.createWriter((writer) => {
							console.log('创建写入器成功')
							
							writer.onwrite = (e) => {
								console.log('文件写入完成事件:', e)
								console.log('写入器位置:', writer.position)
								console.log('写入器长度:', writer.length)
								uni.showModal({
									title: '导出成功',
									content: `文件已保存到应用文档目录：\n${fileName}\n\n共${recordCount}条记录\n文件大小：${writer.length}字节`,
									showCancel: false,
									confirmText: '知道了'
								})
							}
							
							writer.onerror = (err) => {
								console.error('写入失败:', err)
								uni.showToast({
									title: '文件写入失败',
									icon: 'error'
								})
							}
							
							writer.onwriteend = () => {
								console.log('写入结束，最终文件大小:', writer.length)
							}
							
							// 创建带BOM的UTF-8 CSV内容
							const bom = '\ufeff'
							const fullContent = bom + csvContent
							console.log('完整内容长度(含BOM):', fullContent.length)
							
							// 写入数据
							console.log('开始写入数据...')
							writer.write(fullContent)
						}, (err) => {
							console.error('创建写入器失败:', err)
							uni.showToast({
								title: '创建写入器失败',
								icon: 'error'
							})
						})
					}, (err) => {
						console.error('创建文件失败:', err)
						uni.showToast({
							title: '创建文件失败',
							icon: 'error'
						})
					})
				}, (err) => {
					console.error('获取文档目录失败:', err)
					uni.showToast({
						title: '获取文档目录失败',
						icon: 'error'
					})
				})
			},
			
			saveToCustomLocation(csvContent, recordCount, fileName) {
				uni.showModal({
					title: '自定义保存路径',
					content: '请输入保存路径（不包含文件名）：',
					editable: true,
					placeholderText: '/storage/emulated/0/Documents',
					success: (res) => {
						if (res.confirm && res.content && res.content.trim()) {
							const customPath = res.content.trim()
							this.saveToCustomPath(csvContent, recordCount, fileName, customPath)
						}
					}
				})
			},
			
			saveToCustomPath(csvContent, recordCount, fileName, customPath) {
				console.log('=== 开始保存到自定义路径 ===')
				console.log('自定义路径:', customPath)
				console.log('文件名:', fileName)
				console.log('记录数量:', recordCount)
				console.log('CSV内容长度:', csvContent.length)
				console.log('CSV内容预览:', csvContent.substring(0, 200))
				
				plus.io.resolveLocalFileSystemURL(customPath, (dirEntry) => {
					console.log('解析自定义路径成功:', dirEntry.fullPath)
					dirEntry.getFile(fileName, {create: true}, (fileEntry) => {
						console.log('创建文件成功:', fileEntry.fullPath)
						fileEntry.createWriter((writer) => {
							console.log('创建写入器成功')
							
							writer.onwrite = (e) => {
								console.log('文件写入完成事件:', e)
								console.log('写入器位置:', writer.position)
								console.log('写入器长度:', writer.length)
								uni.showModal({
									title: '导出成功',
									content: `文件已保存到：\n${customPath}/${fileName}\n\n共${recordCount}条记录\n文件大小：${writer.length}字节`,
									showCancel: false,
									confirmText: '知道了'
								})
							}
							
							writer.onerror = (err) => {
								console.error('写入失败:', err)
								uni.showToast({
									title: '文件写入失败',
									icon: 'error'
								})
							}
							
							writer.onwriteend = () => {
								console.log('写入结束，最终文件大小:', writer.length)
							}
							
							// 创建带BOM的UTF-8 CSV内容
							const bom = '\ufeff'
							const fullContent = bom + csvContent
							console.log('完整内容长度(含BOM):', fullContent.length)
							
							// 写入数据
							console.log('开始写入数据...')
							writer.write(fullContent)
						}, (err) => {
							console.error('创建写入器失败:', err)
							uni.showToast({
								title: '创建写入器失败',
								icon: 'error'
							})
						})
					}, (err) => {
						console.error('创建文件失败:', err)
						uni.showToast({
							title: '保存失败，请检查路径权限',
							icon: 'none'
						})
					})
				}, (err) => {
					console.error('路径不存在:', err)
					uni.showToast({
						title: '路径不存在或无权限',
						icon: 'none'
					})
				})
			},
			
			saveFileWx(csvContent, recordCount, fileName) {
				// 微信小程序保存文件
				const fs = wx.getFileSystemManager()
				const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
				
				fs.writeFile({
					filePath: filePath,
					data: csvContent,
					encoding: 'utf8',
					success: () => {
						uni.showActionSheet({
							itemList: ['分享文件', '保存到相册', '显示路径'],
							success: (res) => {
								if (res.tapIndex === 0) {
									this.shareFileWx(filePath, fileName, recordCount)
								} else if (res.tapIndex === 1) {
									this.saveToPhotosWx(csvContent, fileName, recordCount)
								} else if (res.tapIndex === 2) {
									uni.showModal({
										title: '导出成功',
										content: `文件已保存：\n${filePath}\n\n共${recordCount}条记录`,
										showCancel: false,
										confirmText: '知道了'
									})
								}
							}
						})
					},
					fail: (err) => {
						console.error('保存失败:', err)
						this.fallbackExport(csvContent, recordCount)
					}
				})
			},
			
			shareFileWx(filePath, fileName, recordCount) {
				wx.shareFileMessage({
					filePath: filePath,
					fileName: fileName,
					success: () => {
						uni.showToast({
							title: '分享成功',
							icon: 'success'
						})
					},
					fail: (err) => {
						console.error('分享失败:', err)
						uni.showModal({
							title: '导出成功',
							content: `文件已保存，但分享失败\n路径：${filePath}\n\n共${recordCount}条记录`,
							showCancel: false,
							confirmText: '知道了'
						})
					}
				})
			},
			
			saveToPhotosWx(csvContent, fileName, recordCount) {
				// 将CSV内容转换为图片保存到相册（作为备选方案）
				uni.showModal({
					title: '提示',
					content: '小程序无法直接保存CSV文件到相册，建议使用分享功能或复制到剪贴板',
					showCancel: true,
					confirmText: '复制内容',
					success: (res) => {
						if (res.confirm) {
							this.fallbackExport(csvContent, recordCount)
						}
					}
				})
			},
			
			downloadDataFile(csvContent, recordCount) {
				// 生成文件名（包含当前日期）
				const now = new Date()
				const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
				const fileName = `记账数据_${dateStr}.csv`
				
				// #ifdef H5
				// H5平台使用blob下载
				this.downloadFileH5(csvContent, fileName, recordCount)
				// #endif
				
				// #ifdef APP-PLUS
				// App平台使用plus.io
				this.saveDataToFileApp(csvContent, recordCount, fileName)
				// #endif
				
				// #ifdef MP
				// 小程序平台处理
				this.saveDataToFileMp(csvContent, recordCount, fileName)
				// #endif
				
				// #ifndef H5 || APP-PLUS || MP
				// 其他平台降级到复制
				this.fallbackExport(csvContent, recordCount)
				// #endif
			},
			
			downloadFileH5(csvContent, fileName, recordCount) {
				try {
					// 创建Blob对象
					const blob = new Blob(['\ufeff' + csvContent], { 
						type: 'text/csv;charset=utf-8' 
					})
					
					// 创建下载链接
					const url = window.URL.createObjectURL(blob)
					const link = document.createElement('a')
					link.href = url
					link.download = fileName
					link.style.display = 'none'
					
					// 触发下载
					document.body.appendChild(link)
					link.click()
					
					// 清理
					setTimeout(() => {
						document.body.removeChild(link)
						window.URL.revokeObjectURL(url)
					}, 100)
					
					uni.showToast({
						title: `成功导出${recordCount}条记录`,
						icon: 'success'
					})
				} catch (error) {
					console.error('下载失败:', error)
					// 降级到复制
					uni.setClipboardData({
						data: csvContent,
						success: () => {
							uni.showToast({
								title: '下载失败，已复制到剪贴板',
								icon: 'success'
							})
						}
					})
				}
			},
			
			saveDataToFile(csvContent, recordCount, fileName) {
				try {
					// 获取文件系统管理器
					const fs = uni.getFileSystemManager()
					
					// 写入临时文件
					const tempPath = `${uni.env.USER_DATA_PATH}/${fileName}`
					
					fs.writeFileSync(tempPath, csvContent, 'utf8')
					
					// 保存成功后的操作选择
					uni.showActionSheet({
						itemList: ['分享文件', '显示文件位置'],
						success: (res) => {
							if (res.tapIndex === 0) {
								// 分享文件
								this.shareFile(tempPath, fileName, recordCount)
							} else if (res.tapIndex === 1) {
								// 显示文件位置
								uni.showModal({
									title: '导出成功',
									content: `文件已保存至：\n${tempPath}\n\n共${recordCount}条记录`,
									showCancel: false,
									confirmText: '知道了'
								})
							}
						}
					})
				} catch (error) {
					console.error('文件写入失败:', error)
					// 降级到复制
					uni.setClipboardData({
						data: csvContent,
						success: () => {
							uni.showToast({
								title: '文件保存失败，已复制到剪贴板',
								icon: 'success'
							})
						}
					})
				}
			},
			
			saveDataToFileApp(csvContent, recordCount, fileName) {
				// App平台使用plus.io
				if (typeof plus !== 'undefined') {
					plus.io.requestFileSystem(plus.io.PUBLIC_DOWNLOADS, (fs) => {
						fs.root.getFile(fileName, {create: true}, (fileEntry) => {
							fileEntry.createWriter((writer) => {
								writer.onwrite = () => {
									uni.showModal({
										title: '导出成功',
										content: `文件已保存到下载目录：\n${fileName}\n\n共${recordCount}条记录`,
										showCancel: false,
										confirmText: '知道了'
									})
								}
								writer.onerror = (err) => {
									console.error('写入失败:', err)
									this.fallbackExport(csvContent, recordCount)
								}
								writer.write(new Blob(['\ufeff' + csvContent], {type: 'text/csv'}))
							})
						}, (err) => {
							console.error('创建文件失败:', err)
							this.fallbackExport(csvContent, recordCount)
						})
					}, (err) => {
						console.error('获取文件系统失败:', err)
						this.fallbackExport(csvContent, recordCount)
					})
				} else {
					this.fallbackExport(csvContent, recordCount)
				}
			},
			
			saveDataToFileMp(csvContent, recordCount, fileName) {
				// 小程序平台只能复制到剪贴板
				this.fallbackExport(csvContent, recordCount)
			},
			
			fallbackExport(csvContent, recordCount) {
				// 降级到复制剪贴板
				uni.setClipboardData({
					data: csvContent,
					success: () => {
						uni.showModal({
							title: '导出成功',
							content: `由于平台限制，数据已复制到剪贴板\n\n共${recordCount}条记录\n\n您可以粘贴到任意文本编辑器中保存为CSV文件`,
							showCancel: false,
							confirmText: '知道了'
						})
					},
					fail: () => {
						uni.showToast({
							title: '导出失败，请重试',
							icon: 'none'
						})
					}
				})
			},
			
			shareFile(filePath, fileName, recordCount) {
				// 使用系统分享功能
				if (typeof plus !== 'undefined' && plus.share) {
					// App平台分享
					plus.share.sendWithSystem({
						type: 'file',
						path: filePath,
						success: () => {
							uni.showToast({
								title: '导出成功',
								icon: 'success'
							})
						},
						fail: (err) => {
							console.error('分享失败:', err)
							// 降级到显示文件路径
							uni.showModal({
								title: '导出成功',
								content: `文件已保存至：\n${filePath}\n\n共${recordCount}条记录`,
								showCancel: false,
								confirmText: '知道了'
							})
						}
					})
				} else {
					// 其他平台降级处理
					uni.showModal({
						title: '导出成功',
						content: `文件已保存至：\n${filePath}\n\n共${recordCount}条记录`,
						showCancel: false,
						confirmText: '知道了'
					})
				}
			}
		}
	}
</script>

<style>
	.container {
		background-color: #f5f5f5;
		min-height: 100vh;
		padding: 0;
	}
	
	/* 用户信息区域 */
	.user-info {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx 30rpx 60rpx;
		position: relative;
		border-radius: 0 0 40rpx 40rpx;
	}
	
	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		color: white;
	}
	
	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		border: 4rpx solid rgba(255, 255, 255, 0.3);
		margin-bottom: 20rpx;
	}
	
	.username {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 10rpx;
	}
	
	.user-desc {
		font-size: 28rpx;
		opacity: 0.8;
	}
	
	/* 数据管理区域 */
	.data-management {
		background: white;
		margin: 30rpx 30rpx 40rpx;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.management-title {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		padding: 30rpx 30rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}
	
	.management-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30rpx;
		border-bottom: 1rpx solid #f8f8f8;
		transition: background-color 0.2s;
	}
	
	.management-item:last-child {
		border-bottom: none;
	}
	
	.management-item:active {
		background-color: #f8f8f8;
	}
	
	.management-left {
		display: flex;
		align-items: center;
	}
	
	.management-icon {
		font-size: 36rpx;
		margin-right: 20rpx;
		width: 50rpx;
		text-align: center;
	}
	
	.management-text {
		font-size: 30rpx;
		color: #333;
	}
	
	.management-arrow {
		font-size: 28rpx;
		color: #999;
	}
	
	/* 特殊项目样式 */
	.ai-chat-item .management-icon {
		background: linear-gradient(45deg, #FF6B6B, #FF8E53);
		border-radius: 50%;
		color: white;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 50rpx;
		height: 50rpx;
	}
	
	.ai-config-item .management-icon {
		background: linear-gradient(45deg, #4ECDC4, #44A08D);
		border-radius: 50%;
		color: white;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 50rpx;
		height: 50rpx;
	}
	
	.danger-item .management-text {
		color: #ff4d4f;
	}
	
	.danger-item .management-icon {
		color: #ff4d4f;
	}
	
	/* 应用信息区域 */
	.app-info {
		background: white;
		margin: 0 30rpx 40rpx;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.info-title {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		padding: 30rpx 30rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}
	
	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 25rpx 30rpx;
		border-bottom: 1rpx solid #f8f8f8;
	}
	
	.info-item:last-child {
		border-bottom: none;
	}
	
	.info-label {
		font-size: 28rpx;
		color: #666;
	}
	
	.info-value {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
	}
	
	/* 响应式适配 */
	@media (max-width: 750rpx) {
		.container {
			padding: 0;
		}
		
		.data-management,
		.app-info {
			margin-left: 20rpx;
			margin-right: 20rpx;
		}
	}
</style>
