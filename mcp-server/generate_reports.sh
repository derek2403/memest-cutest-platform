#!/bin/bash

# Script to generate transaction reports and graphs
# Script location: mcp-server/generate_reports.sh

set -e  # Exit immediately if a command exits with non-zero status
echo "Starting transaction report generation script from $(pwd)"

# Define the API URL - Try to use environment variable if available
if [ -n "$APP_URL" ]; then
  API_URL="$APP_URL"
else
  API_URL="http://localhost:3001"
fi

echo "Using API URL: $API_URL"

# Define wallet address and other parameters
WALLET="0x147151a144fEb00E1e173469B5f90C3B78ae210c"
CHAIN_ID="84532"
MONTH="4"
YEAR="2025"
EMAIL="derekliew0@gmail.com"

echo "Generating transaction report..."
REPORT_RESPONSE=$(curl -s -X POST "$API_URL/transactions/report" \
  -H 'Content-Type: application/json' \
  -d "{
    \"address\": \"$WALLET\",
    \"chainId\": \"$CHAIN_ID\",
    \"month\": \"$MONTH\", 
    \"year\": \"$YEAR\"
  }")

echo "Report API response: $REPORT_RESPONSE"

if [[ "$REPORT_RESPONSE" == *"error"* ]]; then
  echo "Error encountered in report generation. See response above."
else
  echo "Transaction report generated successfully."
fi

echo "Waiting 2 seconds before generating graphs..."
sleep 2

echo "Generating transaction graphs and sending email..."
GRAPHS_RESPONSE=$(curl -s -X POST "$API_URL/api/transactions/graphs" \
  -H 'Content-Type: application/json' \
  -d "{
    \"address\": \"$WALLET\",
    \"chainId\": \"$CHAIN_ID\",
    \"month\": \"$MONTH\",
    \"year\": \"$YEAR\",
    \"email\": \"$EMAIL\"
  }")

echo "Graphs API response: $GRAPHS_RESPONSE"

if [[ "$GRAPHS_RESPONSE" == *"error"* ]]; then
  echo "Error encountered in graph generation. See response above."
else
  echo "Transaction graphs generated and email sent successfully."
fi

echo "Script execution complete."
