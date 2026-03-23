@echo off
title Subir cambios a GitHub - LiveFinder
color 0A
cd /d C:\xampp\htdocs\livefinder

echo ========================================
echo   Subiendo cambios a GitHub...
echo ========================================
echo.

git add .
git commit -m "Actualizacion automatica: %date% %time%"
git push origin master

echo.
echo ========================================
echo   ¡CAMBIOS SUBIDOS EXITOSAMENTE!
echo ========================================
echo.
pause
