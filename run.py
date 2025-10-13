#!/usr/bin/env python3
"""
口译学习平台启动脚本 - 详细错误追踪版本
"""

import os
import sys
import argparse
import uvicorn
import traceback
from loguru import logger

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 加载环境变量
from dotenv import load_dotenv

load_dotenv()


def setup_logging(debug: bool = False):
    """设置日志配置"""
    log_level = "DEBUG" if debug else "INFO"

    # 移除默认处理器
    logger.remove()

    # 添加控制台输出
    logger.add(
        sys.stdout,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True
    )

    # 添加文件输出
    logger.add(
        "logs/interpreting.log",
        level=log_level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="10 MB",
        retention="7 days",
        compression="zip"
    )


def debug_config_loading():
    """调试配置加载过程"""
    logger.info("🔍 开始调试配置加载...")

    # 检查环境变量
    env_db_name = os.getenv("MYSQL_DATABASE")
    logger.info(f"环境变量 MYSQL_DATABASE: {env_db_name}")

    # 检查配置文件
    try:
        from app.config import settings
        logger.info(f"✅ 成功导入 app.config.settings")
        logger.info(f"配置中的 mysql_database: '{settings.mysql_database}'")
        logger.info(f"配置中的 mysql_host: {settings.mysql_host}")
        logger.info(f"配置中的 mysql_port: {settings.mysql_port}")
        logger.info(f"配置中的 mysql_username: {settings.mysql_username}")

        # 检查database_url的生成
        logger.info(f"生成的 database_url: {settings.database_url}")

        # 提取database_url中的数据库名
        if "database=" in settings.database_url:
            db_in_url = settings.database_url.split("database=")[1].split("?")[0]
            logger.info(f"database_url 中的数据库名: '{db_in_url}'")

        return settings
    except ImportError as e:
        logger.error(f"❌ 导入配置失败: {e}")
        traceback.print_exc()
        return None
    except Exception as e:
        logger.error(f"❌ 配置处理失败: {e}")
        traceback.print_exc()
        return None


def check_database_connection(settings):
    """检查数据库连接并详细追踪错误"""
    logger.info("🔍 开始检查数据库连接...")

    try:
        from sqlalchemy import create_engine, text

        # 打印连接详情
        logger.info(f"尝试连接URL: {settings.database_url}")

        # 创建引擎
        engine = create_engine(settings.database_url)

        # 尝试连接
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            logger.info("✅ MySQL数据库连接正常")
            return True

    except Exception as e:
        logger.error(f"❌ MySQL数据库连接失败")
        logger.error(f"错误类型: {type(e).__name__}")
        logger.error(f"错误详情: {str(e)}")

        # 详细分析错误
        error_str = str(e)
        if "Unknown database" in error_str:
            import re
            match = re.search(r"Unknown database '([^']+)'", error_str)
            if match:
                wrong_db_name = match.group(1)
                logger.error(f"🔍 错误中提到的数据库名: '{wrong_db_name}'")
                logger.error(f"🔍 配置中的数据库名: '{settings.mysql_database}'")

                if wrong_db_name != settings.mysql_database:
                    logger.error("❌ 数据库名不匹配！")
                    logger.error(f"  配置中: '{settings.mysql_database}'")
                    logger.error(f"  错误中: '{wrong_db_name}'")

        # 打印完整的错误堆栈
        logger.error("🔍 完整错误堆栈:")
        traceback.print_exc()

        return False


def check_environment():
    """检查环境配置"""
    logger.info("=" * 50)
    logger.info("开始环境检查")
    logger.info("=" * 50)

    # 调试配置加载
    settings = debug_config_loading()
    if not settings:
        return False

    # 检查必要的目录
    logger.info("📁 检查目录...")
    os.makedirs(settings.static_dir, exist_ok=True)
    os.makedirs(settings.materials_dir, exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    logger.info("✅ 目录检查完成")

    # 检查MySQL连接
    if not check_database_connection(settings):
        logger.info("💡 建议操作:")
        logger.info("1. 运行 'python init_interpreting_db.py' 初始化数据库")
        logger.info("2. 检查 MySQL 服务是否运行")
        logger.info("3. 检查数据库名拼写")
        return False

    # 检查必要的表是否存在
    logger.info("📊 检查数据库表...")
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(settings.database_url)
        with engine.connect() as connection:
            tables_to_check = ['practice_materials', 'study_records', 'daily_sentences']
            all_tables_exist = True

            for table in tables_to_check:
                result = connection.execute(text(f"SHOW TABLES LIKE '{table}'"))
                if result.fetchone():
                    logger.info(f"✅ 表 {table} 存在")
                else:
                    logger.error(f"❌ 表 {table} 不存在")
                    all_tables_exist = False

            if not all_tables_exist:
                logger.error("❌ 缺少必要的数据库表")
                return False

    except Exception as e:
        logger.error(f"❌ 检查数据库表失败: {str(e)}")
        traceback.print_exc()
        return False

    logger.info("✅ 环境检查完成")
    return True


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="口译学习平台 - AI驱动的口译训练系统")
    parser.add_argument("--host", default="0.0.0.0", help="服务器地址")
    parser.add_argument("--port", type=int, default=8001, help="服务器端口")
    parser.add_argument("--debug", action="store_true", help="启用调试模式")
    parser.add_argument("--reload", action="store_true", help="启用自动重载")
    parser.add_argument("--workers", type=int, default=1, help="工作进程数")
    parser.add_argument("--log-level", default="info", choices=["debug", "info", "warning", "error"], help="日志级别")

    args = parser.parse_args()

    # 设置日志
    setup_logging(args.debug)

    # 检查环境
    if not check_environment():
        logger.error("❌ 环境检查失败，请解决上述问题后重试")
        sys.exit(1)

    # 启动信息
    logger.info("=" * 60)
    logger.info("🎯 启动口译学习平台服务")
    logger.info("=" * 60)
    logger.info(f"📝 服务地址: http://{args.host}:{args.port}")
    logger.info(f"📚 API文档: http://{args.host}:{args.port}/docs")
    logger.info(f"🐛 调试模式: {'开启' if args.debug else '关闭'}")
    logger.info(f"🔄 自动重载: {'开启' if args.reload else '关闭'}")
    logger.info("=" * 60)

    try:
        # 启动服务器
        uvicorn.run(
            "app.main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
            log_level=args.log_level,
            workers=args.workers if not args.reload else 1,
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("收到停止信号，正在关闭服务...")
    except Exception as e:
        logger.error(f"❌ 服务启动失败: {str(e)}")
        traceback.print_exc()
        sys.exit(1)



if __name__ == "__main__":
    main()