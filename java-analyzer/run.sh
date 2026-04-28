#!/bin/bash
cd "$(dirname "$0")"
echo "Compiling Java Query Analyzer..."
javac -d . src/com/smartcampus/QueryAnalyzer.java
if [ $? -ne 0 ]; then
    echo "Compilation failed!"
    exit 1
fi
echo "Compilation successful!"
echo "Starting Java Analyzer Server..."
java com.smartcampus.QueryAnalyzer