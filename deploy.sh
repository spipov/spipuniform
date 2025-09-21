#!/bin/bash

# Navigate to the project root directory
cd $FLASHPANEL_SITE_ROOT

echo "Running Drizzle database migrations..."
pnpm run db:migrate

echo "Seeding database with initial data..."
pnpm run seed

echo "Managing application with PM2..."
if pm2 describe $APP_NAME > /dev/null; then
  echo "Application '$APP_NAME' is already running. Restarting..."
  pm2 restart $APP_NAME
else
  echo "Application '$APP_NAME' is not running. Starting..."
  pm2 start npm --name $APP_NAME -- run start
fi

echo "Setting up log rotation for PM2..."
pm2 install pm2-logrotate

echo "Deployment complete for spipleavepanel.spipdesigns.com"
echo "Default admin login: admin@example.com / Admin123!"
echo "Please change the default password immediately!"