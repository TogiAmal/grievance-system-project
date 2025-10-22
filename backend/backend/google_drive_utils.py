# backend/api/google_drive_utils.py
import os.path
from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.errors import HttpError
from io import BytesIO
from django.conf import settings
import logging

logger = logging.getLogger(__name__)
SCOPES = ['https://www.googleapis.com/auth/drive']
_drive_service = None # Cache the service

def get_drive_service():
    """Authenticates and returns the Drive API service client."""
    global _drive_service
    if _drive_service:
        return _drive_service

    creds = None
    if not settings.GOOGLE_DRIVE_CREDENTIALS_FILE or not os.path.exists(settings.GOOGLE_DRIVE_CREDENTIALS_FILE):
        logger.error("Error: Google Drive credentials file path not set or file not found.")
        return None
    try:
        creds = Credentials.from_service_account_file(
            settings.GOOGLE_DRIVE_CREDENTIALS_FILE, scopes=SCOPES)
    except Exception as e:
         logger.error(f"Error loading credentials from service account file: {e}")
         return None

    try:
        # Using cache_discovery=False might help avoid some intermittent errors
        service = build('drive', 'v3', credentials=creds, cache_discovery=False)
        logger.info("Google Drive service built successfully.")
        _drive_service = service # Cache it
        return service
    except HttpError as error:
        logger.error(f"An error occurred building Drive service: {error}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred building Drive service: {e}")
        return None

def upload_file_to_drive(file_object, filename):
    """Uploads Django UploadedFile, makes public, returns webViewLink."""
    service = get_drive_service()
    if not service:
        logger.error("Cannot upload file: Drive service is unavailable.")
        return None
    folder_id = settings.GOOGLE_DRIVE_FOLDER_ID
    if not folder_id:
         logger.error("Cannot upload file: GOOGLE_DRIVE_FOLDER_ID is not set.")
         return None

    file_metadata = {'name': filename, 'parents': [folder_id]}
    buffer = None # Define buffer outside try/finally
    try:
        file_content = file_object.read()
        buffer = BytesIO(file_content)
        media_body = MediaIoBaseUpload(
            buffer,
            mimetype=file_object.content_type or 'application/octet-stream',
            resumable=True
        )
        logger.info(f"Uploading '{filename}' ({len(file_content)} bytes) to Drive folder '{folder_id}'.")
        request = service.files().create(
            body=file_metadata,
            media_body=media_body,
            fields='id' # Only need ID initially
        )
        response = None
        while response is None:
            status, response = request.next_chunk()
            if status: logger.info(f"Upload progress: {int(status.progress() * 100)}%")

        file_id = response.get('id')
        logger.info(f"File uploaded. ID: {file_id}")
        if not file_id: return None

        # Make public
        try:
            permission = {'type': 'anyone', 'role': 'reader'}
            service.permissions().create(fileId=file_id, body=permission).execute()
            logger.info(f"Public read permission set for {file_id}.")
        except HttpError as error:
            logger.error(f"Error setting permissions for {file_id}: {error}")
            # Decide: return None, or return link anyway? Let's return link.
            pass

        # Get the webViewLink
        try:
            file_meta = service.files().get(fileId=file_id, fields='webViewLink').execute()
            view_link = file_meta.get('webViewLink')
            logger.info(f"Returning webViewLink for {file_id}: {view_link}")
            return view_link
        except HttpError as error:
             logger.error(f"Error fetching webViewLink for {file_id}: {error}")
             return None # Or construct download link? webViewLink is simpler.

    except HttpError as error:
        logger.error(f"HTTP error during upload: {error}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}")
        return None
    finally:
         if buffer: buffer.close() # Ensure buffer is closed