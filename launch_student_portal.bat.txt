
@echo off
title SmartLab Monitor Startup

cd /d "%~dp0"

echo Starting SmartLab Monitor...

REM Start Flask backend
start "SmartLab Backend" /min cmd /c "call start_backend.bat"

REM Wait for the backend
timeout /t 10 /nobreak >nul

REM Open Student Portal in Chrome full screen
start "" chrome.exe --kiosk "http://127.0.0.1:5000/student.html"

exit
