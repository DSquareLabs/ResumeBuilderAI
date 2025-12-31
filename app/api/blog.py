from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

from app.database import get_db
from app.models.blog import BlogPost
from app.dependencies import get_verified_email

router = APIRouter(prefix="/api/blog", tags=["blog"])

class BlogPostResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    meta_description: Optional[str] = None
    featured_image: Optional[str] = None
    published: bool
    created_at: str
    updated_at: Optional[str] = None
    author_name: str
    category: Optional[str] = None
    tags: Optional[str] = None
    read_time_minutes: int

    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        """Custom method to handle datetime serialization"""
        data = obj.__dict__.copy()
        if 'created_at' in data and data['created_at']:
            data['created_at'] = data['created_at'].isoformat()
        if 'updated_at' in data and data['updated_at']:
            data['updated_at'] = data['updated_at'].isoformat()
        return cls(**data)

class BlogPostCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    meta_description: Optional[str] = None
    featured_image: Optional[str] = None
    published: bool = True
    author_name: str = "ResumeAI Team"
    category: Optional[str] = None
    tags: Optional[str] = None
    read_time_minutes: int = 5

@router.post("/posts", response_model=BlogPostResponse)
def create_blog_post(
    post: BlogPostCreate,
    email: str = Depends(get_verified_email),
    db: Session = Depends(get_db)
):
    """Create a new blog post - only accessible to dxdelvin@gmail.com"""
    # Only allow dxdelvin@gmail.com to create blog posts
    if email != "dxdelvin@gmail.com":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if slug already exists
    existing_post = db.query(BlogPost).filter(BlogPost.slug == post.slug).first()
    if existing_post:
        raise HTTPException(status_code=400, detail="A post with this slug already exists")
    
    # Create new blog post
    new_post = BlogPost(**post.dict())
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return BlogPostResponse.from_orm(new_post)

@router.get("/posts", response_model=List[BlogPostResponse])
def get_blog_posts(
    published_only: bool = True,
    category: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get blog posts with optional filtering"""
    try:
        query = db.query(BlogPost)
        
        if published_only:
            query = query.filter(BlogPost.published == True)
        
        if category:
            query = query.filter(BlogPost.category == category)
        
        posts = query.order_by(BlogPost.created_at.desc()).offset(offset).limit(limit).all()
        
        return [BlogPostResponse.from_orm(post) for post in posts]
    except Exception as e:
        print(f"Error in get_blog_posts: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/posts/{slug}", response_model=BlogPostResponse)
def get_blog_post(slug: str, db: Session = Depends(get_db)):
    """Get a single blog post by slug"""
    try:
        post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
        
        if not post:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        return BlogPostResponse.from_orm(post)
    except Exception as e:
        print(f"Error in get_blog_post: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Get all unique categories"""
    try:
        categories = db.query(BlogPost.category).filter(
            BlogPost.category.isnot(None),
            BlogPost.published == True
        ).distinct().all()
        
        return {"categories": [cat[0] for cat in categories if cat[0]]}
    except Exception as e:
        print(f"Error in get_categories: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/featured", response_model=List[BlogPostResponse])
def get_featured_posts(limit: int = 3, db: Session = Depends(get_db)):
    """Get featured blog posts"""
    try:
        posts = db.query(BlogPost).filter(
            BlogPost.published == True,
            BlogPost.featured_image.isnot(None)
        ).order_by(BlogPost.created_at.desc()).limit(limit).all()
        
        return [BlogPostResponse.from_orm(post) for post in posts]
    except Exception as e:
        print(f"Error in get_featured_posts: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
