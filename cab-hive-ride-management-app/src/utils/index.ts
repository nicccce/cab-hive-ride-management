import Taro from '@tarojs/taro'

// 格式化时间
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

// 格式化日期
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 手机号脱敏
export const maskPhone = (phone: string): string => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 身份证号脱敏  
export const maskIdCard = (idCard: string): string => {
  if (!idCard) return ''
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}

// 车牌号脱敏
export const maskPlateNumber = (plateNumber: string): string => {
  if (!plateNumber) return ''
  if (plateNumber.length <= 3) return plateNumber
  return plateNumber.substring(0, 2) + '***' + plateNumber.substring(plateNumber.length - 1)
}

// 图片压缩
export const compressImage = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    Taro.compressImage({
      src: filePath,
      quality: 80,
      success: (res) => {
        resolve(res.tempFilePath)
      },
      fail: reject
    })
  })
}

// 选择图片
export const chooseImage = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        try {
          const compressedPath = await compressImage(res.tempFilePaths[0])
          resolve(compressedPath)
        } catch (error) {
          resolve(res.tempFilePaths[0])
        }
      },
      fail: reject
    })
  })
}

// 转换图片为base64
export const imageToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    Taro.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        resolve(`data:image/jpeg;base64,${res.data}`)
      },
      fail: reject
    })
  })
}

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func.apply(null, args)
    }, wait)
  }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastTime >= wait) {
      lastTime = now
      func.apply(null, args)
    }
  }
}

// 复制到剪贴板
export const copyToClipboard = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    Taro.setClipboardData({
      data: text,
      success: () => {
        Taro.showToast({
          title: '复制成功',
          icon: 'success'
        })
        resolve()
      },
      fail: reject
    })
  })
}