#!/bin/bash

# AutoPilot CI/CD Gating Script
# Triggers a test suite and blocks until execution is complete.

# Defaults
SERVER_URL="http://localhost:9090"
TIMEOUT_SEC=600
SUITE_ID=""
API_TOKEN=""

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -s|--suite) SUITE_ID="$2"; shift ;;
        -t|--token) API_TOKEN="$2"; shift ;;
        -u|--server) SERVER_URL="$2"; shift ;;
        -o|--timeout) TIMEOUT_SEC="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$SUITE_ID" ] || [ -z "$API_TOKEN" ]; then
    echo "❌ Error: Missing required arguments."
    echo "Usage: $0 --suite <suite_id> --token <api_token> [--server <server_url>] [--timeout <timeout_seconds>]"
    exit 1
fi

# Trim trailing slash from server URL
SERVER_URL="${SERVER_URL%/}"

echo "=================================================="
echo "🚀 AutoPilot CI/CD Pipeline Gating"
echo "=================================================="
echo "Server:    $SERVER_URL"
echo "Suite ID:  $SUITE_ID"
echo "Timeout:   ${TIMEOUT_SEC}s"
echo "=================================================="

echo "Triggering suite execution..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/v1/suites/$SUITE_ID/trigger" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json")

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to connect to AutoPilot server at $SERVER_URL"
    exit 1
fi

# Extract executionId using grep/sed (no jq dependency)
EXECUTION_ID=$(echo "$RESPONSE" | grep -o '"executionId":[0-9]*' | head -n1 | cut -d':' -f2)

if [ -z "$EXECUTION_ID" ]; then
    echo "❌ Error: Failed to trigger suite execution. Server response:"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Triggered successfully! Execution ID: $EXECUTION_ID"
echo "Polling execution status..."

START_TIME=$(date +%s)
PREV_STATUS=""

while true; do
    # Check timeout
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    if [ "$ELAPSED" -ge "$TIMEOUT_SEC" ]; then
        echo "❌ Error: Timeout reached (${TIMEOUT_SEC}s). Gating failed."
        exit 1
    fi

    # Query status
    STATUS_RESP=$(curl -s "$SERVER_URL/api/v1/executions/$EXECUTION_ID/status" \
      -H "Authorization: Bearer $API_TOKEN")

    # Extract status, passedCount, failedCount, totalCount
    STATUS=$(echo "$STATUS_RESP" | grep -o '"status":"[^"]*"' | head -n1 | cut -d':' -f2 | tr -d '"')
    PASSED=$(echo "$STATUS_RESP" | grep -o '"passedCount":[0-9]*' | head -n1 | cut -d':' -f2)
    FAILED=$(echo "$STATUS_RESP" | grep -o '"failedCount":[0-9]*' | head -n1 | cut -d':' -f2)
    TOTAL=$(echo "$STATUS_RESP" | grep -o '"totalCount":[0-9]*' | head -n1 | cut -d':' -f2)

    if [ -z "$STATUS" ]; then
        echo "⚠️ Warning: Failed to parse status. Retrying..."
        sleep 5
        continue
    fi

    # Print status updates on change
    STATUS_LINE="Status: $STATUS (Passed: ${PASSED:-0} | Failed: ${FAILED:-0} | Total: ${TOTAL:-0})"
    if [ "$STATUS" != "$PREV_STATUS" ]; then
        echo "[$(date +%T)] $STATUS_LINE"
        PREV_STATUS="$STATUS"
    fi

    # Check terminal status
    if [ "$STATUS" = "PASSED" ] || [ "$STATUS" = "SUCCESS" ] || [ "$STATUS" = "COMPLETED" ]; then
        echo "=================================================="
        echo "✅ Pipeline Gating: SUCCESS!"
        echo "All tests passed. Proceeding with deployment."
        echo "=================================================="
        exit 0
    elif [ "$STATUS" = "FAILED" ]; then
        echo "=================================================="
        echo "❌ Pipeline Gating: FAILED!"
        echo "$FAILED tests failed. Deployment blocked."
        echo "=================================================="
        exit 1
    elif [ "$STATUS" = "ERROR" ] || [ "$STATUS" = "CANCELLED" ]; then
        echo "=================================================="
        echo "❌ Pipeline Gating: ERROR!"
        echo "Execution finished with status: $STATUS. Deployment blocked."
        echo "=================================================="
        exit 1
    fi

    sleep 5
done
