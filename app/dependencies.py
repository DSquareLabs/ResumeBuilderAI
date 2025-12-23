"""
FastAPI dependencies for authentication.
These provide email extraction from Authorization headers across all endpoints.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import os

# Security scheme for Swagger documentation
bearer = HTTPBearer(description="Google ID Token (JWT)")


def get_verified_email(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    """
    FastAPI dependency that extracts and verifies email from Authorization header.
    
    Usage in endpoints:
        @router.post("/api/some-endpoint")
        def my_endpoint(data: MyModel, email: str = Depends(get_verified_email)):
            # email is now guaranteed to be verified from Google token
            ...
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        str: Verified email address
        
    Raises:
        HTTPException: If token is missing, invalid, or verification fails
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    try:
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), os.getenv("GOOGLE_CLIENT_ID")
        )
        return idinfo["email"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
