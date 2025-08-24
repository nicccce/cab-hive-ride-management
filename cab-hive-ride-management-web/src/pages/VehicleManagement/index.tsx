import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Card,
  Row,
  Col,
  Input,
  Descriptions,
  Select
} from 'antd';
import { EyeOutlined, SearchOutlined, CarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getVehicleListAsync, getVehicleDetailAsync, clearCurrentVehicle } from '../../store/modules/vehicle';
import { Vehicle } from '../../types';

const { Search } = Input;

const VehicleManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { vehicleList, currentVehicle, pagination, loading } = useAppSelector(state => state.vehicle);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailVisible, setDetailVisible] = useState(false);
  const [plateNumberSearch, setPlateNumberSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, plateNumberSearch, brandSearch, modelSearch, statusFilter]);

  const fetchData = () => {
    const params: any = {
      page: currentPage,
      page_size: pageSize,
    };
    
    if (plateNumberSearch) {
      params.plate_number = plateNumberSearch;
    }
    
    if (brandSearch) {
      params.brand = brandSearch;
    }
    
    if (modelSearch) {
      params.model_name = modelSearch;
    }
    
    if (statusFilter) {
      params.status = statusFilter;
    }
    
    dispatch(getVehicleListAsync(params));
  };

  const showDetail = async (record: Vehicle) => {
    await dispatch(getVehicleDetailAsync(record.id));
    setDetailVisible(true);
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">待审核</Tag>;
      case 'approved':
        return <Tag color="green">已通过</Tag>;
      case 'rejected':
        return <Tag color="red">已拒绝</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns: ColumnsType<Vehicle> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '车牌号',
      dataIndex: 'plate_number',
      key: 'plate_number',
      width: 120,
      render: (text) => (
        <Space>
          <CarOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '车辆品牌',
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
    },
    {
      title: '车型',
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: '车辆类型',
      dataIndex: 'vehicle_type',
      key: 'vehicle_type',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '提交时间',
      dataIndex: 'submit_time',
      key: 'submit_time',
      width: 150,
      render: (text) => text ? new Date(text).toLocaleString() : '-',
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
            <h2 style={{ margin: 0 }}>车辆管理</h2>
            <p style={{ color: '#8c8c8c', margin: '4px 0 0 0' }}>
              管理系统中的所有车辆信息
            </p>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="搜索车牌号"
                allowClear
                style={{ width: 150 }}
                value={plateNumberSearch}
                onChange={(e) => setPlateNumberSearch(e.target.value)}
                onSearch={(value) => {
                  setPlateNumberSearch(value);
                  setCurrentPage(1);
                }}
              />
              <Search
                placeholder="搜索品牌"
                allowClear
                style={{ width: 150 }}
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                onSearch={(value) => {
                  setBrandSearch(value);
                  setCurrentPage(1);
                }}
              />
              <Search
                placeholder="搜索车型"
                allowClear
                style={{ width: 150 }}
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                onSearch={(value) => {
                  setModelSearch(value);
                  setCurrentPage(1);
                }}
              />
              <Select
                placeholder="状态筛选"
                allowClear
                style={{ width: 120 }}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value || '');
                  setCurrentPage(1);
                }}
              >
                <Select.Option value="pending">待审核</Select.Option>
                <Select.Option value="approved">已通过</Select.Option>
                <Select.Option value="rejected">已拒绝</Select.Option>
              </Select>
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
                  setPlateNumberSearch('');
                  setBrandSearch('');
                  setModelSearch('');
                  setStatusFilter('');
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
          dataSource={vehicleList}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
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
        />
      </Card>

      {/* 车辆详情弹窗 */}
      <Modal
        title="车辆详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          dispatch(clearCurrentVehicle());
        }}
        footer={null}
        width={600}
      >
        {currentVehicle && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="车辆ID" span={1}>
              {currentVehicle.id}
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={1}>
              {getStatusTag(currentVehicle.status)}
            </Descriptions.Item>
            <Descriptions.Item label="车牌号" span={1}>
              {currentVehicle.plate_number}
            </Descriptions.Item>
            <Descriptions.Item label="车辆类型" span={1}>
              {currentVehicle.vehicle_type}
            </Descriptions.Item>
            <Descriptions.Item label="品牌" span={1}>
              {currentVehicle.brand}
            </Descriptions.Item>
            <Descriptions.Item label="车型" span={1}>
              {currentVehicle.model}
            </Descriptions.Item>
            <Descriptions.Item label="司机ID" span={1}>
              {currentVehicle.driver_id}
            </Descriptions.Item>
            <Descriptions.Item label="提交时间" span={1}>
              {new Date(currentVehicle.submit_time).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="审核时间" span={1}>
              {currentVehicle.review_time ? new Date(currentVehicle.review_time).toLocaleString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="行驶证照片" span={2}>
              {currentVehicle.registration_image ? (
                <img
                  src={currentVehicle.registration_image}
                  alt="行驶证照片"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : (
                '暂无行驶证照片'
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default VehicleManagement;