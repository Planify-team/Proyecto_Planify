#!/bin/sh
set -e

echo "=== PORT=$PORT ==="
echo "=== DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE ==="
echo "=== DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO) ==="

echo "--- migrate ---"
python manage.py migrate --noinput

echo "--- testing django import ---"
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
import django
django.setup()
print('Django setup OK')
"

echo "--- starting gunicorn on port $PORT ---"
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 1 --timeout 120 --log-level debug
