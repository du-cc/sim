@echo off

cd /d "%~dp0"

if not exist first_time.txt (
    echo FALSE > first_time.txt
    goto installNode
)

goto run

:installNode
echo Installing nodeJS...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
call %PROGRAMDATA%\chocolatey\bin\RefreshEnv.cmd
call choco install nodejs --version="25.3.0" -y
echo Node installation finished.

:installDep
echo Installing required dependencies...
call npm install
goto run

:run
echo Running...
call npm run start
exit /B