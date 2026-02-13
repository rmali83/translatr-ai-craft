@echo off
echo ========================================
echo CAT Tool - Quick Setup Script
echo ========================================
echo.

echo [1/3] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependencies installation failed
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo [2/3] Installing backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend dependencies installation failed
    exit /b 1
)
cd ..
echo ✓ Backend dependencies installed
echo.

echo [3/3] Building backend...
cd server
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    exit /b 1
)
cd ..
echo ✓ Backend built successfully
echo.

echo ========================================
echo ✓ Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run database migrations in Supabase SQL Editor
echo    - server/database/schema.sql
echo    - server/database/workflow-update.sql
echo    - server/database/rbac-schema.sql
echo    - server/database/quality-score-update.sql
echo.
echo 2. Start backend server:
echo    cd server ^&^& npm run dev
echo.
echo 3. Start frontend server (new terminal):
echo    npm run dev
echo.
echo 4. Open browser: http://localhost:5173
echo.
echo See NEXT_STEPS.md for detailed instructions.
echo ========================================
