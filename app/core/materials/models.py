# app/core/materials/models.py
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime  # 修改这里
from sqlalchemy.sql import func  # 添加这个导入

Base = declarative_base()


class PracticeMaterial(Base):
    __tablename__ = "practice_materials"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    chinese_title = Column(String(200))
    theme = Column(String(50), nullable=False)
    type = Column(String(50), nullable=False)
    practice_type = Column(String(20), nullable=False)
    difficulty = Column(Float, nullable=False)
    duration = Column(String(20), nullable=False)
    date = Column(String(20), nullable=False)
    format = Column(String(20), nullable=False)
    language = Column(String(20), nullable=False)
    skills = Column(JSON, nullable=False)
    source = Column(String(100))
    content_url = Column(String(500))
    introduction = Column(Text)
    transcript = Column(Text, nullable=False)
    translation = Column(Text, nullable=False)
    terms = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())  # 修改这里
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())  # 修改这里