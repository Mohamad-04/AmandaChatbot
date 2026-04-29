#!/bin/bash
# Run this before deploying to build the admin dashboard React SPA.
# The output goes to services/admin-dashboard/dist/ which Flask serves at /admin-app/

set -e

echo "Building admin dashboard..."
cd services/admin-dashboard
npm install
npm run build
cd ../..

echo "Build complete. Deploy with: gunicorn wsgi:app --worker-class gevent -w 1"
