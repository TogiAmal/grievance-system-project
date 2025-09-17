# backend/urls.py

from django.contrib import admin
from django.urls import path, include, re_path # Import re_path
from django.views.generic import TemplateView # Import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # All your API-specific URLs are handled here
    path('api/', include('api.urls')),

    # ADD THIS: This "catch-all" route serves your React app.
    # It must be the LAST item in this list. It will handle '/', '/login',
    # and any other path that isn't for the admin or the API.
    re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
]