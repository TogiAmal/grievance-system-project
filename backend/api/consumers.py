import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.grievance_id = self.scope['url_route']['kwargs']['grievance_id']
        self.room_group_name = f'chat_{self.grievance_id}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        
        await self.save_message(message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'user_id': self.user.id,
                'username': self.user.name
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))
    
    @database_sync_to_async
    def save_message(self, message):
        from .models import Grievance, ChatMessage
        grievance = Grievance.objects.get(id=self.grievance_id)
        ChatMessage.objects.create(user=self.user, grievance=grievance, message=message)


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return

        self.room_group_name = f'notifications_{self.user.id}'
        print(f"--- NOTIFICATION CONSUMER: User '{self.user.name}' CONNECTED to group '{self.room_group_name}' ---")

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # This function is called when a notification is sent from the signal
    async def send_notification(self, event):
        print(f"--- NOTIFICATION CONSUMER: RECEIVED message in group '{self.room_group_name}' ---")
        await self.send(text_data=json.dumps(event))