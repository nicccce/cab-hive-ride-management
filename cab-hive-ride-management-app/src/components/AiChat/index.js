import { useState, useEffect, useRef } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import './index.scss';

const AiChat = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // 逐字显示AI回复
  const displayAiResponse = (content, aiMessageId) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= content.length) {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: content.substring(0, index) }
            : msg
        ));
        index++;
      } else {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 50); // 每50毫秒显示一个字符
  };

  // 发送消息到AI客服
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // 添加用户消息到聊天记录
    const userMessage = { id: Date.now(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 显示AI正在搜索的提示
      const loadingMessageId = Date.now() + 1;
      const loadingMessage = { id: loadingMessageId, role: 'assistant', content: '正在搜索知识库...' };
      setMessages(prev => [...prev, loadingMessage]);

      // 调用AI客服接口
      const token = Taro.getStorageSync('token');

      // 使用Taro.request发送请求
      const response = await Taro.request({
        url: `${API_BASE_URL}${API_ENDPOINTS.AI_CHAT}`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { message: inputValue },
        responseType: 'text'
      });
      
      // 移除"正在搜索"提示
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));

      // 处理流式响应数据
      if (response.statusCode === 200) {
        // 解析流式响应并提取content内容
        const lines = response.data.split('\n');
        let fullContent = '';
        
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.substring(6));
              if (jsonData.choices && jsonData.choices[0].delta.content) {
                fullContent += jsonData.choices[0].delta.content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        });
        
        // 过滤掉思维链内容
        const filteredContent = fullContent.replace(/<think>.*?<\/think>/gs, '').trim();
        
        // 创建一个新的AI消息
        const aiMessageId = Date.now();
        const aiMessage = { id: aiMessageId, role: 'assistant', content: '' };
        setMessages(prev => [...prev, aiMessage]);
        
        // 逐字显示AI回复
        displayAiResponse(filteredContent, aiMessageId);
      } else {
        // 移除"正在搜索"提示
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
        
        // 输出完整的响应数据
        const fullResponse = typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data, null, 2);
        setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: fullResponse }]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: '抱歉，我遇到了一些问题，请稍后再试。' }]);
    }
  };

  // 滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      // Taro中可能需要使用其他方式滚动到底部
      // 这里保留逻辑，但实际可能需要根据Taro的具体实现调整
    }
  }, [messages]);

  return (
    <View className="ai-chat-overlay">
      <View className="ai-chat-container">
        <View className="ai-chat-header">
          <Text className="ai-chat-title">AI客服</Text>
          <Button className="ai-chat-close" onClick={onClose}>×</Button>
        </View>
        
        <View className="ai-chat-messages" ref={chatContainerRef}>
          {messages.map((message) => (
            <View 
              key={message.id} 
              className={`ai-chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <Text className="ai-chat-message-content">{message.content}</Text>
            </View>
          ))}
          {messages.length === 0 && (
            <View className="ai-chat-welcome">
              <Text className="ai-chat-welcome-text">您好！我是AI客服助手，有什么我可以帮您的吗？</Text>
            </View>
          )}
        </View>
        
        <View className="ai-chat-input-container">
          <Input
            className="ai-chat-input"
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            placeholder="请输入您的问题..."
            disabled={isLoading}
            onConfirm={sendMessage}
          />
          <Button 
            className="ai-chat-send-button" 
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? '发送中...' : '发送'}
          </Button>
        </View>
      </View>
    </View>
  );
};

export default AiChat;