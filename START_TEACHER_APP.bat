@echo off
echo ========================================
echo Starting Teacher App - Frontend + Backend
echo ========================================
echo.

echo [1/4] Installing Backend Dependencies...
cd teacher-app\backend
if not exist "node_modules" (
    echo Installing backend packages...
    call npm install
) else (
    echo Backend dependencies already installed!
)
echo.

echo [2/4] Starting Backend Server (Port 3002)...
start "Teacher Backend" cmd /k "npm run dev"
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

echo [4/4] Starting Frontend Server (Port 8081)...
start "Teacher Frontend" cmd /k "npm run dev"
echo Frontend started!
echo.

echo ========================================
echo Teacher App is starting!
echo ========================================
echo Frontend: http://localhost:8081
echo Backend:  http://localhost:3002
echo.
echo Press any key to exit this window...
pause >nul
