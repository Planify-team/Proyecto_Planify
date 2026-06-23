#!/bin/sh
set -e

echo "=== Starting Planify backend ==="
echo "PORT=$PORT"

python manage.py migrate --noinput
python manage.py ensure_superuser || true
python manage.py loaddata fixtures/places_curated.json || true

echo "=== Starting gunicorn on port ${PORT:-8000} ==="
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 1 --timeout 120
