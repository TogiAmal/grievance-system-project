# backend/backend/asgi.py

import os
import django # Import django first
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

# --- Crucial Setup ---
# 1. Set the Django settings module environment variable
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# 2. Configure Django settings and populate the app registry.
#    This MUST run before importing anything that relies on Django models/settings.
django.setup()
# --- End Crucial Setup ---

# 3. Import routing and middleware AFTER django.setup()
import api.routing # noqa
from api.middleware import TokenAuthMiddleware # noqa

# 4. Get the standard Django HTTP application handler
django_asgi_app = get_asgi_application()

# Define the main ASGI application router
application = ProtocolTypeRouter({
    # Django's ASGI application to handle traditional HTTP requests
    "http": django_asgi_app,

    # WebSocket handler, wrapped in your auth middleware
    "websocket": TokenAuthMiddleware(
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})