<p align="center">
  <img src="public/assets/favicon.svg" alt="Logo IDprotector" width="84" height="84" />
</p>

<h1 align="center">IDprotector</h1>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.es.md">Español</a> ·
  <strong>Français</strong> ·
  <a href="README.pt.md">Português</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.it.md">Italiano</a>
</p>

<p align="center">
  <a href="https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml"><img src="https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml/badge.svg" alt="Publish Docker image" /></a>
  <a href="https://hub.docker.com/r/drakonis96/idprotector"><img src="https://img.shields.io/docker/pulls/drakonis96/idprotector?logo=docker" alt="Docker Hub" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-informational.svg" alt="License: MIT" /></a>
</p>

**Préparez votre pièce d'identité et vos documents avant de les envoyer.** Masquez
les informations que vous préférez ne pas montrer et ajoutez un filigrane
indiquant l'usage autorisé. Tout le traitement se déroule **dans votre
navigateur** : vos fichiers ne sont jamais envoyés à un serveur.

Application **auto-hébergeable** avec Docker, conçue pour protéger les
identifiants personnels (cartes d'identité, passeports, permis) de façon
totalement privée.

## Fonctionnalités

- 🖌️ **Masquer des données** — un pinceau qui trace des **barres droites**
  (jamais de travers) sous n'importe quel angle, avec plusieurs épaisseurs, un
  zoom de précision et une annulation. Ce que vous masquez disparaît vraiment
  (les pages sont rasterisées à l'export, aucun texte caché ne subsiste dessous).
- ✏️ **Modifier et réutiliser les masquages** — sélectionnez une barre pour la
  déplacer, la redimensionner ou la supprimer, puis appliquez le même masquage à
  toutes les pages lorsque le document répète les mêmes champs.
- 📐 **Réglages de page** — pivotez, recadrez et redressez chaque page avant
  l'export, utile pour les photos mobiles et les scans légèrement inclinés.
- 💧 **Filigrane optionnel et configurable** — texte d'usage/destinataire,
  motifs automatiques ou mode **Manuel** déplaçable, plus réglages d'**opacité**,
  de **taille**, de **couleur**, d'angle et de pied de page.
- ⚖️ **Pied de page légal configurable** — ajoute au fichier une bande
  inférieure avec le RGPD européen, l'autorité nationale de protection des
  données à choisir dans une liste déroulante (UE/EEE, Royaume-Uni et Suisse),
  une mention légale modifiable et, en option, un e-mail et un téléphone de
  contact.
- 👀 **Aperçu multipage** — des flèches pour vérifier le rendu du filigrane sur
  chaque page du PDF ou chaque image importée avant d'exporter.
- 🌍 **Interface multilingue** — espagnol, anglais, français, portugais, allemand
  et italien depuis le sélecteur de langue.
- 🌑 **Niveaux de gris optionnels** — convertit le document (image ou PDF) en noir
  et blanc via un interrupteur.
- 🖼️ **Images et PDF** — PNG, JPG, WebP… et PDF d'une ou plusieurs pages.
- 🗂️ **Plusieurs fichiers à la fois** — importez par ex. recto et verso ensemble ;
  ils sont combinés en un seul document protégé.
- 📤 **Télécharger en PDF ou en image** — choisissez le format au téléchargement
  (une image multipage est livrée dans un `.zip`). Vous pouvez aussi partager via
  la feuille système lorsqu'elle est disponible.
- 🔒 **100 % local et privé** — aucun envoi, aucune base de données, aucune mesure
  d'audience. Fonctionne **hors ligne** une fois chargé.

## Confidentialité dès la conception

- Pas de backend : le conteneur n'est qu'un serveur de fichiers statiques
  (nginx). Aucun point d'accès ne peut recevoir ou stocker vos documents.
- Les bibliothèques (`pdf.js`, `pdf-lib`) sont **empaquetées localement** dans
  `public/vendor/` ; l'application ne dépend d'aucun CDN et ne fait aucune requête
  externe.
- Le `Content-Security-Policy` bloque toute connexion sortante
  (`connect-src 'self'`), l'intégration en iframe et les ressources tierces.
- Le conteneur démarre en mode `read_only`, sans volumes ni variables
  d'environnement.

## Démarrage (Docker)

### Option A — depuis Docker Hub (recommandée, sans télécharger le code)

Image publiée : [`drakonis96/idprotector`](https://hub.docker.com/r/drakonis96/idprotector)
(multi-architecture : `amd64` et `arm64`).

Avec Docker Compose, en utilisant le compose dédié :

```bash
curl -O https://raw.githubusercontent.com/Drakonis96/idprotector/main/docker-compose.hub.yml
docker compose -f docker-compose.hub.yml up -d
```

Ou directement avec `docker run` :

```bash
docker run -d --name idprotector -p 8683:8683 --restart unless-stopped drakonis96/idprotector:latest
```

Ouvrez **http://localhost:8683**.

### Option B — en compilant depuis le code

```bash
git clone https://github.com/Drakonis96/idprotector.git
cd idprotector
docker compose up -d --build
```

Pour l'arrêter :

```bash
docker compose down
```

## Publication automatique (CI/CD)

Chaque push sur `main` et chaque release `vX.Y.Z` déclenche le workflow
[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml),
qui construit l'image multi-architecture et la publie sur Docker Hub.

Il ne requiert **qu'un seul secret** dans le dépôt
(*Settings › Secrets and variables › Actions*) :

- `DOCKERHUB_TOKEN` — un *Access Token* Docker Hub avec permission d'écriture
  (Docker Hub › *Account Settings › Security › New Access Token*).

L'utilisateur (`drakonis96`) est fixé dans le workflow lui-même.

### Développement local (sans Docker)

Servez le dossier `public/` avec n'importe quel serveur statique, par exemple :

```bash
cd public && python3 -m http.server 8683
```

> Remarque : ouvrez-le via `http://…`, pas en `file://`, pour que le worker de
> `pdf.js` fonctionne.

## Utilisation

1. **Importez** une image, plusieurs images ou un PDF (glisser-déposer, ou cliquer
   pour choisir).
2. **Masquez** les données sensibles en glissant le pinceau ; ajustez la taille et
   utilisez le zoom pour la précision.
3. **Filigrane** (optionnel) : saisissez l'usage autorisé et ajustez le motif,
   l'opacité, la taille et la couleur. En mode Manuel, déplacez la marque à la
   position souhaitée et parcourez toutes les pages avec les flèches d'aperçu.
4. **Téléchargez ou partagez** le document protégé.

## Structure

```
public/
  index.html          # UI (page unique, étape par étape)
  css/styles.css
  js/
    watermark.js       # motifs de filigrane
    editor.js          # pinceau de masquage (canvas, zoom, annulation)
    app.js             # orchestration, chargement des fichiers, export
  vendor/              # pdf.js + pdf-lib (empaquetés, sans CDN)
Dockerfile
docker-compose.yml     # un seul service, port 8683
nginx.conf             # en-têtes de confidentialité + CSP stricte
```

## Licence

MIT — voir [LICENSE](LICENSE).
