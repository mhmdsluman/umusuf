#!/usr/bin/env bash
set -e
# install composer deps (non-interactive)
echo "--- Running Composer Install ---"
composer install --no-interaction --prefer-dist --optimize-autoloader
echo "--- Composer Install Finished ---"
# correct permissions (example)
# chown -R "$(id -u):$(id -g)" vendor
