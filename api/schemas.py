from pydantic import BaseModel
from typing import List, Optional

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    url: str
    type: str
    banner_url: Optional[str] = None
    logo_url: Optional[str] = None
    is_featured: bool = False
    category_id: Optional[int] = None

class VideoCreate(VideoBase):
    pass

class Video(VideoBase):
    id: int

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    order: int = 0

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    videos: List[Video] = []

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
