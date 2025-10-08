# api/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Add '^' to the beginning of the patterns to match the start of the path
    re_path(r'^ws/chat/(?P<grievance_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'^ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]