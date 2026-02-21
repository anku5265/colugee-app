@echo off
echo ========================================
echo Installing All Dependencies
echo ========================================
echo.

echo [1/4] Installing Student Backend...
cd student-app\backend
call npm install
cd ..\..
echo Student Backend installed!
echo.

echo [2/4] Installing Student Frontend...
cd student-app
if not exist "node_modules" (
    echo Already installed!
) else (
    echo Student Frontend ready!
)
cd ..
echo.

echo [3/4] Installing Teacher Backend...
cd teacher-app\backend
call npm install
cd ..\..
echo Teacher Backend installed!
echo.

echo [4/4] Installing Teacher Frontend...
cd teacher-app
if not exist "node_modules" (
    echo Already installed!
) else (
    echo Teacher Frontend ready!
)
cd ..
echo.

echo ========================================
echo All dependencies installed successfully!
echo ========================================
echo.
echo You can now run:
echo - START_STUDENT_APP.bat (for Student App)
echo - START_TEACHER_APP.bat (for Teacher App)
echo.
pause
