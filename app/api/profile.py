from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.profile import Profile

router = APIRouter()

class ProfileRequest(BaseModel):
    email: str
    full_name: str
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    portfolio: str | None = None

@router.get("/profile")
def get_profile(email: str):
    db: Session = SessionLocal()

    profile = db.query(Profile).filter(Profile.email == email).first()

    db.close()

    if not profile:
        return None

    return profile

@router.post("/profile")
def save_profile(data: ProfileRequest):
    db: Session = SessionLocal()

    profile = db.query(Profile).filter(Profile.email == data.email).first()

    if profile:
        # update existing
        profile.full_name = data.full_name
        profile.phone = data.phone
        profile.location = data.location
        profile.linkedin = data.linkedin
        profile.portfolio = data.portfolio
    else:
        # create new
        profile = Profile(**data.dict())
        db.add(profile)

    db.commit()
    db.refresh(profile)
    db.close()

    return {"message": "Profile saved successfully"}
