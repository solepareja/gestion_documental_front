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
