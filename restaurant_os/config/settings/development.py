from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# CORS: Allow Next.js dev server
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

# Show SQL queries in development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',  # Log every SQL query
        },
    },
}