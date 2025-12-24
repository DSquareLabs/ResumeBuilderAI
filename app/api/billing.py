import os
import stripe
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from fastapi import Request
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_verified_email
from app.models.profile import Profile
from app.models.payment import Payment

# Stripe setup
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter(prefix="/api/billing", tags=["billing"])

# 🔒 Credit packs (single source of truth)
CREDIT_PACKS = {
    "basic": {
        "price_id": "price_1ShVSu7n4jiFDpJAU3hvl7Ev",
        "credits": 80
    },
    "popular": {
        "price_id": "price_1ShW3G7n4jiFDpJAx9e2gs2n",
        "credits": 250
    },
    "pro": {
        "price_id": "price_1ShVUG7n4jiFDpJAq3yHMaGE",
        "credits": 500
    }
}

class CheckoutRequest(BaseModel):
    plan: str


@router.post("/create-checkout-session")
def create_checkout_session(
    data: CheckoutRequest,
    email: str = Depends(get_verified_email),
    db: Session = Depends(get_db)
):
    """
    Create Stripe checkout session. Email is extracted from verified Google token.
    🔒 SECURITY: Email comes from verified JWT token, never from request body.
    """
    plan = data.plan

    if plan not in CREDIT_PACKS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    user = db.query(Profile).filter(Profile.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    price_id = CREDIT_PACKS[plan]["price_id"]

    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        line_items=[{
            "price": price_id,
            "quantity": 1
        }],
        customer_email=email,
        success_url=f"http://localhost:8000/builder?payment=success&plan={plan}",
        cancel_url="http://localhost:8000/pricing?payment=cancelled",
        metadata={
            "pack_id": plan,
            "email": email
        }
    )

    return {"checkout_url": session.url}





@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            os.getenv("STRIPE_WEBHOOK_SECRET")
        )
    except Exception:
        return {"status": "invalid signature"}

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        
        email = metadata.get("email")
        pack_id = metadata.get("pack_id")
        
        # Get financial details
        amount_total = session.get("amount_total", 0) / 100.0  # Convert cents to dollars/euros
        currency = session.get("currency", "eur")

        if not email or not pack_id:
            return {"status": "ignored"}
            
        if pack_id not in CREDIT_PACKS:
            return {"status": "invalid pack"}

        user = db.query(Profile).filter(Profile.email == email).first()
        if not user:
            return {"status": "user not found"}

        credits_to_add = CREDIT_PACKS[pack_id]["credits"]

        # 1. Update User Credits
        user.credits = (user.credits or 0) + credits_to_add
        
        # 2. Record Payment History (NEW)
        new_payment = Payment(
            email=email,
            amount=amount_total,
            currency=currency,
            credits_added=credits_to_add,
            plan_name=pack_id,
            stripe_session_id=session.get("id")
        )
        db.add(new_payment)
        
        db.commit()

    return {"status": "ok"}
