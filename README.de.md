<p align="center">
  <img src="public/assets/favicon.svg" alt="IDprotector-Logo" width="84" height="84" />
</p>

<h1 align="center">IDprotector</h1>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.pt.md">Português</a> ·
  <strong>Deutsch</strong> ·
  <a href="README.it.md">Italiano</a>
</p>

<p align="center">
  <a href="https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml"><img src="https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml/badge.svg" alt="Publish Docker image" /></a>
  <a href="https://hub.docker.com/r/drakonis96/idprotector"><img src="https://img.shields.io/docker/pulls/drakonis96/idprotector?logo=docker" alt="Docker Hub" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-informational.svg" alt="License: MIT" /></a>
</p>

**Bereiten Sie Ihren Ausweis und Ihre Dokumente vor dem Versenden vor.** Decken
Sie die Angaben ab, die Sie lieber nicht zeigen möchten, und fügen Sie ein
Wasserzeichen mit der erlaubten Verwendung hinzu. Die gesamte Verarbeitung
geschieht **in Ihrem Browser**: Ihre Dateien werden nie auf einen Server
hochgeladen.

Eine mit Docker **selbst hostbare** App, die dafür gedacht ist, persönliche
Ausweisdokumente (Personalausweise, Reisepässe, Führerscheine) vollständig privat
zu schützen.

## Funktionen

- 🖌️ **Daten verbergen** — ein Pinsel, der in jedem Winkel **gerade Balken**
  (nie schiefe) zeichnet, mit mehreren Stärken, Zoom für Präzision und
  Rückgängig. Was Sie abdecken, ist wirklich weg (die Seiten werden beim Export
  gerastert, darunter bleibt kein verborgener Text).
- ✏️ **Abdeckungen bearbeiten und wiederverwenden** — wählen Sie einen Balken aus,
  um ihn zu verschieben, zu skalieren oder zu löschen, und wenden Sie dieselbe
  Abdeckung auf alle Seiten an, wenn ein Dokument dieselben Felder wiederholt.
- 📐 **Seiteneinstellungen** — drehen, zuschneiden und begradigen Sie jede Seite
  vor dem Export, nützlich für Handyfotos und leicht schiefe Scans.
- 💧 **Optionales, konfigurierbares Wasserzeichen** — Text für
  Verwendung/Empfänger, automatische Muster oder ein verschiebbarer
  **Manuell**-Modus, plus Einstellungen für **Deckkraft**, **Größe**, **Farbe**,
  Winkel und Fußzeile.
- ⚖️ **Konfigurierbare rechtliche Fußzeile** — fügt dem Download einen unteren
  Streifen hinzu, mit der EU-DSGVO, der in einem Dropdown wählbaren nationalen
  Datenschutzbehörde (EU/EWR, Vereinigtes Königreich und Schweiz), einem
  bearbeitbaren rechtlichen Hinweis sowie optional einer Kontakt-E-Mail und einer
  Telefonnummer.
- 👀 **Mehrseitige Vorschau** — Pfeile, um vor dem Export zu prüfen, wie das
  Wasserzeichen auf jeder PDF-Seite oder jedem hochgeladenen Bild aussieht.
- 🌍 **Mehrsprachige Oberfläche** — Spanisch, Englisch, Französisch,
  Portugiesisch, Deutsch und Italienisch über die Sprachauswahl.
- 🌑 **Optionale Graustufen** — wandelt das Dokument (Bild oder PDF) per Schalter
  in Schwarzweiß um.
- 🖼️ **Bilder und PDF** — PNG, JPG, WebP… sowie ein- oder mehrseitige PDF.
- 🗂️ **Mehrere Dateien auf einmal** — laden Sie z. B. Vorder- und Rückseite
  zusammen hoch; sie werden zu einem einzigen geschützten Dokument kombiniert.
- 📤 **Als PDF oder Bild herunterladen** — wählen Sie das Format beim Download
  (ein mehrseitiges Bild wird als `.zip` geliefert). Sie können auch über das
  System-Sheet teilen, sofern verfügbar.
- 🔒 **100 % lokal und privat** — keine Uploads, keine Datenbank, keine Analyse.
  Funktioniert nach dem Laden **offline**.

## Datenschutz durch Design

- Kein Backend: Der Container ist nur ein Server für statische Dateien (nginx). Es
  gibt keinen Endpunkt, der Ihre Dokumente empfangen oder speichern könnte.
- Die Bibliotheken (`pdf.js`, `pdf-lib`) sind **lokal gebündelt** in
  `public/vendor/`; die App benötigt kein CDN und stellt keine externen Anfragen.
- Die `Content-Security-Policy` blockiert jede ausgehende Verbindung
  (`connect-src 'self'`), das Einbetten in iframes und Ressourcen von Dritten.
- Der Container startet im `read_only`-Modus, ohne Volumes oder
  Umgebungsvariablen.

## Erste Schritte (Docker)

### Option A — von Docker Hub (empfohlen, ohne den Code herunterzuladen)

Veröffentlichtes Image: [`drakonis96/idprotector`](https://hub.docker.com/r/drakonis96/idprotector)
(Multi-Architektur: `amd64` und `arm64`).

Mit Docker Compose, unter Verwendung der dedizierten Compose-Datei:

```bash
curl -O https://raw.githubusercontent.com/Drakonis96/idprotector/main/docker-compose.hub.yml
docker compose -f docker-compose.hub.yml up -d
```

Oder direkt mit `docker run`:

```bash
docker run -d --name idprotector -p 8683:8683 --restart unless-stopped drakonis96/idprotector:latest
```

Öffnen Sie **http://localhost:8683**.

### Option B — aus dem Quellcode bauen

```bash
git clone https://github.com/Drakonis96/idprotector.git
cd idprotector
docker compose up -d --build
```

Zum Stoppen:

```bash
docker compose down
```

## Automatische Veröffentlichung (CI/CD)

Jeder Push auf `main` und jedes `vX.Y.Z`-Release löst den Workflow
[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml)
aus, der das Multi-Architektur-Image baut und auf Docker Hub veröffentlicht.

Es wird nur **ein Secret** im Repository benötigt
(*Settings › Secrets and variables › Actions*):

- `DOCKERHUB_TOKEN` — ein Docker-Hub-*Access Token* mit Schreibrecht
  (Docker Hub › *Account Settings › Security › New Access Token*).

Der Benutzer (`drakonis96`) ist im Workflow selbst festgelegt.

### Lokale Entwicklung (ohne Docker)

Stellen Sie den Ordner `public/` mit einem beliebigen statischen Server bereit,
zum Beispiel:

```bash
cd public && python3 -m http.server 8683
```

> Hinweis: Öffnen Sie es über `http://…`, nicht als `file://`, damit der
> `pdf.js`-Worker funktioniert.

## Verwendung

1. **Laden** Sie ein Bild, mehrere Bilder oder ein PDF hoch (Drag & Drop oder zum
   Auswählen klicken).
2. **Verbergen** Sie die sensiblen Daten durch Ziehen des Pinsels; passen Sie die
   Größe an und nutzen Sie den Zoom für Präzision.
3. **Wasserzeichen** (optional): Geben Sie die erlaubte Verwendung ein und passen
   Sie Muster, Deckkraft, Größe und Farbe an. Im Manuell-Modus ziehen Sie die
   Marke an die gewünschte Position und prüfen alle Seiten mit den
   Vorschaupfeilen.
4. **Laden** Sie das geschützte Dokument herunter oder **teilen** Sie es.

## Struktur

```
public/
  index.html          # UI (eine einzige Seite, Schritt für Schritt)
  css/styles.css
  js/
    watermark.js       # Wasserzeichenmuster
    editor.js          # Verdeckungspinsel (Canvas, Zoom, Rückgängig)
    app.js             # Orchestrierung, Laden der Dateien, Export
  vendor/              # pdf.js + pdf-lib (gebündelt, ohne CDN)
Dockerfile
docker-compose.yml     # ein einziger Dienst, Port 8683
nginx.conf             # Datenschutz-Header + strikte CSP
```

## Lizenz

MIT — siehe [LICENSE](LICENSE).
