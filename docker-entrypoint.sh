#!/bin/bash -eu

cat << EOF >/usr/share/nginx/html/config.js
window.OIDC_PROVIDER_URL="${OIDC_PROVIDER_URL:-undefined}";
window.OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-undefined}";
window.OIDC_CLIENT_SECRET="${OIDC_CLIENT_SECRET:-undefined}";
window.OIDC_REDIRECT_URI="${OIDC_REDIRECT_URI:-undefined}";
EOF

sed -i".old" 's#<body>#<body><script type="text/javascript" src="/config.js"></script>#' /usr/share/nginx/html/index.html

[ ! -z ${APP_TITLE} ] && sed -i".old" 's#<head>#<head><title>'${APP_TITLE}'</title>#' /usr/share/nginx/html/index.html
[ ! -z ${APP_FAVICON} ] && sed -E -i".old" 's#<link rel="icon" href="(.*?)"></head>#<link rel="icon" href="'${APP_FAVICON}'"></head>#' /usr/share/nginx/html/index.html

nginx -g "daemon off;"
