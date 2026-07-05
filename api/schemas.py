from pydantic import BaseModel
from typing import List, Optional

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    url: str
    type: str
    playlist_order: int = 0

class VideoCreate(VideoBase):
    pass

class Video(VideoBase):
    id: int

    class Config:
        from_attributes = True

class AdVideoBase(BaseModel):
    url: str
    active: bool = True

class AdVideoCreate(AdVideoBase):
    pass

class AdVideo(AdVideoBase):
    id: int

    class Config:
        from_attributes = True

class SettingBase(BaseModel):
    key: str
    value: str

class Setting(SettingBase):
    class Config:
        from_attributes = True
