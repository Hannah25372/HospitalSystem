call run-dev.bat

echo Waiting for gateway on port 4000...
:wait
powershell -Command "try { $t = New-Object System.Net.Sockets.TcpClient; $t.Connect('localhost',4000); $t.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait
)

echo Gateway ready, running api tests...
cd gateway && npm test