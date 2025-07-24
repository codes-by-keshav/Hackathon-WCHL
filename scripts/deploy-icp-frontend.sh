#!/bin/bash
# filepath: /home/keshav/Documents/quantsafe/scripts/deploy-icp-frontend.sh
set -e

echo "🚀 Deploying QuantSafe Frontend to ICP..."

# Navigate to ICP project
cd /home/keshav/Documents/quantsafe/quantsafe_icp

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf src/quantsafe_icp_frontend/dist
rm -rf src/quantsafe_icp_frontend/node_modules
rm -rf node_modules

# Install dependencies fresh
echo "📦 Installing dependencies..."
npm install

# Navigate to frontend directory and install its dependencies
cd src/quantsafe_icp_frontend
npm install

# Verify Tailwind configuration
echo "🎨 Verifying Tailwind CSS configuration..."
if [ ! -f "tailwind.config.js" ]; then
    echo "❌ tailwind.config.js not found!"
    exit 1
fi

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Navigate back to root
cd ../..

# Check if dfx is already running
echo "🌐 Checking ICP network status..."
if dfx ping > /dev/null 2>&1; then
    echo "✅ ICP network is already running"
else
    echo "🌐 Starting local ICP network..."
    dfx start --background
fi

# Deploy to ICP
echo "🚀 Deploying to ICP..."
dfx deploy quantsafe_icp_frontend

# Get URLs
FRONTEND_CANISTER_ID=$(dfx canister id quantsafe_icp_frontend)
FRONTEND_URL="http://${FRONTEND_CANISTER_ID}.localhost:4943"

echo "✅ Deployment complete!"
echo ""
echo "🌍 URLs:"
echo "   Frontend: ${FRONTEND_URL}"
echo ""
echo "🔗 Your existing services (keep running):"
echo "   Node.js Backend: http://localhost:5000"
echo "   PQC Service: http://localhost:5001"
echo "   MongoDB: localhost:27017"
echo ""
echo "🎉 Your React app is now running on ICP!"
echo "   All your PQC authentication and extension features will work normally"
echo ""
echo "📋 Extension Configuration:"
echo "   The extension will automatically detect the ICP URL: ${FRONTEND_URL}"
echo "   Make sure to load the extension and visit the ICP URL to test authentication"
echo ""
echo "🔧 If extension doesn't connect:"
echo "   1. Check that extension is loaded in Chrome"
echo "   2. Visit: ${FRONTEND_URL}"
echo "   3. Open developer console to see connection logs"