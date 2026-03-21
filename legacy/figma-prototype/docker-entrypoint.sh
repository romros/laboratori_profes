#!/bin/sh
set -e
mkdir -p /etc/nginx/ssl

CNF=/tmp/profes-openssl.cnf
{
  printf '%s\n' '[req]' 'distinguished_name = req_distinguished_name' 'x509_extensions = v3_req' 'prompt = no'
  printf '%s\n' '[req_distinguished_name]' 'CN = profes'
  printf '%s\n' '[v3_req]' 'subjectAltName = @alt_names' '[alt_names]' 'DNS.1 = localhost' 'IP.1 = 127.0.0.1'
  n=2
  if [ -n "$PROFES_TLS_SAN_IP" ]; then
    # una o més IPs separades per coma
    oldIFS=$IFS
    IFS=,
    for ip in $PROFES_TLS_SAN_IP; do
      ip=$(echo "$ip" | tr -d ' ')
      [ -z "$ip" ] && continue
      echo "IP.$n = $ip"
      n=$((n + 1))
    done
    IFS=$oldIFS
  fi
} >"$CNF"

openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem \
  -config "$CNF" -extensions v3_req

exec nginx -g "daemon off;"
