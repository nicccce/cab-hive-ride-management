import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Pagination, message, Modal, Input, Descriptions, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { getAlertListAsync, processAlertAsync } from '../../store/modules/alert';
import { Alert } from '../../types';
import { useAppDispatch } from '../../hooks';
import { getOrderDetailAsync } from '../../store/modules/order';
import { Order } from '../../types';
import dayjs from 'dayjs';
import OrderMap from '../../components/OrderMap';

const { Option } = Select;

const AlertManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const appDispatch = useAppDispatch();
  const { alertList, pagination, loading, error } = useSelector((state: RootState) => state.alert);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isProcessed, setIsProcessed] = useState<string>('');
  const [alertType, setAlertType] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAlertId, setCurrentAlertId] = useState<number | null>(null);
  const [processNote, setProcessNote] = useState('');
  // 订单详情相关状态
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const columns: ColumnsType<Alert> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '订单ID',
      dataIndex: 'order_id',
      key: 'order_id',
    },
    {
      title: '预警内容',
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: '预警时间',
      dataIndex: 'alert_time',
      key: 'alert_time',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '处理状态',
      dataIndex: 'is_processed',
      key: 'is_processed',
      render: (isProcessed) => (isProcessed ? '已处理' : '未处理'),
    },
    {
      title: '预警类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
    },
    {
      title: '处理说明',
      dataIndex: 'process_note',
      key: 'process_note',
      render: (text) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            onClick={() => handleProcessAlert(record.id)}
            disabled={record.is_processed}
          >
            {record.is_processed ? '已处理' : '处理'}
          </Button>
          <Button
            onClick={() => handleViewOrderDetail(record.order_id)}
          >
            查看订单
          </Button>
        </div>
      ),
    },
  ];

  const fetchAlerts = () => {
    const params = {
      page: currentPage,
      page_size: pageSize,
      is_processed: isProcessed,
      alert_type: alertType,
    };
    
    dispatch(getAlertListAsync(params));
  };

  const handleProcessAlert = (id: number) => {
    // 打开模态框，让用户输入处理说明
    setCurrentAlertId(id);
    setIsModalVisible(true);
  };
  // 查看订单详情
  const handleViewOrderDetail = async (orderId: number) => {
    try {
      const result = await appDispatch(getOrderDetailAsync(orderId)).unwrap();
      setSelectedOrder(result);
      setOrderDetailVisible(true);
    } catch (error) {
      message.error('获取订单详情失败');
      console.error('获取订单详情失败:', error);
    }
  };

  const handleProcessConfirm = () => {
    if (currentAlertId === null) return;
    
    if (!processNote.trim()) {
      message.warning('请输入处理说明');
      return;
    }
    
    dispatch(processAlertAsync({ id: currentAlertId, process_note: processNote }))
      .then(() => {
        message.success('处理成功');
        setIsModalVisible(false);
        setProcessNote('');
        setCurrentAlertId(null);
        fetchAlerts(); // 重新获取数据
      })
      .catch(() => {
        message.error('处理失败');
      });
  };

  const handleProcessCancel = () => {
    setIsModalVisible(false);
    setProcessNote('');
    setCurrentAlertId(null);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAlerts();
  };

  const handleReset = () => {
    setIsProcessed('');
    setAlertType('');
    setCurrentPage(1);
    fetchAlerts();
  };

  useEffect(() => {
    fetchAlerts();
  }, [currentPage, pageSize]);

  // 处理错误信息
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="mr-2">处理状态:</label>
          <Select
            style={{ width: 120 }}
            value={isProcessed}
            onChange={setIsProcessed}
            allowClear
          >
            <Option value="true">已处理</Option>
            <Option value="false">未处理</Option>
          </Select>
        </div>
        
        <div>
          <label className="mr-2">预警类型:</label>
          <Select
            style={{ width: 200 }}
            value={alertType}
            onChange={setAlertType}
            allowClear
            placeholder="请选择预警类型"
          >
            <Option value="driver_distance_exceeded">司机偏离路线</Option>
            <Option value="order_timeout">司机超时未更新位置</Option>
          </Select>
        </div>
        
        <Button type="primary" onClick={handleSearch}>
          查询
        </Button>
        <Button onClick={handleReset}>
          重置
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={alertList}
        loading={loading}
        rowKey="id"
        pagination={false}
      />
      
      <div className="mt-4 flex justify-end">
        <Pagination
          current={pagination.current_page}
          pageSize={pagination.page_size}
          total={pagination.total_count}
          onChange={(page, pageSize) => {
            setCurrentPage(page);
            setPageSize(pageSize || 10);
          }}
          showSizeChanger
          showQuickJumper
        />
      </div>
      
      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={orderDetailVisible}
        onCancel={() => {
          setOrderDetailVisible(false);
          setSelectedOrder(null);
        }}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <Tabs defaultActiveKey="info" items={[
            {
              key: 'info',
              label: '基本信息',
              children: (
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="订单ID" span={1}>
                    {selectedOrder.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="用户OpenID" span={2}>
                    <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedOrder.user_open_id}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="司机OpenID" span={2}>
                    <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedOrder.driver_open_id && selectedOrder.driver_open_id !== '""' ? selectedOrder.driver_open_id : '未分配'}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="起点" span={2}>
                    {selectedOrder.start_location.name || `${selectedOrder.start_location.latitude},${selectedOrder.start_location.longitude}`}
                  </Descriptions.Item>
                  <Descriptions.Item label="终点" span={2}>
                    {selectedOrder.end_location.name || `${selectedOrder.end_location.latitude},${selectedOrder.end_location.longitude}`}
                  </Descriptions.Item>
                  <Descriptions.Item label="距离" span={1}>
                    {(selectedOrder.distance / 1000).toFixed(2)} km
                  </Descriptions.Item>
                  <Descriptions.Item label="预计时长" span={1}>
                    {selectedOrder.duration} 分钟
                  </Descriptions.Item>
                  <Descriptions.Item label="费用" span={1}>
                    ¥{selectedOrder.fare.toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="过路费" span={1}>
                    ¥{selectedOrder.tolls.toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="下单时间" span={1}>
                    {dayjs(selectedOrder.start_time).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="完成时间" span={1}>
                    {selectedOrder.end_time ? dayjs(selectedOrder.end_time).format('YYYY-MM-DD HH:mm:ss') : '未完成'}
                  </Descriptions.Item>
                  <Descriptions.Item label="预约时间" span={1}>
                    {selectedOrder.reserve_time ? dayjs(selectedOrder.reserve_time).format('YYYY-MM-DD HH:mm:ss') : '立即出发'}
                  </Descriptions.Item>
                  <Descriptions.Item label="支付时间" span={1}>
                    {selectedOrder.payment_time ? dayjs(selectedOrder.payment_time).format('YYYY-MM-DD HH:mm:ss') : '未支付'}
                  </Descriptions.Item>
                  <Descriptions.Item label="评分" span={1}>
                    {selectedOrder.rating > 0 ? selectedOrder.rating : '未评分'}
                  </Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>
                    {selectedOrder.comment || '无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="取消原因" span={2}>
                    {selectedOrder.cancel_reason || '无'}
                  </Descriptions.Item>
                </Descriptions>
              )
            },
            {
              key: 'map',
              label: '路线地图',
              children: (
                <OrderMap
                  startLocation={selectedOrder.start_location}
                  endLocation={selectedOrder.end_location}
                  routePoints={selectedOrder.route_points}
                  height={400}
                />
              )
            }
          ]} />
        )}
      </Modal>
      {/* 处理预警的模态框 */}
      <Modal
        title="处理预警"
        visible={isModalVisible}
        onOk={handleProcessConfirm}
        onCancel={handleProcessCancel}
        okText="确认处理"
        cancelText="取消"
      >
        <p>请输入处理说明：</p>
        <Input.TextArea
          rows={4}
          value={processNote}
          onChange={(e) => setProcessNote(e.target.value)}
          placeholder="请输入处理说明..."
        />
      </Modal>
    </div>
  );
};

export default AlertManagement;