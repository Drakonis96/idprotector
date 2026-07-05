# IDprotector

[![Publish Docker image](https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml)
[![Docker Hub](https://img.shields.io/docker/pulls/drakonis96/idprotector?logo=docker)](https://hub.docker.com/r/drakonis96/idprotector)
[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](LICENSE)

**Prepara tu DNI y tus documentos antes de enviarlos.** Cubre la información
que prefieras no mostrar y añade una marca de agua con el uso autorizado. Todo el
procesamiento ocurre **dentro del navegador**: tus archivos nunca se suben a ningún
servidor.

App **autohospedable** con Docker, pensada para proteger identificadores
personales (DNI, pasaportes, permisos) de forma totalmente privada.

![flujo: subir → ocultar → marca de agua → compartir](public/assets/favicon.svg)

## Características

- 🖌️ **Ocultar datos** — pincel que dibuja **barras rectas** (nunca torcidas) en
  cualquier ángulo, con varios grosores, zoom para precisión y deshacer. Lo que
  tapas desaparece de verdad (las páginas se rasterizan al exportar, no queda
  texto oculto debajo).
- 💧 **Marca de agua opcional y configurable** — texto de uso/destinatario,
  patrones automáticos o modo **Manual** arrastrable, y ajuste de **opacidad**,
  **tamaño**, **color**, ángulo y pie de página.
- ⚖️ **Pie legal configurable** — añade al descargable una franja inferior con
  el RGPD europeo, el organismo nacional según idioma, un aviso legal editable
  y un email y un teléfono de contacto opcionales.
- 👀 **Vista previa multipágina** — flechas para revisar cómo queda la marca de
  agua en cada página del PDF o en cada imagen subida antes de exportar.
- 🌍 **Interfaz multilingüe** — español, inglés, francés, portugués, alemán e
  italiano desde el selector de idioma.
- 🌑 **Escala de grises opcional** — convierte el documento (imagen o PDF) a
  blanco y negro con un interruptor.
- 🖼️ **Imágenes y PDF** — PNG, JPG, WebP… y PDF de una o varias páginas.
- 🗂️ **Varios archivos a la vez** — sube p. ej. anverso y reverso juntos; se
  combinan en un mismo documento protegido.
- 📤 **Descargar como PDF o imagen** — elige el formato al descargar (varias
  páginas en imagen se entregan en un `.zip`). También compartir con la hoja del
  sistema cuando está disponible.
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

### Opción A — desde Docker Hub (recomendada, sin descargar el código)

Imagen publicada: [`drakonis96/idprotector`](https://hub.docker.com/r/drakonis96/idprotector)
(multi-arquitectura: `amd64` y `arm64`).

Con Docker Compose, usando el compose dedicado:

```bash
curl -O https://raw.githubusercontent.com/Drakonis96/idprotector/main/docker-compose.hub.yml
docker compose -f docker-compose.hub.yml up -d
```

O directamente con `docker run`:

```bash
docker run -d --name idprotector -p 8683:8683 --restart unless-stopped drakonis96/idprotector:latest
```

Abre **http://localhost:8683**.

### Opción B — construyendo desde el código

```bash
git clone https://github.com/Drakonis96/idprotector.git
cd idprotector
docker compose up -d --build
```

Para pararlo:

```bash
docker compose down
```

## Publicación automática (CI/CD)

Cada push a `main` y cada release `vX.Y.Z` dispara el workflow
[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml),
que construye la imagen multi-arquitectura y la publica en Docker Hub.

Solo requiere **un secreto** en el repositorio
(*Settings › Secrets and variables › Actions*):

- `DOCKERHUB_TOKEN` — un *Access Token* de Docker Hub con permiso de escritura
  (Docker Hub › *Account Settings › Security › New Access Token*).

El usuario (`drakonis96`) va fijado en el propio workflow.

### Desarrollo local (sin Docker)

Sirve la carpeta `public/` con cualquier servidor estático, por ejemplo:

```bash
cd public && python3 -m http.server 8683
```

> Nota: ábrelo vía `http://…`, no como `file://`, para que el worker de `pdf.js`
> funcione.

## Cómo se usa

1. **Sube** una imagen, varias imágenes o un PDF (arrastrar y soltar, o pulsar para elegir).
2. **Oculta** los datos sensibles deslizando el pincel; ajusta el tamaño y usa el
   zoom para precisión.
3. **Marca de agua** (opcional): escribe el uso autorizado y ajusta patrón,
   opacidad, tamaño y color. En modo Manual, arrastra la marca a la posición que
   prefieras y revisa todas las páginas con las flechas de vista previa.
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
