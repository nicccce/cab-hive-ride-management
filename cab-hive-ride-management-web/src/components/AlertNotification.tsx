import React, { useEffect, useState } from 'react';
import { Alert, Badge, Modal, List } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { eventEmitter } from '../utils/eventEmitter';
import { Alert as AlertType } from '../types/alert';

const AlertNotification: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // 监听新的预警事件
  useEffect(() => {
    const handleNewAlerts = (newAlerts: AlertType[]) => {
      setAlerts(newAlerts);
      setAlertCount(newAlerts.length);
      setVisible(true);
      
      // 3秒后自动隐藏通知
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    };
    
    eventEmitter.on('newAlerts', handleNewAlerts);
    
    return () => {
      eventEmitter.off('newAlerts', handleNewAlerts);
    };
  }, []);
  
  const handleClose = () => {
    setVisible(false);
  };
  
  const handleViewDetails = () => {
    setVisible(false);
    setModalVisible(true);
  };
  
  const handleModalOk = () => {
    setModalVisible(false);
  };
  
  const handleModalCancel = () => {
    setModalVisible(false);
  };
  
  if (!visible) return null;
  
  return (
    <>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        width: '300px',
      }}>
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>系统预警</span>
              <Badge count={alertCount} />
            </div>
          }
          description={`您有 ${alertCount} 条新预警信息`}
          type="warning"
          showIcon
          icon={<BellOutlined />}
          closable
          onClose={handleClose}
          action={
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <a onClick={handleViewDetails} style={{ fontSize: '12px', cursor: 'pointer' }}>
                查看详情
              </a>
            </div>
          }
        />
      </div>
      
      {/* 预警详情弹窗 */}
      <Modal
        title="预警详情"
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="确定"
        cancelText="关闭"
        width={600}
      >
        <List
          dataSource={alerts}
          renderItem={(alert) => (
            <List.Item>
              <List.Item.Meta
                title={`预警类型: ${alert.alert_type}`}
                description={
                  <div>
                    <p>{alert.content}</p>
                    <p style={{ fontSize: '12px', color: '#999' }}>
                      时间: {new Date(alert.alert_time).toLocaleString()}
                    </p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};

export default AlertNotification;