from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        from django.db.models.signals import post_save
        # Import only the models and signal functions that still exist
        from .models import ChatMessage, CustomUser
        from .signals import send_chat_notification, send_profile_update_notification
        
        print("--- ApiConfig.ready() IS RUNNING ---")
        
        # Connect the two active signals
        post_save.connect(send_chat_notification, sender=ChatMessage)
        post_save.connect(send_profile_update_notification, sender=CustomUser)