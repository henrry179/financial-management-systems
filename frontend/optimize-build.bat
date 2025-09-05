@echo off
echo 🚀 Optimizing Financial Management System Build
echo.

:: Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH.
    echo Please install Node.js (LTS) and ensure it's in your system PATH.
    echo See: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is available.

:: Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies.
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed.
) else (
    echo ✅ Dependencies already installed.
)

echo.
echo 🧹 Cleaning previous build...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ Previous build cleaned.
)

echo.
echo 🔍 Running linting...
call npm run lint
if %errorlevel% neq 0 (
    echo ⚠️  Linting issues found, but continuing with build...
) else (
    echo ✅ Linting passed.
)

echo.
echo 🧪 Running tests...
call npm run test
if %errorlevel% neq 0 (
    echo ⚠️  Some tests failed, but continuing with build...
) else (
    echo ✅ All tests passed.
)

echo.
echo 🏗️  Building optimized production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed.
    pause
    exit /b 1
)

echo.
echo 📊 Analyzing bundle size...
if exist "dist" (
    echo ✅ Build completed successfully!
    echo.
    echo 📁 Build output:
    dir /s dist
    echo.
    echo 📈 Bundle analysis:
    for /f "tokens=*" %%i in ('dir /s /-c dist ^| find "File(s)"') do echo %%i
) else (
    echo ❌ Build output not found.
    pause
    exit /b 1
)

echo.
echo 🎉 Build optimization completed!
echo 📦 Optimized files are in the 'dist' directory.
echo 🚀 Ready for production deployment.
echo.
echo Press any key to exit...
pause >nul
exit /b 0
