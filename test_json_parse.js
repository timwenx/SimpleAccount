// 测试JSON解析功能
const testText = `\n\n\`\`\`json\n{\"type\": \"expense\", \"amount\": \"15\", \"category\": \"餐饮\", \"note\": \"午饭\", \"time\": \"刚才\"}\n\`\`\``

function unescapeJsonString(str) {
    return str.replace(/\\"/g, '"')
              .replace(/\\'/g, "'")
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\r/g, '\r')
              .replace(/\\\\/g, '\\')
}

function parseRecordsData(text) {
    try {
        console.log('开始解析文本:', text)
        
        // 先尝试提取markdown代码块中的JSON
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
            let jsonStr = codeBlockMatch[1].trim()
            console.log('从代码块提取的JSON字符串:', jsonStr)
            // 处理转义字符
            jsonStr = unescapeJsonString(jsonStr)
            console.log('处理转义字符后:', jsonStr)
            const data = JSON.parse(jsonStr)
            console.log('解析成功:', data)
            return [data]
        }
    } catch (error) {
        console.log('JSON解析失败:', error)
    }
    return null
}

// 测试
const result = parseRecordsData(testText)
console.log('最终结果:', result)
