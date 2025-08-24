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
  message
} from 'antd';
import { EyeOutlined, SearchOutlined, UserOutlined, RedoOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getUserListAsync, clearCurrentUser, resetUserByAdminAsync } from '../../store/modules/user';
import { User } from '../../types';

const { Search } = Input;

const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { userList, pagination, loading } = useAppSelector(state => state.user);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [nickNameSearch, setNickNameSearch] = useState('');
  const [openIdSearch, setOpenIdSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, nickNameSearch, openIdSearch]);

  const fetchData = () => {
    const params: {
      page: number;
      page_size: number;
      nick_name?: string;
      open_id?: string;
    } = {
      page: currentPage,
      page_size: pageSize,
    };
    
    if (nickNameSearch) {
      params.nick_name = nickNameSearch;
    }
    
    if (openIdSearch) {
      params.open_id = openIdSearch;
    }
    
    dispatch(getUserListAsync(params));
  };

  const showDetail = (record: User) => {
    setSelectedUser(record);
    setDetailVisible(true);
  };

  const getRoleTag = (roleId: number) => {
    switch (roleId) {
      case 1:
        return <Tag color="blue">普通用户</Tag>;
      case 2:
        return <Tag color="green">司机</Tag>;
      case 3:
        return <Tag color="red">管理员</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '头像',
      dataIndex: 'avatar_url',
      key: 'avatar_url',
      width: 80,
      render: (avatarUrl) => (
        avatarUrl ? (
          <img
            src={avatarUrl}
            alt="头像"
            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
          />
        ) : (
          <UserOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
        )
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nick_name',
      key: 'nick_name',
      width: 150,
      render: (text) => (
        <Space>
          {text || '未设置'}
        </Space>
      ),
    },
    {
      title: 'OpenID',
      dataIndex: 'open_id',
      key: 'open_id',
      width: 200,
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text ? `${text.slice(0, 10)}...${text.slice(-6)}` : '-'}
        </span>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role_id',
      key: 'role_id',
      width: 120,
      render: getRoleTag,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
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
            icon={<RedoOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认重置',
                content: `确定要重置用户"${record.nick_name || '未知用户'}"的信息吗？`,
                onOk: async () => {
                  try {
                    await dispatch(resetUserByAdminAsync(record.id)).unwrap();
                    message.success('用户信息重置成功');
                    // 重新加载用户列表
                    fetchData();
                  } catch (_error) {
                    message.error('重置用户信息失败');
                  }
                },
              });
            }}
          >
            重置
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
            <h2 style={{ margin: 0 }}>用户管理</h2>
            <p style={{ color: '#8c8c8c', margin: '4px 0 0 0' }}>
              管理系统中的所有用户信息
            </p>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="搜索用户昵称"
                allowClear
                style={{ width: 200 }}
                value={nickNameSearch}
                onChange={(e) => setNickNameSearch(e.target.value)}
                onSearch={(value) => {
                  setNickNameSearch(value);
                  setCurrentPage(1);
                }}
              />
              <Search
                placeholder="搜索OpenID"
                allowClear
                style={{ width: 200 }}
                value={openIdSearch}
                onChange={(e) => setOpenIdSearch(e.target.value)}
                onSearch={(value) => {
                  setOpenIdSearch(value);
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
                  setNickNameSearch('');
                  setOpenIdSearch('');
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
          dataSource={userList}
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
        />
      </Card>

      {/* 用户详情弹窗 */}
      <Modal
        title="用户详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedUser(null);
          dispatch(clearCurrentUser());
        }}
        footer={null}
        width={600}
      >
        {selectedUser && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户ID" span={1}>
              {selectedUser.id}
            </Descriptions.Item>
            <Descriptions.Item label="角色" span={1}>
              {getRoleTag(selectedUser.role_id)}
            </Descriptions.Item>
            <Descriptions.Item label="昵称" span={2}>
              {selectedUser.nick_name || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="头像" span={2}>
              {selectedUser.avatar_url ? (
                <img
                  src={selectedUser.avatar_url}
                  alt="头像"
                  style={{ width: '64px', height: '64px', borderRadius: '50%' }}
                />
              ) : (
                <UserOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="OpenID" span={2}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                {selectedUser.open_id}
              </span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;