@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run.ps1" -Action dev %*
set "result=%errorlevel%"
if not defined STOCK_NO_PAUSE pause
exit /b %result%
