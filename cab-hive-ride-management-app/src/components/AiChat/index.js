import { useState, useEffect, useRef } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { sendAiMessage } from '../../services/user';
import './index.scss';

const AiChat = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

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
      const loadingMessage = { id: Date.now() + 1, role: 'assistant', content: '正在搜索知识库...' };
      setMessages(prev => [...prev, loadingMessage]);

      // 调用AI客服接口
      const response = await sendAiMessage(inputValue);
      
      // 移除"正在搜索"提示
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

      // 处理AI回复 - 简化处理，直接显示完整响应
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const content = response.data.choices[0].message.content;
        // 过滤掉思维链内容
        const filteredContent = content.replace(/<think>.*?<\/think>/gs, '').trim();
        setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: filteredContent }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: '抱歉，我没有理解您的问题。' }]);
      }
      
      setIsLoading(false);
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