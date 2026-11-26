# Gestión Documental

## Aplicación instalable (PWA)

La web incluye un manifiesto, iconos y apertura en ventana independiente.
El botón «Instalar app» abre la instalación cuando el navegador la ofrece;
en otros casos muestra las instrucciones para el dispositivo.

Para probar la versión instalable, ejecuta `npm run build` y `npm run preview`.
El service worker solo se registra en producción. Usa `localhost` en el equipo
de desarrollo; para instalar desde móviles u otros equipos, publica con HTTPS
(una dirección HTTP de la red local no es suficiente).

Despliega todo `dist/`, incluidos `sw.js`, `offline.html`, `manifest.webmanifest`
y `icons/`. Configura el servidor para servir `index.html` en las rutas de React,
sin redirigir las peticiones de archivos estáticos ni del backend a ese HTML.
Sirve `sw.js` con revalidación (`Cache-Control: no-cache`) y el manifiesto como
`application/manifest+json`. Mantén la configuración de `VITE_API_URL` y el
acceso al backend desde los dispositivos donde se instale.

La consulta y las modificaciones requieren conexión al backend. Sin conexión,
una navegación muestra una página con el botón de reintentar. No se almacenan
documentos, respuestas de la API ni credenciales en la caché del service worker.
Las actualizaciones del worker se aplican al cerrar las ventanas de la app y
volver a abrirla, sin forzar una recarga durante la edición de formularios.

En Chrome/Edge usa «Instalar app»; en iPhone/iPad abre Safari y selecciona
Compartir → Añadir a la pantalla de inicio. Una vez instalada, se abre con su
icono y sin la barra de navegación del navegador.

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## Transporte SQL Server — 25/11/2026

Las rutas de transporte usan TransporteConsulta.jsx: listados con busqueda/estado, fichas con NULL como «Sin indicar», varios conductores por vehiculo, varios vehiculos por conductor y vinculos TITULAR/EMPLEADO/AUTONOMO_COLABORADOR. Los datos proceden del backend Flask 0.6.0 (W:/API_Backend_WebGestorDocumental), que consulta las tablas AppLogistica de 200_Pruebas. No hay datos de muestra en estas pantallas.

Esta fase habilita consulta y acceso a documentacion; las antiguas rutas de alta/edicion de maestros redirigen a sus listados hasta migrar sus escrituras. Sus componentes originales se conservan. Las fichas de trabajadores siguen usando PersonaDetalle.

El build de produccion incluye VITE_API_URL=/api en .env.production. Necesita el proxy del portal hacia Flask, que agrega las claves en servidor; ninguna API key debe ponerse en variables VITE_. La configuracion de desarrollo de Vite anterior sigue siendo para Spring: la prueba contra Flask se hara al configurar el proxy/portal. No se ha desplegado ni reiniciado ningun servicio.

Validado con npm run build y eslint de los archivos modificados. Pendiente prueba integral en navegador con Flask. Los datos de gestion de MySQL ya se han importado a SQL Server; informe de conteos, exclusiones y mapa de IDs en W:/API_Backend_WebGestorDocumental/datos/informe_importacion_mysql_2026-11-25.json. Los datos reales de transporte permanecen sin cambios. 25 entregas antiguas carecian de PDF en MySQL y conservan esa ausencia.


## Portal Docker preparado

Despliegue adaptado de WebLogisticaFSV: [guía de NAS, Cloudflare y NSSM](deploy/README.md). En el NAS, desde esta carpeta `deploy/`, `sudo sh portal.sh actualizar` compila React dentro de la imagen y recrea el proyecto independiente `gestiondocumental`. Antes hay que completar el `.env` del despliegue, el fichero de secretos externo y el túnel propio. No se ha publicado ni arrancado ningún contenedor desde esta sesión. El backend 0.6.0 sigue siendo una migración parcial; la guía detalla qué está migrado y qué falta.


Estado actualizado a 26/11/2026, historial de Cloudflare/NSSM/NAS y comandos de actualización: [Despliegue y actualizaciones](docs/DESPLIEGUE_Y_ACTUALIZACIONES.md). Esta referencia sustituye las notas históricas anteriores de despliegue pendiente.
