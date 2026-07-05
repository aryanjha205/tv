from sqlalchemy import Column, Integer, String, Boolean
from .database import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    url = Column(String)
    type = Column(String) # HLS, DASH, MP4, YOUTUBE
    playlist_order = Column(Integer, default=0)

class AdVideo(Base):
    __tablename__ = "ad_videos"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)
    active = Column(Boolean, default=True)

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer)
    views = Column(Integer, default=0)
    watch_time_seconds = Column(Integer, default=0)

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)
