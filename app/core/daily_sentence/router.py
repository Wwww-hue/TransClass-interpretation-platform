# app/core/daily_sentence/router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.core.daily_sentence.models import DailySentence
from app.core.daily_sentence.schemas import DailySentence as DailySentenceSchema

router = APIRouter(prefix="/api/daily-sentence", tags=["daily-sentence"])

from datetime import datetime, date


@router.get("/", response_model=DailySentenceSchema)
def get_daily_sentence(db: Session = Depends(get_db)):
    """获取每日一句"""
    try:
        # 使用本地时间而不是UTC时间
        today = datetime.now().date()

        # 先查询今天的句子
        sentence = db.query(DailySentence).filter(
            DailySentence.sentence_date == today,
            DailySentence.is_active == True
        ).first()

        if not sentence:
            # 如果没有今天的句子，返回最近的一条活跃句子
            sentence = db.query(DailySentence).filter(
                DailySentence.is_active == True
            ).order_by(DailySentence.sentence_date.desc()).first()

        if not sentence:
            # 如果没有任何句子，返回一个默认的
            return DailySentenceSchema(
                content="The limits of my language mean the limits of my world.",
                translation="我的语言的界限意味着我的世界的界限。",
                source="Ludwig Wittgenstein",
                sentence_date=today.strftime("%Y-%m-%d")
            )

        return DailySentenceSchema(
            content=sentence.content,
            translation=sentence.translation,
            source=sentence.source or "未知",
            sentence_date=sentence.sentence_date.strftime("%Y-%m-%d")
        )

    except Exception as e:
        print(f"获取每日一句错误: {e}")
        # 出错时返回默认句子
        return DailySentenceSchema(
            content="The limits of my language mean the limits of my world.",
            translation="我的语言的界限意味着我的世界的界限。",
            source="Ludwig Wittgenstein",
            sentence_date=datetime.now().date().strftime("%Y-%m-%d")
        )