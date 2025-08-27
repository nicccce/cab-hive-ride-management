import { View, Text, Button } from '@tarojs/components'
import PropTypes from 'prop-types'
import './index.scss'

const VehicleCard = ({ vehicle, onDetail, showDetailButton = true }) => {
  // 根据审核状态显示不同颜色的状态标签
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-badge status-approved'
      case 'rejected':
        return 'status-badge status-rejected'
      default:
        return 'status-badge status-pending'
    }
  }

  // 根据审核状态显示中文标签
  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return '已通过'
      case 'rejected':
        return '已拒绝'
      default:
        return '待审核'
    }
  }

  return (
    <View className="vehicle-card">
      <View className="card-header">
        <Text className="vehicle-plate">{vehicle.plate_number}</Text>
        <Text className={getStatusBadgeClass(vehicle.status)}>
          {getStatusText(vehicle.status)}
        </Text>
      </View>

      <View className="vehicle-info">
        <View className="info-row">
          <Text className="info-label">车型</Text>
          <Text className="info-value">
            {vehicle.brand} {vehicle.model}
          </Text>
        </View>
        <View className="info-row">
          <Text className="info-label">类型</Text>
          <Text className="info-value">{vehicle.vehicle_type}</Text>
        </View>
      </View>

      {showDetailButton && (
        <View className="card-actions">
          <Button
            className="detail-btn"
            size="mini"
            onClick={() => onDetail(vehicle)}
          >
            详情
          </Button>
        </View>
      )}
    </View>
  )
}

VehicleCard.propTypes = {
  vehicle: PropTypes.object.isRequired,
  onDetail: PropTypes.func,
  showDetailButton: PropTypes.bool
}

VehicleCard.defaultProps = {
  showDetailButton: true
}

export default VehicleCard