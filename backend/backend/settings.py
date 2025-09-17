"""
Django settings for backend project.
...
"""

from pathlib import Path
import os
import dj_database_url # Import for Render database configuration

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# This will be read from an environment variable on Render
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-n7yg&)%m6^3zq^=(v+r(kpkunort82x!=%z%h&f2235^j(h9vx')

# SECURITY WARNING: don't run with debug turned on in production!
# This will be 'False' on Render by default
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# ALLOWED_HOSTS will be set automatically by Render
ALLOWED_HOSTS = []
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt', 
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # Whitenoise Middleware for serving static files in production
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [], # DIRS can be empty as the frontend is separate
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database Configuration for Render
DATABASES = {
    'default': dj_database_url.config(
        # Default to your local DB for development if DATABASE_URL is not set
        default='postgres://support_admin:sjcet@1234@localhost:5432/support_desk',
        conn_max_age=600,
        ssl_require=True
    )
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    # ... (validators remain the same) ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    # Remember to add your live frontend URL here once it's deployed
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata' # Set to your local time zone
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'

# This is where collectstatic will gather all of Django's static files.
# It is required for deployment and fixes your error.
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Enable Whitenoise to serve files collected by collectstatic.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# We have removed STATICFILES_DIRS to fix the warning, as Django doesn't need to find React's files.

# --- EMAIL CONFIGURATION FOR VERIFICATION ---
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'api.CustomUser'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}