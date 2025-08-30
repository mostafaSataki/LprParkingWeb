@echo off
echo Killing processes using port 3000...

REM Find process ID using port 3000
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3000') do (
    echo Found process ID: %%i
    taskkill /PID %%i /F >nul 2>&1
    if errorlevel 1 (
        echo Failed to kill process %%i
    ) else (
        echo Successfully killed process %%i
    )
)

REM Alternative method using PowerShell
powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo Port 3000 cleanup completed.
pause