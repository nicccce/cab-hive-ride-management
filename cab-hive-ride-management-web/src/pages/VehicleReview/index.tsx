import React from 'react';
import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  message,
  Card,
  Descriptions,
  Select
} from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, CarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  getVehiclePendingReviewListAsync,
  reviewVehicleAsync,
  clearCurrentReview,
  getVehicleReviewDetailAsync
} from '../../store/modules/vehicle';
import { VehicleReview } from '../../types';

const { TextArea } = Input;

const VehicleReviewPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { reviewList, currentReview, pagination, loading } = useAppSelector(state => state.vehicle);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailVisible, setDetailVisible] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [selectedRecord, setSelectedRecord] = useState<VehicleReview | null>(null);
  const [form] = Form.useForm();
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
    
    dispatch(getVehiclePendingReviewListAsync(params));
  };

  const showDetail = async (record: VehicleReview) => {
    // 获取车辆审核详情
    try {
      await dispatch(getVehicleReviewDetailAsync(record.id)).unwrap();
      setDetailVisible(true);
    } catch (error) {
      console.error('获取车辆审核详情失败:', error);
      message.error('获取车辆审核详情失败');
    }
  };

  const showAction = (record: VehicleReview, type: 'approve' | 'reject') => {
    setSelectedRecord(record);
    setActionType(type);
    setActionVisible(true);
    form.setFieldsValue({
      comment: type === 'approve' ? '审核通过' : ''
    });
  };

  const handleAction = async () => {
    if (!selectedRecord) return;
    
    try {
      const values = await form.validateFields();
      
      await dispatch(reviewVehicleAsync({
        id: selectedRecord.id,
        params: {
          action: actionType === 'approve' ? 'approved' : 'rejected',
          comment: values.comment
        }
      })).unwrap();
      
      message.success(actionType === 'approve' ? '审核通过成功' : '审核拒绝成功');
      
      setActionVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<VehicleReview> = [
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
      dataIndex: 'model_name',
      key: 'model_name',
      width: 120,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 80,
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      width: 80,
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
      render: () => <Tag color="orange">待审核</Tag>,
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
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => showAction(record, 'approve')}
          >
            通过
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => showAction(record, 'reject')}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="待审核车辆列表"
        extra={
          <Space>
            <Input
              placeholder="搜索车牌号"
              allowClear
              style={{ width: 150 }}
              value={plateNumberSearch}
              onChange={(e) => setPlateNumberSearch(e.target.value)}
              onPressEnter={() => {
                setCurrentPage(1);
                fetchData();
              }}
            />
            <Input
              placeholder="搜索品牌"
              allowClear
              style={{ width: 150 }}
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              onPressEnter={() => {
                setCurrentPage(1);
                fetchData();
              }}
            />
            <Input
              placeholder="搜索车型"
              allowClear
              style={{ width: 150 }}
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              onPressEnter={() => {
                setCurrentPage(1);
                fetchData();
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
        }
      >
        <Table
          columns={columns}
          dataSource={reviewList}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
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

      {/* 详情弹窗 */}
      <Modal
        title="车辆审核详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          dispatch(clearCurrentReview());
        }}
        footer={null}
        width={700}
      >
        {currentReview && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="车辆ID" span={1}>
                {currentReview.id}
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <Tag color={currentReview.status === 'approved' ? 'green' : currentReview.status === 'rejected' ? 'red' : 'orange'}>
                  {currentReview.status === 'approved' ? '已通过' : currentReview.status === 'rejected' ? '已拒绝' : '待审核'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="车牌号" span={1}>
                {currentReview.plate_number}
              </Descriptions.Item>
              <Descriptions.Item label="车辆类型" span={1}>
                {currentReview.vehicle_type}
              </Descriptions.Item>
              <Descriptions.Item label="品牌" span={1}>
                {currentReview.brand}
              </Descriptions.Item>
              <Descriptions.Item label="车型" span={1}>
                {currentReview.model_name}
              </Descriptions.Item>
              <Descriptions.Item label="司机ID" span={1}>
                {currentReview.driver_id}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间" span={1}>
                {new Date(currentReview.submit_time).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="审核时间" span={1}>
                {'-'}
              </Descriptions.Item>
              <Descriptions.Item label="行驶证照片" span={2}>
                {currentReview.registration_image ? (
                  <img
                    src={currentReview.registration_image}
                    alt="行驶证照片"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : (
                  '暂无行驶证照片'
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 审核操作弹窗 */}
      <Modal
        title={actionType === 'approve' ? '审核通过' : '审核拒绝'}
        open={actionVisible}
        onOk={handleAction}
        onCancel={() => {
          setActionVisible(false);
          form.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="comment"
            label="审核意见"
            rules={[
              { required: true, message: '请输入审核意见' },
              { min: 2, message: '审核意见至少2个字符' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder={actionType === 'approve' ? '请输入通过原因' : '请输入拒绝原因'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VehicleReviewPage;