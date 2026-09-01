#!/bin/sh
set -e

echo "[entrypoint] applying database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] ensuring an admin account exists..."
node scripts/bootstrap-admin.mjs

echo "[entrypoint] starting Next.js on ${HOSTNAME}:${PORT}"
exec node server.js
