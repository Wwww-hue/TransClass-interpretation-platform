# app/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "口译学习平台"
    debug: bool = False

    # 数据库配置
    mysql_host: str
    mysql_port: int
    mysql_username: str
    mysql_password: str
    mysql_database: str
    mysql_charset: str = "utf8mb4"

    # 自动生成数据库 URL
    database_url: str = ""

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }

settings = Settings()

settings.database_url = (
    f"mysql+pymysql://{settings.mysql_username}:{settings.mysql_password}"
    f"@{settings.mysql_host}:{settings.mysql_port}/{settings.mysql_database}"
    f"?charset={settings.mysql_charset}&time_zone=+8:00"  # 🎯 添加时区参数
)