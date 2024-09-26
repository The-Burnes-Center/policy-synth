#!/bin/bash

LOG_FILE="/var/log/hook_eval_script.log"  # Ensure this path is writable by the webhook process

echo "Script invoked at $(date)" | tee -a $LOG_FILE

if [ $# -eq 0 ]; then
    echo "Usage: ./hook_eval_script.sh <entry_key>" | tee -a $LOG_FILE
    exit 1
fi

ENTRY_KEY="$1"
PYTHON_SCRIPT="/var/www/policy-synth-chat-v1/sdk/projects/rebootingDemocracy/webApp/deepeval/test_json.py"

echo "Received entry key: $ENTRY_KEY" | tee -a $LOG_FILE
echo "Setting entry key to $ENTRY_KEY in $PYTHON_SCRIPT" | tee -a $LOG_FILE

sed -i "s/entry_key = \".*\"/entry_key = \"$ENTRY_KEY\"/" $PYTHON_SCRIPT
if [ $? -eq 0 ]; then
    echo "Successfully set entry key in Python script." | tee -a $LOG_FILE
else
    echo "Failed to set entry key in Python script." | tee -a $LOG_FILE
    exit 1
fi


if [ -f ".env" ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | sed 's/#.*//g' | xargs)
fi

echo "Executing deepeval test run $PYTHON_SCRIPT" | tee -a $LOG_FILE
deepeval test run $PYTHON_SCRIPT >> $LOG_FILE 2>&1

if [ $? -eq 0 ]; then
    echo "Deepeval test run successful." | tee -a $LOG_FILE
else
    echo "Deepeval test run failed." | tee -a $LOG_FILE
    exit 1
fi

echo "Script completed at $(date)" | tee -a $LOG_FILE
