-- 插入测试用户数据
INSERT INTO users (role_id, nick_name, open_id, session_key, union_id, last_login, created_at, updated_at) VALUES
(1, '用户1', 'openid_user1', 'session_key1', 'union_id1', 1678886400, NOW(), NOW()),
(1, '用户2', 'openid_user2', 'session_key2', 'union_id2', 1678886400, NOW(), NOW()),
(1, '用户3', 'openid_user3', 'session_key3', 'union_id3', 1678886400, NOW(), NOW()),
(2, '司机1', 'openid_driver1', 'session_key4', 'union_id4', 1678886400, NOW(), NOW()),
(2, '司机2', 'openid_driver2', 'session_key5', 'union_id5', 1678886400, NOW(), NOW()),
(2, '司机3', 'openid_driver3', 'session_key6', 'union_id6', 1678886400, NOW(), NOW()),
(3, '管理员', 'openid_admin', 'session_key7', 'union_id7', 1678886400, NOW(), NOW());

-- 插入测试司机数据（已审核通过的司机）
INSERT INTO drivers (open_id, license_number, name, phone, license_image_url, status, created_at, updated_at) VALUES
('openid_driver1', 'LICENSE001', '张三', '13800138001', 'http://example.com/license1.jpg', 'approved', NOW(), NOW()),
('openid_driver2', 'LICENSE002', '李四', '13800138002', 'http://example.com/license2.jpg', 'approved', NOW(), NOW());

-- 插入待审核司机数据
INSERT INTO driver_reviews (open_id, license_number, name, phone, license_image_url, status, comment, action_type, driver_id, created_at, updated_at) VALUES
('openid_user1', 'LICENSE003', '王五', '13800138003', 'http://example.com/license3.jpg', 'pending', '', 'register', 0, NOW(), NOW()),
('openid_user2', 'LICENSE004', '赵六', '13800138004', 'http://example.com/license4.jpg', 'pending', '', 'register', 0, NOW(), NOW()),
('openid_user3', 'LICENSE005', '孙七', '13800138005', 'http://example.com/license5.jpg', 'pending', '', 'register', 0, NOW(), NOW());

-- 插入测试车辆数据（已审核通过的车辆）
INSERT INTO vehicles (driver_id, plate_number, vehicle_type, brand, model_name, color, year, registration_image, insurance_expiry, status, comment, submit_time, created_at, updated_at) VALUES
('openid_driver1', '粤A12345', '轿车', '丰田', '凯美瑞', '白色', 2020, 'http://example.com/registration1.jpg', '2024-12-31', 'approved', '', NOW(), NOW(), NOW()),
('openid_driver1', '粤A67890', 'SUV', '本田', 'CR-V', '黑色', 2021, 'http://example.com/registration2.jpg', '2025-06-30', 'approved', '', NOW(), NOW(), NOW()),
('openid_driver2', '粤B12345', '轿车', '大众', '帕萨特', '银色', 2019, 'http://example.com/registration3.jpg', '2024-10-31', 'approved', '', NOW(), NOW(), NOW());

-- 插入待审核车辆数据
INSERT INTO vehicle_reviews (driver_id, plate_number, vehicle_type, brand, model_name, color, year, registration_image, insurance_expiry, status, comment, action_type, vehicle_id, created_at, updated_at) VALUES
('openid_driver1', '粤C12345', '轿车', '奔驰', 'C级', '红色', 2022, 'http://example.com/registration4.jpg', '2026-05-31', 'pending', '', 'submit', 0, NOW(), NOW()),
('openid_driver2', '粤C67890', 'SUV', '宝马', 'X3', '蓝色', 2021, 'http://example.com/registration5.jpg', '2025-12-31', 'pending', '', 'submit', 0, NOW(), NOW()),
('openid_driver3', '粤D12345', '轿车', '奥迪', 'A4', '白色', 2020, 'http://example.com/registration6.jpg', '2024-08-31', 'pending', '', 'submit', 0, NOW(), NOW());

-- 验证数据插入
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Drivers' as table_name, COUNT(*) as count FROM drivers
UNION ALL
SELECT 'Driver Reviews' as table_name, COUNT(*) as count FROM driver_reviews
UNION ALL
SELECT 'Vehicles' as table_name, COUNT(*) as count FROM vehicles
UNION ALL
SELECT 'Vehicle Reviews' as table_name, COUNT(*) as count FROM vehicle_reviews;