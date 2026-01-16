@echo off
cd /d "%~dp0"

echo Deleting first_time variable
cd ..
del /f first_time.txt
echo Deleting nodeJS
choco uninstall nodejs -y -x
echo Deleting chocolatey
cd %PROGRAMDATA%
rmdir /s /q chocolatey
echo Done!