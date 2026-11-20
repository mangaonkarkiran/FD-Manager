from typing import Annotated
from pathlib import Path

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from google.auth.exceptions import DefaultCredentialsError

from app.config import get_settings


bearer_scheme = HTTPBearer(auto_error=False)


def _firebase_app() -> firebase_admin.App:
    try:
        return firebase_admin.get_app()
    except ValueError:
        settings = get_settings()
        if not settings.firebase_project_id:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Firebase authentication is not configured on the server.",
            )
        service_account_path = settings.firebase_service_account_path
        try:
            if service_account_path:
                path = Path(service_account_path)
                if not path.is_file():
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="The Firebase service account file is not available on the server.",
                    )
                credential = credentials.Certificate(str(path))
            else:
                credential = credentials.ApplicationDefault()
            return firebase_admin.initialize_app(
                credential,
                options={"projectId": settings.firebase_project_id},
            )
        except (ValueError, DefaultCredentialsError) as error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Firebase server credentials are not configured correctly.",
            ) from error


def get_current_uid(
    credentials_header: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
) -> str:
    if credentials_header is None or credentials_header.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    app = _firebase_app()
    try:
        decoded_token = firebase_auth.verify_id_token(
            credentials_header.credentials,
            app=app,
            check_revoked=True,
        )
    except (
        firebase_auth.InvalidIdTokenError,
        firebase_auth.ExpiredIdTokenError,
        firebase_auth.RevokedIdTokenError,
        firebase_auth.UserDisabledError,
        firebase_auth.UserNotFoundError,
    ) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The authentication token is invalid or expired.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    except firebase_auth.CertificateFetchError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not verify the authentication token. Try again later.",
        ) from error
    except (firebase_admin.exceptions.FirebaseError, DefaultCredentialsError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not verify the authentication token. Try again later.",
        ) from error

    uid = decoded_token.get("uid")
    if not isinstance(uid, str) or not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The authentication token does not contain a valid user.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return uid
