@echo off
echo 🧪 Running Financial Management System Tests
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

:: Check if npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed or not in PATH.
    echo Please install Node.js (LTS) which includes npm.
    echo See: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available.

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
echo 🧪 Running tests...
echo.

:: Run tests with coverage
call npm run test:coverage

if %errorlevel% equ 0 (
    echo.
    echo ✅ All tests passed!
    echo 📊 Coverage report generated in coverage/ directory.
) else (
    echo.
    echo ❌ Some tests failed.
    echo Check the output above for details.
)

echo.
echo Press any key to exit...
pause >nul
exit /b 0
