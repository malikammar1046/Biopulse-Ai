@echo off
cd /d "%~dp0\backend"
echo ====================================================
echo Starting OvaSense Intelligence Backend Server...
echo ====================================================
python manage.py runserver 127.0.0.1:8000
pause
