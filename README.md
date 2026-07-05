# IDprotector

**Protege tu DNI y tus documentos antes de compartirlos.** Oculta los datos que no
quieras mostrar y añade una marca de agua rastreable que desincentiva el uso
indebido. Todo el procesamiento ocurre **dentro del navegador**: tus archivos nunca
se suben a ningún servidor.

App **autohospedable** con Docker. Inspirada en el concepto de herramientas como
saferlayer.com, pero como proyecto independiente y autoalojable.

![flujo: subir → ocultar → marca de agua → compartir](public/assets/favicon.svg)

## Características

- 🖌️ **Ocultar datos** — pincel que pinta rectángulos opacos en cualquier ángulo,
  con varios tamaños, zoom para precisión y deshacer. Lo que tapas desaparece de
  verdad (las páginas se rasterizan al exportar, no queda texto oculto debajo).
- 💧 **Marca de agua opcional y configurable** — texto de uso/destinatario, y
  ajuste de **patrón** (Seguro, Diagonal, Malla, Rejilla, Central), **opacidad**,
  **tamaño**, **color** y pie de página.
- 🖼️ **Imágenes y PDF** — PNG, JPG, WebP… y PDF de una o varias páginas.
- 📤 **Descargar o compartir** — usa la hoja de compartir del sistema cuando está
  disponible.
- 🔒 **100% local y privado** — sin subidas, sin base de datos, sin analítica.
  Funciona **sin conexión** una vez cargada.

## Privacidad por diseño

- No hay backend: el contenedor es únicamente un servidor de archivos estáticos
  (nginx). No existe endpoint capaz de recibir o guardar tus documentos.
- Las librerías (`pdf.js`, `pdf-lib`) están **empaquetadas localmente** en
  `public/vendor/`; la app no depende de ningún CDN ni hace peticiones externas.
- El `Content-Security-Policy` bloquea cualquier conexión saliente
  (`connect-src 'self'`), la incrustación en iframes y los recursos de terceros.
- El contenedor arranca en modo `read_only`, sin volúmenes ni variables de entorno.

## Puesta en marcha (Docker)

```bash
docker compose up -d --build
```

Abre **http://localhost:8683**.

Para pararlo:

```bash
docker compose down
```

### Sin compose

```bash
docker build -t idprotector .
docker run --rm -p 8683:8683 idprotector
```

### Desarrollo local (sin Docker)

Sirve la carpeta `public/` con cualquier servidor estático, por ejemplo:

```bash
cd public && python3 -m http.server 8683
```

> Nota: ábrelo vía `http://…`, no como `file://`, para que el worker de `pdf.js`
> funcione.

## Cómo se usa

1. **Sube** una imagen o un PDF (arrastrar y soltar, o pulsar para elegir).
2. **Oculta** los datos sensibles deslizando el pincel; ajusta el tamaño y usa el
   zoom para precisión.
3. **Marca de agua** (opcional): escribe el uso autorizado y ajusta patrón,
   opacidad, tamaño y color.
4. **Descarga o comparte** el documento protegido.

## Estructura

```
public/
  index.html          # UI (una sola página, por pasos)
  css/styles.css
  js/
    watermark.js       # patrones de marca de agua
    editor.js          # pincel de ocultación (canvas, zoom, deshacer)
    app.js             # orquestación, carga de archivos, exportación
  vendor/              # pdf.js + pdf-lib (empaquetados, sin CDN)
Dockerfile
docker-compose.yml     # un único servicio, puerto 8683
nginx.conf             # cabeceras de privacidad + CSP estricta
```

## Licencia

MIT — ver [LICENSE](LICENSE).
