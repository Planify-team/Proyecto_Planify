from .base import *  # noqa
import dj_database_url
from decouple import config

DEBUG = False

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1").split(",") + ["healthcheck.railway.app"]

_db_url = config("DATABASE_URL", default="")
if _db_url:
    DATABASES = {"default": dj_database_url.parse(_db_url, conn_max_age=600, ssl_require=True)}

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
