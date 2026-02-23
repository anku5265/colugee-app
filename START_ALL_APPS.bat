@echo off
echo ========================================
echo Starting All Apps (Student, Teacher, Admin)
echo ========================================
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do set IP=%%a
set IP=%IP:~1%

echo Your Local IP: %IP%
echo.
echo Student App will open at: http://localhost:5173
echo Teacher App will open at: http://localhost:5174
echo Admin Panel will open at: http://localhost:5175
echo.
echo Network Access URLs (for phone/other devices):
echo Student: http://%IP%:5173
echo Teacher: http://%IP%:5174
echo Admin: http://%IP%:5175
echo.
echo ========================================
echo Starting backends first...
echo ========================================

REM Start Student Backend
echo Starting Student Backend on port 3001...
start "Student Backend" cmd /k "cd student-app\backend && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Teacher Backend
echo Starting Teacher Backend on port 3002...
start "Teacher Backend" cmd /k "cd teacher-app\backend && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Admin Backend
echo Starting Admin Backend on port 3003...
start "Admin Backend" cmd /k "cd admin-panel\backend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo Waiting for backends to initialize...
timeout /t 5 /nobreak >nul

echo ========================================
echo Starting frontends...
echo ========================================

REM Start Student Frontend
echo Starting Student App on port 5173...
start "Student App" cmd /k "cd student-app && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Teacher Frontend
echo Starting Teacher App on port 5174...
start "Teacher App" cmd /k "cd teacher-app && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Admin Frontend
echo Starting Admin Panel on port 5175...
start "Admin Panel" cmd /k "cd admin-panel && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo Waiting for apps to start...
timeout /t 8 /nobreak >nul

echo ========================================
echo Opening apps in Brave browser...
echo ========================================

REM Try to find Brave browser
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
    echo Opening in Brave Browser...
    start "" "%BRAVE_PATH%" "http://localhost:5173"
    timeout /t 2 /nobreak >nul
    start "" "%BRAVE_PATH%" "http://localhost:5174"
    timeout /t 2 /nobreak >nul
    start "" "%BRAVE_PATH%" "http://localhost:5175"
) else (
    echo Brave browser not found, opening in default browser...
    start http://localhost:5173
    timeout /t 2 /nobreak >nul
    start http://localhost:5174
    timeout /t 2 /nobreak >nul
    start http://localhost:5175
)

echo.
echo ========================================
echo ALL APPS STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Student App: http://localhost:5173
echo Teacher App: http://localhost:5174
echo Admin Panel: http://localhost:5175
echo.
echo Network URLs (for phone):
echo Student: http://%IP%:5173
echo Teacher: http://%IP%:5174
echo Admin: http://%IP%:5175
echo.
echo Press any key to stop all apps...
pause >nul

echo.
echo Stopping all apps...
taskkill /FI "WindowTitle eq Student*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Teacher*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Admin*" /T /F >nul 2>&1

echo All apps stopped.
pause
