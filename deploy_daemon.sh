#!/bin/bash
API_URL="http://localhost:3000"
SECRET="super-secret-dev-key"

# Check for pending deployments
PENDING_JSON=$(curl -s -H "Authorization: Bearer $SECRET" $API_URL/api/deployments/pending)
ID=$(echo $PENDING_JSON | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

if [ ! -z "$ID" ] && [ "$ID" != "null" ]; then
  # Update status to BUILDING
  curl -s -X POST -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" -d '{"status":"BUILDING","logs":"Starting deployment process...\n"}' $API_URL/api/deployments/$ID/update > /dev/null

  cd /root/inhouse-qase-clone
  
  # Git pull
  git pull origin main > /tmp/deploy.log 2>&1
  # properly escape JSON string
  LOGS=$(jq -Rs . < /tmp/deploy.log)
  curl -s -X POST -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" -d "{\"logs\":$LOGS}" $API_URL/api/deployments/$ID/update > /dev/null

  # Docker build
  docker compose -f docker-compose.prod.yml build > /tmp/deploy.log 2>&1
  BUILD_STATUS=$?
  LOGS=$(jq -Rs . < /tmp/deploy.log)
  curl -s -X POST -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" -d "{\"logs\":$LOGS}" $API_URL/api/deployments/$ID/update > /dev/null

  if [ $BUILD_STATUS -eq 0 ]; then
    # Docker up
    docker compose -f docker-compose.prod.yml up -d > /tmp/deploy.log 2>&1
    LOGS=$(jq -Rs . < /tmp/deploy.log)
    curl -s -X POST -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" -d "{\"status\":\"SUCCESS\",\"logs\":$LOGS}" $API_URL/api/deployments/$ID/update > /dev/null
  else
    curl -s -X POST -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" -d '{"status":"FAILED","logs":"\nDocker build failed!"}' $API_URL/api/deployments/$ID/update > /dev/null
  fi
fi
