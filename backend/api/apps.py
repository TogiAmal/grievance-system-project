# api/apps.py
from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        from django.db.models.signals import post_save
        # Import the model and the function
        from .models import ChatMessage
        from .signals import send_notification_on_new_message
        
        print("--- ApiConfig.ready() IS RUNNING ---")
        
        # Manually connect the signal
        post_save.connect(send_notification_on_new_message, sender=ChatMessage)