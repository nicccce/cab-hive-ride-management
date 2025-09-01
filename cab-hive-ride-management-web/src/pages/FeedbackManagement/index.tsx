import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Space, 
  Card,
  Row,
  Col,
  Input,
  Select,
  message,
  Modal,
  Descriptions,
  Form,
  Input as AntdInput
} from 'antd';
import { 
  EyeOutlined, 
  SearchOutlined,
  MessageOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  getFeedbackListAsync,
  getFeedbackDetailAsync,
  replyFeedbackAsync,
  updateFeedbackStatusAsync,
  clearCurrentFeedback
} from '../../store/modules/feedback';
import { Feedback } from '../../types';

const { Search } = Input;
const { Option } = Select;

const FeedbackManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { feedbackList, currentFeedback, pagination, loading } = useAppSelector(state => state.feedback);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailVisible, setDetailVisible] = useState(false);
  const [replyVisible, setReplyVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [userOpenIdSearch, setUserOpenIdSearch] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState<number | undefined>(undefined);
  
  const [replyForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, statusFilter, typeFilter, userOpenIdSearch, orderIdSearch]);

  const fetchData = () => {
    const params: any = {
      page: currentPage,
      page_size: pageSize,
    };
    
    if (statusFilter) {
      params.status = statusFilter;
    }
    
    if (typeFilter) {
      params.type = typeFilter;
    }
    
    if (userOpenIdSearch) {
      params.user_open_id = userOpenIdSearch;
    }
    
    if (orderIdSearch) {
      params.order_id = orderIdSearch;
    }
    
    dispatch(getFeedbackListAsync(params));
  };

  const showDetail = async (record: Feedback) => {
    await dispatch(getFeedbackDetailAsync(record.id));
    setDetailVisible(true);
  };

  const showReplyModal = async (record: Feedback) => {
    await dispatch(getFeedbackDetailAsync(record.id));
    setReplyVisible(true);
    replyForm.setFieldsValue({
      reply: record.reply || '',
    });
  };

  const handleReply = async (values: { reply: string }) => {
    if (!currentFeedback) return;
    
    try {
      await dispatch(replyFeedbackAsync({ 
        id: currentFeedback.id, 
        params: { reply: values.reply } 
      })).unwrap();
      message.success('回复成功');
      setReplyVisible(false);
      replyForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('回复失败');
    }
  };

  const handleUpdateStatus = async (id: number, status: 'open' | 'processing' | 'closed') => {
    try {
      await dispatch(updateFeedbackStatusAsync({ 
        id, 
        params: { status } 
      })).unwrap();
      message.success('状态更新成功');
      fetchData();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'open':
        return <Tag color="blue">待处理</Tag>;
      case 'processing':
        return <Tag color="orange">处理中</Tag>;
      case 'closed':
        return <Tag color="green">已关闭</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getTypeTag = (type: string) => {
    switch (type) {
      case 'complaint':
        return <Tag color="red">投诉</Tag>;
      case 'suggestion':
        return <Tag color="blue">建议</Tag>;
      case 'consult':
        return <Tag color="purple">咨询</Tag>;
      case 'praise':
        return <Tag color="green">表扬</Tag>;
      case 'other':
        return <Tag color="gray">其他</Tag>;
      default:
        return <Tag>{type}</Tag>;
    }
  };

  const getLevelTag = (level: number) => {
    const colors = ['gray', 'blue', 'green', 'orange', 'red'];
    return <Tag color={colors[level - 1]}>{level}级</Tag>;
  };

  const columns: ColumnsType<Feedback> = [
    {
      title: 'ID',
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
          {text ? `${text.slice(0, 6)}...${text.slice(-6)}` : '-'}
        </span>
      ),
    },
    {
      title: '订单ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 100,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: getTypeTag,
      filters: [
        { text: '投诉', value: 'complaint' },
        { text: '建议', value: 'suggestion' },
        { text: '咨询', value: 'consult' },
        { text: '表扬', value: 'praise' },
        { text: '其他', value: 'other' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: getLevelTag,
      sorter: (a, b) => a.level - b.level,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
      filters: [
        { text: '待处理', value: 'open' },
        { text: '处理中', value: 'processing' },
        { text: '已关闭', value: 'closed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 150,
      render: (text) => new Date(text).toLocaleString(),
      sorter: (a, b) => a.create_time - b.create_time,
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
            type="default"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => showReplyModal(record)}
            disabled={record.status === 'closed'}
          >
            回复
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
            <h2 style={{ margin: 0 }}>反馈管理</h2>
            <p style={{ color: '#8c8c8c', margin: '4px 0 0 0' }}>
              管理系统中的用户反馈信息
            </p>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="搜索用户OpenID"
                allowClear
                style={{ width: 150 }}
                value={userOpenIdSearch}
                onChange={(e) => setUserOpenIdSearch(e.target.value)}
                onSearch={(value) => {
                  setUserOpenIdSearch(value);
                  setCurrentPage(1);
                }}
              />
              <Input
                placeholder="订单ID"
                type="number"
                style={{ width: 120 }}
                value={orderIdSearch}
                onChange={(e) => setOrderIdSearch(e.target.value ? Number(e.target.value) : undefined)}
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
                <Option value="open">待处理</Option>
                <Option value="processing">处理中</Option>
                <Option value="closed">已关闭</Option>
              </Select>
              <Select
                placeholder="类型筛选"
                allowClear
                style={{ width: 120 }}
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value || '');
                  setCurrentPage(1);
                }}
              >
                <Option value="complaint">投诉</Option>
                <Option value="suggestion">建议</Option>
                <Option value="consult">咨询</Option>
                <Option value="praise">表扬</Option>
                <Option value="other">其他</Option>
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
                  setUserOpenIdSearch('');
                  setOrderIdSearch(undefined);
                  setStatusFilter('');
                  setTypeFilter('');
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
          dataSource={feedbackList}
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

      {/* 反馈详情弹窗 */}
      <Modal
        title="反馈详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          dispatch(clearCurrentFeedback());
        }}
        footer={null}
        width={800}
      >
        {currentFeedback && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="反馈ID" span={1}>
                {currentFeedback.id}
              </Descriptions.Item>
              <Descriptions.Item label="订单ID" span={1}>
                {currentFeedback.order_id}
              </Descriptions.Item>
              <Descriptions.Item label="用户OpenID" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  {currentFeedback.user_open_id}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="类型" span={1}>
                {getTypeTag(currentFeedback.type)}
              </Descriptions.Item>
              <Descriptions.Item label="级别" span={1}>
                {getLevelTag(currentFeedback.level)}
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                {getStatusTag(currentFeedback.status)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={1}>
                {new Date(currentFeedback.create_time).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间" span={1}>
                {new Date(currentFeedback.update_time).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>
                {currentFeedback.title}
              </Descriptions.Item>
              <Descriptions.Item label="内容" span={2}>
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  {currentFeedback.content}
                </div>
              </Descriptions.Item>
              {currentFeedback.reply && (
                <Descriptions.Item label="回复内容" span={2}>
                  <div style={{ padding: '8px', background: '#e6f7ff', borderRadius: '4px' }}>
                    {currentFeedback.reply}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
            
            <Space>
              {currentFeedback.status !== 'closed' && (
                <>
                  <Button 
                    type="primary" 
                    onClick={() => {
                      setDetailVisible(false);
                      showReplyModal(currentFeedback);
                    }}
                  >
                    回复
                  </Button>
                  <Button 
                    onClick={() => handleUpdateStatus(currentFeedback.id, 'closed')}
                  >
                    关闭反馈
                  </Button>
                </>
              )}
            </Space>
          </div>
        )}
      </Modal>

      {/* 回复反馈弹窗 */}
      <Modal
        title="回复反馈"
        open={replyVisible}
        onCancel={() => {
          setReplyVisible(false);
          replyForm.resetFields();
        }}
        onOk={() => replyForm.submit()}
        width={600}
      >
        {currentFeedback && (
          <div style={{ marginBottom: '20px' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="反馈ID">{currentFeedback.id}</Descriptions.Item>
              <Descriptions.Item label="标题">{currentFeedback.title}</Descriptions.Item>
              <Descriptions.Item label="内容">
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  {currentFeedback.content}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
        
        <Form
          form={replyForm}
          layout="vertical"
          onFinish={handleReply}
        >
          <Form.Item
            name="reply"
            label="回复内容"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <AntdInput.TextArea rows={4} placeholder="请输入回复内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedbackManagement;