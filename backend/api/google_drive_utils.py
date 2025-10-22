import os
import tempfile
import logging
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.errors import HttpError
from dotenv import load_dotenv
from django.conf import settings
from io import BytesIO # Use BytesIO to avoid temp files

load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/drive']
CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
REFRESH_TOKEN = os.environ.get('REFRESH_TOKEN')
PARENT_ID = os.environ.get('FOLDER_ID') # Folder ID from .env

logger = logging.getLogger(__name__)
_drive_service = None

def get_drive_service():
    """Authenticates and returns the Drive API service client."""
    global _drive_service
    if _drive_service:
        return _drive_service

    if not all([CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN]):
        logger.error("Drive API Error: CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN is missing from .env")
        return None

    creds = Credentials.from_authorized_user_info(
        info={
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'refresh_token': REFRESH_TOKEN,
            'token_uri': 'https://oauth2.googleapis.com/token'
        },
        scopes=SCOPES
    )
    
    try:
        service = build('drive', 'v3', credentials=creds, cache_discovery=False)
        logger.info("Google Drive service built successfully.")
        _drive_service = service
        return service
    except HttpError as error:
        logger.error(f'Google Drive service build error: {error}')
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred building Drive service: {e}")
        return None

def upload_file_and_get_link(file_object, filename):
    """
    Uploads a Django UploadedFile, makes public, returns webViewLink.
    This version avoids temp files by using MediaIoBaseUpload.
    """
    service = get_drive_service()
    if not service:
        logger.error("Cannot upload: Drive service is unavailable.")
        return None
    if not PARENT_ID:
        logger.error("Cannot upload: FOLDER_ID (PARENT_ID) is not set in .env")
        return None

    file_metadata = {'name': filename, 'parents': [PARENT_ID]}
    buffer = None
    
    try:
        # Read the file content into a BytesIO buffer
        file_content = file_object.read()
        buffer = BytesIO(file_content)
        
        media_body = MediaIoBaseUpload(
            buffer,
            mimetype=file_object.content_type or 'application/octet-stream',
            resumable=True
        )
        
        logger.info(f"Uploading '{filename}' ({len(file_content)} bytes) to Drive folder '{PARENT_ID}'.")
        
        request = service.files().create(
            body=file_metadata,
            media_body=media_body,
            fields='id' # Get ID first
        )
        
        response = None
        while response is None:
            status, response = request.next_chunk()
            if status: logger.info(f"Upload progress: {int(status.progress() * 100)}%")

        file_id = response.get('id')
        logger.info(f"File uploaded. ID: {file_id}")
        if not file_id: return None

        # Make public (from your generate_public_url function)
        try:
            permission = {'role': 'reader', 'type': 'anyone'}
            service.permissions().create(fileId=file_id, body=permission).execute()
            logger.info(f"Public read permission set for {file_id}.")
        except HttpError as error:
            logger.error(f"Error setting permissions for {file_id}: {error}")
            pass # Continue anyway, link might still be accessible

        # Get links (from your generate_public_url function)
        try:
            file_meta = service.files().get(
                fileId=file_id,
                fields='webViewLink, webContentLink' # Get both links
            ).execute()
            
            # Use webViewLink as it's more reliable for viewing
            view_link = file_meta.get('webViewLink') 
            logger.info(f"Returning webViewLink for {file_id}: {view_link}")
            return view_link
        except HttpError as error:
             logger.error(f"Error fetching webViewLink for {file_id}: {error}")
             return None

    except HttpError as error:
        logger.error(f"HTTP error during upload: {error}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}")
        return None
    finally:
         if buffer: buffer.close() # Clean up the buffer