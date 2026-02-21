@echo off
echo ========================================
echo Starting Student App - Frontend + Backend
echo ========================================
echo.

echo [1/4] Installing Backend Dependencies...
cd student-app\backend
if not exist "node_modules" (
    echo Installing backend packages...
    call npm install
) else (
    echo Backend dependencies already installed!
)
echo.

echo [2/4] Starting Backend Server (Port 3001)...
start "Student Backend" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
echo Backend started!
echo.

echo [3/4] Checking Frontend Dependencies...
cd ..
if not exist "node_modules" (
    echo Frontend dependencies already installed!
) else (
    echo Frontend ready!
)
echo.

echo [4/4] Starting Frontend Server (Port 8080)...
start "Student Frontend" cmd /k "npm run dev"
echo Frontend started!
echo.

echo ========================================
echo Student App is starting!
echo ========================================
echo Frontend: http://localhost:8080
echo Backend:  http://localhost:3001
echo.
echo Press any key to exit this window...
pause >nul
