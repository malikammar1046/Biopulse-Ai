@echo off
cd /d "%~dp0"
echo ====================================================
echo Starting OvaSense Intelligence Backend Server...
echo ====================================================
".\venv\Scripts\python.exe" manage.py runserver 127.0.0.1:8000
pause
