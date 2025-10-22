import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/drive']
CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
REFRESH_TOKEN = os.environ.get('REFRESH_TOKEN')
PARENT_ID = os.environ.get('FOLDER_ID')

def get_drive_service():
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
        return build('drive', 'v3', credentials=creds)
    except HttpError as error:
        print(f'Google Drive error: {error}')
        return None

def upload_file_to_drive(file_path, filename):
    service = get_drive_service()
    if not service:
        return None

    try:
        file_metadata = {'name': filename, 'parents': [PARENT_ID]}
        media = MediaFileUpload(file_path, mimetype='application/pdf')
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()
        return file.get('id')
    except HttpError as error:
        print(f'Upload error: {error}')
        return None

def generate_public_url(file_id):
    service = get_drive_service()
    if not service:
        return None

    try:
        service.permissions().create(
            fileId=file_id,
            body={'role': 'reader', 'type': 'anyone'}
        ).execute()
        file = service.files().get(
            fileId=file_id,
            fields='webViewLink, webContentLink'
        ).execute()
        return {
            'view_url': file.get('webViewLink'),
            'download_url': file.get('webContentLink')
        }
    except HttpError as error:
        print(f'Permission error: {error}')
        return None