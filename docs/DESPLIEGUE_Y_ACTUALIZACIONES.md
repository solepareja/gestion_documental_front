# Gestión Documental — estado y operación del despliegue

Fecha: 26/11/2026. Registro de lo realizado y comandos para las siguientes actualizaciones.

## Estado confirmado

- **Backend Python:** servicio NSSM `API_Backend_WebGestorDocumental` creado y en ejecución en el servidor Windows, según confirmación de la usuaria. Ejecuta Flask mediante Waitress, escuchando en `127.0.0.1:5006`.
- **Frontend:** scripts de despliegue preparados y utilizados en el NAS. Se ha construido la imagen y han arrancado los contenedores públicos `gestiondocumental-portal-1` y `gestiondocumental-cloudflared-1`.
- **Prueba local:** `sudo sh portal.sh comprobar --local` devolvió «API Flask accesible a traves del portal». Verifica NAS → nginx → Cloudflare Access → Flask.
- **Prueba pública:** ambos contenedores arrancaron; la última salida mostraba el portal en `health: starting`. Queda por confirmar `portal.sh comprobar` en producción y el login/navegación desde el dominio público.
- **El despliegue y la migración funcional todavía no están finalizados.** El servicio en ejecución no significa que todas las funciones de Spring estén migradas.

## Carpetas y arquitectura

| Elemento | Ubicación |
|---|---|
| Backend desde el puesto de trabajo | `W:\API_Backend_WebGestorDocumental` |
| Backend en Windows Server | `C:\Users\Administrador\Documents\Python\API_Backend_WebGestorDocumental` |
| Frontend desde Windows | `\\172.16.10.4\Sistemas\WebGestorDocumental\gestion_documental_front` |
| Frontend en el NAS | `/volume3/Sistemas/WebGestorDocumental/gestion_documental_front` |
| Scripts en el NAS | `/volume3/Sistemas/WebGestorDocumental/gestion_documental_front/deploy` |

`S:` es el recurso compartido del NAS: guardar el código ahí ya modifica los archivos que utiliza el build. El código queda dentro de la imagen Docker al reconstruirla.

```text
Navegador HTTPS
  → gestiondocumental.sistemasfsv.com
  → túnel gestiondocumental-nas
  → nginx del portal en el NAS :8080
  → /api/ → api-gestiondocumental.sistemasfsv.com
  → Cloudflare Access + túnel fsv-sql-sage
  → Windows 127.0.0.1:5006, Flask/Waitress bajo NSSM
  → SQL Server 200_Pruebas y API NAS/RRHH
```

## Backend y datos migrados

Versión de referencia: **0.6.0**.

Migrados a Python: usuarios/login, trabajadores, avisos, materiales, stock por talla, entregas, renovación de vestuario, documentos y archivos NAS, plantillas, firmas, modo tablet y consultas de transporte con relaciones múltiples.

Pendientes funcionales: escrituras de maestros de transporte, sus relaciones y carnets; parte de los listados paginados; endpoints `/v1/logistica/`; pruebas integrales con React.

Se importaron de MySQL los datos de prueba autorizados de gestión: 3 usuarios, 25 trabajadores, 32 materiales, 38 stocks por talla, 42 entregas, 48 líneas, 4 plantillas, 4 asignaciones de firmantes, 19 firmas y la renovación. Se cotejaron 216 filas sin diferencias. Se subieron 13 PDF de firmas al NAS y se verificaron otros 23 PDF existentes. Las 25 entregas que carecían de PDF en MySQL conservan esa ausencia.

**No se importó transporte de prueba ni sus 44 documentos.** Las seis tablas de transporte real se compararon antes/después y permanecieron sin cambios. La API de Logística no se modifica.

Informe: `W:\API_Backend_WebGestorDocumental\datos\informe_importacion_mysql_2026-11-25.json`. No volver a ejecutar la importación como parte de una actualización de código.

Validación de referencia: 240 pruebas Python aprobadas; build React y eslint de los archivos modificados correctos.

## Cloudflare configurado

### API del servidor Windows

- Hostname: `api-gestiondocumental.sistemasfsv.com`.
- Aplicación Access self-hosted para ese hostname, sin Path.
- Política con acción **Service Auth**, incluyendo el Service Token propio `nas-gestiondocumental`.
- Activada la opción de respuesta 401, según lo indicado por la usuaria.
- Team domain: `orange-sea-cc14.cloudflareaccess.com`.
- AUD de esa aplicación guardado en el `.env` del backend; su valor no se incluye en este documento.
- Ruta añadida al túnel existente `fsv-sql-sage`: hostname API → `http://127.0.0.1:5006`, sin Path. Cloudflare confirmó la creación de la ruta y del DNS.

El `.env` del backend utiliza `CF_ACCESS_VALIDAR=1`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` y `PORTAL_ORIGIN=https://gestiondocumental.sistemasfsv.com`. Tras completar la configuración, la usuaria confirmó el arranque del servicio.

SQL usa `SQL_ENCRYPT=1` y `SQL_TRUST_SERVER_CERTIFICATE=1`, según la configuración indicada por Sistemas para el certificado propio de SQL. No se instaló un certificado en Windows.

### Túnel del portal NAS

Creado por SSH mediante la imagen Docker de cloudflared, sin instalar el ejecutable en el NAS:

- Nombre: `gestiondocumental-nas`.
- UUID: `2134ff86-54e0-4df2-a616-1a972011c45e`.
- Hostname público: `gestiondocumental.sistemasfsv.com`.
- Destino dentro de Compose: `http://portal:8080`.
- Credencial de ejecución: `deploy/cloudflared/gestiondocumental-nas.json`.
- Configuración: `deploy/cloudflared/config.yml`, con el UUID anterior y esa credencial.
- DNS CNAME creado mediante `tunnel route dns`; Cloudflare confirmó que apunta a este túnel.

La autorización administrativa se generó con `tunnel login` y se guardó en `/root/.cloudflared/cert.pem`. La credencial del túnel se generó inicialmente como `/root/.cloudflared/2134ff86-54e0-4df2-a616-1a972011c45e.json` y se copió al directorio de ejecución. No compartir el contenido de estos archivos.

Se asignó propietario `1026:100` a `deploy/cloudflared` y sus dos archivos; permisos 700 para el directorio y 600 para configuración/credencial. El comando `sed` utilizado sustituyó el marcador `CAMBIAME_UUID_DEL_TUNEL` por el UUID; solo editó la configuración, sin crear túneles ni DNS.

## NAS y secretos del portal

Acceso SSH realizado con la cuenta `sistemas`, que tiene UID `1026`, GID `100` y pertenece a `administrators`.

`deploy/.env` quedó con:

```dotenv
NAS_UID_GID=1026:100
API_HOST=api-gestiondocumental.sistemasfsv.com
LAN_BIND_IP=127.0.0.1
PUERTO_LOCAL=8083
```

Los secretos se guardaron fuera del recurso compartido en `/root/gestiondocumental-secrets/portal.env`, con directorio 700 y archivo 600:

- `API_KEY_PORTAL`: misma clave que en el backend Python.
- `CF_ACCESS_CLIENT_ID`: Client ID de `nas-gestiondocumental`.
- `CF_ACCESS_CLIENT_SECRET`: Client Secret de ese token.

Estas claves se inyectan en nginx en ejecución. No se guardan en React ni en variables VITE_. El frontend compila con `VITE_API_URL=/api`.

## Archivos de despliegue y ajustes realizados

Se adaptaron los scripts de `Sistemas/WebLogisticaFSV/deploy/`, conservando el proyecto Docker independiente `gestiondocumental`:

- `Dockerfile`: compila React con Node y sirve el resultado con nginx sin privilegios.
- `nginx/nginx.conf`, `nginx/default.conf.template` y `nginx/entrypoint.sh`: SPA, proxy de API, TLS verificado, secretos en servidor y temporales en `/tmp`.
- `deploy/common.sh`, `deploy/deploy.sh` y `deploy/portal.sh`: selección Compose, validaciones, build y operaciones habituales.
- `deploy/docker-compose.yml`: portal y cloudflared, sin publicar el puerto del portal al host en producción.
- `deploy/docker-compose.local.yml`: prueba aislada, proyecto `gestiondocumental-local`, puerto `127.0.0.1:8083`.
- Ejemplos de configuración, exclusiones de secretos y finales de línea LF.

Durante la prueba se corrigió el permiso de lectura de `/etc/nginx/nginx.conf` en la imagen para el UID del NAS. También se mejoró el mensaje de `nginx -t`, ocultando las claves antes de mostrar errores. Después de reconstruir, el portal local arrancó y la comprobación de API fue correcta.

El modo local HTTP es una vista previa. No se desactivaron la cookie Secure ni la comprobación de Origin; el login completo se valida desde el dominio HTTPS.

## Actualizar el backend Python

**Ejecutar en PowerShell como administrador EN EL SERVIDOR WINDOWS**, donde está instalado NSSM. Usar la ruta física local, no W: como ruta del servicio.

Una vez guardados los cambios de código en la carpeta del backend:

```powershell
Set-Location 'C:\Users\Administrador\Documents\Python\API_Backend_WebGestorDocumental'
nssm restart API_Backend_WebGestorDocumental
nssm status API_Backend_WebGestorDocumental
```

El estado esperado es `SERVICE_RUNNING`. No arrancar además `python app.py` manualmente mientras NSSM utiliza el puerto 5006.

**Si cambian las dependencias de `requirements.txt`**, realizar la actualización con el servicio parado:

```powershell
Set-Location 'C:\Users\Administrador\Documents\Python\API_Backend_WebGestorDocumental'
nssm stop API_Backend_WebGestorDocumental
.\venv\Scripts\python.exe -m pip install -r requirements.txt
# Continuar solo si pip termina correctamente.
nssm start API_Backend_WebGestorDocumental
nssm status API_Backend_WebGestorDocumental
```

`venv` es el nombre previsto para el entorno del servidor; si se creó con otro nombre, utilizar el intérprete configurado en Application/Path de NSSM. No utilizar el venv temporal de pruebas del puesto de desarrollo.

Los cambios del `.env` también necesitan reiniciar el backend. Reiniciar invalida las sesiones de login/tablet, porque sus registros están en memoria. Usar un único proceso Waitress.

### Logs del backend

La aplicación escribe `api_gestiondocumental.log` en su propia carpeta, con rotación de 5 MB y 5 copias. Registra errores HTTP, peticiones de 3 segundos o más y errores internos sanitizados. No guarda contraseñas, tokens ni documentos.

```powershell
Get-Content '.\api_gestiondocumental.log' -Tail 50 -Wait
```

Los errores anteriores a inicializar la aplicación, como un `.env` incompleto, van a stderr de Python. Se indicó configurar en NSSM → I/O:

- Output: `C:\Users\Administrador\Documents\Python\API_Backend_WebGestorDocumental\servicio-output.log`.
- Error: `C:\Users\Administrador\Documents\Python\API_Backend_WebGestorDocumental\servicio-error.log`.

La configuración final de I/O y su rotación no se ha confirmado en este chat. Si Error está configurado con la ruta anterior:

```powershell
Get-Content '.\servicio-error.log' -Tail 50 -Wait
```

## Actualizar el frontend y portal

Desde Windows, entrar al NAS:

```sh
ssh sistemas@172.16.10.4
```

**Los siguientes comandos se ejecutan DENTRO del NAS:**

```sh
cd /volume3/Sistemas/WebGestorDocumental/gestion_documental_front/deploy
sudo sh portal.sh actualizar
sudo sh portal.sh estado
sudo sh portal.sh comprobar
```

`actualizar` recompila React dentro de Docker, valida nginx y recrea los servicios del proyecto público. Guardar archivos o ejecutar `reiniciar` no recompila el frontend. No hace falta ejecutar `npm run build` en Windows antes: el Dockerfile lo hace.

`comprobar` debe mostrar «API Flask accesible a traves del portal». Después abrir `https://gestiondocumental.sistemasfsv.com` y comprobar login y navegación.

Otros comandos, desde la misma carpeta:

```sh
sudo sh portal.sh log        # Seguir logs del portal; Ctrl+C para salir
sudo sh portal.sh tunel      # Últimos mensajes del túnel
sudo sh portal.sh reiniciar  # Reiniciar nginx sin recompilar
sudo sh portal.sh parar      # Parar portal y túnel públicos
sudo sh portal.sh arrancar   # Arrancar contenedores públicos ya creados
```

La actualización del portal no reinicia el backend ni modifica SQL. Para cambios de backend, reiniciar NSSM en Windows. Para cambios en ambos, actualizar ambos componentes y comprobar después la API y el navegador.

### Prueba local y limpieza opcional

La prueba local tiene su propio proyecto y sus comandos llevan `--local`:

```sh
sudo sh portal.sh actualizar --local
sudo sh portal.sh estado --local
sudo sh portal.sh comprobar --local
sudo sh portal.sh parar --local
```

El portal local se utilizó con éxito. No consta que se haya parado después. Una vez comprobado el portal público, puede pararse con el último comando; no afecta al proyecto público.

## Pendientes al cerrar este registro

1. Ejecutar `sudo sh portal.sh comprobar` para el proyecto público y confirmar el resultado.
2. Abrir el dominio HTTPS y validar login y navegación con los usuarios importados.
3. Revisar logs del túnel si la URL pública no responde; el arranque de Docker no confirma por sí solo la conexión del túnel.
4. Confirmar I/O y rotación de logs NSSM.
5. Completar las funciones pendientes de la migración y las pruebas integrales. Revisar también la configuración WAF prevista de acceso desde España antes de dar el despliegue por finalizado.
