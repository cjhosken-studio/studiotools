@echo off
REM Ensure the script runs from its own directory
cd /d "%~dp0"

REM Install dependencies
npm install
IF ERRORLEVEL 1 (
    echo npm install failed.
    exit /b 1
)
