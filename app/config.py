# app/config.py
"""
口译学习平台配置文件
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""

    # 应用基础配置
    app_name: str = "口译学习平台"  # ✅ 改成中文名
    app_version: str = "1.0.0"
    debug: bool = False

    # 服务器配置
    host: str = "0.0.0.0"
    port: int = 8000

    # MySQL数据库配置
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_username: str = "root"
    mysql_password: str = ""  # 从环境变量获取
    mysql_database: str = "interpretation-platform"  # ✅ 改成相关的数据库名
    mysql_charset: str = "utf8mb4"

    # 数据库连接URL（自动生成）
    database_url: str = ""

    # JWT配置
    secret_key: str = "interpreting-secret-key-2024"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # 文件上传配置 - 口译学习专用
    max_file_size: int = 100 * 1024 * 1024  # 100MB，音视频文件较大
    allowed_audio_types: list = [
        "audio/mpeg",
        "audio/wav",
        "audio/mp3"
    ]
    allowed_video_types: list = [
        "video/mp4",
        "video/avi"
    ]

    # 文件存储路径 - 口译学习专用
    static_dir: str = "static"
    materials_dir: str = "static/materials"  # ✅ 简化路径

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }


# 全局配置实例
settings = Settings()

# 自动生成MySQL连接URL
settings.database_url = (
    f"mysql+pymysql://{settings.mysql_username}:{settings.mysql_password}"
    f"@{settings.mysql_host}:{settings.mysql_port}/{settings.mysql_database}"
    f"?charset={settings.mysql_charset}"
)

# 确保必要的目录存在
os.makedirs(settings.static_dir, exist_ok=True)
os.makedirs(settings.materials_dir, exist_ok=True)