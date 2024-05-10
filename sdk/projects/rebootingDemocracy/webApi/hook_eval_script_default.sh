#!/bin/bash

# Define the directory where the deepeval executable and script are located
SCRIPT_DIR="/var/www/policy-synth-chat-v1/sdk/projects/rebootingDemocracy/webApp/deepeval"

# Define the log file path and name with a timestamp
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
logFilePath="${SCRIPT_DIR}/logs/deepeval_execution_log_$timestamp.log"

# Change to the script directory
cd "$SCRIPT_DIR"

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | sed 's/#.*//g' | xargs)
fi

# Executing the deepeval script
echo "Executing the deepeval script at $(date)..." >> "$logFilePath"
deepeval test run test_chatbot.py &>> "$logFilePath"
echo "Deepeval script execution complete at $(date). Check log at $logFilePath" >> "$logFilePath"
