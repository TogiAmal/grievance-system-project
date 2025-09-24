# backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # This line correctly routes all API calls to your api app
    path('api/', include('api.urls')),

    # The catch-all route has been removed to fix the error.
]