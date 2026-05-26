# Static site served by the Airbase-managed Nginx image.
# gdssingapore/airbase:nginx-1.28 is pre-configured with:
#   - non-root 'app' user (UID/GID 999)
#   - nginx listening on port 8080
#   - temp/PID/log paths under /tmp (read-only-container safe)
#   - regular GovTech security patches
FROM gdssingapore/airbase:nginx-1.28

# Custom nginx config: the base image handles temp/cache paths in /tmp
COPY --chown=app:app nginx.conf /etc/nginx/conf.d/default.conf

# Application files
COPY --chown=app:app index.html  /usr/share/nginx/html/index.html
COPY --chown=app:app style.css   /usr/share/nginx/html/style.css
COPY --chown=app:app app.js      /usr/share/nginx/html/app.js
COPY --chown=app:app js/         /usr/share/nginx/html/js/

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO /dev/null http://localhost:8080/health || exit 1
