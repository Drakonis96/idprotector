# IDprotector — self-hosted, fully client-side document protector.
# The image is just a static web server: there is no backend, no database,
# and no code that could receive or persist a user's files.
FROM nginx:1.27-alpine

# Serve config (listens on 8683, sets privacy/security headers).
COPY nginx.conf /etc/nginx/nginx.conf

# Static site (HTML/CSS/JS + vendored pdf.js & pdf-lib).
COPY public/ /usr/share/nginx/html/

EXPOSE 8683

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8683/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
