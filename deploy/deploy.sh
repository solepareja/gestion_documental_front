#!/bin/sh
set -eu
cd "$(dirname "$0")"
. ./common.sh
[ "$#" -le 1 ] || exit 2
compose_init "${1:-}"
[ -f .env ] || { echo 'ERROR: copiar deploy/.env.example a deploy/.env y rellenarlo.' >&2; exit 1; }
# Fichero propio, sin secretos, sintaxis KEY=value compatible con sh.
. ./.env
printf '%s' "${NAS_UID_GID:-}" | grep -Eq '^[1-9][0-9]*:[1-9][0-9]*$' || { echo 'ERROR: indicar UID:GID no root en .env.' >&2; exit 1; }
SECRETOS=/root/gestiondocumental-secrets/portal.env
[ -r "$SECRETOS" ] || { echo "ERROR: falta $SECRETOS (ejecutar con sudo)." >&2; exit 1; }
for fichero in ../Dockerfile ../package.json ../package-lock.json ../src/App.jsx ../nginx/entrypoint.sh; do
    [ -f "$fichero" ] || { echo "ERROR: falta $fichero" >&2; exit 1; }
done
if [ "$MODO" != --local ]; then
    [ -s cloudflared/gestiondocumental-nas.json ] || { echo 'ERROR: falta la credencial del tunel propio.' >&2; exit 1; }
    if grep -q CAMBIAME cloudflared/config.yml; then echo 'ERROR: completar el UUID del tunel propio.' >&2; exit 1; fi
fi
# -q valida sin imprimir secretos resueltos por env_file.
compose config -q
compose build portal
# Validar claves, DNS de la API y nginx antes de sustituir el portal existente.
compose run --rm --no-deps portal --check
if [ "$MODO" = --local ]; then
    compose up -d portal
else
    compose up -d
fi
# Fallar si nginx no responde; no anunciar exito solo porque Docker lo arranco.
intentos=0
until compose exec -T portal wget -q -O /dev/null http://127.0.0.1:8080/portal-health; do
    intentos=$((intentos + 1))
    [ "$intentos" -lt 15 ] || { echo 'ERROR: nginx no responde. Revisar portal.sh log.' >&2; exit 1; }
    sleep 2
done
compose ps
echo 'Portal actualizado. Comprobar tambien API: sudo sh portal.sh comprobar'
[ "$MODO" != --local ] || echo 'Modo local aislado: vista previa HTTP; el login requiere el dominio HTTPS autorizado.'
