#!/bin/bash

# Setup test database for E2E tests
echo "🔄 Setting up test database..."

# Export DATABASE_URL for the test environment
export DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/demoday"}

# Drop all existing tables (force mode)
echo "🗑️ Dropping existing tables..."
npx drizzle-kit drop --force 2>/dev/null || true

# Push the schema to the database
echo "📦 Pushing schema to database..."
npx drizzle-kit push --force

# Seed test users
echo "🌱 Seeding test users..."
npx tsx scripts/seed-test-user.ts

echo "✅ Database setup complete!"