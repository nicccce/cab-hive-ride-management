import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Space, 
  Image, 
  Modal, 
  Card,
  Row,
  Col,
  Input,
  Select,
  message,
  Popconfirm,
  Descriptions
} from 'antd';
import { 
  EyeOutlined, 
  SearchOutlined, 
  StopOutlined, 
  PlayCircleOutlined,
  UserOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  getDriverListAsync,
  getDriverDetailAsync,
  getDriverVehiclesAsync,
  banDriverAsync,
  unbanDriverAsync,
  clearCurrentDriver,
  clearDriverVehicles
} from '../../store/modules/driver';
import { Driver, Vehicle } from '../../types';

const { Search } = Input;
const { Option } = Select;

const DriverManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { driverList, currentDriver, driverVehicles, pagination, loading } = useAppSelector(state => state.driver);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailVisible, setDetailVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [nameSearch, setNameSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [licenseNumberSearch, setLicenseNumberSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, nameSearch, phoneSearch, licenseNumberSearch, statusFilter]);

  const fetchData = () => {
    const params: any = {
      page: currentPage,
      page_size: pageSize,
    };
    
    if (nameSearch) {
      params.name = nameSearch;
    }
    
    if (phoneSearch) {
      params.phone = phoneSearch;
    }
    
    if (licenseNumberSearch) {
      params.license_number = licenseNumberSearch;
    }
    
    if (statusFilter) {
      params.status = statusFilter;
    }
    
    dispatch(getDriverListAsync(params));
  };

  const showDetail = async (record: Driver) => {
    // 清除之前的车辆信息
    dispatch(clearDriverVehicles());
    // 获取司机详情
    await dispatch(getDriverDetailAsync(record.id));
    // 获取司机名下的车辆信息
    await dispatch(getDriverVehiclesAsync(record.id));
    setDetailVisible(true);
  };

  const handleBanDriver = async (id: number) => {
    try {
      await dispatch(banDriverAsync(id)).unwrap();
      message.success('司机已封禁');
      fetchData();
    } catch (error) {
      message.error('封禁失败');
    }
  };

  const handleUnbanDriver = async (id: number) => {
    try {
      await dispatch(unbanDriverAsync(id)).unwrap();
      message.success('司机已解封');
      fetchData();
    } catch (error) {
      message.error('解封失败');
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">待审核</Tag>;
      case 'approved':
        return <Tag color="green">已通过</Tag>;
      case 'rejected':
        return <Tag color="red">已拒绝</Tag>;
      case 'banned':
        return <Tag color="volcano">已封禁</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns: ColumnsType<Driver> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '身份证号',
      dataIndex: 'license_number',
      key: 'license_number',
      width: 150,
      render: (text) => text ? `${text.slice(0, 6)}****${text.slice(-4)}` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
      filters: [
        { text: '待审核', value: 'pending' },
        { text: '已通过', value: 'approved' },
        { text: '已拒绝', value: 'rejected' },
        { text: '已封禁', value: 'banned' },
      ],
      onFilter: (value, record) => record.status === value,
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
      width: 200,
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
          {record.status === 'approved' && (
            <Popconfirm
              title="确定要封禁这个司机吗？"
              onConfirm={() => handleBanDriver(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
              >
                封禁
              </Button>
            </Popconfirm>
          )}
          {record.status === 'banned' && (
            <Popconfirm
              title="确定要解封这个司机吗？"
              onConfirm={() => handleUnbanDriver(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                解封
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ margin: 0 }}>司机管理</h2>
            <p style={{ color: '#8c8c8c', margin: '4px 0 0 0' }}>
              管理系统中的所有司机信息
            </p>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="搜索司机姓名"
                allowClear
                style={{ width: 150 }}
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                onSearch={(value) => {
                  setNameSearch(value);
                  setCurrentPage(1);
                }}
              />
              <Search
                placeholder="搜索手机号"
                allowClear
                style={{ width: 150 }}
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                onSearch={(value) => {
                  setPhoneSearch(value);
                  setCurrentPage(1);
                }}
              />
              <Search
                placeholder="搜索驾照编号"
                allowClear
                style={{ width: 150 }}
                value={licenseNumberSearch}
                onChange={(e) => setLicenseNumberSearch(e.target.value)}
                onSearch={(value) => {
                  setLicenseNumberSearch(value);
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
                <Option value="pending">待审核</Option>
                <Option value="approved">已通过</Option>
                <Option value="rejected">已拒绝</Option>
                <Option value="banned">已封禁</Option>
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
                  setNameSearch('');
                  setPhoneSearch('');
                  setLicenseNumberSearch('');
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
          dataSource={driverList}
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

      {/* 司机详情弹窗 */}
      <Modal
        title="司机详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          dispatch(clearCurrentDriver());
          dispatch(clearDriverVehicles());
        }}
        footer={null}
        width={700}
      >
        {currentDriver && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="司机ID" span={1}>
                {currentDriver.id}
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                {getStatusTag(currentDriver.status)}
              </Descriptions.Item>
              <Descriptions.Item label="姓名" span={1}>
                {currentDriver.name}
              </Descriptions.Item>
              <Descriptions.Item label="手机号" span={1}>
                {currentDriver.phone}
              </Descriptions.Item>
              <Descriptions.Item label="身份证号" span={2}>
                {currentDriver.license_number}
              </Descriptions.Item>
              <Descriptions.Item label="OpenID" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                  {currentDriver.open_id}
                </span>
              </Descriptions.Item>
              {currentDriver.submit_time && (
                <Descriptions.Item label="提交时间" span={1}>
                  {new Date(currentDriver.submit_time).toLocaleString()}
                </Descriptions.Item>
              )}
              {currentDriver.review_time && (
                <Descriptions.Item label="审核时间" span={1}>
                  {new Date(currentDriver.review_time).toLocaleString()}
                </Descriptions.Item>
              )}
              {currentDriver.comment && (
                <Descriptions.Item label="审核意见" span={2}>
                  <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                    {currentDriver.comment}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {currentDriver.license_image_url && (
              <div>
                <h4>身份证照片</h4>
                <Image
                  src={currentDriver.license_image_url}
                  alt="身份证照片"
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                />
              </div>
            )}
            
            {/* 车辆信息 */}
            <div style={{ marginTop: '20px' }}>
              <h4>名下车辆</h4>
              {driverVehicles.length > 0 ? (
                <Table
                  dataSource={driverVehicles}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: '车牌号',
                      dataIndex: 'plate_number',
                      key: 'plate_number',
                    },
                    {
                      title: '车辆类型',
                      dataIndex: 'vehicle_type',
                      key: 'vehicle_type',
                    },
                    {
                      title: '品牌',
                      dataIndex: 'brand',
                      key: 'brand',
                    },
                    {
                      title: '型号',
                      dataIndex: 'model',
                      key: 'model',
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: string) => {
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
                      },
                    },
                  ]}
                />
              ) : (
                <p>暂无车辆信息</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DriverManagement;