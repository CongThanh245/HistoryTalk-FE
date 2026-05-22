#!/bin/bash

BACKEND=$1

if [ -z "$BACKEND" ]; then
    echo "Usage: ./switch-backend.sh <spring|nodejs>"
    exit 1
fi

if [ "$BACKEND" != "spring" ] && [ "$BACKEND" != "nodejs" ]; then
    echo "Error: Backend must be 'spring' or 'nodejs'"
    exit 1
fi

ENV_FILE=".env.$BACKEND"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found!"
    exit 1
fi

cp "$ENV_FILE" .env.local
echo "✅ Switched to $BACKEND backend"
echo "📡 API: $(grep NEXT_PUBLIC_API_BASE_URL $ENV_FILE)"
