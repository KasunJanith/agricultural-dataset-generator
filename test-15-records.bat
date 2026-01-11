@echo off
echo ============================================
echo Testing Agricultural Dataset Generator
echo Batch Size: 15 records
echo Token Config: 800 tokens/item
echo ============================================
echo.

echo [1/3] Testing backend health...
curl -s http://localhost:5000/api/health
echo.
echo.

echo [2/3] Fetching available subdomains...
curl -s http://localhost:5000/api/subdomains
echo.
echo.

echo [3/3] Testing generation (15 records)...
echo This will take 30-45 seconds...
echo.
curl -X POST http://localhost:5000/api/generate-batch ^
     -H "Content-Type: application/json" ^
     -d "{\"subdomain\":\"crop_production\",\"count\":15}" ^
     -w "\n\nHTTP Status: %%{http_code}\n"

echo.
echo.
echo ============================================
echo Test complete!
echo Check the backend window for token allocation logs
echo ============================================
pause
