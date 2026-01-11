@echo off
echo ================================
echo Gemini API Connection Test
echo ================================
echo.

cd backend

echo Checking for .env file...
if not exist .env (
    echo ERROR: .env file not found!
    echo.
    echo Please create backend\.env with:
    echo GEMINI_API_KEY=your_api_key_here
    echo PORT=5000
    echo.
    pause
    exit /b 1
)

echo .env file found
echo.
echo Testing Gemini 2.5 Flash API connection...
echo.

node test-gemini-connection.js

echo.
echo ================================
if %ERRORLEVEL% EQU 0 (
    echo Test PASSED! Ready to start backend server.
    echo.
    echo Run: cd backend ^&^& node server.js
) else (
    echo Test FAILED! Check error messages above.
    echo.
    echo Common fixes:
    echo 1. Check API key in backend\.env
    echo 2. Try different model name in server.js
    echo 3. Verify internet connection
)
echo ================================
echo.
pause
