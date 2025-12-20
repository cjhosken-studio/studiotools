@echo off
REM Ensure the script runs from its own directory
cd /d "%~dp0"

REM Run Tauri dev
npm run tauri dev
