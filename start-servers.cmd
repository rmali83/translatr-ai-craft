@echo off
echo ========================================
echo Starting CAT Tool Servers
echo ========================================
echo.
echo This will open 2 terminal windows:
echo - Backend server (port 5000)
echo - Frontend server (port 5173)
echo.
echo Press any key to continue...
pause >nul

echo Starting backend server...
start "CAT Tool - Backend" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "CAT Tool - Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo ✓ Servers starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Check the opened terminal windows for status.
echo Press any key to exit this window...
pause >nul
