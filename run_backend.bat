@echo off
setlocal EnableDelayedExpansion

REM Resolve script directory
set "BASE_DIR=%~dp0"

REM Locate backend directory
if exist "%BASE_DIR%backend\manage.py" (
    set "BACKEND_DIR=%BASE_DIR%backend"
) else if exist "%BASE_DIR%PMOSense\backend\manage.py" (
    set "BACKEND_DIR=%BASE_DIR%PMOSense\backend"
) else if exist "%BASE_DIR%manage.py" (
    set "BACKEND_DIR=%BASE_DIR%"
) else (
    echo [ERROR] Could not locate backend directory with manage.py!
    pause
    exit /b 1
)

cd /d "%BACKEND_DIR%"

REM Locate Python inside virtual environment
if exist "%BACKEND_DIR%\venv\Scripts\python.exe" (
    set "PYTHON_EXE=%BACKEND_DIR%\venv\Scripts\python.exe"
) else if exist "%BASE_DIR%venv\Scripts\python.exe" (
    set "PYTHON_EXE=%BASE_DIR%venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

echo ====================================================
echo Starting BioPulse AI / OvaSense Intelligence Backend...
echo Directory: %BACKEND_DIR%
echo Python:    %PYTHON_EXE%
echo ====================================================

"%PYTHON_EXE%" manage.py runserver 127.0.0.1:8000

if errorlevel 1 (
    echo.
    echo [ERROR] Backend server stopped with an error.
)

pause
