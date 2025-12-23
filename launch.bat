@echo off
REM Exit immediately if a command fails
setlocal EnableExtensions EnableDelayedExpansion

REM Get the directory of this script
set SCRIPT_DIR=%~dp0
REM Remove trailing backslash if present
if "%SCRIPT_DIR:~-1%"=="\" set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

REM Activate virtual environment
call "%SCRIPT_DIR%\.venv\Scripts\activate"

REM Extend PYTHONPATH
set PYTHONPATH=%PYTHONPATH%;%SCRIPT_DIR%\plugins\usd\installs\OpenUSD\lib\python

REM Extend PATH
set PATH=%PATH%;%SCRIPT_DIR%\plugins\usd\installs\OpenUSD\bin

REM Run the Python application
python "%SCRIPT_DIR%\src\main.py"

endlocal
