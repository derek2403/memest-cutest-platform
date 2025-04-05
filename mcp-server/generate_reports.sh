#!/bin/bash

# Script to generate transaction reports and graphs

echo "Generating transaction report..."
curl -X POST 'http://localhost:3001/transactions/report' \
  -H 'Content-Type: application/json' \
  -d '{
    "address": "0x147151a144fEb00E1e173469B5f90C3B78ae210c",
    "chainId": "84532",
    "month": "4", 
    "year": "2025"
  }'

echo -e "\n\nWaiting 2 seconds before generating graphs...\n"
sleep 2

echo "Generating transaction graphs and sending email..."
curl -X POST 'http://localhost:3001/api/transactions/graphs' \
  -H 'Content-Type: application/json' \
  -d '{
    "address": "0x147151a144fEb00E1e173469B5f90C3B78ae210c",
    "chainId": "84532",
    "month": "4",
    "year": "2025",
    "email": "derekliew0@gmail.com"
  }'

echo -e "\n\nDone! Reports and graphs generated."
