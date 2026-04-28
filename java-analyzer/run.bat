
@echo off
cd /d %~dp0
echo Compiling Java Query Analyzer...
javac -d . src/com/smartcampus/QueryAnalyzer.java
if %errorlevel% neq 0 (
    echo Compilation failed!
    pause
    exit /b %errorlevel%
)
echo Compilation successful!
echo Starting Java Analyzer Server...
java com.smartcampus.QueryAnalyzer
pause