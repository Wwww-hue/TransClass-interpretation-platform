#!/usr/bin/env python3
"""
口译学习平台MySQL数据库初始化脚本 - 使用 interpretation 数据库名
完全支持云数据库，无需 root 权限创建数据库
"""

import os
import sys
from loguru import logger
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入配置
try:
    from app.config import settings
except ImportError:
    logger.error("无法导入 app.config.settings，请检查路径")
    sys.exit(1)

TARGET_DATABASE = settings.mysql_database

def check_database_connection():
    """检查数据库连接"""
    try:
        engine = create_engine(settings.database_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("数据库连接测试成功")
        return True
    except SQLAlchemyError as e:
        logger.error(f"数据库连接失败: {e}")
        return False

def create_interpreting_tables():
    """创建口译学习相关的表"""
    try:
        engine = create_engine(settings.database_url)
        with engine.connect() as conn:
            # 禁用外键检查
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            conn.commit()

            # SQL 语句
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

            -- 学习记录表
            CREATE TABLE IF NOT EXISTS study_records (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id BIGINT NOT NULL,
                material_id BIGINT NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                progress INT DEFAULT 0,
                last_studied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                study_duration_seconds INT DEFAULT 0,
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
                    conn.execute(text(statement))
                    conn.commit()

            # 启用外键检查
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            conn.commit()

        logger.info("口译学习相关表创建成功")
        return True

    except SQLAlchemyError as e:
        logger.error(f"创建口译学习表失败: {e}")
        return False

def main():
    logger.info("="*60)
    logger.info(f"🎯 开始初始化口译学习平台数据库: {TARGET_DATABASE}")
    logger.info("="*60)

    if not check_database_connection():
        logger.error("数据库连接失败，请检查 .env 配置")
        sys.exit(1)

    if not create_interpreting_tables():
        logger.error("创建口译学习表失败")
        sys.exit(1)

    logger.info("="*60)
    logger.info(f"✅ 数据库 {TARGET_DATABASE} 初始化完成！")
    logger.info("="*60)

if __name__ == "__main__":
    main()
