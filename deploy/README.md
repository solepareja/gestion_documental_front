# Despliegue del portal de Gestión Documental

Adaptado de `Sistemas/WebLogisticaFSV/deploy/portal.sh` y `deploy.sh`, sin modificar Logística.
Este proyecto contiene el frontend en su raíz: el Dockerfile compila `src/` con `npm ci` y sirve `dist/` mediante nginx. Flask y SQL Server permanecen en Windows. No hay otro backend Python dentro del portal.

## Estado real

Actualizado a 26/11/2026: backend en ejecución bajo NSSM; secretos, Access, DNS y túnel propio configurados. Build Docker ejecutado en el NAS y contenedores públicos arrancados. La comprobación de API desde el portal local fue correcta. Pendientes la comprobación pública y el login integral. Estado, historial y comandos operativos en [DESPLIEGUE_Y_ACTUALIZACIONES.md](../docs/DESPLIEGUE_Y_ACTUALIZACIONES.md).

Backend en `W:/API_Backend_WebGestorDocumental`, versión 0.6.0: usuarios, trabajadores, avisos, materiales, entregas, renovación, documentos, firmas/tablet y consulta de transporte. **Migración funcional aún incompleta**: faltan altas/ediciones de transporte y sus relaciones/carnets, parte de los listados paginados y endpoints `/v1/logistica/`. Crear el servicio no completa esas funciones.

## Preparación inicial en el NAS

Los archivos que se editan en S: ya están en el NAS. No hay que copiarlos a otra carpeta.

```sh
cd /volume3/Sistemas/WebGestorDocumental/gestion_documental_front/deploy
cp .env.example .env
chmod 600 .env
```

Editar `.env` con el UID:GID de una cuenta real del NAS (`id nombre_de_usuario`, ambos distintos de cero). Mantener `API_HOST=api-gestiondocumental.sistemasfsv.com`, o ajustar al hostname real de la API. Sin protocolo ni ruta.

Crear `/root/gestiondocumental-secrets/` con propietario root y permisos 700. Crear dentro `portal.env`, propietario root y permisos 600, siguiendo `portal.env.example`:

- `API_KEY_PORTAL`: el mismo valor que en el `.env` del backend Python.
- `CF_ACCESS_CLIENT_ID` y `CF_ACCESS_CLIENT_SECRET`: token de servicio propio `nas-gestiondocumental`, autorizado en Cloudflare Access para la API.

No copiar estos secretos al recurso compartido, al frontend ni a variables VITE_. Compose los entrega a nginx en ejecución; la imagen y el JavaScript no los contienen. Los ejemplos son marcadores, no claves utilizables.

La API de Windows debe estar disponible en su hostname HTTPS a través del túnel `fsv-sql-sage`, con Cloudflare Access configurado **antes de publicar la ruta**. En su `.env`: `CF_ACCESS_VALIDAR=1`, dominio Access y AUD correctos, `PORTAL_ORIGIN=https://gestiondocumental.sistemasfsv.com`. El backend sigue escuchando solo en `127.0.0.1:5006`.

Crear un túnel propio del portal `gestiondocumental-nas`, completar su UUID en `cloudflared/config.yml` y guardar su credencial en `cloudflared/gestiondocumental-nas.json`. Esta credencial debe ser legible por el UID:GID elegido (fichero 600, directorio 700 para ese propietario). Configurar la ruta DNS del hostname `gestiondocumental.sistemasfsv.com` a ese túnel. No reutilizar UUID ni credenciales de Logística.

## Publicar cambios

```sh
sudo sh portal.sh actualizar
sudo sh portal.sh estado
sudo sh portal.sh comprobar
```

`actualizar` valida ficheros y Compose sin mostrar secretos, construye React dentro de Docker, comprueba credenciales/formato y `nginx -t` en un contenedor temporal, y recrea los servicios. No borra imágenes ni volúmenes de otros proyectos. Si falla la construcción/validación, no ejecuta `up` sobre el portal existente.

`estado` muestra los contenedores. `healthy` significa que nginx responde a `/portal-health`; **no garantiza que Flask funcione**. `comprobar` exige respuesta correcta de `/api/health` atravesando nginx, Cloudflare y Flask. Después probar login y navegación desde el dominio HTTPS.

```sh
sudo sh portal.sh log        # seguir logs del portal, salir con Ctrl+C
sudo sh portal.sh tunel      # últimas líneas de cloudflared
sudo sh portal.sh reiniciar  # no recompila React
sudo sh portal.sh parar
sudo sh portal.sh arrancar   # arranca contenedores existentes; primera vez: actualizar
```

Siempre se fija `-p gestiondocumental`; los comandos usan nombres de servicio Compose, sin depender de si DSM genera nombres con guiones o guiones bajos. No ejecutar Compose sin el proyecto explícito.

## Vista previa local

```sh
sudo sh portal.sh actualizar --local
sudo sh portal.sh estado --local
sudo sh portal.sh comprobar --local
sudo sh portal.sh parar --local
```

Usa el proyecto independiente `gestiondocumental-local`, solo servicio portal y puerto 8083. Por defecto se publica en 127.0.0.1 del NAS; para verlo desde la LAN ajustar `LAN_BIND_IP` a la IP del NAS. No arranca cloudflared ni modifica el proyecto de producción. Aun en local, las llamadas a la API usan su hostname HTTPS y requieren las claves del portal.

**Es una vista previa HTTP, no un modo de autenticación local.** El backend conserva cookie Secure y valida el Origin del dominio HTTPS. No se falsea Origin ni se desactivan esas protecciones para hacer funcionar el login en HTTP.

## Servicio NSSM en Windows

Configurar en el Windows Server, con rutas físicas locales. W: es una unidad mapeada del puesto de desarrollo y no debe usarse como ruta del servicio. Según la infraestructura entregada, su carpeta física es:

`C:/Users/Administrador/Documents/Python/API_Backend_WebGestorDocumental`

Comprobar esta correspondencia en el servidor. Crear allí el entorno virtual e instalar dependencias (el venv de pruebas del equipo de desarrollo no sirve como servicio):

```powershell
Set-Location 'C:\Users\Administrador\Documents\Python\API_Backend_WebGestorDocumental'
py -3 -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe herramientas\comprobar_sql.py
.\venv\Scripts\python.exe app.py
```

El servidor necesita ODBC Driver 18 y la configuración `.env` completada. El arranque de `app.py` valida también Cloudflare; no basta con que SQL conecte. Tras comprobar el arranque manual, detenerlo antes de iniciar NSSM para no ocupar dos veces el puerto 5006.

En la ventana de instalación de NSSM para un servicio nuevo `API_Backend_WebGestorDocumental`:

| Campo | Valor |
|---|---|
| Application / Path | `C:\Users\Administrador\Documents\Python\API_Backend_WebGestorDocumental\venv\Scripts\python.exe` |
| Startup directory | `C:\Users\Administrador\Documents\Python\API_Backend_WebGestorDocumental` |
| Arguments | `app.py` |
| Startup type | Automático |

Usar una cuenta de servicio con acceso a esa carpeta y a su `.env`; configurar salida/error y rotación de logs en NSSM. El proceso ejecuta Waitress con 8 hilos. **Un único proceso**: las sesiones de login y tablet están en memoria. Reiniciar el backend invalida las sesiones; reconstruir solo el portal no lo reinicia. No instalar ni cambiar el servicio de Logística.

## Decisiones de configuración

- Imagen de nginx sin privilegios, UID:GID del NAS, sistema de archivos de solo lectura y temporales/configuración generada en `/tmp` (tmpfs). Plantilla sustituida con una lista explícita de variables; `$uri` no se altera.
- Sin puertos publicados en producción: solo cloudflared llega al portal por la red de su proyecto.
- `/api/` quita ese prefijo, inyecta las tres credenciales y conserva Origin/cookies. TLS hacia la API verifica la CA; esto es independiente del certificado SQL configurado en Python.
- Límite de cuerpo 36 MiB, suficiente para el base64 de los PDF de 25 MiB. Tiempo de espera API 130 segundos; sin reintentos automáticos de escrituras.
- Las rutas SPA vuelven a index.html; assets inexistentes devuelven 404. index.html no se cachea.

Referencias técnicas: [nginx sin privilegios](https://github.com/nginx/docker-nginx-unprivileged/blob/main/README.md), [validación silenciosa de Compose](https://docs.docker.com/reference/cli/docker/compose/config/).
