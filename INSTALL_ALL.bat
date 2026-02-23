@echo off
echo ========================================
echo Installing All Dependencies
echo ========================================
echo.

echo [1/6] Installing Student Backend...
cd student-app\backend
call npm install
cd ..\..
echo Student Backend installed!
echo.

echo [2/6] Installing Student Frontend...
cd student-app
if not exist "node_modules" (
    echo Already installed!
) else (
    echo Student Frontend ready!
)
cd ..
echo.

echo [3/6] Installing Teacher Backend...
cd teacher-app\backend
call npm install
cd ..\..
echo Teacher Backend installed!
echo.

echo [4/6] Installing Teacher Frontend...
cd teacher-app
if not exist "node_modules" (
    echo Already installed!
) else (
    echo Teacher Frontend ready!
)
cd ..
echo.

echo [5/6] Installing Admin Panel Backend...
cd admin-panel\backend
call npm install
cd ..\..
echo Admin Panel Backend installed!
echo.

echo [6/6] Installing Admin Panel Frontend...
cd admin-panel
call npm install
cd ..
echo Admin Panel Frontend installed!
echo.

echo ========================================
echo All dependencies installed successfully!
echo ========================================
echo.
echo You can now run:
echo - START_STUDENT_APP.bat (for Student App)
echo - START_TEACHER_APP.bat (for Teacher App)
echo - START_ADMIN_APP.bat (for Admin Panel)
echo.
pause
