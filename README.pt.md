<p align="center">
  <img src="public/assets/favicon.svg" alt="Logótipo do IDprotector" width="84" height="84" />
</p>

<h1 align="center">IDprotector</h1>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <strong>Português</strong> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.it.md">Italiano</a>
</p>

<p align="center">
  <a href="https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml"><img src="https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml/badge.svg" alt="Publish Docker image" /></a>
  <a href="https://hub.docker.com/r/drakonis96/idprotector"><img src="https://img.shields.io/docker/pulls/drakonis96/idprotector?logo=docker" alt="Docker Hub" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-informational.svg" alt="License: MIT" /></a>
</p>

**Prepare o seu documento de identificação e ficheiros antes de os enviar.** Cubra
a informação que preferir não mostrar e adicione uma marca de água com o uso
autorizado. Todo o processamento acontece **dentro do navegador**: os seus
ficheiros nunca são enviados para qualquer servidor.

Aplicação **auto-hospedável** com Docker, pensada para proteger identificadores
pessoais (cartões de identidade, passaportes, licenças) de forma totalmente
privada.

## Funcionalidades

- 🖌️ **Ocultar dados** — pincel que desenha **barras retas** (nunca tortas) em
  qualquer ângulo, com várias espessuras, zoom para precisão e anular. O que
  cobre desaparece mesmo (as páginas são rasterizadas ao exportar, não fica texto
  oculto por baixo).
- ✏️ **Editar e reutilizar ocultações** — selecione uma barra para a mover,
  redimensionar ou eliminar, e aplique a mesma ocultação a todas as páginas
  quando o documento repete os mesmos campos.
- 📐 **Ajustes de página** — rode, recorte e endireite cada página antes de
  exportar, útil para fotografias de telemóvel e digitalizações ligeiramente
  inclinadas.
- 💧 **Marca de água opcional e configurável** — texto de uso/destinatário,
  padrões automáticos ou modo **Manual** arrastável, e ajuste de **opacidade**,
  **tamanho**, **cor**, ângulo e rodapé.
- ⚖️ **Rodapé legal configurável** — adiciona à transferência uma faixa inferior
  com o RGPD europeu, a autoridade nacional de proteção de dados a escolher numa
  lista pendente (UE/EEE, Reino Unido e Suíça), um aviso legal editável e, em
  opção, um e-mail e um telefone de contacto.
- 👀 **Pré-visualização multipágina** — setas para rever como fica a marca de água
  em cada página do PDF ou em cada imagem carregada antes de exportar.
- 🌍 **Interface multilingue** — espanhol, inglês, francês, português, alemão e
  italiano a partir do seletor de idioma.
- 🌑 **Escala de cinzentos opcional** — converte o documento (imagem ou PDF) para
  preto e branco com um interruptor.
- 🖼️ **Imagens e PDF** — PNG, JPG, WebP… e PDF de uma ou várias páginas.
- 🗂️ **Vários ficheiros de uma vez** — carregue, p. ex., frente e verso juntos;
  são combinados num único documento protegido.
- 📤 **Transferir como PDF ou imagem** — escolha o formato ao transferir (uma
  imagem com várias páginas é entregue num `.zip`). Também pode partilhar através
  da folha do sistema quando disponível.
- 🔒 **100% local e privado** — sem envios, sem base de dados, sem análise.
  Funciona **offline** depois de carregado.

## Privacidade desde a conceção

- Não há backend: o contentor é apenas um servidor de ficheiros estáticos
  (nginx). Não existe endpoint capaz de receber ou guardar os seus documentos.
- As bibliotecas (`pdf.js`, `pdf-lib`) estão **empacotadas localmente** em
  `public/vendor/`; a aplicação não depende de qualquer CDN nem faz pedidos
  externos.
- O `Content-Security-Policy` bloqueia qualquer ligação de saída
  (`connect-src 'self'`), a incorporação em iframes e os recursos de terceiros.
- O contentor arranca em modo `read_only`, sem volumes nem variáveis de ambiente.

## Como começar (Docker)

### Opção A — a partir do Docker Hub (recomendada, sem descarregar o código)

Imagem publicada: [`drakonis96/idprotector`](https://hub.docker.com/r/drakonis96/idprotector)
(multi-arquitetura: `amd64` e `arm64`).

Com Docker Compose, usando o compose dedicado:

```bash
curl -O https://raw.githubusercontent.com/Drakonis96/idprotector/main/docker-compose.hub.yml
docker compose -f docker-compose.hub.yml up -d
```

Ou diretamente com `docker run`:

```bash
docker run -d --name idprotector -p 8683:8683 --restart unless-stopped drakonis96/idprotector:latest
```

Abra **http://localhost:8683**.

### Opção B — construindo a partir do código

```bash
git clone https://github.com/Drakonis96/idprotector.git
cd idprotector
docker compose up -d --build
```

Para o parar:

```bash
docker compose down
```

## Publicação automática (CI/CD)

Cada push para `main` e cada release `vX.Y.Z` aciona o workflow
[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml),
que constrói a imagem multi-arquitetura e a publica no Docker Hub.

Requer apenas **um segredo** no repositório
(*Settings › Secrets and variables › Actions*):

- `DOCKERHUB_TOKEN` — um *Access Token* do Docker Hub com permissão de escrita
  (Docker Hub › *Account Settings › Security › New Access Token*).

O utilizador (`drakonis96`) está fixado no próprio workflow.

### Desenvolvimento local (sem Docker)

Sirva a pasta `public/` com qualquer servidor estático, por exemplo:

```bash
cd public && python3 -m http.server 8683
```

> Nota: abra-o via `http://…`, não como `file://`, para que o worker do `pdf.js`
> funcione.

## Como se usa

1. **Carregue** uma imagem, várias imagens ou um PDF (arrastar e largar, ou clicar
   para escolher).
2. **Oculte** os dados sensíveis deslizando o pincel; ajuste o tamanho e use o
   zoom para precisão.
3. **Marca de água** (opcional): escreva o uso autorizado e ajuste o padrão, a
   opacidade, o tamanho e a cor. No modo Manual, arraste a marca para a posição
   que preferir e reveja todas as páginas com as setas de pré-visualização.
4. **Transfira ou partilhe** o documento protegido.

## Estrutura

```
public/
  index.html          # UI (uma única página, por passos)
  css/styles.css
  js/
    watermark.js       # padrões de marca de água
    editor.js          # pincel de ocultação (canvas, zoom, anular)
    app.js             # orquestração, carregamento de ficheiros, exportação
  vendor/              # pdf.js + pdf-lib (empacotados, sem CDN)
Dockerfile
docker-compose.yml     # um único serviço, porta 8683
nginx.conf             # cabeçalhos de privacidade + CSP estrita
```

## Licença

MIT — ver [LICENSE](LICENSE).
