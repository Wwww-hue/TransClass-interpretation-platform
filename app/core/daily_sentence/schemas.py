# app/core/daily_sentence/schemas.py
from pydantic import BaseModel
from typing import Optional

class DailySentence(BaseModel):
    content: str
    translation: str
    source: Optional[str] = None
    sentence_date: str