#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
实时数据处理和流式计算模块
"""

import json
import logging
import threading
from kafka import KafkaConsumer, KafkaProducer
from collections import deque
import time
from datetime import datetime
import numpy as np

# 配置日志
logger = logging.getLogger(__name__)

class StreamProcessor:
    def __init__(self, kafka_bootstrap_servers='localhost:9092'):
        """
        初始化流处理器
        
        Args:
            kafka_bootstrap_servers: Kafka服务器地址
        """
        self.kafka_bootstrap_servers = kafka_bootstrap_servers
        self.consumer = None
        self.producer = None
        self.is_running = False
        self.processing_thread = None
        self.data_buffer = deque(maxlen=1000)  # 用于存储最近的数据
        
        # 处理函数映射
        self.processors = {}
        
    def register_processor(self, topic, processor_func):
        """
        注册数据处理器
        
        Args:
            topic: 主题名称
            processor_func: 处理函数
        """
        self.processors[topic] = processor_func
        logger.info(f"注册处理器: {topic}")
    
    def start_consumer(self, topics):
        """
        启动Kafka消费者
        
        Args:
            topics: 订阅的主题列表
        """
        try:
            self.consumer = KafkaConsumer(
                *topics,
                bootstrap_servers=self.kafka_bootstrap_servers,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='latest',
                enable_auto_commit=True,
                group_id='ai_stream_processor'
            )
            
            self.is_running = True
            self.processing_thread = threading.Thread(target=self._process_messages)
            self.processing_thread.start()
            
            logger.info(f"启动Kafka消费者，订阅主题: {topics}")
            
        except Exception as e:
            logger.error(f"启动Kafka消费者失败: {str(e)}")
            raise
    
    def stop_consumer(self):
        """
        停止Kafka消费者
        """
        self.is_running = False
        if self.consumer:
            self.consumer.close()
        if self.processing_thread:
            self.processing_thread.join()
        logger.info("停止Kafka消费者")
    
    def _process_messages(self):
        """
        处理消息的内部方法
        """
        try:
            for message in self.consumer:
                if not self.is_running:
                    break
                
                try:
                    # 获取主题和数据
                    topic = message.topic
                    data = message.value
                    
                    # 添加到缓冲区
                    self.data_buffer.append({
                        'timestamp': time.time(),
                        'topic': topic,
                        'data': data
                    })
                    
                    # 处理数据
                    if topic in self.processors:
                        processor_func = self.processors[topic]
                        result = processor_func(data)
                        
                        # 发送处理结果
                        self.send_result(topic + '_result', result)
                        
                        logger.debug(f"处理消息: {topic}, 数据: {data}")
                    
                except Exception as e:
                    logger.error(f"处理消息时出错: {str(e)}")
                    
        except Exception as e:
            logger.error(f"消息处理循环出错: {str(e)}")
    
    def send_result(self, topic, data):
        """
        发送处理结果
        
        Args:
            topic: 结果主题
            data: 结果数据
        """
        try:
            if not self.producer:
                self.producer = KafkaProducer(
                    bootstrap_servers=self.kafka_bootstrap_servers,
                    value_serializer=lambda v: json.dumps(v).encode('utf-8')
                )
            
            self.producer.send(topic, data)
            self.producer.flush()
            
        except Exception as e:
            logger.error(f"发送结果失败: {str(e)}")
    
    def get_recent_data(self, topic=None, limit=100):
        """
        获取最近处理的数据
        
        Args:
            topic: 主题名称（可选）
            limit: 限制数量
            
        Returns:
            list: 最近的数据列表
        """
        recent_data = []
        for item in reversed(self.data_buffer):
            if topic is None or item['topic'] == topic:
                recent_data.append(item)
                if len(recent_data) >= limit:
                    break
        return recent_data
    
    def get_statistics(self):
        """
        获取处理统计信息
        
        Returns:
            dict: 统计信息
        """
        topic_stats = {}
        for item in self.data_buffer:
            topic = item['topic']
            if topic not in topic_stats:
                topic_stats[topic] = 0
            topic_stats[topic] += 1
        
        return {
            'total_messages': len(self.data_buffer),
            'topic_statistics': topic_stats,
            'buffer_size': len(self.data_buffer),
            'max_buffer_size': self.data_buffer.maxlen
        }

class RealTimeAnalyzer:
    """实时数据分析器"""
    
    def __init__(self, stream_processor):
        """
        初始化实时分析器
        
        Args:
            stream_processor: 流处理器实例
        """
        self.stream_processor = stream_processor
        self.metrics = {
            'order_rate': deque(maxlen=100),  # 订单速率
            'avg_price': deque(maxlen=100),   # 平均价格
            'driver_utilization': deque(maxlen=100),  # 司机利用率
        }
    
    def analyze_order_stream(self, data):
        """
        分析订单流数据
        
        Args:
            data: 订单数据
            
        Returns:
            dict: 分析结果
        """
        try:
            # 记录订单时间
            self.metrics['order_rate'].append(time.time())
            
            # 记录订单价格
            price = data.get('price', 0)
            if price > 0:
                self.metrics['avg_price'].append(price)
            
            # 计算实时指标
            result = {
                'timestamp': datetime.now().isoformat(),
                'order_rate_per_minute': self._calculate_order_rate(),
                'average_price': self._calculate_average_price(),
                'total_orders_processed': len(self.metrics['order_rate']),
                'data': data
            }
            
            logger.info(f"订单流分析结果: {result}")
            return result
            
        except Exception as e:
            logger.error(f"分析订单流时出错: {str(e)}")
            return {'error': str(e)}
    
    def analyze_driver_stream(self, data):
        """
        分析司机流数据
        
        Args:
            data: 司机数据
            
        Returns:
            dict: 分析结果
        """
        try:
            # 记录司机利用率
            utilization = data.get('utilization_rate', 0)
            self.metrics['driver_utilization'].append(utilization)
            
            # 计算实时指标
            result = {
                'timestamp': datetime.now().isoformat(),
                'average_driver_utilization': self._calculate_driver_utilization(),
                'total_driver_updates': len(self.metrics['driver_utilization']),
                'data': data
            }
            
            logger.info(f"司机流分析结果: {result}")
            return result
            
        except Exception as e:
            logger.error(f"分析司机流时出错: {str(e)}")
            return {'error': str(e)}
    
    def _calculate_order_rate(self):
        """计算订单速率（每分钟）"""
        if len(self.metrics['order_rate']) < 2:
            return 0
        
        # 计算最近10个订单的时间窗口
        recent_orders = list(self.metrics['order_rate'])[-10:]
        if len(recent_orders) < 2:
            return 0
        
        time_window = recent_orders[-1] - recent_orders[0]
        if time_window <= 0:
            return 0
        
        # 计算每分钟订单数
        rate = len(recent_orders) / (time_window / 60)
        return round(rate, 2)
    
    def _calculate_average_price(self):
        """计算平均价格"""
        if not self.metrics['avg_price']:
            return 0
        
        return round(np.mean(list(self.metrics['avg_price'])), 2)
    
    def _calculate_driver_utilization(self):
        """计算司机平均利用率"""
        if not self.metrics['driver_utilization']:
            return 0
        
        return round(np.mean(list(self.metrics['driver_utilization'])), 2)
    
    def get_realtime_metrics(self):
        """
        获取实时指标
        
        Returns:
            dict: 实时指标
        """
        return {
            'order_rate_per_minute': self._calculate_order_rate(),
            'average_price': self._calculate_average_price(),
            'average_driver_utilization': self._calculate_driver_utilization(),
            'total_orders_processed': len(self.metrics['order_rate']),
            'total_driver_updates': len(self.metrics['driver_utilization'])
        }

# 创建全局实例
stream_processor = StreamProcessor()
real_time_analyzer = RealTimeAnalyzer(stream_processor)