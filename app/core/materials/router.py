# app/core/materials/router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.core.materials.models import PracticeMaterial
from app.core.materials.schemas import PracticeMaterialResponse, MaterialFilter
from sqlalchemy import func
import base64
import os
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from github import Github, InputFileContent
from app.database import get_db
from app.core.materials.models import PracticeMaterial
from app.core.materials.schemas import PracticeMaterialResponse, PracticeMaterialCreate
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
router = APIRouter(prefix="/api/materials", tags=["materials"])
UPLOAD_DIR = "static/materials"
MAX_FILE_SIZE = 100 * 1024 * 1024
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO_OWNER = os.getenv("GITHUB_REPO_OWNER")
GITHUB_REPO_NAME = os.getenv("GITHUB_REPO_NAME")
GITHUB_STATIC_PATH=os.getenv("GITHUB_STATIC_PATH")
# 添加严格的验证
if not GITHUB_TOKEN:
    print("❌ GITHUB_TOKEN 未设置")
    # 或者抛出异常
    raise ValueError("GITHUB_TOKEN 环境变量未设置")

if not GITHUB_REPO_OWNER:
    print("❌ GITHUB_REPO_OWNER 未设置")
    raise ValueError("GITHUB_REPO_OWNER 环境变量未设置")

if not GITHUB_REPO_NAME:
    print("❌ GITHUB_REPO_NAME 未设置")
    raise ValueError("GITHUB_REPO_NAME 环境变量未设置")

print(f"✅ GitHub 配置: {GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}")


ALLOWED_EXTENSIONS = {
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/mp4': 'm4a',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi'
}
# 初始化 GitHub 客户端
def get_github_client():
    """获取 GitHub 客户端"""
    try:
        return Github(GITHUB_TOKEN)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub 客户端初始化失败: {str(e)}")


def ensure_upload_dir():
    """确保上传目录存在（用于本地备份）"""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def allowed_file(file: UploadFile) -> bool:
    """检查文件类型是否允许"""
    return file.content_type in ALLOWED_EXTENSIONS


def get_file_extension(file: UploadFile) -> str:
    """获取文件扩展名"""
    return ALLOWED_EXTENSIONS.get(file.content_type, 'bin')


async def save_upload_file_to_github(file: UploadFile, file_content: bytes) -> str:
    """保存上传的文件到 GitHub 仓库并返回访问 URL"""
    try:
        # 生成唯一文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        original_name = file.filename
        filename = f"{timestamp}_{original_name}"
        github_path = f"static/materials/{filename}"

        # 获取 GitHub 客户端
        g = get_github_client()
        repo = g.get_repo(f"{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}")

        # 将文件内容编码为 base64
        file_content_b64 = base64.b64encode(file_content).decode('utf-8')

        # 上传文件到 GitHub
        commit_message = f"Add audio file: {filename}"
        repo.create_file(
            path=github_path,
            message=commit_message,
            content=file_content_b64,
            branch="master"  # 你的分支是 master
        )

        # 使用 GitHub Pages URL 而不是 Raw URL
        pages_url = f"https://{GITHUB_REPO_OWNER}.github.io/{GITHUB_REPO_NAME}/static/materials/{filename}"

        print(f"✅ 文件上传成功，Pages URL: {pages_url}")

        return pages_url

    except Exception as e:
        print(f"❌ GitHub 上传失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"上传文件到 GitHub 失败: {str(e)}")


@router.post("/", response_model=PracticeMaterialResponse)
async def create_material(
        title: str = Form(...),
        chinese_title: Optional[str] = Form(None),
        theme: str = Form(...),
        type: str = Form(...),
        practice_type: str = Form(...),
        difficulty: float = Form(...),
        duration: str = Form(...),
        date: str = Form(...),
        format: str = Form(...),
        language: str = Form(...),
        skills: str = Form(...),
        source: Optional[str] = Form(None),
        introduction: Optional[str] = Form(None),
        transcript: str = Form(...),
        translation: str = Form(...),
        terms: Optional[str] = Form(None),
        file: Optional[UploadFile] = File(None),
        db: Session = Depends(get_db)
):
    """上传新的学习材料"""
    try:
        # 验证文件
        content_url = None
        if file and file.filename:
            # 检查文件大小 - 需要先读取内容
            file_content = await file.read()
            if len(file_content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"文件大小不能超过 {MAX_FILE_SIZE // (1024 * 1024)}MB"
                )

            # 检查文件类型
            if file.content_type not in ALLOWED_EXTENSIONS:
                allowed_types = ", ".join(ALLOWED_EXTENSIONS.keys())
                raise HTTPException(
                    status_code=400,
                    detail=f"不支持的文件类型。允许的类型: {allowed_types}"
                )

            # 保存文件到 GitHub
            content_url = await save_upload_file_to_github(file, file_content)

        # 解析技能列表和术语表
        try:
            skills_list = json.loads(skills) if skills else []
        except json.JSONDecodeError:
            skills_list = []

        try:
            terms_list = json.loads(terms) if terms else []
        except json.JSONDecodeError:
            terms_list = []

        # 创建材料记录
        material_data = {
            "title": title,
            "chinese_title": chinese_title,
            "theme": theme,
            "type": type,
            "practice_type": practice_type,
            "difficulty": difficulty,
            "duration": duration,
            "date": date,
            "format": format,
            "language": language,
            "skills": skills_list,
            "source": source,
            "introduction": introduction,
            "transcript": transcript,
            "translation": translation,
            "terms": terms_list,
            "content_url": content_url,  # 现在这是 GitHub 的原始文件 URL
            "is_active": True,
            "created_at": datetime.now(timezone(timedelta(hours=8))),
            "updated_at": datetime.now(timezone(timedelta(hours=8))),
        }

        # 创建数据库记录
        db_material = PracticeMaterial(**material_data)
        db.add(db_material)
        db.commit()
        db.refresh(db_material)

        return db_material

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"上传材料失败: {str(e)}")

@router.get("/", response_model=List[PracticeMaterialResponse])
def get_materials(
        theme: Optional[str] = Query(None),
        type: Optional[str] = Query(None),
        practice_type: Optional[str] = Query(None),
        language: Optional[str] = Query(None),
        format: Optional[str] = Query(None),
        skill: Optional[str] = Query(None),
        difficulty_min: Optional[float] = Query(None),
        difficulty_max: Optional[float] = Query(None),
        duration_min: Optional[int] = Query(None, description="最短时长(分钟)"),  # 新增
        duration_max: Optional[int] = Query(None, description="最长时长(分钟)"),  # 新增
        date_start: Optional[str] = Query(None, description="开始日期(YYYY-MM-DD)"),  # 新增
        date_end: Optional[str] = Query(None, description="结束日期(YYYY-MM-DD)"),  # 新增
        search: Optional[str] = Query(None),
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """获取练习材料列表"""
    query = db.query(PracticeMaterial).filter(PracticeMaterial.is_active == True)

    # 应用筛选条件
    if theme:
        query = query.filter(PracticeMaterial.theme == theme)
    if type:
        query = query.filter(PracticeMaterial.type == type)
    if practice_type:
        query = query.filter(PracticeMaterial.practice_type == practice_type)
    if language:
        query = query.filter(PracticeMaterial.language == language)
    if format:
        query = query.filter(PracticeMaterial.format == format)
    if skill:
        # 方法1：使用 like 查询（如果技能是字符串数组）
        query = query.filter(PracticeMaterial.skills.like(f'%"{skill}"%'))
    if difficulty_min is not None:
        query = query.filter(PracticeMaterial.difficulty >= difficulty_min)
    if difficulty_max is not None:
        query = query.filter(PracticeMaterial.difficulty <= difficulty_max)

    # 新增：时长范围筛选
    if duration_min is not None or duration_max is not None:
        # 需要创建一个函数来解析时长字符串 "8:30" -> 8.5分钟
        from sqlalchemy import or_, and_

        # 创建一个子查询来过滤时长
        duration_filter = or_()

        # 获取所有材料来手动过滤（这不是最优方案，但对于小数据量可以）
        all_materials = query.all()
        filtered_material_ids = []

        for material in all_materials:
            # 解析时长字符串 "8:30" -> 8.5分钟
            duration_parts = material.duration.split(':')
            if len(duration_parts) == 2:
                minutes = int(duration_parts[0])
                seconds = int(duration_parts[1])
                total_minutes = minutes + seconds / 60.0

                # 检查是否在范围内
                if duration_min is not None and total_minutes < duration_min:
                    continue
                if duration_max is not None and total_minutes > duration_max:
                    continue

                filtered_material_ids.append(material.id)

        # 根据过滤后的ID重新构建查询
        query = query.filter(PracticeMaterial.id.in_(filtered_material_ids))

    # 新增：发布时间范围筛选
    if date_start:
        query = query.filter(PracticeMaterial.date >= date_start)
    if date_end:
        query = query.filter(PracticeMaterial.date <= date_end)

    if search:
        query = query.filter(
            (PracticeMaterial.title.ilike(f"%{search}%")) |
            (PracticeMaterial.chinese_title.ilike(f"%{search}%")) |
            (PracticeMaterial.transcript.ilike(f"%{search}%"))
        )

    materials = query.offset(skip).limit(limit).all()
    return materials


@router.get("/{material_id}", response_model=PracticeMaterialResponse)
def get_material(material_id: int, db: Session = Depends(get_db)):
    """获取特定材料详情"""
    material = db.query(PracticeMaterial).filter(
        PracticeMaterial.id == material_id,
        PracticeMaterial.is_active == True
    ).first()

    if not material:
        raise HTTPException(status_code=404, detail="材料未找到")

    return material


@router.get("/recent/updates", response_model=List[PracticeMaterialResponse])
def get_recent_updates(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """获取最新更新（最近7天）"""
    one_week_ago = datetime.utcnow() - timedelta(days=7)

    query = db.query(PracticeMaterial).filter(
        PracticeMaterial.is_active == True,
        PracticeMaterial.created_at >= one_week_ago
    )

    # 添加搜索功能
    if search:
        query = query.filter(
            (PracticeMaterial.title.ilike(f"%{search}%")) |
            (PracticeMaterial.chinese_title.ilike(f"%{search}%")) |
            (PracticeMaterial.transcript.ilike(f"%{search}%"))
        )

    materials = query.order_by(PracticeMaterial.created_at.desc()).all()
    return materials





@router.get("/practice-type/{practice_type}", response_model=PracticeMaterialResponse)
def get_random_practice_type_material(practice_type: str, db: Session = Depends(get_db)):
    """获取特定练习类型的随机一个材料"""
    # 方法1: 使用数据库的随机函数（推荐，性能好）
    material = db.query(PracticeMaterial).filter(
        PracticeMaterial.is_active == True,
        PracticeMaterial.practice_type == practice_type
    ).order_by(func.random()).first()



    if not material:
        raise HTTPException(status_code=404, detail="该类型暂无可用材料")

    return material


