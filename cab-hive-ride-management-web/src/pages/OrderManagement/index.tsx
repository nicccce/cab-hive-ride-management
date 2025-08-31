import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Card,
  Tag,
  Modal,
  Descriptions,
  Row,
  Col,
  Input,
  DatePicker,
  Select,
  message,
  Tabs
} from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getOrderListAsync, clearCurrentOrder, getOrderDetailAsync } from '../../store/modules/order';
import { Order } from '../../types';
import dayjs from 'dayjs';
import OrderMap from '../../components/OrderMap';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orderList, pagination, loading } = useAppSelector(state => state.order);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [userOpenIdSearch, setUserOpenIdSearch] = useState('');
  const [driverOpenIdSearch, setDriverOpenIdSearch] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, statusFilter, userOpenIdSearch, driverOpenIdSearch, dateRange]);

  const fetchData = () => {
    const params: {
      page: number;
      page_size: number;
      status?: string;
      user_open_id?: string;
      driver_open_id?: string;
      start_time?: string;
      end_time?: string;
    } = {
      page: currentPage,
      page_size: pageSize,
    };
    
    if (statusFilter) {
      params.status = statusFilter;
    }
    
    if (userOpenIdSearch) {
      params.user_open_id = userOpenIdSearch;
    }
    
    if (driverOpenIdSearch) {
      params.driver_open_id = driverOpenIdSearch;
    }
    
    if (dateRange[0] && dateRange[1]) {
      params.start_time = dateRange[0].format('YYYY-MM-DD');
      params.end_time = dateRange[1].format('YYYY-MM-DD');
    }
    
    dispatch(getOrderListAsync(params));
  };

  const showDetail = async (record: Order) => {
    try {
      await dispatch(getOrderDetailAsync(record.id)).unwrap();
      setSelectedOrder(record);
      setDetailVisible(true);
    } catch (error) {
      message.error('获取订单详情失败');
      console.error('获取订单详情失败:', error);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'waiting_for_driver':
        return <Tag color="blue">等待司机接单</Tag>;
      case 'driver_arriving':
        return <Tag color="orange">司机到达中</Tag>;
      case 'in_progress':
        return <Tag color="purple">进行中</Tag>;
      case 'waiting_for_payment':
        return <Tag color="yellow">待支付</Tag>;
      case 'completed':
        return <Tag color="green">已完成</Tag>;
      case 'cancelled':
        return <Tag color="red">已取消</Tag>;
      case 'reserved':
        return <Tag color="cyan">预约中</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户OpenID',
      dataIndex: 'user_open_id',
      key: 'user_open_id',
      width: 150,
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text ? `${text.slice(0, 10)}...${text.slice(-6)}` : '-'}
        </span>
      ),
    },
    {
      title: '司机OpenID',
      dataIndex: 'driver_open_id',
      key: 'driver_open_id',
      width: 150,
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text && text !== '""' ? `${text.slice(0, 10)}...${text.slice(-6)}` : '-'}
        </span>
      ),
    },
    {
      title: '起点',
      dataIndex: 'start_location',
      key: 'start_location',
      width: 150,
      render: (location) => location.name || `${location.latitude},${location.longitude}`,
    },
    {
      title: '终点',
      dataIndex: 'end_location',
      key: 'end_location',
      width: 150,
      render: (location) => location.name || `${location.latitude},${location.longitude}`,
    },
    {
      title: '距离(km)',
      dataIndex: 'distance',
      key: 'distance',
      width: 100,
      render: (distance) => (distance / 1000).toFixed(2),
    },
    {
      title: '费用(元)',
      dataIndex: 'fare',
      key: 'fare',
      width: 100,
      render: (fare) => `¥${fare.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: getStatusTag,
    },
    {
      title: '下单时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ margin: 0 }}>订单管理</h2>
            <p style={{ color: '#8c8c8c', margin: '4px 0 0 0' }}>
              管理系统中的所有订单信息
            </p>
          </Col>
          <Col>
            <Space>
              <Select
                placeholder="订单状态"
                style={{ width: 120 }}
                allowClear
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value || '');
                  setCurrentPage(1);
                }}
              >
                <Option value="waiting_for_driver">等待司机接单</Option>
                <Option value="driver_arriving">司机到达中</Option>
                <Option value="in_progress">进行中</Option>
                <Option value="waiting_for_payment">待支付</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
                <Option value="reserved">预约中</Option>
              </Select>
              <Search
                placeholder="搜索用户OpenID"
                allowClear
                style={{ width: 200 }}
                value={userOpenIdSearch}
                onChange={(e) => setUserOpenIdSearch(e.target.value)}
                onSearch={(value) => {
                  setUserOpenIdSearch(value);
                  setCurrentPage(1);
                }}
              />
              <Search
                placeholder="搜索司机OpenID"
                allowClear
                style={{ width: 200 }}
                value={driverOpenIdSearch}
                onChange={(e) => setDriverOpenIdSearch(e.target.value)}
                onSearch={(value) => {
                  setDriverOpenIdSearch(value);
                  setCurrentPage(1);
                }}
              />
              <RangePicker
                placeholder={['开始时间', '结束时间']}
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates || [null, null]);
                  setCurrentPage(1);
                }}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  setCurrentPage(1);
                  fetchData();
                }}
              >
                搜索
              </Button>
              <Button
                onClick={() => {
                  setStatusFilter('');
                  setUserOpenIdSearch('');
                  setDriverOpenIdSearch('');
                  setDateRange([null, null]);
                  setCurrentPage(1);
                }}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={orderList}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current_page,
            pageSize: pagination.page_size,
            total: pagination.total_count,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedOrder(null);
          dispatch(clearCurrentOrder());
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
                  <Descriptions.Item label="状态" span={1}>
                    {getStatusTag(selectedOrder.status)}
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
    </div>
  );
};

export default OrderManagement;