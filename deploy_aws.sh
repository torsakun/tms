#!/bin/bash
echo "Deploying to AWS (43.209.225.219)..."
ssh -o ConnectTimeout=10 -i /Users/socket9/qa-tms.pem ubuntu@43.209.225.219 "cd /home/ubuntu/inhouse-qase-clone && git pull origin main && npm install && npx prisma db push && npm run build && pm2 restart tms-app"
echo "Deployment complete!"
