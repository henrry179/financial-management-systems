-- 数据库初始化脚本
-- 智能财务管理系统

-- 创建数据库（如果不存在）
-- CREATE DATABASE IF NOT EXISTS financial_db;

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表已由Prisma管理，此处仅添加一些初始化设置
-- 系统启动时的配置
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入系统配置
INSERT INTO system_config (config_key, config_value) VALUES
('system_name', '智能财务管理系统'),
('system_version', '1.0.0'),
('system_initialized', 'true'),
('default_currency', 'CNY')
ON CONFLICT (config_key) DO NOTHING;

-- 创建索引优化性能
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
-- CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- 数据库初始化完成日志
INSERT INTO system_config (config_key, config_value) VALUES
('last_init_time', CURRENT_TIMESTAMP::text)
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = CURRENT_TIMESTAMP::text,
    updated_at = CURRENT_TIMESTAMP; 