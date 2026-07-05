from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    order = Column(Integer, default=0)

    videos = relationship("Video", back_populates="category")

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    url = Column(String)
    type = Column(String) # HLS, DASH, MP4, YOUTUBE
    banner_url = Column(String)
    logo_url = Column(String)
    is_featured = Column(Boolean, default=False)
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="videos")

class AdVideo(Base):
    __tablename__ = "ad_videos"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)
    active = Column(Boolean, default=True)

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    views = Column(Integer, default=0)
    watch_time_seconds = Column(Integer, default=0)
