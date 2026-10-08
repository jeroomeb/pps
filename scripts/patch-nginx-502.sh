#!/usr/bin/env bash
# Intermittent 502s: Nginx was sending "Connection: upgrade" on every request.
# Next.js then closes some of those connections and Nginx reports Bad Gateway.
# This sends "upgrade" only when the browser actually asked for a WebSocket.
set -euo pipefail

MAP_FILE=/etc/nginx/conf.d/amenityops-upgrade-map.conf
SITE=/etc/nginx/sites-available/amenityops

if [ ! -f "$SITE" ]; then
  echo "Nginx site file not found at $SITE — skipped."
  exit 0
fi

cp "$SITE" "${SITE}.bak-502"
if [ -f "$MAP_FILE" ]; then
  cp "$MAP_FILE" "${MAP_FILE}.bak-502"
fi

cat > "$MAP_FILE" << 'EOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
EOF

python3 - "$SITE" << 'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()
replacements = [
    ("proxy_set_header Connection 'upgrade';", "proxy_set_header Connection $connection_upgrade;"),
    ('proxy_set_header Connection "upgrade";', "proxy_set_header Connection $connection_upgrade;"),
    ("proxy_set_header Connection 'Upgrade';", "proxy_set_header Connection $connection_upgrade;"),
]
for old, new in replacements:
    text = text.replace(old, new)

needle = "proxy_cache_bypass $http_upgrade;"
timeouts = """proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;"""
if "proxy_read_timeout" not in text and needle in text:
    text = text.replace(needle, timeouts, 1)

path.write_text(text)
PY

if nginx -t; then
  systemctl reload nginx
  echo "Nginx proxy headers updated and reloaded."
else
  cp "${SITE}.bak-502" "$SITE"
  if [ -f "${MAP_FILE}.bak-502" ]; then
    cp "${MAP_FILE}.bak-502" "$MAP_FILE"
  else
    rm -f "$MAP_FILE"
  fi
  echo "nginx -t failed. Restored the previous config. Site was not reloaded."
  exit 1
fi
