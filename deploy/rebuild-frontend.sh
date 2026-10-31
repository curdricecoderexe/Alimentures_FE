#!/usr/bin/env bash
# rebuild-frontend.sh — build the storefront into a new release directory and
# switch the live symlink atomically, then reload Nginx (for regenerated 301s).
#
# Run by hand after `git pull`, or by the API after catalogue changes
# (backend env: SITE_REBUILD_COMMAND="bash /var/www/alimenture/frontend/repo/deploy/rebuild-frontend.sh").
#
# Requires: Node 20 (see .nvmrc), the repo's .env.production with
#   VITE_API_URL=https://alimenture.in/api
#   VITE_APP_URL=https://alimenture.in
# and permission to run `sudo -n systemctl reload nginx` (see deploy/README.md).
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/alimenture/frontend}"
REPO="${REPO:-$APP_DIR/repo}"
RELEASES="$APP_DIR/releases"
KEEP="${KEEP_RELEASES:-5}"
STAMP="$(date +%Y%m%d%H%M%S)"
LOCK="$APP_DIR/.rebuild.lock"

mkdir -p "$RELEASES"
exec 9>"$LOCK"
flock -w 900 9 || { echo "another build is still running" >&2; exit 1; }

cd "$REPO"
export NODE_ENV=production
[ -d node_modules ] || npm ci --no-audit --no-fund

# Build + prerender + SEO validation. Any failure leaves the live site untouched.
npm run build:prod

cp -a dist "$RELEASES/$STAMP"
ln -sfn "$RELEASES/$STAMP" "$APP_DIR/current.tmp"
mv -Tf "$APP_DIR/current.tmp" "$APP_DIR/current"

# Regenerated redirects need a reload (graceful, no dropped connections).
sudo -n systemctl reload nginx || echo "warning: could not reload nginx — redirects update on next reload" >&2

# Keep the last $KEEP releases for instant rollback.
ls -1dt "$RELEASES"/*/ | tail -n +"$((KEEP + 1))" | xargs -r rm -rf

echo "storefront live: $RELEASES/$STAMP${REBUILD_REASON:+ ($REBUILD_REASON)}"
