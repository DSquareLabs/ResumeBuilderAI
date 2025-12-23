"""
Server-side token verification using Google's public keys.
This module verifies Google ID Tokens (JWTs) to extract the authenticated user's email.
"""

from fastapi import HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token
import os

# Google OAuth Client ID (from your .env file)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

def verify_google_token(token: str) -> dict:
    """
    Verify Google ID Token and extract user information.
    
    Args:
        token: The JWT token from the Authorization header
        
    Returns:
        dict: User information including email, name, picture
        
    Raises:
        HTTPException: If token is invalid or verification fails
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_CLIENT_ID not configured on server"
        )
    
    try:
        # Verify the token against Google's public keys
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        # Verify the token is not expired and other validations are passed
        # verify_oauth2_token handles most of this automatically
        
        return idinfo
    
    except ValueError as e:
        # Token is invalid
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        # Other verification errors (network, etc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed",
            headers={"WWW-Authenticate": "Bearer"}
        )


def extract_email_from_token(token: str) -> str:
    """
    Extract email from verified Google token.
    
    Args:
        token: The JWT token from the Authorization header
        
    Returns:
        str: The verified email address
    """
    idinfo = verify_google_token(token)
    email = idinfo.get("email")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain email claim"
        )
    
    return email
