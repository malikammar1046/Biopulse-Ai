#!/bin/bash
set -e

# ==============================================================================
# BioPulse AI - Docker Container Startup Entrypoint
# ==============================================================================
# In the Dockerfile, WORKDIR is /app while Django manage.py is in /app/backend.
# We explicitly navigate to /app/backend to ensure Django management commands,
# settings modules, and database paths resolve correctly.
# ==============================================================================

cd /app/backend

echo "==> [BioPulse Startup] Running Django database migrations..."
python manage.py migrate --noinput

# If arguments were provided to docker run / CMD, execute them;
# otherwise default to starting the Gunicorn application server.
if [ "$#" -gt 0 ]; then
    echo "==> [BioPulse Startup] Executing custom container command: $@"
    exec "$@"
else
    echo "==> [BioPulse Startup] Starting Gunicorn application server on port 8000..."
    exec gunicorn \
        --chdir /app/backend \
        --bind 0.0.0.0:8000 \
        --workers 1 \
        --threads 2 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile - \
        config.wsgi:application
fi
