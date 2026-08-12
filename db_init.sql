-- ============================================
-- Lsys_configabManage データベース初期化スクリプト
-- ============================================

-- データベース作成
CREATE DATABASE IF NOT EXISTS app
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 一般ユーザ作成
CREATE USER IF NOT EXISTS 'labuser'@'%' IDENTIFIED BY 'labpassword';

-- 権限付与
GRANT ALL PRIVILEGES ON labmanage.* TO 'labuser'@'%';

FLUSH PRIVILEGES;