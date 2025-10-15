# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# 导入路由
from app.core.materials.router import router as materials_router
from app.core.study_records.router import router as study_record_router
from app.core.daily_sentence.router import router as daily_sentence_router

# 创建FastAPI应用
app = FastAPI(
    title="口译学习平台 API",
    description="口译学习平台后端API接口文档",
    version="1.0.0",
    docs_url="/docs",  # 明确指定文档路径
    redoc_url="/redoc"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.transclass.top",  # ✅ 允许所有子域名
        "https://transclass.top",    # ✅ 允许根域名
        "https://trans-class-interpretation-platform-ux2p-*.vercel.app",
        "https://trans-class-interpretation-platform-two.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory="static"), name="static")

# 注册路由
app.include_router(materials_router)
app.include_router(study_record_router)
app.include_router(daily_sentence_router)

@app.get("/")
def read_root():
    return {
        "message": "口译学习平台API服务已启动",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "interpreting-platform"}