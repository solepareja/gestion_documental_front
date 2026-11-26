#!/bin/sh
# Cargar despues de entrar en deploy/. Siempre proyecto y ficheros explicitos.
compose_init() {
    MODO=${1:-}
    case "$MODO" in ''|--local) ;; *) echo 'Modo desconocido' >&2; exit 2 ;; esac
    PROYECTO=gestiondocumental
    [ "$MODO" != --local ] || PROYECTO=gestiondocumental-local
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_V2=1
    elif command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_V2=0
    else
        echo 'ERROR: Docker Compose no esta disponible.' >&2; exit 1
    fi
}
compose() {
    if [ "$MODO" = --local ]; then
        set -- -f docker-compose.yml -f docker-compose.local.yml "$@"
    else
        set -- -f docker-compose.yml "$@"
    fi
    if [ "$COMPOSE_V2" = 1 ]; then
        docker compose -p "$PROYECTO" "$@"
    else
        docker-compose -p "$PROYECTO" "$@"
    fi
}
