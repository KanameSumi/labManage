from .base import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'app',
        'USER': 'root',
        'PASSWORD': 'password',
        'HOST': 'host.docker.internal',
        'PORT': '53307',
        'ATOMIC_REQUESTS': True
    }
}