from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import ChatMessage, CustomUser

@receiver(post_save, sender=ChatMessage)
def send_notification_on_new_message(sender, instance, created, **kwargs):
    if created:
        print("--- NEW CHAT MESSAGE SIGNAL FIRED ---")
        channel_layer = get_channel_layer()
        grievance = instance.grievance
        sender_user = instance.user
        
        recipients = []
        
        if sender_user.role in ['admin', 'grievance_cell']:
            recipients.append(grievance.submitted_by)
        else:
            recipients.extend(
                CustomUser.objects.filter(role__in=['admin', 'grievance_cell'])
            )

        for recipient in recipients:
            if recipient and recipient.is_active:
                transaction.on_commit(
                    lambda: async_to_sync(channel_layer.group_send)(
                        f'notifications_{recipient.id}',
                        {
                            # CORRECTED TYPE: Remove the dot
                            'type': 'send_notification',
                            'message': f'You have a new message regarding grievance #{grievance.id}'
                        }
                    )
                )