@echo off
echo Starting backend and frontend dev servers...
start cmd /k "cd backend && .\gradlew.bat bootRun"
start cmd /k "cd frontend && npm run dev"

echo Waiting for backend on port 9090...
:wait
powershell -Command "try { $t = New-Object System.Net.Sockets.TcpClient; $t.Connect('localhost',9090); $t.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait
)

echo Backend ready, starting gateway...
start cmd /k "cd gateway && npm run dev"