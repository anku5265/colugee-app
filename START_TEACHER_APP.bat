@echo off
echo ========================================
echo Starting Teacher App
echo ========================================
echo.

cd teacher-app

echo Step 1: Starting Teacher Backend (Port 3002)...
start "Teacher Backend" cmd /k "cd backend && npm run dev"
echo Backend starting...
timeout /t 5 /nobreak >nul

echo.
echo Step 2: Starting Teacher Frontend (Port 5174)...
start "Teacher Frontend" cmd /k "npm run dev"
echo Frontend starting...
timeout /t 8 /nobreak >nul

echo.
echo Step 3: Opening in Brave Browser...

REM Find Brave browser
set BRAVE_PATH=
if exist "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set BRAVE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
)
if exist "C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set BRAVE_PATH=C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe
)
if exist "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set BRAVE_PATH=%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe
)

if defined BRAVE_PATH (
    echo Opening in Brave...
    start "" "%BRAVE_PATH%" "http://localhost:5174"
) else (
    echo Brave not found, opening in default browser...
    start http://localhost:5174
)

echo.
echo ========================================
echo Teacher App Started Successfully!
echo ========================================
echo.
echo URL: http://localhost:5174
echo Backend: http://localhost:3002
echo.
echo Press any key to exit (apps will keep running)...
pause >nul
