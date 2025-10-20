from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        from django.db.models.signals import post_save
        from .models import ChatMessage, Grievance, CustomUser
        from .signals import (
            send_chat_notification, 
            send_profile_update_notification, 
            create_user_conversation
        )
        
        print("--- ApiConfig.ready() IS RUNNING ---")
        
        post_save.connect(send_chat_notification, sender=ChatMessage)
        post_save.connect(send_profile_update_notification, sender=CustomUser)
        post_save.connect(create_user_conversation, sender=CustomUser)