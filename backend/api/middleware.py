# backend/api/middleware.py

from urllib.parse import parse_qs
from channels.db import database_sync_to_async # Crucial for DB access
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
# Use rest_framework_simplejwt's utilities for token validation
from rest_framework_simplejwt.tokens import AccessToken 
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()

@database_sync_to_async # Decorator to allow async calling of sync ORM code
def get_user_from_token(token_key):
    """
    Attempts to authenticate a user based on the provided JWT access token key.
    Handles token validation and user lookup asynchronously.
    """
    try:
        # Validate the token using Simple JWT's AccessToken class
        access_token = AccessToken(token_key)
        # Verify the token is valid (checks expiry, signature etc.)
        access_token.verify() 
        # Get the user ID from the validated token payload
        user_id = access_token.payload.get('user_id') 
        if user_id is None:
            print("TokenAuthMiddleware: Token payload missing user_id")
            return AnonymousUser()

        # Fetch the user from the database
        user = User.objects.get(id=user_id)
        print(f"TokenAuthMiddleware: Authenticated user: {user}")
        return user
    except (InvalidToken, TokenError) as e:
        # Handle invalid token errors (expired, malformed, etc.)
        print(f"TokenAuthMiddleware: Invalid token - {e}")
        return AnonymousUser()
    except User.DoesNotExist:
        print(f"TokenAuthMiddleware: User specified in token does not exist (ID: {user_id})")
        return AnonymousUser()
    except Exception as e:
        # Catch any other unexpected errors during token processing
        print(f"TokenAuthMiddleware: Unexpected error during token validation: {e}")
        return AnonymousUser()

class TokenAuthMiddleware:
    """
    Custom ASGI middleware for Django Channels to authenticate users via
    a JWT token provided in the query string.
    """
    def __init__(self, app):
        # Store the ASGI application callable next in the chain
        self.app = app

    async def __call__(self, scope, receive, send):
        # Look for 'token' key in the query string for WebSocket connections
        query_string = scope.get('query_string', b'').decode('utf-8')
        parsed_query = parse_qs(query_string)
        token = parsed_query.get('token', [None])[0] # Get the first token value if present

        print(f"TokenAuthMiddleware: Incoming scope path: {scope.get('path')}") # Debug log

        if token:
            print(f"TokenAuthMiddleware: Token found in query string. Attempting auth...") # Debug log
            # Asynchronously get the user associated with the token
            scope['user'] = await get_user_from_token(token) 
        else:
            # If no token, default to AnonymousUser
            print("TokenAuthMiddleware: No token found in query string.") # Debug log
            scope['user'] = AnonymousUser()

        # Continue processing the request down the middleware chain
        return await self.app(scope, receive, send)