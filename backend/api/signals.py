# api/signals.py
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import ChatMessage, CustomUser, Grievance, Conversation

@receiver(post_save, sender=ChatMessage)
def send_chat_notification(sender, instance, created, **kwargs):
    if created:
        print("--- NEW CHAT MESSAGE SIGNAL FIRED ---")
        channel_layer = get_channel_layer()
        sender_user = instance.user
        # Get the conversation from the chat message
        conversation = instance.conversation
        
        recipients = []
        
        if sender_user.role in ['admin', 'grievance_cell']:
            # If an admin sends, notify the user who owns the conversation
            recipients.append(conversation.user)
        else:
            # If a student sends, notify all admins
            recipients.extend(
                CustomUser.objects.filter(role__in=['admin', 'grievance_cell'])
            )

        for recipient in recipients:
            if recipient and recipient.is_active and recipient.id != sender_user.id:
                transaction.on_commit(
                    lambda: async_to_sync(channel_layer.group_send)(
                        f'notifications_{recipient.id}',
                        {
                            'type': 'send_notification',
                            'message': f'New message from {sender_user.name}',
                            'sender_name': sender_user.name
                        }
                    )
                )

# This signal is for the chat request feature, which we removed.
# You can delete this function.
@receiver(post_save, sender=Grievance)
def send_chat_request_notification(sender, instance, created, **kwargs):
    pass

@receiver(post_save, sender=CustomUser)
def send_profile_update_notification(sender, instance, created, **kwargs):
    if not created:
        print("--- PROFILE UPDATE SIGNAL FIRED ---")
        channel_layer = get_channel_layer()
        user = instance
        image_url = user.profile_image.url if user.profile_image else None
        
        transaction.on_commit(
            lambda: async_to_sync(channel_layer.group_send)(
                f'notifications_{user.id}',
                {
                    'type': 'profile_updated',
                    'user': {
                        'id': user.id,
                        'name': user.name,
                        'profile_image': image_url
                    }
                }
            )
        )

# This signal creates a new conversation for a new user
@receiver(post_save, sender=CustomUser)
def create_user_conversation(sender, instance, created, **kwargs):
    if created and instance.role not in ['admin', 'grievance_cell']:
        Conversation.objects.create(user=instance)