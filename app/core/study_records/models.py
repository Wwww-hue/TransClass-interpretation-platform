# app/core/study_record/models.py
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from typing import Optional
from datetime import timedelta,timezone,datetime
Base = declarative_base()


class StudyRecord(Base):
    __tablename__ = "study_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    material_id = Column(Integer, index=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone(timedelta(hours=8))))
    progress = Column(Integer, default=0)
    last_studied_at = Column(DateTime, default=lambda: datetime.now(timezone(timedelta(hours=8))))
    study_duration_seconds = Column(Integer, default=0)  # 改为秒数
    created_at = Column(DateTime, default=lambda: datetime.now(timezone(timedelta(hours=8))))