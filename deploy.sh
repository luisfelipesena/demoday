#!/bin/bash
set -e

# Configuration
APP_NAME="demoday"
DOKKU_HOST="dokku@app.ic.ufba.br"
DOKKU_PORT="2299"

# Check if the dokku remote already exists
if ! git remote | grep -q "^dokku$"; then
  echo "Adding dokku remote..."
  git remote add dokku ssh://dokku@app.ic.ufba.br:2299/demoday
else
  echo "Dokku remote already exists."
fi

# Configure Dokku to use Dockerfile builder
echo "Setting Dokku to use Dockerfile builder with Bun runtime..."
ssh -t -p $DOKKU_PORT $DOKKU_HOST builder:set $APP_NAME selected dockerfile

# Create a git commit if there are changes
git add .
git diff-index --quiet HEAD || git commit -m "chore: bun deployment"

# Push to dokku
echo "Pushing to dokku..."
git push dokku master

echo "Deployment completed! Your app should now be running on Dokku with Bun." 