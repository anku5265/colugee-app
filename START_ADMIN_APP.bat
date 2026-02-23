@echo off
echo ========================================
echo Starting Admin Panel
echo ========================================
echo.

cd admin-panel

echo Step 1: Starting Admin Backend (Port 3003)...
start "Admin Backend" cmd /k "cd backend && npm run dev"
echo Backend starting...
timeout /t 5 /nobreak >nul

echo.
echo Step 2: Starting Admin Frontend (Port 5175)...
start "Admin Frontend" cmd /k "npm run dev"
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
    start "" "%BRAVE_PATH%" "http://localhost:5175"
) else (
    echo Brave not found, opening in default browser...
    start http://localhost:5175
)

echo.
echo ========================================
echo Admin Panel Started Successfully!
echo ========================================
echo.
echo URL: http://localhost:5175
echo Backend: http://localhost:3003
echo.
echo Press any key to exit (apps will keep running)...
pause >nul
