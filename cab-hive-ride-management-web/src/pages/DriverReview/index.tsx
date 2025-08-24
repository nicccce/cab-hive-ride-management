import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Space, 
  Image, 
  Modal, 
  Form, 
  Input, 
  message,
  Card,
  Select,
  DatePicker,
  Row,
  Col
} from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { 
  getDriverPendingReviewListAsync, 
  getDriverReviewDetailAsync,
  reviewDriverAsync,
  clearCurrentReview
} from '../../store/modules/driver';
import { DriverReview } from '../../types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const DriverReviewPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { reviewList, currentReview, reviewPagination, loading } = useAppSelector(state => state.driver);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailVisible, setDetailVisible] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [selectedRecord, setSelectedRecord] = useState<DriverReview | null>(null);
  const [form] = Form.useForm();
  const [nameSearch, setNameSearch] = useState('');
  const [licenseNumberSearch, setLicenseNumberSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, nameSearch, licenseNumberSearch, statusFilter]);

  const fetchData = () => {
    const params: any = {
      page: currentPage,
      page_size: pageSize,
    };
    
    if (nameSearch) {
      params.name = nameSearch;
    }
    
    if (licenseNumberSearch) {
      params.license_number = licenseNumberSearch;
    }
    
    if (statusFilter) {
      params.status = statusFilter;
    }
    
    dispatch(getDriverPendingReviewListAsync(params));
  };

  const showDetail = async (record: DriverReview) => {
    await dispatch(getDriverReviewDetailAsync(record.id));
    setDetailVisible(true);
  };

  const showAction = (record: DriverReview, type: 'approve' | 'reject') => {
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
      
      await dispatch(reviewDriverAsync({
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
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<DriverReview> = [
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
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
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
        title="待审核司机列表"
        extra={
          <Space>
            <Input
              placeholder="搜索司机姓名"
              allowClear
              style={{ width: 150 }}
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              onPressEnter={() => {
                setCurrentPage(1);
                fetchData();
              }}
            />
            <Input
              placeholder="搜索驾照编号"
              allowClear
              style={{ width: 150 }}
              value={licenseNumberSearch}
              onChange={(e) => setLicenseNumberSearch(e.target.value)}
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
                setNameSearch('');
                setLicenseNumberSearch('');
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
          scroll={{ x: 1000 }}
          pagination={{
            current: reviewPagination.current_page,
            pageSize: reviewPagination.page_size,
            total: reviewPagination.total_count,
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
        title="司机审核详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          dispatch(clearCurrentReview());
        }}
        footer={null}
        width={600}
      >
        {currentReview && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div><strong>姓名：</strong>{currentReview.name}</div>
              </Col>
              <Col span={12}>
                <div><strong>手机号：</strong>{currentReview.phone}</div>
              </Col>
              <Col span={12}>
                <div><strong>身份证号：</strong>{currentReview.license_number}</div>
              </Col>
              <Col span={12}>
                <div><strong>状态：</strong><Tag color="orange">待审核</Tag></div>
              </Col>
              <Col span={12}>
                <div><strong>提交时间：</strong>{currentReview.submit_time ? new Date(currentReview.submit_time).toLocaleString() : '-'}</div>
              </Col>
              {currentReview.comment && (
                <Col span={24}>
                  <div><strong>审核意见：</strong></div>
                  <div style={{ marginTop: '8px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                    {currentReview.comment}
                  </div>
                </Col>
              )}
            </Row>
            
            {currentReview.license_image_url && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ marginBottom: '12px' }}><strong>身份证照片：</strong></div>
                <Image
                  src={currentReview.license_image_url}
                  alt="身份证照片"
                  style={{ maxWidth: '100%' }}
                />
              </div>
            )}
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

export default DriverReviewPage;