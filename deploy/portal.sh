#!/bin/sh
# En el NAS: sudo sh portal.sh actualizar [--local]
set -eu
cd "$(dirname "$0")"
. ./common.sh
[ "$#" -le 2 ] || exit 2
compose_init "${2:-}"
case "${1:-}" in
    actualizar) exec sh ./deploy.sh "$MODO" ;;
    comprobar) compose exec -T portal wget -q -O /dev/null http://127.0.0.1:8080/api/health; echo 'API Flask accesible a traves del portal.' ;;
    estado) compose ps; echo 'healthy comprueba nginx; usar comprobar para verificar tambien Flask.' ;;
    log) compose logs -f --tail 50 portal ;;
    tunel) [ "$MODO" != --local ] || { echo 'El modo local no tiene tunel.'; exit 2; }; compose logs --tail 30 cloudflared ;;
    reiniciar) compose restart portal ;;
    parar) if [ "$MODO" = --local ]; then compose stop portal; else compose stop; fi ;;
    arrancar) if [ "$MODO" = --local ]; then compose start portal; else compose start; fi ;;
    *) echo "uso: $0 {actualizar|comprobar|estado|log|tunel|reiniciar|parar|arrancar} [--local]" >&2; exit 2 ;;
esac
