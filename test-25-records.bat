@echo off
echo ============================================
echo Testing 25 Records Generation
echo Token Config: 800 tokens/item, 1.5x buffer
echo Expected: 30,000 tokens (46%% of max)
echo ============================================
echo.

echo [1/3] Testing backend health...
curl -s http://localhost:5000/api/health
echo.
echo.

echo [2/3] Checking current statistics...
curl -s http://localhost:5000/api/statistics
echo.
echo.

echo [3/3] Generating 25 records (crop_production)...
echo This will take ~1 minute...
echo.
curl -X POST http://localhost:5000/api/generate-batch ^
     -H "Content-Type: application/json" ^
     -d "{\"subdomain\":\"crop_production\",\"count\":25}" ^
     -w "\n\nHTTP Status: %%{http_code}\n"

echo.
echo.
echo ============================================
echo Test complete!
echo.
echo Check backend logs for:
echo - Token allocation: Should show ~30,000 tokens (46%% utilized)
echo - No truncation warnings
echo - Successfully generated records
echo ============================================
pause
