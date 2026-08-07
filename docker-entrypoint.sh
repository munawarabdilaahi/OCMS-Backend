#!/bin/sh
set -e

echo "[ocms-entrypoint] Applying pending Prisma migrations..."
npx prisma migrate deploy

echo "[ocms-entrypoint] Starting OCMS API..."
exec node src/server.js
