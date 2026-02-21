#!/bin/bash

# Supabase Edge Functions Deployment Script
# This script deploys all Edge Functions to Supabase

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if logged in
echo "Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI ready"
echo ""

# Deploy each function
functions=("translate" "auth" "projects" "segments" "translation-memory" "glossary" "workflow")

for func in "${functions[@]}"; do
    echo "📦 Deploying $func..."
    if supabase functions deploy $func --no-verify-jwt; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ Failed to deploy $func"
        exit 1
    fi
    echo ""
done

echo "🎉 All Edge Functions deployed successfully!"
echo ""
echo "Your API endpoints are now available at:"
echo "https://yizsijfuwqiwbxncmrga.supabase.co/functions/v1/{function-name}"
echo ""
echo "Next steps:"
echo "1. Update your frontend VITE_API_URL to point to Supabase Edge Functions"
echo "2. Test each endpoint"
echo "3. Migrate WebSocket to Supabase Realtime"
