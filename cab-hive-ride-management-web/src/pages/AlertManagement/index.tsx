import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Pagination, message, Modal, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { getAlertListAsync, processAlertAsync } from '../../store/modules/alert';
import { Alert } from '../../types';

const { Option } = Select;

const AlertManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { alertList, pagination, loading, error } = useSelector((state: RootState) => state.alert);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isProcessed, setIsProcessed] = useState<string>('');
  const [alertType, setAlertType] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAlertId, setCurrentAlertId] = useState<number | null>(null);
  const [processNote, setProcessNote] = useState('');

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
        <Button
          type="primary"
          onClick={() => handleProcessAlert(record.id)}
          disabled={record.is_processed}
        >
          {record.is_processed ? '已处理' : '处理'}
        </Button>
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