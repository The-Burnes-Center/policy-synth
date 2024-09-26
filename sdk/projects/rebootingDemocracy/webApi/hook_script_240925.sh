#!/bin/bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Use the specific Node version
nvm use 18.16.1

# Current timestamp for log file naming
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")

# Log file path
logFilePath="./webhook_logs/execution_log_$timestamp.log"

# Command to load .env, execute the script, and log the execution
{ echo "Starting execution at $(date)"; export $(grep -v '^#' .env | xargs) && node ./ts-out/ingestion/ingestContent.js; echo "Finished execution at $(date)"; } &> "$logFilePath"
