#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "
import psycopg, os
psycopg.connect(
    dbname=os.environ['POSTGRES_DB'],
    user=os.environ['POSTGRES_USER'],
    password=os.environ['POSTGRES_PASSWORD'],
    host=os.environ['POSTGRES_HOST'],
    port=os.environ.get('POSTGRES_PORT', '5432'),
)
print('Database ready.')
" 2>/dev/null; do
    sleep 1
done

echo "Running migrations..."
python manage.py migrate --noinput

if [ "${DEBUG}" != "True" ] && [ "${DEBUG}" != "true" ] && [ "${DEBUG}" != "1" ]; then
    echo "Collecting static files..."
    python manage.py collectstatic --noinput
fi

echo "Starting server..."
exec "$@"
