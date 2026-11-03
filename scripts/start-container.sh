#!/bin/sh
set -eu

# Railway attaches volumes at runtime as root. Initialize only the data directory,
# then drop privileges before starting the application. Never run the web server
# as root or recursively rewrite existing volume contents.
if [ "$(id -u)" = "0" ]; then
  case "${DATA_DIR:-/data}" in
    /data|/data/*)
      mkdir -p "${DATA_DIR:-/data}"
      chown node:node "${DATA_DIR:-/data}"
      chmod 700 "${DATA_DIR:-/data}"
      ;;
    *)
      echo "Container DATA_DIR must be /data or a directory inside /data." >&2
      exit 1
      ;;
  esac
  exec su-exec node:node "$@"
fi

exec "$@"
