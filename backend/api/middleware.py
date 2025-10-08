# api/middleware.py
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs

@database_sync_to_async
def get_user_from_token(token_key):
    # All Django-related imports are now inside this function
    from django.contrib.auth.models import AnonymousUser
    from rest_framework_simplejwt.tokens import AccessToken
    from api.models import CustomUser

    if token_key is None:
        return AnonymousUser()
    try:
        token = AccessToken(token_key)
        user_id = token.payload['user_id']
        return CustomUser.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        
        scope['user'] = await get_user_from_token(token)
        
        return await super().__call__(scope, receive, send)