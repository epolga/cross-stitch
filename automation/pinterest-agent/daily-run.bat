@echo off
cd /d D:\ann\Git\cross-stitch\automation\pinterest-agent

echo [%date% %time%] Starting daily business pipeline >> daily-run.log

call npm run daily >> daily-run.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%date% %time%] ERROR: daily report failed >> daily-run.log
    exit /b 1
)

call npm run history >> daily-run.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%date% %time%] ERROR: history build failed >> daily-run.log
    exit /b 1
)

call npm run ai:trend >> daily-run.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%date% %time%] ERROR: ai trend analysis failed >> daily-run.log
    exit /b 1
)

echo [%date% %time%] Pipeline complete >> daily-run.log
