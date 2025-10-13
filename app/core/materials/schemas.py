# app/core/materials/schemas.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class PracticeMaterialBase(BaseModel):
    title: str
    chinese_title: Optional[str] = None
    theme: str
    type: str
    practice_type: str
    difficulty: float
    duration: str
    date: str
    format: str
    language: str
    skills: List[str]
    source: Optional[str] = None
    content_url: Optional[str] = None
    introduction: Optional[str] = None
    transcript: str
    translation: str
    terms: Optional[List[Dict[str, str]]] = None


class PracticeMaterialResponse(PracticeMaterialBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialFilter(BaseModel):
    theme: Optional[str] = None
    type: Optional[str] = None
    practice_type: Optional[str] = None
    language: Optional[str] = None
    format: Optional[str] = None
    difficulty_min: Optional[float] = None
    difficulty_max: Optional[float] = None
    search: Optional[str] = None

class TermSchema(BaseModel):
    term: str
    translation: str

class PracticeMaterialCreate(BaseModel):
    title: str
    chinese_title: Optional[str] = None
    theme: str
    type: str
    practice_type: str
    difficulty: float
    duration: str
    date: str
    format: str
    language: str
    skills: List[str]
    source: Optional[str] = None
    introduction: Optional[str] = None
    transcript: str
    translation: str
    terms: Optional[List[TermSchema]] = None
    content_url: Optional[str] = None

    class Config:
        from_attributes = True


