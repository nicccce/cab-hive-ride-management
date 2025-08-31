import { useState } from 'react';
import { View, Text } from '@tarojs/components';
import { Picker, Cell, Button, Rate, Input, Textarea, Popup } from '@taroify/core';
import { ArrowRight } from '@taroify/icons';
import './index.scss';

const Feedback = ({ orderId, onSubmit, onCancel }) => {
  const [feedbackType, setFeedbackType] = useState('complaint');
  const [feedbackLevel, setFeedbackLevel] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const feedbackTypes = [
    { label: '投诉', value: 'complaint' },
    { label: '建议', value: 'suggestion' },
    { label: '咨询', value: 'consult' },
    { label: '表扬', value: 'praise' },
    { label: '其他', value: 'other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        order_id: orderId,
        type: feedbackType,
        level: feedbackLevel,
        title,
        content
      });
    } catch (error) {
      console.error('提交反馈失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPicker = () => {
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  const getFeedbackLabel = () => {
    return feedbackTypes.find(item => item.value === feedbackType)?.label || '请选择反馈类型'
  };

  return (
    <View className="feedback-modal">
      <View className="feedback-modal-content">
        <Text className="feedback-title">提交反馈</Text>
        <View>
          <Cell.Group inset>
            <Cell title="反馈类型" arrow={<ArrowRight />} bordered={false} onClick={openPicker}>
              {getFeedbackLabel()}
            </Cell>

            <Cell title="反馈级别" bordered={false}>
              <Rate
                value={feedbackLevel}
                onChange={setFeedbackLevel}
                size={24}
                allowHalf={false}
                voidColor="#eee"
                color="#ffd21e"
              />
            </Cell>

            <Cell title="标题" bordered={false}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.detail.value)}
                placeholder="请输入反馈标题"
                style={{ textAlign: 'right' }}
              />
            </Cell>

            <Cell title="内容" bordered={false}>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.detail.value)}
                placeholder="请输入反馈内容"
                autoHeight
                style={{ width: '100%' }}
              />
            </Cell>
          </Cell.Group>

          <View className="form-actions">
            <Button
              onClick={onCancel}
              variant="outlined"
              disabled={loading}
              className="cancel-btn"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              color="primary"
              loading={loading}
              disabled={loading}
              className="submit-btn"
            >
              {loading ? '提交中...' : '提交反馈'}
            </Button>
          </View>
        </View>
      </View>

      <Popup open={showPicker} rounded placement="bottom" onClose={closePicker}>
        <Picker
          defaultValue={feedbackType}
          columns={feedbackTypes}
          columnsFieldNames={{ label: 'label', value: 'value' }}
          onChange={(value) => {
            setFeedbackType(value)
          }}
          onConfirm={(value) => {
            setFeedbackType(value[0]);
            closePicker();
          }}
          onCancel={closePicker}
        />
      </Popup>
    </View>
  );
};

export default Feedback;