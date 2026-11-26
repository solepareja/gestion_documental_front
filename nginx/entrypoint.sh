#!/bin/sh
set -eu
umask 077
fail() { echo "ERROR: configuracion del portal incompleta o invalida ($1)." >&2; exit 1; }
[ "$(id -u)" != 0 ] || fail usuario_root
printf '%s' "${API_HOST:-}" | grep -Eq '^[A-Za-z0-9]+([.-][A-Za-z0-9]+)+$' || fail API_HOST
check_token() {
    nombre=$1 valor=$2 minimo=$3
    [ "${#valor}" -ge "$minimo" ] || fail "$nombre"
    case "$valor" in *CAMBIAME*|*[!A-Za-z0-9_.-]*) fail "$nombre" ;; esac
}
check_token API_KEY_PORTAL "${API_KEY_PORTAL:-}" 32
check_token CF_ACCESS_CLIENT_ID "${CF_ACCESS_CLIENT_ID:-}" 8
check_token CF_ACCESS_CLIENT_SECRET "${CF_ACCESS_CLIENT_SECRET:-}" 16
# Lista explicita: no sustituir $uri ni variables internas de nginx.
envsubst '${API_HOST} ${API_KEY_PORTAL} ${CF_ACCESS_CLIENT_ID} ${CF_ACCESS_CLIENT_SECRET}' < /etc/nginx/templates/portal.conf.template > /tmp/portal.conf
if ! nginx -t >/tmp/nginx-check.log 2>&1; then
    echo 'ERROR: nginx no puede validar la configuracion:' >&2
    # Sustitucion literal (no regex) de secretos antes de mostrar el diagnostico.
    awk '
        function ocultar(linea, secreto, salida, pos) {
            if (secreto == "") return linea
            salida = ""
            while ((pos = index(linea, secreto)) > 0) {
                salida = salida substr(linea, 1, pos - 1) "[REDACTADO]"
                linea = substr(linea, pos + length(secreto))
            }
            return salida linea
        }
        {
            linea = ocultar($0, ENVIRON["API_KEY_PORTAL"])
            linea = ocultar(linea, ENVIRON["CF_ACCESS_CLIENT_ID"])
            print ocultar(linea, ENVIRON["CF_ACCESS_CLIENT_SECRET"])
        }
    ' /tmp/nginx-check.log >&2
    exit 1
fi
[ "${1:-}" != --check ] || exit 0
exec nginx -g 'daemon off;'
