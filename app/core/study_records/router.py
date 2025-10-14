# app/core/study_record/router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime
from app.database import get_db
from app.core.study_records.models import StudyRecord
from app.core.study_records.schemas import StudyRecordResponse, StudyRecordCreate, UserStats
from app.core.materials.models import PracticeMaterial
from .schemas import StudyRecordResponse, StudyRecordCreate, PracticeMaterialBase,StudyRecordProgress
from datetime import timedelta
router = APIRouter(prefix="/api/study-records", tags=["study-records"])

# 硬编码用户ID
CURRENT_USER_ID = 1

from datetime import datetime, timezone


@router.post("/", response_model=StudyRecordResponse)
def create_study_record(record: StudyRecordCreate, db: Session = Depends(get_db)):
    """创建学习记录"""
    print(
        f"🔍 调试信息 - 接收到的数据: material_id={record.material_id}, progress={record.progress}, is_restart={record.is_restart}")

    # 检查材料是否存在
    material = db.query(PracticeMaterial).filter(
        PracticeMaterial.id == record.material_id,
        PracticeMaterial.is_active == True
    ).first()

    if not material:
        raise HTTPException(status_code=404, detail="材料未找到")

    # 查找现有记录
    study_record = db.query(StudyRecord).filter(
        StudyRecord.user_id == CURRENT_USER_ID,
        StudyRecord.material_id == record.material_id
    ).first()

    current_time = datetime.now(timezone(timedelta(hours=8)))

    if study_record:
        # 使用前端传递的实际播放时长（秒）
        if record.play_duration > 0:
            study_record.study_duration_seconds += record.play_duration
            print(f"⏱️ 学习时长更新: {record.play_duration}秒, 总时长: {study_record.study_duration_seconds}秒")
        else:
            # 如果没有传递播放时长，使用保守估算（每次保存算10秒）
            study_record.study_duration_seconds += 10
            print(f"⏱️ 默认学习时长更新: 10秒, 总时长: {study_record.study_duration_seconds}秒")

        # 更新进度
        study_record.progress = record.progress
        study_record.last_studied_at = current_time

        if record.is_restart:
            print("🔄 执行重新学习逻辑")
            study_record.started_at = current_time

        print(f"📈 更新进度: {record.progress}%")
    else:
        print("🆕 创建新记录")
        # 创建新记录，使用正确的字段名
        study_record = StudyRecord(
            user_id=CURRENT_USER_ID,
            material_id=record.material_id,
            progress=record.progress,
            started_at=current_time,
            last_studied_at=current_time,
            study_duration_seconds=10  # 新记录初始10秒
        )
        db.add(study_record)

    db.commit()

    # 重新查询，包含材料信息
    result = db.query(StudyRecord, PracticeMaterial).join(
        PracticeMaterial, StudyRecord.material_id == PracticeMaterial.id
    ).filter(
        StudyRecord.id == study_record.id
    ).first()

    if not result:
        raise HTTPException(status_code=500, detail="创建记录后查询失败")

    record_obj, material_obj = result

    # 构建响应数据
    material_info = PracticeMaterialBase(
        id=material_obj.id,
        title=material_obj.title,
        chinese_title=material_obj.chinese_title,
        practice_type=material_obj.practice_type,
        theme=material_obj.theme,
        duration=material.duration,

    )

    response_data = StudyRecordResponse(
        id=record_obj.id,
        user_id=record_obj.user_id,
        material_id=record_obj.material_id,
        progress=record_obj.progress,
        started_at=record_obj.started_at,
        last_studied_at=record_obj.last_studied_at,
        material=material_info
    )

    print(
        f"✅ 最终返回的记录: id={response_data.id}, 进度={response_data.progress}, 学习时长={record_obj.study_duration_seconds}秒")
    return response_data


@router.get("/user-stats", response_model=UserStats)
def get_user_stats(db: Session = Depends(get_db)):
    """获取用户学习统计"""
    from sqlalchemy import func, distinct, Date

    try:
        # 获取总学习秒数
        total_seconds_result = db.query(
            func.sum(StudyRecord.study_duration_seconds).label('total_seconds')
        ).filter(
            StudyRecord.user_id == CURRENT_USER_ID
        ).first()

        total_seconds = total_seconds_result.total_seconds or 0

        # 修改：基于 last_studied_at 计算训练天数
        training_days_result = db.query(
            func.count(distinct(func.date(StudyRecord.last_studied_at)))  # 改为 last_studied_at
        ).filter(
            StudyRecord.user_id == CURRENT_USER_ID
        ).first()

        training_days = training_days_result[0] or 0

        # 计算总学习小时数（秒转小时）
        total_study_hours = max(1, round(total_seconds / 3600))

        print(f"📊 用户统计: 总秒数={total_seconds}, 训练天数={training_days}, 总小时={total_study_hours}")

        return UserStats(
            total_study_hours=total_study_hours,
            training_days=training_days
        )

    except Exception as e:
        print(f"计算用户统计错误: {e}")
        return UserStats(total_study_hours=1, training_days=0)


@router.get("/material/{material_id}/progress", response_model=StudyRecordProgress)
def get_study_progress_by_material(
        material_id: int,
        db: Session = Depends(get_db)
):
    """获取用户对指定材料的学习进度"""
    try:
        # 查询用户对该材料的学习记录
        study_record = db.query(StudyRecord).filter(
            StudyRecord.user_id == CURRENT_USER_ID,
            StudyRecord.material_id == material_id
        ).first()

        if not study_record:
            # 如果没有学习记录，返回进度0
            return StudyRecordProgress(
                material_id=material_id,
                progress=0,
                study_record_id=None
            )

        # 返回进度信息
        return StudyRecordProgress(
            material_id=study_record.material_id,
            progress=study_record.progress,
            study_record_id=study_record.id
        )

    except Exception as e:
        print(f"查询学习进度错误: {e}")
        raise HTTPException(status_code=500, detail="获取学习进度失败")


@router.get("/", response_model=List[StudyRecordResponse])
def get_user_study_records(db: Session = Depends(get_db)):
    """获取用户学习记录"""
    try:
        # 使用连接查询确保获取材料信息
        results = db.query(
            StudyRecord,
            PracticeMaterial
        ).join(
            PracticeMaterial, StudyRecord.material_id == PracticeMaterial.id
        ).filter(
            StudyRecord.user_id == CURRENT_USER_ID
        ).order_by(StudyRecord.last_studied_at.desc()).all()

        # 手动构建响应数据
        response_data = []
        for record, material in results:
            # 构建材料信息
            material_info = PracticeMaterialBase(
                id=material.id,
                title=material.title,
                chinese_title=material.chinese_title,
                practice_type=material.practice_type,
                theme=material.theme,
                duration = material.duration
            )

            # 构建学习记录响应
            record_response = StudyRecordResponse(
                id=record.id,
                user_id=record.user_id,
                material_id=record.material_id,
                progress=record.progress,
                started_at=record.started_at,
                last_studied_at=record.last_studied_at,
                material=material_info

            )
            response_data.append(record_response)

        return response_data

    except Exception as e:
        print(f"查询学习记录错误: {e}")
        raise HTTPException(status_code=500, detail="获取学习记录失败")