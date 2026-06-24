from .base import *  # noqa
import dj_database_url
from decouple import config

DEBUG = False

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1").split(",") + ["healthcheck.railway.app"]

_db_url = config("DATABASE_URL", default="")
if _db_url:
    DATABASES = {"default": dj_database_url.parse(_db_url, conn_max_age=600, ssl_require=True)}

# Always allow the Vercel frontend + any extra origins from env
_extra_cors = config("CORS_ALLOWED_ORIGINS", default="").split(",")
CORS_ALLOWED_ORIGINS = [o for o in _extra_cors if o] + [
    "https://planify-frontend-one.vercel.app",
    "https://planify-frontend-one-git-main-planify-frontendvercelapp.vercel.app",
]

# Fall back to in-memory cache when Redis is not provisioned (avoids 500s from DRF throttling)
_redis_url = config("REDIS_URL", default="") or config("REDIS_HOST", default="")
if not _redis_url:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
