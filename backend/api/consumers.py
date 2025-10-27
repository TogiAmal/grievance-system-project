# backend/api/consumers.py
import json
import time # Added for notification consumer example
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
# Import models *outside* the async function for clarity
from .models import Conversation, ChatMessage, CustomUser

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get user from scope (populated by middleware like TokenAuthMiddleware)
        self.user = self.scope.get('user', None)
        print(f"ChatConsumer: Attempting connect. User from scope: {self.user}") # <-- Debug Log

        # Check authentication first
        if not self.user or not self.user.is_authenticated:
            print("ChatConsumer: User not authenticated. Closing connection.") # <-- Debug Log
            await self.close()
            return

        # Get conversation ID from URL kwargs
        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id', None)
        print(f"ChatConsumer: Conversation ID from URL: {self.conversation_id}") # <-- Debug Log

        if not self.conversation_id:
            print("ChatConsumer: Conversation ID missing in URL. Closing connection.") # <-- Debug Log
            await self.close()
            return

        # Define the group name specific to this conversation
        self.room_group_name = f'chat_{self.conversation_id}'
        print(f"ChatConsumer: Set room group name: {self.room_group_name}") # <-- Debug Log

        # --- Permission Check ---
        # Check if the authenticated user is allowed to join this specific chat conversation.
        try:
            print("ChatConsumer: Checking permissions...") # <-- Debug Log
            has_permission = await self.check_chat_permissions()
            if not has_permission:
                print(f"ChatConsumer: Permission DENIED for user {self.user.id} on convo {self.conversation_id}. Closing.") # <-- Debug Log
                await self.close()
                return
            print(f"ChatConsumer: Permission GRANTED for user {self.user.id}.") # <-- Debug Log
        except Exception as e:
            # Catch any unexpected error during the permission check
            print(f"ChatConsumer: EXCEPTION during permission check: {e}. Closing.") # <-- Debug Log
            await self.close()
            return
        # --- End Permission Check ---

        # Join the conversation's channel group
        try:
            print(f"ChatConsumer: Adding channel {self.channel_name} to group {self.room_group_name}") # <-- Debug Log
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            print("ChatConsumer: Successfully added to group.") # <-- Debug Log
        except Exception as e:
            # Catch errors during group_add (e.g., Redis connection issue)
            print(f"ChatConsumer: EXCEPTION during group_add: {e}. Closing.") # <-- Debug Log
            await self.close()
            return

        # Accept the WebSocket connection
        print("ChatConsumer: Accepting connection.") # <-- Debug Log
        await self.accept()
        print("ChatConsumer: Connection accepted successfully.") # <-- Debug Log

    async def disconnect(self, close_code):
        print(f"ChatConsumer: Disconnecting channel {self.channel_name} from group {getattr(self, 'room_group_name', 'N/A')}") # <-- Debug Log
        # Leave room group - Use getattr for safety in case room_group_name wasn't set (e.g., connect failed early)
        if hasattr(self, 'room_group_name'):
            try:
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
                print("ChatConsumer: Successfully discarded from group.") # <-- Debug Log
            except Exception as e:
                # Log errors during group_discard (less critical than connect errors)
                print(f"ChatConsumer: EXCEPTION during group_discard: {e}") # <-- Debug Log
        print(f"ChatConsumer: Disconnected with code {close_code}") # <-- Debug Log

    async def receive(self, text_data):
        print(f"ChatConsumer: Received raw data: {text_data}") # <-- Debug Log
        try:
            # Attempt to parse the incoming JSON data
            data = json.loads(text_data)
            # Expecting a structure like {'message': 'The message text'}
            message_text = data.get('message', None)

            # Validate the message content
            if not message_text or not isinstance(message_text, str) or not message_text.strip():
                print("ChatConsumer: Received invalid or empty message content.") # <-- Debug Log
                # Optionally send an error back to the client
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'Invalid message content.'}))
                return

            print(f"ChatConsumer: Parsed message: '{message_text.strip()}'") # <-- Debug Log

            # Save the message to the database asynchronously
            print("ChatConsumer: Attempting to save message...") # <-- Debug Log
            saved_message_info = await self.save_message(message_text.strip()) # Use strip() to remove leading/trailing whitespace

            # Check if saving was successful
            if not saved_message_info:
                 print("ChatConsumer: Failed to save message (save_message returned None).") # <-- Debug Log
                 await self.send(text_data=json.dumps({'type': 'error', 'message': 'Failed to save message.'}))
                 return
            print(f"ChatConsumer: Message saved (ID: {saved_message_info['id']}).") # <-- Debug Log

            # Prepare user data for the broadcast payload
            user_data = {
                'id': self.user.id,
                'name': self.user.name or self.user.username, # Use name, fallback to username
                 # Safely get profile image URL - check if image field exists and has a value
                 'profile_image': self.user.profile_image.url if hasattr(self.user, 'profile_image') and self.user.profile_image else None
            }

            # Prepare the full payload structure expected by the frontend
            broadcast_payload = {
                 'id': saved_message_info['id'],          # Message ID
                 'user': user_data,                       # User details object
                 'message': saved_message_info['message'], # The message text
                 'timestamp': saved_message_info['timestamp'], # Timestamp from saved object
            }

            # Send the message to the room group (broadcast)
            print(f"ChatConsumer: Broadcasting message to group {self.room_group_name}") # <-- Debug Log
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message', # This key calls the 'chat_message' method below
                    'payload': broadcast_payload # Send the structured data
                }
            )
            print("ChatConsumer: Broadcast sent.") # <-- Debug Log

        # Handle potential errors during receive
        except json.JSONDecodeError:
            print("ChatConsumer: Received invalid JSON.") # <-- Debug Log
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'Invalid JSON format.'}))
        except KeyError as e:
             print(f"ChatConsumer: Received JSON missing expected key: {e}") # <-- Debug Log
             await self.send(text_data=json.dumps({'type': 'error', 'message': f"JSON missing '{e}' key."}))
        except Exception as e:
             # Catch any other unexpected errors during processing
             print(f"ChatConsumer: EXCEPTION during receive: {e}") # <-- Debug Log
             await self.send(text_data=json.dumps({'type': 'error', 'message': 'An internal error occurred while processing your message.'}))


    # Method called when a message is received from the channel group layer
    async def chat_message(self, event):
        payload = event.get('payload', None)
        print(f"ChatConsumer: Handling broadcast event. Payload: {payload}") # <-- Debug Log
        if payload:
            # Send the structured payload to the WebSocket client
            print("ChatConsumer: Sending message payload to client.") # <-- Debug Log
            await self.send(text_data=json.dumps({
                'type': 'chat_message', # Let frontend know this is a chat message
                'payload': payload      # The actual message data
            }))
            print("ChatConsumer: Message payload sent to client.") # <-- Debug Log
        else:
             # This shouldn't happen if group_send is always correct
             print("ChatConsumer: Received chat_message event with missing payload.") # <-- Debug Log

    # --- Database Operations ---

    @database_sync_to_async
    def check_chat_permissions(self):
        """
        Checks if the current user has permission to access the chat.
        Allows the conversation owner and admin/grievance_cell roles.
        Runs in a sync context suitable for Django ORM.
        """
        try:
            print(f"ChatConsumer DB Check: Looking for Conversation {self.conversation_id}") # <-- Debug Log
            # Fetch the conversation and its related user in one query
            conversation = Conversation.objects.select_related('user').get(id=self.conversation_id)
            print(f"ChatConsumer DB Check: Found conversation belonging to user ID {conversation.user.id} ({conversation.user.username})") # <-- Debug Log

            # Check if the connected user (self.user) is the owner OR has a privileged role
            is_owner = self.user.id == conversation.user.id
            is_privileged = self.user.role in ['admin', 'grievance_cell']

            if is_owner or is_privileged:
                print(f"ChatConsumer DB Check: Permission GRANTED (User: {self.user.id}, Role: {self.user.role}, Is Owner: {is_owner}, Is Privileged: {is_privileged})") # <-- Debug Log
                return True
            else:
                print(f"ChatConsumer DB Check: Permission DENIED (User: {self.user.id}, Role: {self.user.role}, Is Owner: {is_owner}, Is Privileged: {is_privileged})") # <-- Debug Log
                return False
        except Conversation.DoesNotExist:
            # Handle case where the conversation ID is invalid
            print(f"ChatConsumer DB Check: Conversation {self.conversation_id} DoesNotExist.") # <-- Debug Log
            return False
        except Exception as e:
            # Log any other unexpected database errors
            print(f"ChatConsumer DB Check: EXCEPTION during permission check: {e}") # <-- Debug Log
            return False # Deny permission on unexpected errors

    @database_sync_to_async
    def save_message(self, message_text):
        """
        Saves a chat message to the database.
        Returns a dictionary with message details or None on failure.
        Runs in a sync context suitable for Django ORM.
        """
        try:
            print(f"ChatConsumer DB Save: Attempting to save message for convo {self.conversation_id} by user {self.user.id} ({self.user.username})") # <-- Debug Log
            # Fetch the conversation instance to link the message to
            conversation_instance = Conversation.objects.get(id=self.conversation_id)
            # self.user is the authenticated user instance from the scope
            new_msg = ChatMessage.objects.create(
                user=self.user,
                conversation=conversation_instance,
                message=message_text
            )
            print(f"ChatConsumer DB Save: Message saved successfully (ID: {new_msg.id}).") # <-- Debug Log
            # Return details needed for the broadcast payload
            return {
                'id': new_msg.id,
                'message': new_msg.message,
                'timestamp': new_msg.timestamp.isoformat() # Use standard ISO format
            }
        except Conversation.DoesNotExist:
             # Handle error if the conversation doesn't exist when trying to save
             print(f"ChatConsumer DB Save: ERROR - Conversation {self.conversation_id} not found.") # <-- Debug Log
             return None
        except Exception as e:
            # Log any other errors during the database operation
            print(f"ChatConsumer DB Save: EXCEPTION during message save: {e}") # <-- Debug Log
            return None


# --- NotificationConsumer ---
# (Using the version from your last code snippet, with added basic logging)
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user', None)
        print(f"NotificationConsumer: Attempting connect. User: {self.user}") # <-- ADDED

        if not self.user or not self.user.is_authenticated:
            print("NotificationConsumer: User not authenticated. Closing.") # <-- ADDED
            await self.close()
            return

        # Define group name based on role or path
        # Example: Separate group for admins/GC members
        if self.user.role in ['admin', 'grievance_cell']:
             self.room_group_name = "admin_notifications" # Specific group for admins
        else:
             # Example: Group per user ID (more scalable but requires targeted sending)
             # self.room_group_name = f"user_{self.user.id}_notifications"
             # Example: Simple group for all regular users
             self.room_group_name = f"user_notifications_{self.user.id}" # User-specific seems better for targeted updates


        print(f"NotificationConsumer: Joining group: {self.room_group_name}") # <-- ADDED
        try:
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            print(f"NotificationConsumer: Connection accepted for group {self.room_group_name}.") # <-- ADDED
        except Exception as e:
             print(f"NotificationConsumer: EXCEPTION during group_add/accept: {e}. Closing.") # <-- ADDED
             await self.close()


    async def disconnect(self, close_code):
        print(f"NotificationConsumer: Disconnecting from group {getattr(self, 'room_group_name', 'N/A')}") # <-- ADDED
        if hasattr(self, 'room_group_name'):
             try:
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
             except Exception as e:
                 print(f"NotificationConsumer: EXCEPTION during group_discard: {e}") # <-- ADDED
        print(f"NotificationConsumer: Disconnected with code {close_code}") # <-- ADDED

    # Usually notifications are sent *from* the server, not received *to* it via WebSocket
    async def receive(self, text_data):
        print(f"NotificationConsumer: Received data (usually not expected): {text_data}") # <-- ADDED
        pass # Not typically used for server-sent notifications

    # This method is called when a message is sent to the group (e.g., from signals.py)
    # The 'type' in group_send must match this method name ('notify')
    async def notify(self, event):
        message_payload = event.get('payload', {})
        # Use a more descriptive key for the event type coming from the signal
        message_type = event.get('event_type', 'generic_notification')
        print(f"NotificationConsumer: Handling broadcast event. Type: {message_type}, Payload: {message_payload}") # <-- ADDED

        # Send the structured data to the WebSocket client
        print("NotificationConsumer: Sending notification payload to client.") # <-- ADDED
        try:
            await self.send(text_data=json.dumps({
                'type': message_type, # Pass the specific type to the frontend
                'payload': message_payload
            }))
            print("NotificationConsumer: Notification sent to client.") # <-- ADDED
        except Exception as e:
             print(f"NotificationConsumer: EXCEPTION during send: {e}") # <-- ADDED