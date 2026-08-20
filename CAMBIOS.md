# Cambios aplicados — catalogo-inmobiliario

Basado en el audit del 10 de agosto 2026. Todos los archivos fueron editados sobre el
`main` actual (commit `06e8ff9`). Antes de hacer push, revisa el diff con tu copia local.

## app.js

1. **Rebranding RE/MAX completado.**
   - Logo del header: ahora usa `.logo-text` / `.logo-name` / `.logo-subtitle` (clases que
     ya existían en `styles.css` desde el commit `06e8ff9` pero nunca se consumían).
     Muestra "Jose Miguel Quintero" + "RE/MAX MOMENTUM".
   - Footer: reemplaza "Premium Inmobiliaria" por tu nombre y RE/MAX Momentum, agrega
     enlaces a Facebook e Instagram (usando `.footer-social-link`, también sin usar antes).
   - Nuevas claves en `CONFIG`: `EMAIL`, `FACEBOOK_URL`, `INSTAGRAM_URL`.
   - **Revisa el email**: dejé `quinteroff@gmail.com` porque es el único que tengo
     confirmado. Si tienes un correo profesional de RE/MAX, cámbialo en `CONFIG.EMAIL`.
   - Los íconos de Facebook/Instagram en el footer usan `external-link` de Lucide en vez
     de los íconos de marca — Lucide los eliminó en su versión 1.0 (junio 2026) por temas
     de licencia de marcas registradas. Si quieres los logos reales, hay que usar SVGs
     propios o el paquete `simple-icons`.

2. **Fix: badge className con múltiples espacios.**
   `property.badge.toLowerCase().replace(' ', '-')` solo reemplazaba el primer espacio.
   Ahora usa `.replace(/\s+/g, '-')` (regex global) para que cualquier badge de más de
   una palabra genere la clase CSS correcta.

3. **Fix: filtro de tipo de propiedad incompleto.**
   Se agregó `'galpon'` al arreglo de checkboxes de tipo (antes solo tenía 4 de los 5 tipos
   que reconoce `normalizeType()` en el backend). Se agregó `TYPE_LABELS` y `formatType()`
   para mostrar "Galpón" con tilde en vez de "Galpon" en la tarjeta y el modal.

## api/properties.js

4. **Fix: `lastModified` nunca se calculaba.**
   `app.js` ordena las propiedades con `(b.lastModified || 0) - (a.lastModified || 0)`,
   pero el backend nunca incluía ese campo — el sort no hacía nada en la práctica.
   Ahora:
   - La consulta de carpetas (`foldersUrl`) y la de archivos (`filesUrl`) piden también
     `modifiedTime` a la API de Drive.
   - `propertyData.lastModified` se calcula como el máximo `modifiedTime` entre la carpeta
     y todos sus archivos (imágenes + info.txt), convertido a timestamp numérico.
   - Resultado: el catálogo ahora sí ordena por "más recientemente modificado primero"
     (con las destacadas siempre arriba, como ya hacía `app.js`).

5. **Fix de seguridad: CORS abierto (`*`) restringido.**
   Antes: `Access-Control-Allow-Origin: '*'` — cualquier sitio podía consumir tu endpoint.
   Ahora: se valida el header `Origin` de la petición contra una lista blanca
   (`ALLOWED_ORIGINS`, incluye tu dominio de Vercel y localhost para desarrollo). Si el
   origin no está en la lista, no se envía el header (el navegador bloqueará la lectura
   de la respuesta desde ese origen). **Esto no afecta tu propio sitio**: las peticiones
   desde `catalogo-inmobiliario-six.vercel.app` a `/api/properties` son same-origin y no
   dependen de CORS para funcionar.
   - Si cambias de dominio o agregas un dominio personalizado, agrégalo a
     `ALLOWED_ORIGINS` en `api/properties.js`.

## styles.css

6. **Fix: badges `RESERVADO` y `OPORTUNIDAD` sin estilo.**
   Se agregaron `.property-badge.reservado` (ámbar `#f0932b`) y
   `.property-badge.oportunidad` (verde `#27ae60`), consistentes con la paleta existente
   (`--secondary` para nuevo, `--accent` para destacado, gris para vendido).

## index.html

7. **Meta tags y título actualizados** — quitan "Premium Inmobiliaria" (title, description,
   keywords, author) y el texto de carga inicial, y los reemplazan con tu identidad RE/MAX.
8. **Lucide fijado a versión concreta** (`1.31.0`) en vez de `@latest`, para que una
   actualización de la librería no rompa los íconos sin aviso. `React`/`ReactDOM` ya
   estaban fijados en `@18`.

## No incluido en esta entrega (pendiente, requiere infraestructura adicional)

- **Rate limiting** en `/api/properties`: recomendado (Upstash / Vercel Edge Config) pero
  no lo agregué porque requiere una base de datos o servicio externo que no está
  configurado en el repo.
- **Caché compartida entre instancias serverless**: la caché sigue siendo en memoria de
  proceso; para que sea realmente efectiva en producción necesitarías un KV externo
  (Vercel KV, Upstash Redis, etc.).

## Cómo aplicar

1. Reemplaza los 5 archivos en tu repo local por los de esta entrega (respeta la
   estructura de carpetas: `api/properties.js` va dentro de `api/`).
2. Revisa `CONFIG.EMAIL` en `app.js` por si quieres usar un correo distinto.
3. `git diff` para confirmar que los cambios son los esperados.
4. Commit y push — Vercel desplegará automáticamente.
