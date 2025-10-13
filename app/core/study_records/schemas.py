# app/core/study_record/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PracticeMaterialBase(BaseModel):
    id: int
    title: str
    chinese_title: str
    practice_type: str
    theme: str
    duration: str

    class Config:
        from_attributes = True


# 学习记录响应模型
class StudyRecordResponse(BaseModel):
    id: int
    user_id: int
    material_id: int
    progress: int
    started_at: datetime
    last_studied_at: datetime
    material: PracticeMaterialBase  # 使用正确的模型名称

    class Config:
        from_attributes = True


class StudyRecordCreate(BaseModel):
    material_id: int
    progress: int
    is_restart: bool = False
    play_duration: float = 0  # 新增：播放时长（秒）




class StudyRecordBase(BaseModel):
    material_id: int
    progress: int = 0



class UserStats(BaseModel):
    total_study_hours: int
    training_days: int


class StudyRecordProgress(BaseModel):
    material_id: int
    progress: int
    study_record_id: Optional[int] = None

    class Config:
        from_attributes = True