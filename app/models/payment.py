from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)  # Linked to user
    amount = Column(Float)              # e.g. 4.99
    currency = Column(String)           # e.g. 'eur'
    credits_added = Column(Integer)     # e.g. 250
    plan_name = Column(String)          # e.g. 'popular'
    stripe_session_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)