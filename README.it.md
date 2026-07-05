<p align="center">
  <img src="public/assets/favicon.svg" alt="Logo di IDprotector" width="84" height="84" />
</p>

<h1 align="center">IDprotector</h1>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.pt.md">Português</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <strong>Italiano</strong>
</p>

<p align="center">
  <a href="https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml"><img src="https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml/badge.svg" alt="Publish Docker image" /></a>
  <a href="https://hub.docker.com/r/drakonis96/idprotector"><img src="https://img.shields.io/docker/pulls/drakonis96/idprotector?logo=docker" alt="Docker Hub" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-informational.svg" alt="License: MIT" /></a>
</p>

**Prepara il tuo documento d'identità e i tuoi file prima di inviarli.** Copri le
informazioni che preferisci non mostrare e aggiungi una filigrana con l'uso
autorizzato. Tutta l'elaborazione avviene **dentro il browser**: i tuoi file non
vengono mai caricati su alcun server.

App **auto-ospitabile** con Docker, pensata per proteggere gli identificativi
personali (carte d'identità, passaporti, permessi) in modo totalmente privato.

## Funzionalità

- 🖌️ **Nascondere i dati** — un pennello che disegna **barre dritte** (mai storte)
  con qualsiasi angolazione, con vari spessori, zoom per la precisione e annulla.
  Ciò che copri sparisce davvero (le pagine vengono rasterizzate all'esportazione,
  non resta testo nascosto sotto).
- ✏️ **Modificare e riutilizzare le coperture** — seleziona una barra per
  spostarla, ridimensionarla o eliminarla, e applica la stessa copertura a tutte
  le pagine quando il documento ripete gli stessi campi.
- 📐 **Regolazioni pagina** — ruota, ritaglia e raddrizza ogni pagina prima
  dell'esportazione, utile per foto da telefono e scansioni leggermente storte.
- 💧 **Filigrana opzionale e configurabile** — testo di uso/destinatario, motivi
  automatici o modalità **Manuale** trascinabile, e regolazione di **opacità**,
  **dimensione**, **colore**, angolo e piè di pagina.
- ⚖️ **Piè di pagina legale configurabile** — aggiunge al download una fascia
  inferiore con il GDPR europeo, l'autorità nazionale per la protezione dei dati
  da scegliere in un menu a tendina (UE/SEE, Regno Unito e Svizzera), un avviso
  legale modificabile e, in opzione, un'e-mail e un telefono di contatto.
- 👀 **Anteprima multipagina** — frecce per verificare come appare la filigrana su
  ogni pagina del PDF o su ogni immagine caricata prima di esportare.
- 🌍 **Interfaccia multilingue** — spagnolo, inglese, francese, portoghese, tedesco
  e italiano dal selettore della lingua.
- 🌑 **Scala di grigi opzionale** — converte il documento (immagine o PDF) in
  bianco e nero con un interruttore.
- 🖼️ **Immagini e PDF** — PNG, JPG, WebP… e PDF di una o più pagine.
- 🗂️ **Più file in una volta** — carica ad es. fronte e retro insieme; vengono
  combinati in un unico documento protetto.
- 📤 **Scaricare come PDF o immagine** — scegli il formato al download (un'immagine
  multipagina viene consegnata in un `.zip`). Puoi anche condividere tramite il
  foglio di sistema quando disponibile.
- 🔒 **100% locale e privato** — nessun caricamento, nessun database, nessuna
  analisi. Funziona **offline** una volta caricato.

## Privacy by design

- Nessun backend: il container è solo un server di file statici (nginx). Non
  esiste alcun endpoint in grado di ricevere o salvare i tuoi documenti.
- Le librerie (`pdf.js`, `pdf-lib`) sono **incluse localmente** in
  `public/vendor/`; l'app non dipende da alcun CDN e non effettua richieste
  esterne.
- Il `Content-Security-Policy` blocca qualsiasi connessione in uscita
  (`connect-src 'self'`), l'incorporamento in iframe e le risorse di terze parti.
- Il container si avvia in modalità `read_only`, senza volumi né variabili
  d'ambiente.

## Avvio (Docker)

### Opzione A — da Docker Hub (consigliata, senza scaricare il codice)

Immagine pubblicata: [`drakonis96/idprotector`](https://hub.docker.com/r/drakonis96/idprotector)
(multi-architettura: `amd64` e `arm64`).

Con Docker Compose, usando il compose dedicato:

```bash
curl -O https://raw.githubusercontent.com/Drakonis96/idprotector/main/docker-compose.hub.yml
docker compose -f docker-compose.hub.yml up -d
```

Oppure direttamente con `docker run`:

```bash
docker run -d --name idprotector -p 8683:8683 --restart unless-stopped drakonis96/idprotector:latest
```

Apri **http://localhost:8683**.

### Opzione B — compilando dal codice

```bash
git clone https://github.com/Drakonis96/idprotector.git
cd idprotector
docker compose up -d --build
```

Per fermarlo:

```bash
docker compose down
```

## Pubblicazione automatica (CI/CD)

Ogni push su `main` e ogni release `vX.Y.Z` attiva il workflow
[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml),
che costruisce l'immagine multi-architettura e la pubblica su Docker Hub.

Richiede solo **un segreto** nel repository
(*Settings › Secrets and variables › Actions*):

- `DOCKERHUB_TOKEN` — un *Access Token* di Docker Hub con permesso di scrittura
  (Docker Hub › *Account Settings › Security › New Access Token*).

L'utente (`drakonis96`) è fissato nel workflow stesso.

### Sviluppo locale (senza Docker)

Servi la cartella `public/` con un qualsiasi server statico, ad esempio:

```bash
cd public && python3 -m http.server 8683
```

> Nota: aprilo tramite `http://…`, non come `file://`, affinché il worker di
> `pdf.js` funzioni.

## Come si usa

1. **Carica** un'immagine, più immagini o un PDF (trascina e rilascia, o clicca per
   scegliere).
2. **Nascondi** i dati sensibili facendo scorrere il pennello; regola la dimensione
   e usa lo zoom per la precisione.
3. **Filigrana** (opzionale): scrivi l'uso autorizzato e regola motivo, opacità,
   dimensione e colore. In modalità Manuale, trascina la marca nella posizione che
   preferisci e rivedi tutte le pagine con le frecce di anteprima.
4. **Scarica o condividi** il documento protetto.

## Struttura

```
public/
  index.html          # UI (pagina unica, passo dopo passo)
  css/styles.css
  js/
    watermark.js       # motivi di filigrana
    editor.js          # pennello di occultamento (canvas, zoom, annulla)
    app.js             # orchestrazione, caricamento file, esportazione
  vendor/              # pdf.js + pdf-lib (inclusi, senza CDN)
Dockerfile
docker-compose.yml     # un unico servizio, porta 8683
nginx.conf             # intestazioni di privacy + CSP rigorosa
```

## Licenza

MIT — vedi [LICENSE](LICENSE).
