from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.profile import Profile

REFINE_COST = 0.5  # ✅ SINGLE SOURCE OF TRUTH


def has_credits(db: Session, email: str) -> bool:
    user = db.query(Profile).filter(Profile.email == email).first()
    return bool(user and user.credits > 0)


def deduct_credit(db: Session, email: str):
    user = db.query(Profile).filter(Profile.email == email).first()
    if user:
        user.credits -= 1
        db.commit()


def add_credits(db: Session, email: str, amount: int):
    user = db.query(Profile).filter(Profile.email == email).first()
    if user:
        user.credits += amount
        db.commit()


def get_credits(db: Session, email: str) -> int:
    user = db.query(Profile).filter(Profile.email == email).first()
    return user.credits if user else 0


def deduct_refine_credit(db: Session, email: str) -> float:
    user = db.query(Profile).filter(Profile.email == email).first()

    if not user or user.credits is None or user.credits < REFINE_COST:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    user.credits -= REFINE_COST
    db.commit()
    db.refresh(user)

    return user.credits
