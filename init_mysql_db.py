#!/usr/bin/env python3
"""
口译学习平台MySQL数据库初始化脚本 - 使用 interpretation-platform 数据库名
"""

import os
import sys
import pymysql
from loguru import logger
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 明确指定数据库名
TARGET_DATABASE = "interpretation-platform"

try:
    from app.config import settings

    # 覆盖配置中的数据库名
    settings.mysql_database = TARGET_DATABASE
    HAS_CONFIG = True
except ImportError:
    logger.error("无法导入 app.config.settings")
    HAS_CONFIG = False
    sys.exit(1)

# 添加缺失的函数
def create_database_if_not_exists():
    """创建数据库（如果不存在）"""
    try:
        password = input("请输入MySQL root密码创建数据库: ")

        # 先连接到MySQL服务器（不指定数据库）
        connection = pymysql.connect(
            host=settings.mysql_host,
            port=settings.mysql_port,
            user='root',
            password=password,
            charset='utf8mb4'
        )

        with connection.cursor() as cursor:
            # 创建数据库
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{TARGET_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            logger.info(f"数据库 '{TARGET_DATABASE}' 创建成功或已存在")

        connection.close()
        return True

    except Exception as e:
        logger.error(f"创建数据库失败: {str(e)}")
        return False

def check_existing_database():
    """检查数据库是否已存在"""
    try:
        password = input("请输入MySQL root密码检查数据库: ")
        database_url = f"mysql+pymysql://root:{password}@{settings.mysql_host}:{settings.mysql_port}/{TARGET_DATABASE}?charset={settings.mysql_charset}"
        engine = create_engine(database_url)

        with engine.connect() as connection:
            # 简单测试连接
            result = connection.execute(text("SELECT 1"))
            logger.info("数据库连接测试成功")
            return True

    except Exception as e:
        logger.error(f"检查数据库失败: {str(e)}")
        return False

def create_interpreting_tables():
    """创建口译学习相关的表"""
    try:
        password = input("请输入MySQL root密码创建口译学习表: ")
        database_url = f"mysql+pymysql://root:{password}@{settings.mysql_host}:{settings.mysql_port}/{TARGET_DATABASE}?charset={settings.mysql_charset}"
        engine = create_engine(database_url)

        with engine.connect() as connection:
            # 第一步：禁用外键检查
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            connection.commit()




            # 第三步：创建所有表
            create_tables_sql = """
            -- 口译练习材料表
            CREATE TABLE IF NOT EXISTS practice_materials (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(200) NOT NULL,
                chinese_title VARCHAR(200),
                theme VARCHAR(50) NOT NULL,
                type VARCHAR(50) NOT NULL,
                practice_type VARCHAR(20) NOT NULL COMMENT '对话,篇章,视听',
                difficulty FLOAT NOT NULL,
                duration VARCHAR(20) NOT NULL,
                date VARCHAR(20) NOT NULL,
                format VARCHAR(20) NOT NULL,
                language VARCHAR(20) NOT NULL,
                skills JSON NOT NULL,
                source VARCHAR(100),
                content_url VARCHAR(500),
                introduction TEXT,
                transcript TEXT NOT NULL,
                translation TEXT NOT NULL,
                terms JSON,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                INDEX idx_practice_type (practice_type),
                INDEX idx_created_at (created_at),
                INDEX idx_theme (theme),
                INDEX idx_type (type),
                INDEX idx_language (language),
                INDEX idx_format (format),
                INDEX idx_difficulty (difficulty)
            );

            -- 学习记录表（添加学习时长字段）
            CREATE TABLE IF NOT EXISTS study_records (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id BIGINT NOT NULL,
                material_id BIGINT NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                progress INT DEFAULT 0,
                last_studied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                study_duration_seconds INT DEFAULT 0,  -- 新增：学习时长（分钟）
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                UNIQUE KEY unique_user_material (user_id, material_id),
                INDEX idx_user_id (user_id),
                INDEX idx_last_studied (last_studied_at)
            );

            -- 每日一句表
            CREATE TABLE IF NOT EXISTS daily_sentences (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                content TEXT NOT NULL,
                translation TEXT NOT NULL,
                source VARCHAR(100),
                sentence_date DATE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                UNIQUE KEY unique_date (sentence_date),
                INDEX idx_date (sentence_date)
            );
            """

            for statement in create_tables_sql.split(';'):
                if statement.strip():
                    connection.execute(text(statement))
                    connection.commit()

            # 第四步：重新启用外键检查
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            connection.commit()

        logger.info("口译学习相关表创建成功")
        return True

    except Exception as e:
        logger.error(f"创建口译学习表失败: {str(e)}")
        return False

def main():
    """主函数"""
    logger.info("=" * 60)
    logger.info(f"🎯 开始初始化口译学习平台数据库: {TARGET_DATABASE}")
    logger.info("=" * 60)

    # 步骤0: 创建数据库（如果不存在）
    logger.info("步骤0: 检查并创建数据库...")
    if not create_database_if_not_exists():
        logger.error("数据库创建失败")
        sys.exit(1)

    # 步骤1: 检查数据库连接
    logger.info("步骤1: 检查数据库连接...")
    if not check_existing_database():
        logger.error("数据库连接失败")
        sys.exit(1)

    # 步骤2: 创建口译学习相关表
    logger.info("步骤2: 创建口译学习相关表...")
    if not create_interpreting_tables():
        logger.error("创建口译学习表失败")
        sys.exit(1)

    logger.info("=" * 60)
    logger.info(f"✅ 口译学习平台数据库 {TARGET_DATABASE} 初始化完成！")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()