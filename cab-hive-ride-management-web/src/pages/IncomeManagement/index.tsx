import React, { useEffect, useState } from 'react';
import { Table, Card, Space, Button, message, DatePicker, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { AxiosResponse } from 'axios';
import { incomeService } from '../../services/income';
import { Income, IncomeListParams, IncomeListResponse } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { PaginationProps } from 'antd/es/pagination';

const { RangePicker } = DatePicker;
const { Option } = Select;

const IncomeManagement: React.FC = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    income_type: undefined as 'order' | 'activity' | 'other' | undefined,
    start_date: undefined as string | undefined,
    end_date: undefined as string | undefined,
    driver_id: undefined as number | undefined,
  });

  const columns: ColumnsType<Income> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '司机ID',
      dataIndex: 'driver_id',
      key: 'driver_id',
    },
    {
      title: '订单ID',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (order_id) => order_id || '-',
    },
    {
      title: '收入类型',
      dataIndex: 'income_type',
      key: 'income_type',
      render: (type: string) => {
        switch (type) {
          case 'order': return '订单收入';
          case 'activity': return '活动收入';
          case 'other': return '其他收入';
          default: return type;
        }
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  // 定义经过请求拦截器处理后的响应类型
  interface ProcessedResponse<T> extends Omit<AxiosResponse, 'data'> {
    data: T;
    msg?: string;
  }

  const fetchIncomes = async (page = 1, pageSize = 10) => {
    console.log('fetchIncomes called with:', { page, pageSize, filters });
    setLoading(true);
    try {
      const params: IncomeListParams = {
        page,
        page_size: pageSize,
        income_type: filters.income_type,
        start_date: filters.start_date,
        end_date: filters.end_date,
        driver_id: filters.driver_id,
      };
      
      const res = await incomeService.getAdminIncomeList(params);
      console.log('API response:', res);
      if ((res as unknown as ProcessedResponse<IncomeListResponse>).status === 200) {
        setIncomes(res.data.incomes);
        console.log('Setting pagination:', {
          current: res.data.pagination.current_page,
          pageSize: res.data.pagination.page_size,
          total: res.data.pagination.total_count,
        });
        setPagination({
          current: res.data.pagination.current_page,
          pageSize: res.data.pagination.page_size,
          total: res.data.pagination.total_count,
        });
      } else {
        message.error((res as unknown as ProcessedResponse<IncomeListResponse>).msg || '获取收入列表失败');
      }
    } catch (err) {
      console.error('获取收入列表失败:', err);
      message.error('获取收入列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  useEffect(() => {
    // 当filters发生变化时，重新获取第一页数据
    fetchIncomes(1, pagination.pageSize);
  }, [filters]);

  const handleTableChange: PaginationProps['onChange'] = (page, pageSize) => {
    fetchIncomes(page, pageSize || 10);
  };

  const handleSearch = () => {
    fetchIncomes(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({
      income_type: undefined,
      start_date: undefined,
      end_date: undefined,
      driver_id: undefined,
    });
  };

  const onDateChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
    setFilters({
      ...filters,
      start_date: dateStrings[0],
      end_date: dateStrings[1],
    });
  };

  return (
    <div>
      <Card title="收入管理" style={{ marginBottom: 20 }}>
        <Space wrap>
          <Select
            placeholder="收入类型"
            style={{ width: 120 }}
            allowClear
            value={filters.income_type}
            onChange={(value) => setFilters({ ...filters, income_type: value })}
          >
            <Option value="order">订单收入</Option>
            <Option value="activity">活动收入</Option>
            <Option value="other">其他收入</Option>
          </Select>
          
          <RangePicker onChange={onDateChange} />
          
          <Input
            placeholder="司机ID"
            style={{ width: 120 }}
            value={filters.driver_id}
            onChange={(e) => setFilters({ ...filters, driver_id: e.target.value ? parseInt(e.target.value) : undefined })}
          />
          
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          
          <Button onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>
      
      <Card>
        <Table
          columns={columns}
          dataSource={incomes}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={(pg) => handleTableChange(pg.current || 1, pg.pageSize || 10)}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default IncomeManagement;