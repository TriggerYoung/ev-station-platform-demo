-- CREATE DATABASE IF NOT EXISTS `evpcs` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE evpcs;

-- 行政区信息表
-- DROP TABLE IF EXISTS districts;
-- TRUNCATE TABLE districts;
CREATE TABLE IF NOT EXISTS `districts` (
    `adcode` VARCHAR(100) PRIMARY KEY,   -- 行政区编码
    `district_name` VARCHAR(255) NOT NULL, -- 行政区名称
    `longitude` DECIMAL(15, 6), 		-- 估算中心经度
    `latitude` DECIMAL(15, 6),			-- 估算中心纬度
    `population` DECIMAL(9, 3) NOT NULL, -- 常住人口数目估算（万人）
    `area` DECIMAL(9, 3) NOT NULL -- 区域面积（平方千米）
);
INSERT INTO districts(adcode, district_name, longitude, latitude, population, area) VALUES 
('440303', '罗湖区', 114.119444, 22.543889, 103.46, 78.79),
('440304', '福田区', 114.057868, 22.543099, 152.1, 78.66),
('440305', '南山区', 113.933333, 22.533333, 181.86, 185.3),
('440306', '宝安区', 113.850000, 22.580000, 456.54, 397),
('440307', '龙岗区', 114.233333, 22.750000, 409.81, 388.21),
('440308', '盐田区', 114.242500, 22.552500, 21.24, 74.99),
('440309', '龙华区', 114.066667, 22.666667, 251.84, 175.6),
('440310', '坪山区', 114.366667, 22.716667, 61.61, 166.31),
('440311', '光明区', 113.950000, 22.683333, 115.9, 155.44);
SELECT * FROM districts;


-- 充电站信息表
-- TRUNCATE TABLE charging_stations;
-- DROP TABLE IF EXISTS charging_stations;
CREATE TABLE IF NOT EXISTS `charging_stations` (
    `station_id` VARCHAR(25) PRIMARY KEY,  	 -- 充电站ID编码
    `longitude` DECIMAL(9,6),                    -- 经度
    `latitude` DECIMAL(9,6),                     -- 纬度
    `pile_count` INT DEFAULT 0,          		 -- 充电桩数量
    `address` VARCHAR(255),                      -- 详细地址
    `adcode` VARCHAR(25) NOT NULL,              -- 所属行政区编码
    `has_parking_fee` TINYINT(1) DEFAULT 0,   		 -- 是否有停车费用（无0、有1）
    `status` TINYINT(1) DEFAULT 1,  			 -- 充电站状态（离线0、在线1、维修2）
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 更新时间
    FOREIGN KEY (`adcode`) REFERENCES `districts`(`adcode`) ON DELETE CASCADE  -- 外键约束
);
-- csv数据导入
LOAD DATA INFILE '/Users/young/evpcs_monitor/backend/data/charging_stations.csv'
INTO TABLE charging_stations
FIELDS TERMINATED BY ','         -- 字段之间的分隔符为逗号
ENCLOSED BY '"'                  -- 字段值用双引号括起
LINES TERMINATED BY '\n'         -- 每行以换行符结束
IGNORE 1 ROWS                    -- 忽略第一行（表头）
(station_id, longitude, latitude, pile_count, address, adcode, has_parking_fee, status);

SELECT * FROM charging_stations;


-- 充电桩信息表
-- DROP TABLE IF EXISTS charging_piles;
-- TRUNCATE TABLE charging_piles;
CREATE TABLE IF NOT EXISTS `charging_piles` (
    `pile_id` VARCHAR(100) PRIMARY KEY,        
    `station_id` VARCHAR(25) NOT NULL,                  
    `charging_type` TINYINT(1) DEFAULT 0 NOT NULL,    -- 充电类型（0为交流、1为直流）
    `charging_power` INT NOT NULL,              -- 充电功率
    `connector_type` VARCHAR(50), -- 充电枪类型（CCS、CHAdeMO、GB/T）
    `location_desc` VARCHAR(255), -- 位置描述（# Ground, Basement 1, Basement 2）
    `maintenance_needed` BOOLEAN DEFAULT 0, -- 是否需要维护（0 正常，1 维护中）
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`station_id`) REFERENCES `charging_stations`(`station_id`) ON DELETE CASCADE  -- 外键约束
);

LOAD DATA INFILE '/Users/young/evpcs_monitor/backend/data/charging_piles.csv'
INTO TABLE charging_piles
FIELDS TERMINATED BY ','
ENCLOSED BY '"'  
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(pile_id, station_id, charging_type, charging_power, connector_type, location_desc, maintenance_needed);

SELECT * FROM charging_piles;


-- 系统用户表
-- TRUNCATE TABLE users;
-- DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,    -- 用户ID，自增长
    `username` VARCHAR(50) NOT NULL UNIQUE,      -- 用户名（邮箱），唯一
    `password` VARCHAR(255) NOT NULL,            -- 密码
    `role` ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'viewer',  -- 用户角色
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- 更新时间
) AUTO_INCREMENT=100;  -- 自增列从100开始

INSERT INTO users (username, password, role) VALUES
('admin@gmail.com', 'admin', 'admin'),
('admin1@gmail.com', 'password1', 'admin'),
('admin2@gmail.com', 'password2', 'admin'),
('operator1@gmail.com', 'password3', 'operator'),
('operator2@gmail.com', 'password4', 'operator'),
('operator3@gmail.com', 'password5', 'operator'),
('viewer1@gmail.com', 'password6', 'viewer'),
('viewer2@gmail.com', 'password7', 'viewer'),
('viewer3@gmail.com', 'password8', 'viewer'),
('admin3@gmail.com', 'password9', 'admin'),
('admin4@gmail.com', 'password10', 'admin'),
('operator4@gmail.com', 'password11', 'operator'),
('operator5@gmail.com', 'password12', 'operator'),
('viewer4@gmail.com', 'password13', 'viewer'),
('viewer5@gmail.com', 'password14', 'viewer'),
('admin5@gmail.com', 'password15', 'admin'),
('admin6@gmail.com', 'password16', 'admin'),
('operator6@gmail.com', 'password17', 'operator'),
('viewer6@gmail.com', 'password18', 'viewer'),
('viewer7@gmail.com', 'password19', 'viewer'),
('viewer8@gmail.com', 'password20', 'viewer');
SELECT * FROM users;




-- 合作意向表
DROP TABLE IF EXISTS business;
-- TRUNCATE TABLE business;
CREATE TABLE IF NOT EXISTS business (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `contact_name` VARCHAR(50) NOT NULL,
    `contact_info` VARCHAR(100) NOT NULL,
    `company` VARCHAR(100) NOT NULL,
    `position` VARCHAR(50),
    `company_size` VARCHAR(50),
    `industry` VARCHAR(100),
    `cooperation_type` VARCHAR(100) NOT NULL,
    `region` VARCHAR(100),
    `website` VARCHAR(255),
    `needs` TEXT,
    `is_read` TINYINT DEFAULT 0, -- 0未读，1已读
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT * FROM business;


-- 留言信息表
-- DROP TABLE IF EXISTS comments;
-- TRUNCATE TABLE comments;
CREATE TABLE IF NOT EXISTS `comments` (
    `comment_id` INT AUTO_INCREMENT PRIMARY KEY,         -- 评论ID
    `user_id` INT,                                       -- 用户ID，外键
    `content` TEXT NOT NULL,                             -- 评论内容
    `parent_id` INT DEFAULT NULL,                        -- 父评论ID（用于回复）
	`likes` INT DEFAULT 0,								 -- 点赞数
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
    FOREIGN KEY (`parent_id`) REFERENCES `comments`(`comment_id`) ON DELETE CASCADE
);
-- 插入留言信息（基础留言）
INSERT INTO comments (user_id, content, likes)
VALUES
(100, '希望充电桩可以增加语音提示功能。', 5),
(104, '建议在高峰期设置充电预约机制。', 12),
(107, '能不能考虑设立更多快充桩？', 7),
(111, '南山区充电站太少了，出行不方便。', 3),
(115, '建议优化充电桩地图导航功能。', 6),
(118, '晚上充电站照明不够，存在安全隐患。', 4),
(120, 'App 的界面操作还有改进空间。', 2);

-- 插入留言信息（回复某条评论）
INSERT INTO comments (user_id, content, parent_id, likes)
VALUES
(101, '我也觉得语音提示很实用！', 1, 2),
(108, '充电预约功能真的很有必要。', 2, 5),
(112, '快充桩增加后排队时间会少很多。', 3, 3),
(119, '导航经常卡，希望能优化。', 5, 1),
(106, '照明问题确实严重，支持改善。', 6, 4),
(117, '界面可以更简洁一点。', 7, 1);

SELECT * FROM comments;


-- 评论点赞关联表，用于记录谁给哪条评论点过赞
CREATE TABLE IF NOT EXISTS `comment_likes` (
  `comment_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  PRIMARY KEY(`comment_id`, `user_id`),
  FOREIGN KEY (`comment_id`) REFERENCES `comments`(`comment_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
);

SELECT * FROM comment_likes;

-- show variables like "secure_file_priv"

