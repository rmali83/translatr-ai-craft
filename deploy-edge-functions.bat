@echo off
REM Supabase Edge Functions Deployment Script for Windows
REM This script deploys all Edge Functions to Supabase

echo 🚀 Deploying Supabase Edge Functions...
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo    npm install -g supabase
    exit /b 1
)

echo ✅ Supabase CLI ready
echo.

REM Deploy each function
set functions=translate auth projects segments translation-memory glossary workflow

for %%f in (%functions%) do (
    echo 📦 Deploying %%f...
    supabase functions deploy %%f --no-verify-jwt
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to deploy %%f
        exit /b 1
    )
    echo ✅ %%f deployed successfully
    echo.
)

echo 🎉 All Edge Functions deployed successfully!
echo.
echo Your API endpoints are now available at:
echo https://yizsijfuwqiwbxncmrga.supabase.co/functions/v1/{function-name}
echo.
echo Next steps:
echo 1. Update your frontend VITE_API_URL to point to Supabase Edge Functions
echo 2. Test each endpoint
echo 3. Migrate WebSocket to Supabase Realtime
