@echo off
chcp 65001 >nul
echo 🚀 项目文件统计 - 批处理版本
echo ================================
echo.

echo 📊 项目总览统计:
echo ----------------

:: 统计各个目录的文件数量
echo 后端服务 (backend):
if exist "backend" (
    for /f %%i in ('dir "backend" /s /a-d ^| find " 个文件"') do echo   文件数: %%i
    for /f %%i in ('dir "backend" /s /ad ^| find " 个目录"') do echo   目录数: %%i
) else (
    echo   目录不存在
)
echo.

echo 前端界面 (frontend):
if exist "frontend" (
    for /f %%i in ('dir "frontend" /s /a-d ^| find " 个文件"') do echo   文件数: %%i
    for /f %%i in ('dir "frontend" /s /ad ^| find " 个目录"') do echo   目录数: %%i
) else (
    echo   目录不存在
)
echo.

echo 项目文档 (docs):
if exist "docs" (
    for /f %%i in ('dir "docs" /s /a-d ^| find " 个文件"') do echo   文件数: %%i
    for /f %%i in ('dir "docs" /s /ad ^| find " 个目录"') do echo   目录数: %%i
) else (
    echo   目录不存在
)
echo.

echo 脚本工具 (scripts):
if exist "scripts" (
    for /f %%i in ('dir "scripts" /s /a-d ^| find " 个文件"') do echo   文件数: %%i
    for /f %%i in ('dir "scripts" /s /ad ^| find " 个目录"') do echo   目录数: %%i
) else (
    echo   目录不存在
)
echo.

echo 💻 文件类型统计:
echo ----------------
echo TypeScript文件:
if exist "*.ts" (dir /s *.ts 2>nul | find " 个文件") else echo   0 个文件
if exist "*.tsx" (dir /s *.tsx 2>nul | find " 个文件") else echo   0 个文件

echo JavaScript文件:
if exist "*.js" (dir /s *.js 2>nul | find " 个文件") else echo   0 个文件
if exist "*.jsx" (dir /s *.jsx 2>nul | find " 个文件") else echo   0 个文件

echo JSON文件:
if exist "*.json" (dir /s *.json 2>nul | find " 个文件") else echo   0 个文件

echo Markdown文件:
if exist "*.md" (dir /s *.md 2>nul | find " 个文件") else echo   0 个文件

echo CSS文件:
if exist "*.css" (dir /s *.css 2>nul | find " 个文件") else echo   0 个文件

echo HTML文件:
if exist "*.html" (dir /s *.html 2>nul | find " 个文件") else echo   0 个文件

echo.
echo ✅ 统计完成!
echo.
echo 💡 提示: 要获得更详细的统计信息，请使用 PowerShell 版本:
echo    powershell -ExecutionPolicy Bypass -File quantification\Update-ProjectStats.ps1
echo.
pause 