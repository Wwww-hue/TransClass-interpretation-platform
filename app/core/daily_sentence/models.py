# app/core/daily_sentence/models.py
from sqlalchemy import Column, Integer, Text, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class DailySentence(Base):
    __tablename__ = "daily_sentences"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    translation = Column(Text, nullable=False)
    source = Column(String(100))
    sentence_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())  # 修改这里