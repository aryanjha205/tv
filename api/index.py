from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from . import models, schemas, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="OTT Streaming PWA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/videos", response_model=List[schemas.Video])
def read_videos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    videos = db.query(models.Video).offset(skip).limit(limit).all()
    return videos

@app.get("/api/categories", response_model=List[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = db.query(models.Category).order_by(models.Category.order).offset(skip).limit(limit).all()
    return categories

@app.get("/api/ads", response_model=List[schemas.AdVideo])
def read_ads(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    ads = db.query(models.AdVideo).filter(models.AdVideo.active == True).offset(skip).limit(limit).all()
    return ads

# Admin endpoints (protected by PIN 4333)
def verify_pin(pin: str):
    if pin != "4333":
        raise HTTPException(status_code=401, detail="Invalid PIN")

@app.post("/api/admin/login")
def admin_login(pin: str):
    verify_pin(pin)
    return {"status": "ok"}

@app.post("/api/videos", response_model=schemas.Video)
def create_video(video: schemas.VideoCreate, pin: str, db: Session = Depends(get_db)):
    verify_pin(pin)
    db_video = models.Video(**video.dict())
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video

@app.post("/api/categories", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, pin: str, db: Session = Depends(get_db)):
    verify_pin(pin)
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.post("/api/ads", response_model=schemas.AdVideo)
def create_ad(ad: schemas.AdVideoCreate, pin: str, db: Session = Depends(get_db)):
    verify_pin(pin)
    db_ad = models.AdVideo(**ad.dict())
    db.add(db_ad)
    db.commit()
    db.refresh(db_ad)
    return db_ad

@app.delete("/api/videos/{video_id}")
def delete_video(video_id: int, pin: str, db: Session = Depends(get_db)):
    verify_pin(pin)
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if video:
        db.delete(video)
        db.commit()
    return {"status": "deleted"}
