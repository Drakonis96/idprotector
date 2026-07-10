/* IDprotector — app orchestration.
 * Everything runs locally in the browser. No fetch/XHR to any backend,
 * no analytics, no storage. Files are read via FileReader and never leave
 * this tab. */
(function (global) {
  "use strict";
  var SL = global.SL;

  // pdf.js worker (served locally from /vendor).
  if (global.pdfjsLib) {
    global.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
  }

  var MAX_IMG_DIM = 2600;   // cap raster size to keep memory sane
  var PDF_TARGET_W = 1600;  // render width for PDF pages
  var WM_REF_W = 1000;      // watermark size reference width
  var currentLang = "es";

  var I18N = {
    es: {
      "doc.title": "IDprotector · Protege tus documentos",
      "doc.description": "Oculta datos sensibles y añade marcas de agua a tu DNI y documentos. 100% en tu navegador: nada se sube a ningún servidor.",
      "language.label": "Idioma",
      "common.back": "← Atrás",
      "home.title": "¿Qué quieres hacer?",
      "home.lead": "Elige una opción para empezar. Todo ocurre dentro de tu navegador: tus archivos nunca salen de tu dispositivo.",
      "home.protectTitle": "Proteger documentos",
      "home.protectText": "Cubre datos sensibles, añade marcas de agua y genera una copia lista para enviar con mayor privacidad.",
      "home.protectCta": "Proteger documentos",
      "home.verifyTitle": "Verificar copia trazable",
      "home.verifyText": "Comprueba si un archivo lleva una marca invisible de IDprotector y qué información declara.",
      "home.verifyCta": "Verificar una copia",
      "upload.title": "Prepara tus documentos<br />antes de enviarlos",
      "upload.lead": "Cubre los datos que prefieras reservar y añade una marca de agua personalizada. Todo ocurre <strong>dentro de tu navegador</strong>: tus archivos nunca se suben a ningún servidor.",
      "upload.dropTitle": "Arrastra tus documentos aquí",
      "upload.dropText": "o pulsa para elegir imágenes o PDF. Puedes subir varios archivos.",
      "privacy.local": "Procesamiento 100% local",
      "privacy.noCloud": "Cero subidas a la nube",
      "privacy.offline": "Funciona sin conexión",
      "redact.title": "Cubre la información que prefieras mantener privada",
      "redact.lead": "Pasa el dedo o el cursor por las partes que quieras tapar y usa el zoom para ajustar el trazo con detalle.",
      "redact.grayscale": "Convertir el documento a escala de grises",
      "redact.hint": "Consejo: el pincel dibuja barras rectas; arrastra desde un extremo al otro. Usa el zoom para ocultar con precisión matrículas, direcciones o números de documento.",
      "redact.continue": "Continuar",
      "redact.continueNoRedaction": "Seguir sin tapar información",
      "tool.undo": "Deshacer",
      "tool.pan": "Mover / desplazar",
      "tool.move": "Mover",
      "tool.zoomOut": "Alejar",
      "tool.zoomIn": "Acercar",
      "tool.fit": "Ajustar",
      "tool.brush": "Pincel (barra negra)",
      "tool.blur": "Desenfocar",
      "tool.select": "Seleccionar / mover",
      "tool.deleteRedaction": "Eliminar selección",
      "tool.copyRedaction": "Aplicar selección a todas las páginas",
      "blur.intensity": "Intensidad",
      "blur.area": "Área",
      "select.hint": "Selecciona una barra o un desenfoque para moverlo o cambiar su tamaño.",
      "pageTools.group": "Ajustes de página",
      "pageTools.rotateLeft": "Girar a la izquierda",
      "pageTools.rotateRight": "Girar a la derecha",
      "pageTools.crop": "Recortar",
      "pageTools.applyCrop": "Aplicar recorte",
      "pageTools.straighten": "Enderezar",
      "pageTools.applyStraighten": "Aplicar enderezado",
      "brush.group": "Tamaño del pincel",
      "brush.veryThin": "Muy fino",
      "brush.thin": "Fino",
      "brush.medium": "Medio",
      "brush.thick": "Grueso",
      "brush.veryThick": "Muy grueso",
      "nav.prevPage": "Página anterior",
      "nav.nextPage": "Página siguiente",
      "wm.title": "Añade una marca de agua personalizada",
      "wm.lead": "Indica el uso permitido y el destinatario autorizado. Ese texto se integra sobre el documento como marca de agua.",
      "wm.authorized": "Uso y destinatario autorizados",
      "wm.placeholder": "Ej.: Solo válido para la verificación de identidad de Banco XYZ, 05/07/2026",
      "wm.charsRemaining": "caracteres restantes",
      "wm.apply": "Aplicar marca de agua",
      "wm.pattern": "Patrón",
      "wm.patternAria": "Patrón de marca de agua",
      "wm.opacity": "Opacidad",
      "wm.size": "Tamaño",
      "wm.angle": "Ángulo",
      "wm.resetPosition": "Restablecer posición",
      "wm.manualItem": "Marca",
      "wm.manualAdd": "Añadir marca de agua",
      "wm.manualText": "Texto de esta marca (opcional)",
      "wm.manualTextPlaceholder": "Usa el texto principal si lo dejas vacío",
      "wm.manualRemove": "Eliminar",
      "wm.manualRandom": "Distinta posición en cada página",
      "wm.manualHint": "Arrastra sobre la vista previa para colocar la marca seleccionada.",
      "wm.color": "Color",
      "wm.custom": "Personalizado",
      "wm.footer": "Añadir pie de página con firma de protección",
      "legal.title": "Información legal del descargable",
      "legal.eu": "Normativa Europea de Protección de Datos",
      "legal.national": "Autoridad nacional de protección de datos",
      "legal.nationalSelect": "Selecciona la autoridad de protección de datos",
      "legal.contactEmail": "Correo electrónico de contacto",
      "legal.phone": "Teléfono de contacto",
      "legal.message": "Mensaje legal",
      "legal.emailPlaceholder": "nombre@dominio.com",
      "legal.phonePlaceholder": "+34 600 000 000",
      "legal.messagePlaceholder": "Mensaje que se integrará en el descargable",
      "legal.defaultMessage": "Válido únicamente a efectos de identificación en el trámite indicado. No constituye firma, autorización contractual ni consentimiento para usos distintos.",
      "legal.outputContactEmail": "Correo electrónico de contacto",
      "legal.outputPhone": "Teléfono de contacto",
      "wm.preview": "Vista previa en vivo",
      "wm.generate": "Generar documento protegido",
      "wm.continueNoWatermark": "Continuar sin marca de agua",
      "result.title": "Documento preparado para enviarlo con mayor privacidad",
      "result.lead": "El archivo final incluye el documento protegido y, si la activaste, la marca de agua con la información indicada.",
      "result.format": "Formato de descarga",
      "result.image": "Imagen",
      "result.pdf": "PDF",
      "result.share": "Compartir",
      "result.download": "Descargar",
      "result.more": "Proteger más documentos",
      "format.multiImage": "Se descargará un .zip con una imagen por página.",
      "format.pdf": "Un PDF con todas las páginas.",
      "format.image": "Una imagen PNG.",
      "busy.processing": "Procesando…",
      "busy.preparingMany": "Preparando tus documentos…",
      "busy.preparingOne": "Preparando tu documento…",
      "busy.generating": "Generando archivo…",
      "busy.sharing": "Preparando para compartir…",
      "alert.unsupported": "Formato no compatible. Usa imágenes (PNG, JPG…) o PDF.",
      "alert.imageRead": "No se pudo leer la imagen",
      "alert.openFailed": "No se pudo abrir el documento: ",
      "alert.generateFailed": "No se pudo generar el archivo: ",
      "alert.shareFailed": "No se pudo compartir: ",
      "share.title": "Documento protegido",
      "footer.selfHosted": "autohospedado",
      "footer.privacy": "Nada de lo que subes sale de este dispositivo.",
      "footer.policyTitle": "Política de privacidad:",
      "footer.policyText": "IDprotector no recopila, almacena ni transmite ningún dato. Todo el procesamiento ocurre en local, dentro de tu navegador, y ningún archivo sale de tu dispositivo. No se usan cookies de seguimiento ni servicios de análisis.",
      "pattern.dense": "Seguro",
      "pattern.topographic": "Topográfico",
      "pattern.diagonal": "Diagonal",
      "pattern.mesh": "Malla",
      "pattern.grid": "Rejilla",
      "pattern.single": "Central",
      "pattern.manual": "Manual",
      "watermark.unauthorized": "SIN AUTORIZAR",
      "watermark.protectedWith": "Protegido con",
      "file.protectedSuffix": "protegido",
      "file.pagePrefix": "pagina",
      "upload.verifyLink": "¿Recibiste una copia trazable? Verifícala aquí",
      "trace.title": "Copia trazable (marca invisible)",
      "trace.enable": "Incrustar un identificador invisible en esta copia",
      "trace.labelLabel": "Destinatario o propósito",
      "trace.labelPlaceholder": "p. ej. Inmobiliaria García — alquiler",
      "trace.passLabel": "Frase secreta (opcional)",
      "trace.passPlaceholder": "Sin frase, cualquiera con IDprotector podrá leer la marca",
      "trace.passHint": "Con frase, solo quien la conozca podrá verificar la marca. Si la olvidas, no se puede recuperar.",
      "trace.note": "La marca solo sobrevive en archivos sin pérdida: la imagen se exporta en PNG y el PDF incrusta PNG (archivo más grande). Capturas de pantalla y recompresión la destruyen.",
      "trace.unavailable": "No disponible: esta función necesita un contexto seguro (HTTPS o localhost).",
      "trace.issuedTitle": "Última copia emitida",
      "trace.issuedCount": "{n} copia(s) emitida(s) en esta sesión. El registro se borra al recargar la página.",
      "trace.registryDownload": "Descargar registro (CSV)",
      "verify.title": "Verificar una copia",
      "verify.lead": "Comprueba, sin salir de tu navegador, si un archivo lleva una marca invisible de IDprotector y qué metadatos declara.",
      "verify.dropTitle": "Arrastra el archivo a comprobar",
      "verify.dropText": "o pulsa para elegir una imagen o PDF.",
      "verify.passLabel": "Frase secreta (solo si la copia se creó con una)",
      "verify.passPlaceholder": "Déjalo vacío para marcas abiertas",
      "verify.retry": "Reintentar",
      "verify.metaTitle": "Metadatos declarados",
      "verify.metaNone": "El archivo no declara metadatos de IDprotector. Es normal: los metadatos se pueden eliminar fácilmente.",
      "verify.pixelTitle": "Marca invisible en los píxeles",
      "verify.statusVerified": "Marca verificada",
      "verify.statusFoundUnverified": "Marca encontrada, sin verificar",
      "verify.statusNone": "No se detectó marca",
      "verify.noneExplain": "No se encontró ninguna marca. Ojo: esto no significa que el documento no estuviera protegido — capturas de pantalla, recompresión (JPEG, WhatsApp) o redimensionado destruyen la marca.",
      "verify.copyId": "Identificador de copia",
      "verify.created": "Creada",
      "verify.keyLabel": "Tipo de clave",
      "verify.keyOpen": "Marca abierta (sin frase secreta)",
      "verify.keyPassphrase": "Verificada con tu frase secreta",
      "verify.agreement": "Consistencia",
      "verify.registryMatch": "Coincide con el registro",
      "verify.pageLabel": "Página",
      "verify.pdfExtractFallback": "Los píxeles del PDF se leyeron por la vía de reserva; si no aparece marca, puede deberse a la extracción y no al archivo.",
      "busy.verifying": "Analizando archivo…",
      "alert.verifyFailed": "No se pudo analizar el archivo: "
    },
    en: {
      "doc.title": "IDprotector · Protect your documents",
      "doc.description": "Hide sensitive data and add watermarks to IDs and documents. 100% in your browser: nothing is uploaded to any server.",
      "language.label": "Language",
      "common.back": "← Back",
      "home.title": "What would you like to do?",
      "home.lead": "Choose an option to start. Everything happens inside your browser: your files never leave your device.",
      "home.protectTitle": "Protect documents",
      "home.protectText": "Cover sensitive data, add watermarks and generate a copy ready to send with more privacy.",
      "home.protectCta": "Protect documents",
      "home.verifyTitle": "Verify a traceable copy",
      "home.verifyText": "Check whether a file carries an invisible IDprotector mark and what information it declares.",
      "home.verifyCta": "Verify a copy",
      "upload.title": "Prepare your documents<br />before sending them",
      "upload.lead": "Cover the details you want to keep private and add a custom watermark. Everything happens <strong>inside your browser</strong>: your files are never uploaded to any server.",
      "upload.dropTitle": "Drop your documents here",
      "upload.dropText": "or click to choose images or PDFs. You can upload several files.",
      "privacy.local": "100% local processing",
      "privacy.noCloud": "No cloud uploads",
      "privacy.offline": "Works offline",
      "redact.title": "Cover the information you want to keep private",
      "redact.lead": "Drag your finger or pointer over the parts to cover, then use zoom to refine the stroke.",
      "redact.grayscale": "Convert the document to grayscale",
      "redact.hint": "Tip: the brush draws straight bars; drag from one end to the other. Use zoom to hide ID numbers or document data precisely.",
      "redact.continue": "Continue",
      "redact.continueNoRedaction": "Proceed without covering anything",
      "tool.undo": "Undo",
      "tool.pan": "Move / pan",
      "tool.move": "Move",
      "tool.zoomOut": "Zoom out",
      "tool.zoomIn": "Zoom in",
      "tool.fit": "Fit",
      "tool.brush": "Brush (black bar)",
      "tool.blur": "Blur",
      "tool.select": "Select / move",
      "tool.deleteRedaction": "Delete selection",
      "tool.copyRedaction": "Apply selection to every page",
      "blur.intensity": "Intensity",
      "blur.area": "Area",
      "select.hint": "Select a bar or blur patch to move it or resize it.",
      "pageTools.group": "Page adjustments",
      "pageTools.rotateLeft": "Rotate left",
      "pageTools.rotateRight": "Rotate right",
      "pageTools.crop": "Crop",
      "pageTools.applyCrop": "Apply crop",
      "pageTools.straighten": "Straighten",
      "pageTools.applyStraighten": "Apply straightening",
      "brush.group": "Brush size",
      "brush.veryThin": "Very thin",
      "brush.thin": "Thin",
      "brush.medium": "Medium",
      "brush.thick": "Thick",
      "brush.veryThick": "Very thick",
      "nav.prevPage": "Previous page",
      "nav.nextPage": "Next page",
      "wm.title": "Add a custom watermark",
      "wm.lead": "Enter the authorized use and recipient. That text will be embedded into the document as a watermark.",
      "wm.authorized": "Authorized use and recipient",
      "wm.placeholder": "Example: Only valid for Banco XYZ identity verification, 05/07/2026",
      "wm.charsRemaining": "characters left",
      "wm.apply": "Apply watermark",
      "wm.pattern": "Pattern",
      "wm.patternAria": "Watermark pattern",
      "wm.opacity": "Opacity",
      "wm.size": "Size",
      "wm.angle": "Angle",
      "wm.resetPosition": "Reset position",
      "wm.manualItem": "Mark",
      "wm.manualAdd": "Add watermark",
      "wm.manualText": "Text for this mark (optional)",
      "wm.manualTextPlaceholder": "Leave empty to use the main text",
      "wm.manualRemove": "Remove",
      "wm.manualRandom": "Different position on each page",
      "wm.manualHint": "Drag on the preview to place the selected mark.",
      "wm.color": "Color",
      "wm.custom": "Custom",
      "wm.footer": "Add protection signature footer",
      "legal.title": "Download legal information",
      "legal.eu": "European Data Protection Regulation",
      "legal.national": "National data protection authority",
      "legal.nationalSelect": "Select the data protection authority",
      "legal.contactEmail": "Contact email",
      "legal.phone": "Contact phone",
      "legal.message": "Legal notice",
      "legal.emailPlaceholder": "name@example.com",
      "legal.phonePlaceholder": "+1 555 000 0000",
      "legal.messagePlaceholder": "Notice embedded in the download",
      "legal.defaultMessage": "Valid only for identity verification in the stated procedure. It does not constitute a signature, contractual authorization, or consent for other purposes.",
      "legal.outputContactEmail": "Contact email",
      "legal.outputPhone": "Contact phone",
      "wm.preview": "Live preview",
      "wm.generate": "Generate protected document",
      "wm.continueNoWatermark": "Continue without watermark",
      "result.title": "Your protected document is ready",
      "result.lead": "The final file contains the protected pages and, when enabled, the watermark details you entered.",
      "result.format": "Download format",
      "result.image": "Image",
      "result.pdf": "PDF",
      "result.share": "Share",
      "result.download": "Download",
      "result.more": "Protect more documents",
      "format.multiImage": "A .zip with one image per page will be downloaded.",
      "format.pdf": "One PDF with all pages.",
      "format.image": "One PNG image.",
      "busy.processing": "Processing…",
      "busy.preparingMany": "Preparing your documents…",
      "busy.preparingOne": "Preparing your document…",
      "busy.generating": "Generating file…",
      "busy.sharing": "Preparing to share…",
      "alert.unsupported": "Unsupported format. Use images (PNG, JPG…) or PDF.",
      "alert.imageRead": "Could not read the image",
      "alert.openFailed": "Could not open the document: ",
      "alert.generateFailed": "Could not generate the file: ",
      "alert.shareFailed": "Could not share: ",
      "share.title": "Protected document",
      "footer.selfHosted": "self-hosted",
      "footer.privacy": "Nothing you upload leaves this device.",
      "footer.policyTitle": "Privacy policy:",
      "footer.policyText": "IDprotector collects, stores and transmits no data. All processing happens locally, inside your browser, and no file ever leaves your device. No tracking cookies and no analytics services are used.",
      "pattern.dense": "Secure",
      "pattern.topographic": "Topographic",
      "pattern.diagonal": "Diagonal",
      "pattern.mesh": "Mesh",
      "pattern.grid": "Grid",
      "pattern.single": "Center",
      "pattern.manual": "Manual",
      "watermark.unauthorized": "UNAUTHORIZED",
      "watermark.protectedWith": "Protected with",
      "file.protectedSuffix": "protected",
      "file.pagePrefix": "page",
      "upload.verifyLink": "Received a traceable copy? Verify it here",
      "trace.title": "Traceable copy (invisible mark)",
      "trace.enable": "Embed an invisible identifier in this copy",
      "trace.labelLabel": "Recipient or purpose",
      "trace.labelPlaceholder": "e.g. García Realty — rental",
      "trace.passLabel": "Passphrase (optional)",
      "trace.passPlaceholder": "Without one, anyone with IDprotector can read the mark",
      "trace.passHint": "With a passphrase, only someone who knows it can verify the mark. If you forget it, it cannot be recovered.",
      "trace.note": "The mark only survives lossless files: images export as PNG and PDFs embed PNG (larger file). Screenshots and recompression destroy it.",
      "trace.unavailable": "Unavailable: this feature needs a secure context (HTTPS or localhost).",
      "trace.issuedTitle": "Last issued copy",
      "trace.issuedCount": "{n} copy(ies) issued this session. The registry is wiped when the page reloads.",
      "trace.registryDownload": "Download registry (CSV)",
      "verify.title": "Verify a copy",
      "verify.lead": "Check — without leaving your browser — whether a file carries an invisible IDprotector mark and what metadata it declares.",
      "verify.dropTitle": "Drop the file to check",
      "verify.dropText": "or click to pick an image or PDF.",
      "verify.passLabel": "Passphrase (only if the copy was created with one)",
      "verify.passPlaceholder": "Leave empty for open marks",
      "verify.retry": "Retry",
      "verify.metaTitle": "Declared metadata",
      "verify.metaNone": "The file declares no IDprotector metadata. That's normal: metadata is easy to strip.",
      "verify.pixelTitle": "Invisible mark in the pixels",
      "verify.statusVerified": "Mark verified",
      "verify.statusFoundUnverified": "Mark found, not verified",
      "verify.statusNone": "No mark detected",
      "verify.noneExplain": "No mark was found. Note this does not mean the document wasn't protected — screenshots, recompression (JPEG, WhatsApp) or resizing destroy the mark.",
      "verify.copyId": "Copy identifier",
      "verify.created": "Created",
      "verify.keyLabel": "Key type",
      "verify.keyOpen": "Open mark (no passphrase)",
      "verify.keyPassphrase": "Verified with your passphrase",
      "verify.agreement": "Consistency",
      "verify.registryMatch": "Matches this session's registry",
      "verify.pageLabel": "Page",
      "verify.pdfExtractFallback": "The PDF pixels were read via the fallback path; if no mark shows up, it may be the extraction, not the file.",
      "busy.verifying": "Analysing file…",
      "alert.verifyFailed": "Could not analyse the file: "
    },
    fr: {
      "doc.title": "IDprotector · Protégez vos documents",
      "doc.description": "Masquez les données sensibles et ajoutez des filigranes à vos documents. 100 % dans votre navigateur : rien n'est envoyé à un serveur.",
      "language.label": "Langue",
      "common.back": "← Retour",
      "home.title": "Que souhaitez-vous faire ?",
      "home.lead": "Choisissez une option pour commencer. Tout se passe dans votre navigateur : vos fichiers ne quittent jamais votre appareil.",
      "home.protectTitle": "Protéger des documents",
      "home.protectText": "Masquez les données sensibles, ajoutez des filigranes et générez une copie prête à envoyer en toute confidentialité.",
      "home.protectCta": "Protéger des documents",
      "home.verifyTitle": "Vérifier une copie traçable",
      "home.verifyText": "Vérifiez si un fichier porte une marque invisible IDprotector et quelles informations il déclare.",
      "home.verifyCta": "Vérifier une copie",
      "upload.title": "Préparez vos documents<br />avant de les envoyer",
      "upload.lead": "Masquez les informations à préserver et ajoutez un filigrane personnalisé. Tout se passe <strong>dans votre navigateur</strong> : vos fichiers ne sont jamais envoyés à un serveur.",
      "upload.dropTitle": "Déposez vos documents ici",
      "upload.dropText": "ou cliquez pour choisir des images ou des PDF. Vous pouvez importer plusieurs fichiers.",
      "privacy.local": "Traitement 100 % local",
      "privacy.noCloud": "Aucun envoi dans le cloud",
      "privacy.offline": "Fonctionne hors ligne",
      "redact.title": "Recouvrez les informations que vous voulez garder privées",
      "redact.lead": "Passez le doigt ou le curseur sur les parties à couvrir, puis utilisez le zoom pour affiner le tracé.",
      "redact.grayscale": "Convertir le document en niveaux de gris",
      "redact.hint": "Astuce : le pinceau trace des barres droites ; faites glisser d'une extrémité à l'autre. Utilisez le zoom pour masquer précisément les données du document.",
      "redact.continue": "Continuer",
      "redact.continueNoRedaction": "Continuer sans rien couvrir",
      "tool.undo": "Annuler",
      "tool.pan": "Déplacer / parcourir",
      "tool.move": "Déplacer",
      "tool.zoomOut": "Réduire",
      "tool.zoomIn": "Agrandir",
      "tool.fit": "Ajuster",
      "tool.brush": "Pinceau (barre noire)",
      "tool.blur": "Flouter",
      "tool.select": "Sélectionner / déplacer",
      "tool.deleteRedaction": "Supprimer la sélection",
      "tool.copyRedaction": "Appliquer la sélection à toutes les pages",
      "blur.intensity": "Intensité",
      "blur.area": "Zone",
      "select.hint": "Sélectionnez une barre ou un flou pour le déplacer ou le redimensionner.",
      "pageTools.group": "Réglages de page",
      "pageTools.rotateLeft": "Pivoter à gauche",
      "pageTools.rotateRight": "Pivoter à droite",
      "pageTools.crop": "Recadrer",
      "pageTools.applyCrop": "Appliquer le recadrage",
      "pageTools.straighten": "Redresser",
      "pageTools.applyStraighten": "Appliquer le redressement",
      "brush.group": "Taille du pinceau",
      "brush.veryThin": "Très fin",
      "brush.thin": "Fin",
      "brush.medium": "Moyen",
      "brush.thick": "Épais",
      "brush.veryThick": "Très épais",
      "nav.prevPage": "Page précédente",
      "nav.nextPage": "Page suivante",
      "wm.title": "Ajoutez un filigrane personnalisé",
      "wm.lead": "Indiquez l'usage autorisé et le destinataire. Ce texte sera intégré au document comme filigrane.",
      "wm.authorized": "Usage et destinataire autorisés",
      "wm.placeholder": "Ex. : Valable uniquement pour la vérification d'identité de Banque XYZ, 05/07/2026",
      "wm.charsRemaining": "caractères restants",
      "wm.apply": "Appliquer le filigrane",
      "wm.pattern": "Motif",
      "wm.patternAria": "Motif du filigrane",
      "wm.opacity": "Opacité",
      "wm.size": "Taille",
      "wm.angle": "Angle",
      "wm.resetPosition": "Réinitialiser la position",
      "wm.manualItem": "Marque",
      "wm.manualAdd": "Ajouter un filigrane",
      "wm.manualText": "Texte de cette marque (facultatif)",
      "wm.manualTextPlaceholder": "Laissez vide pour utiliser le texte principal",
      "wm.manualRemove": "Supprimer",
      "wm.manualRandom": "Position différente sur chaque page",
      "wm.manualHint": "Faites glisser sur l'aperçu pour placer la marque sélectionnée.",
      "wm.color": "Couleur",
      "wm.custom": "Personnalisé",
      "wm.footer": "Ajouter un pied de page avec signature de protection",
      "legal.title": "Informations légales du téléchargement",
      "legal.eu": "Règlement européen sur la protection des données",
      "legal.national": "Autorité nationale de protection des données",
      "legal.nationalSelect": "Sélectionnez l'autorité de protection des données",
      "legal.contactEmail": "E-mail de contact",
      "legal.phone": "Téléphone de contact",
      "legal.message": "Mention légale",
      "legal.emailPlaceholder": "nom@domaine.com",
      "legal.phonePlaceholder": "+33 6 00 00 00 00",
      "legal.messagePlaceholder": "Mention intégrée au téléchargement",
      "legal.defaultMessage": "Valable uniquement pour la vérification d'identité dans la démarche indiquée. Ne constitue ni signature, ni autorisation contractuelle, ni consentement à d'autres usages.",
      "legal.outputContactEmail": "E-mail de contact",
      "legal.outputPhone": "Téléphone de contact",
      "wm.preview": "Aperçu en direct",
      "wm.generate": "Générer le document protégé",
      "wm.continueNoWatermark": "Continuer sans filigrane",
      "result.title": "Votre document protégé est prêt",
      "result.lead": "Le fichier final contient les pages protégées et, si elle est activée, les informations de filigrane saisies.",
      "result.format": "Format de téléchargement",
      "result.image": "Image",
      "result.pdf": "PDF",
      "result.share": "Partager",
      "result.download": "Télécharger",
      "result.more": "Protéger d'autres documents",
      "format.multiImage": "Un .zip avec une image par page sera téléchargé.",
      "format.pdf": "Un PDF avec toutes les pages.",
      "format.image": "Une image PNG.",
      "busy.processing": "Traitement…",
      "busy.preparingMany": "Préparation de vos documents…",
      "busy.preparingOne": "Préparation de votre document…",
      "busy.generating": "Génération du fichier…",
      "busy.sharing": "Préparation du partage…",
      "alert.unsupported": "Format non compatible. Utilisez des images (PNG, JPG…) ou un PDF.",
      "alert.imageRead": "Impossible de lire l'image",
      "alert.openFailed": "Impossible d'ouvrir le document : ",
      "alert.generateFailed": "Impossible de générer le fichier : ",
      "alert.shareFailed": "Impossible de partager : ",
      "share.title": "Document protégé",
      "footer.selfHosted": "auto-hébergé",
      "footer.privacy": "Rien de ce que vous importez ne quitte cet appareil.",
      "footer.policyTitle": "Politique de confidentialité :",
      "footer.policyText": "IDprotector ne collecte, ne stocke ni ne transmet aucune donnée. Tout le traitement se fait localement, dans votre navigateur, et aucun fichier ne quitte votre appareil. Aucun cookie de suivi ni service d'analyse n'est utilisé.",
      "pattern.dense": "Sécurisé",
      "pattern.topographic": "Topographique",
      "pattern.diagonal": "Diagonal",
      "pattern.mesh": "Maillage",
      "pattern.grid": "Grille",
      "pattern.single": "Central",
      "pattern.manual": "Manuel",
      "watermark.unauthorized": "NON AUTORISÉ",
      "watermark.protectedWith": "Protégé avec",
      "file.protectedSuffix": "protege",
      "file.pagePrefix": "page",
      "upload.verifyLink": "Vous avez reçu une copie traçable ? Vérifiez-la ici",
      "trace.title": "Copie traçable (marque invisible)",
      "trace.enable": "Intégrer un identifiant invisible dans cette copie",
      "trace.labelLabel": "Destinataire ou finalité",
      "trace.labelPlaceholder": "p. ex. Agence García — location",
      "trace.passLabel": "Phrase secrète (facultative)",
      "trace.passPlaceholder": "Sans phrase, quiconque avec IDprotector peut lire la marque",
      "trace.passHint": "Avec une phrase, seul celui qui la connaît peut vérifier la marque. En cas d'oubli, elle est irrécupérable.",
      "trace.note": "La marque ne survit que dans des fichiers sans perte : l'image est exportée en PNG et le PDF intègre du PNG (fichier plus lourd). Captures d'écran et recompression la détruisent.",
      "trace.unavailable": "Indisponible : cette fonction requiert un contexte sécurisé (HTTPS ou localhost).",
      "trace.issuedTitle": "Dernière copie émise",
      "trace.issuedCount": "{n} copie(s) émise(s) dans cette session. Le registre s'efface au rechargement de la page.",
      "trace.registryDownload": "Télécharger le registre (CSV)",
      "verify.title": "Vérifier une copie",
      "verify.lead": "Vérifiez, sans quitter votre navigateur, si un fichier porte une marque invisible IDprotector et quelles métadonnées il déclare.",
      "verify.dropTitle": "Déposez le fichier à vérifier",
      "verify.dropText": "ou cliquez pour choisir une image ou un PDF.",
      "verify.passLabel": "Phrase secrète (seulement si la copie en a une)",
      "verify.passPlaceholder": "Laissez vide pour les marques ouvertes",
      "verify.retry": "Réessayer",
      "verify.metaTitle": "Métadonnées déclarées",
      "verify.metaNone": "Le fichier ne déclare aucune métadonnée IDprotector. C'est normal : les métadonnées s'effacent facilement.",
      "verify.pixelTitle": "Marque invisible dans les pixels",
      "verify.statusVerified": "Marque vérifiée",
      "verify.statusFoundUnverified": "Marque trouvée, non vérifiée",
      "verify.statusNone": "Aucune marque détectée",
      "verify.noneExplain": "Aucune marque trouvée. Attention : cela ne signifie pas que le document n'était pas protégé — captures d'écran, recompression (JPEG, WhatsApp) ou redimensionnement détruisent la marque.",
      "verify.copyId": "Identifiant de copie",
      "verify.created": "Créée",
      "verify.keyLabel": "Type de clé",
      "verify.keyOpen": "Marque ouverte (sans phrase secrète)",
      "verify.keyPassphrase": "Vérifiée avec votre phrase secrète",
      "verify.agreement": "Cohérence",
      "verify.registryMatch": "Correspond au registre de cette session",
      "verify.pageLabel": "Page",
      "verify.pdfExtractFallback": "Les pixels du PDF ont été lus par la voie de secours ; si aucune marque n'apparaît, la cause peut être l'extraction et non le fichier.",
      "busy.verifying": "Analyse du fichier…",
      "alert.verifyFailed": "Impossible d'analyser le fichier : "
    },
    pt: {
      "doc.title": "IDprotector · Proteja os seus documentos",
      "doc.description": "Oculte dados sensíveis e adicione marcas de água aos seus documentos. 100% no navegador: nada é enviado para servidores.",
      "language.label": "Idioma",
      "common.back": "← Voltar",
      "home.title": "O que deseja fazer?",
      "home.lead": "Escolha uma opção para começar. Tudo acontece dentro do seu navegador: os seus ficheiros nunca saem do seu dispositivo.",
      "home.protectTitle": "Proteger documentos",
      "home.protectText": "Oculte dados sensíveis, adicione marcas de água e gere uma cópia pronta para enviar com mais privacidade.",
      "home.protectCta": "Proteger documentos",
      "home.verifyTitle": "Verificar cópia rastreável",
      "home.verifyText": "Verifique se um ficheiro tem uma marca invisível do IDprotector e que informação declara.",
      "home.verifyCta": "Verificar uma cópia",
      "upload.title": "Prepare os seus documentos<br />antes de enviá-los",
      "upload.lead": "Cubra os dados que pretende reservar e adicione uma marca de água personalizada. Tudo acontece <strong>no seu navegador</strong>: os ficheiros nunca são enviados para servidores.",
      "upload.dropTitle": "Arraste os documentos para aqui",
      "upload.dropText": "ou clique para escolher imagens ou PDF. Pode carregar vários ficheiros.",
      "privacy.local": "Processamento 100% local",
      "privacy.noCloud": "Sem envios para a cloud",
      "privacy.offline": "Funciona offline",
      "redact.title": "Cubra as informações que pretende manter privadas",
      "redact.lead": "Passe o dedo ou o cursor pelas partes a cobrir e use o zoom para ajustar o traço com detalhe.",
      "redact.grayscale": "Converter o documento para escala de cinzentos",
      "redact.hint": "Dica: o pincel desenha barras retas; arraste de uma extremidade à outra. Use o zoom para ocultar dados do documento com precisão.",
      "redact.continue": "Continuar",
      "redact.continueNoRedaction": "Avançar sem cobrir informação",
      "tool.undo": "Anular",
      "tool.pan": "Mover / deslocar",
      "tool.move": "Mover",
      "tool.zoomOut": "Afastar",
      "tool.zoomIn": "Aproximar",
      "tool.fit": "Ajustar",
      "tool.brush": "Pincel (barra preta)",
      "tool.blur": "Desfocar",
      "tool.select": "Selecionar / mover",
      "tool.deleteRedaction": "Eliminar seleção",
      "tool.copyRedaction": "Aplicar seleção a todas as páginas",
      "blur.intensity": "Intensidade",
      "blur.area": "Área",
      "select.hint": "Selecione uma barra ou um desfoque para o mover ou redimensionar.",
      "pageTools.group": "Ajustes da página",
      "pageTools.rotateLeft": "Rodar para a esquerda",
      "pageTools.rotateRight": "Rodar para a direita",
      "pageTools.crop": "Recortar",
      "pageTools.applyCrop": "Aplicar recorte",
      "pageTools.straighten": "Endireitar",
      "pageTools.applyStraighten": "Aplicar endireitamento",
      "brush.group": "Tamanho do pincel",
      "brush.veryThin": "Muito fino",
      "brush.thin": "Fino",
      "brush.medium": "Médio",
      "brush.thick": "Grosso",
      "brush.veryThick": "Muito grosso",
      "nav.prevPage": "Página anterior",
      "nav.nextPage": "Página seguinte",
      "wm.title": "Adicione uma marca de água personalizada",
      "wm.lead": "Indique o uso permitido e o destinatário autorizado. Esse texto será integrado no documento como marca de água.",
      "wm.authorized": "Uso e destinatário autorizados",
      "wm.placeholder": "Ex.: Válido apenas para verificação de identidade do Banco XYZ, 05/07/2026",
      "wm.charsRemaining": "caracteres restantes",
      "wm.apply": "Aplicar marca de água",
      "wm.pattern": "Padrão",
      "wm.patternAria": "Padrão da marca de água",
      "wm.opacity": "Opacidade",
      "wm.size": "Tamanho",
      "wm.angle": "Ângulo",
      "wm.resetPosition": "Repor posição",
      "wm.manualItem": "Marca",
      "wm.manualAdd": "Adicionar marca de água",
      "wm.manualText": "Texto desta marca (opcional)",
      "wm.manualTextPlaceholder": "Deixe vazio para usar o texto principal",
      "wm.manualRemove": "Eliminar",
      "wm.manualRandom": "Posição diferente em cada página",
      "wm.manualHint": "Arraste sobre a pré-visualização para colocar a marca selecionada.",
      "wm.color": "Cor",
      "wm.custom": "Personalizado",
      "wm.footer": "Adicionar rodapé com assinatura de proteção",
      "legal.title": "Informação legal da transferência",
      "legal.eu": "Regulamento Europeu de Proteção de Dados",
      "legal.national": "Autoridade nacional de proteção de dados",
      "legal.nationalSelect": "Selecione a autoridade de proteção de dados",
      "legal.contactEmail": "E-mail de contacto",
      "legal.phone": "Telefone de contacto",
      "legal.message": "Aviso legal",
      "legal.emailPlaceholder": "nome@dominio.com",
      "legal.phonePlaceholder": "+351 900 000 000",
      "legal.messagePlaceholder": "Aviso integrado na transferência",
      "legal.defaultMessage": "Válido apenas para verificação de identidade no procedimento indicado. Não constitui assinatura, autorização contratual nem consentimento para outros fins.",
      "legal.outputContactEmail": "E-mail de contacto",
      "legal.outputPhone": "Telefone de contacto",
      "wm.preview": "Pré-visualização em direto",
      "wm.generate": "Gerar documento protegido",
      "wm.continueNoWatermark": "Continuar sem marca de água",
      "result.title": "O documento protegido está pronto",
      "result.lead": "O ficheiro final contém as páginas protegidas e, se ativada, a marca de água com a informação indicada.",
      "result.format": "Formato de transferência",
      "result.image": "Imagem",
      "result.pdf": "PDF",
      "result.share": "Partilhar",
      "result.download": "Transferir",
      "result.more": "Proteger mais documentos",
      "format.multiImage": "Será transferido um .zip com uma imagem por página.",
      "format.pdf": "Um PDF com todas as páginas.",
      "format.image": "Uma imagem PNG.",
      "busy.processing": "A processar…",
      "busy.preparingMany": "A preparar os documentos…",
      "busy.preparingOne": "A preparar o documento…",
      "busy.generating": "A gerar ficheiro…",
      "busy.sharing": "A preparar para partilhar…",
      "alert.unsupported": "Formato não compatível. Use imagens (PNG, JPG…) ou PDF.",
      "alert.imageRead": "Não foi possível ler a imagem",
      "alert.openFailed": "Não foi possível abrir o documento: ",
      "alert.generateFailed": "Não foi possível gerar o ficheiro: ",
      "alert.shareFailed": "Não foi possível partilhar: ",
      "share.title": "Documento protegido",
      "footer.selfHosted": "autoalojado",
      "footer.privacy": "Nada do que carrega sai deste dispositivo.",
      "footer.policyTitle": "Política de privacidade:",
      "footer.policyText": "O IDprotector não recolhe, armazena nem transmite quaisquer dados. Todo o processamento ocorre localmente, dentro do seu navegador, e nenhum ficheiro sai do seu dispositivo. Não são usados cookies de rastreio nem serviços de análise.",
      "pattern.dense": "Seguro",
      "pattern.topographic": "Topográfico",
      "pattern.diagonal": "Diagonal",
      "pattern.mesh": "Malha",
      "pattern.grid": "Grelha",
      "pattern.single": "Central",
      "pattern.manual": "Manual",
      "watermark.unauthorized": "NÃO AUTORIZADO",
      "watermark.protectedWith": "Protegido com",
      "file.protectedSuffix": "protegido",
      "file.pagePrefix": "pagina",
      "upload.verifyLink": "Recebeu uma cópia rastreável? Verifique-a aqui",
      "trace.title": "Cópia rastreável (marca invisível)",
      "trace.enable": "Incorporar um identificador invisível nesta cópia",
      "trace.labelLabel": "Destinatário ou finalidade",
      "trace.labelPlaceholder": "p. ex. Imobiliária García — arrendamento",
      "trace.passLabel": "Frase secreta (opcional)",
      "trace.passPlaceholder": "Sem frase, qualquer pessoa com o IDprotector pode ler a marca",
      "trace.passHint": "Com frase, só quem a conhecer pode verificar a marca. Se a esquecer, não é recuperável.",
      "trace.note": "A marca só sobrevive em ficheiros sem perdas: a imagem é exportada em PNG e o PDF incorpora PNG (ficheiro maior). Capturas de ecrã e recompressão destroem-na.",
      "trace.unavailable": "Indisponível: esta função precisa de um contexto seguro (HTTPS ou localhost).",
      "trace.issuedTitle": "Última cópia emitida",
      "trace.issuedCount": "{n} cópia(s) emitida(s) nesta sessão. O registo apaga-se ao recarregar a página.",
      "trace.registryDownload": "Transferir registo (CSV)",
      "verify.title": "Verificar uma cópia",
      "verify.lead": "Confirme, sem sair do navegador, se um ficheiro tem uma marca invisível do IDprotector e que metadados declara.",
      "verify.dropTitle": "Arraste o ficheiro a verificar",
      "verify.dropText": "ou toque para escolher uma imagem ou PDF.",
      "verify.passLabel": "Frase secreta (apenas se a cópia foi criada com uma)",
      "verify.passPlaceholder": "Deixe vazio para marcas abertas",
      "verify.retry": "Tentar novamente",
      "verify.metaTitle": "Metadados declarados",
      "verify.metaNone": "O ficheiro não declara metadados do IDprotector. É normal: os metadados removem-se facilmente.",
      "verify.pixelTitle": "Marca invisível nos píxeis",
      "verify.statusVerified": "Marca verificada",
      "verify.statusFoundUnverified": "Marca encontrada, não verificada",
      "verify.statusNone": "Nenhuma marca detetada",
      "verify.noneExplain": "Não foi encontrada nenhuma marca. Atenção: isto não significa que o documento não estivesse protegido — capturas de ecrã, recompressão (JPEG, WhatsApp) ou redimensionamento destroem a marca.",
      "verify.copyId": "Identificador da cópia",
      "verify.created": "Criada",
      "verify.keyLabel": "Tipo de chave",
      "verify.keyOpen": "Marca aberta (sem frase secreta)",
      "verify.keyPassphrase": "Verificada com a sua frase secreta",
      "verify.agreement": "Consistência",
      "verify.registryMatch": "Coincide com o registo desta sessão",
      "verify.pageLabel": "Página",
      "verify.pdfExtractFallback": "Os píxeis do PDF foram lidos pela via de recurso; se não aparecer marca, pode dever-se à extração e não ao ficheiro.",
      "busy.verifying": "A analisar o ficheiro…",
      "alert.verifyFailed": "Não foi possível analisar o ficheiro: "
    },
    de: {
      "doc.title": "IDprotector · Dokumente schützen",
      "doc.description": "Blenden Sie sensible Daten aus und fügen Sie Wasserzeichen hinzu. 100 % im Browser: nichts wird auf einen Server geladen.",
      "language.label": "Sprache",
      "common.back": "← Zurück",
      "home.title": "Was möchten Sie tun?",
      "home.lead": "Wählen Sie eine Option, um zu beginnen. Alles geschieht in Ihrem Browser: Ihre Dateien verlassen niemals Ihr Gerät.",
      "home.protectTitle": "Dokumente schützen",
      "home.protectText": "Verdecken Sie sensible Daten, fügen Sie Wasserzeichen hinzu und erstellen Sie eine versandfertige Kopie mit mehr Privatsphäre.",
      "home.protectCta": "Dokumente schützen",
      "home.verifyTitle": "Rückverfolgbare Kopie prüfen",
      "home.verifyText": "Prüfen Sie, ob eine Datei ein unsichtbares IDprotector-Zeichen trägt und welche Informationen sie angibt.",
      "home.verifyCta": "Kopie prüfen",
      "upload.title": "Dokumente vorbereiten<br />bevor Sie sie senden",
      "upload.lead": "Decken Sie vertrauliche Angaben ab und fügen Sie ein eigenes Wasserzeichen hinzu. Alles geschieht <strong>in Ihrem Browser</strong>: Ihre Dateien werden nie auf einen Server hochgeladen.",
      "upload.dropTitle": "Dokumente hier ablegen",
      "upload.dropText": "oder klicken, um Bilder oder PDFs auszuwählen. Mehrere Dateien sind möglich.",
      "privacy.local": "100 % lokale Verarbeitung",
      "privacy.noCloud": "Keine Cloud-Uploads",
      "privacy.offline": "Funktioniert offline",
      "redact.title": "Decken Sie Informationen ab, die privat bleiben sollen",
      "redact.lead": "Fahren Sie mit Finger oder Maus über die zu verdeckenden Bereiche und nutzen Sie den Zoom für den Feinschliff.",
      "redact.grayscale": "Dokument in Graustufen umwandeln",
      "redact.hint": "Tipp: Der Pinsel zeichnet gerade Balken; ziehen Sie von einem Ende zum anderen. Nutzen Sie den Zoom für präzises Abdecken.",
      "redact.continue": "Weiter",
      "redact.continueNoRedaction": "Fortfahren ohne etwas abzudecken",
      "tool.undo": "Rückgängig",
      "tool.pan": "Verschieben / bewegen",
      "tool.move": "Verschieben",
      "tool.zoomOut": "Verkleinern",
      "tool.zoomIn": "Vergrößern",
      "tool.fit": "Einpassen",
      "tool.brush": "Pinsel (schwarzer Balken)",
      "tool.blur": "Weichzeichnen",
      "tool.select": "Auswählen / verschieben",
      "tool.deleteRedaction": "Auswahl löschen",
      "tool.copyRedaction": "Auswahl auf alle Seiten anwenden",
      "blur.intensity": "Intensität",
      "blur.area": "Bereich",
      "select.hint": "Wählen Sie einen Balken oder Weichzeichner, um ihn zu verschieben oder zu skalieren.",
      "pageTools.group": "Seiteneinstellungen",
      "pageTools.rotateLeft": "Nach links drehen",
      "pageTools.rotateRight": "Nach rechts drehen",
      "pageTools.crop": "Zuschneiden",
      "pageTools.applyCrop": "Zuschnitt anwenden",
      "pageTools.straighten": "Begradigen",
      "pageTools.applyStraighten": "Begradigung anwenden",
      "brush.group": "Pinselgröße",
      "brush.veryThin": "Sehr dünn",
      "brush.thin": "Dünn",
      "brush.medium": "Mittel",
      "brush.thick": "Dick",
      "brush.veryThick": "Sehr dick",
      "nav.prevPage": "Vorherige Seite",
      "nav.nextPage": "Nächste Seite",
      "wm.title": "Eigenes Wasserzeichen hinzufügen",
      "wm.lead": "Geben Sie erlaubte Nutzung und Empfänger an. Dieser Text wird als Wasserzeichen in das Dokument eingebettet.",
      "wm.authorized": "Erlaubte Nutzung und Empfänger",
      "wm.placeholder": "Bsp.: Nur gültig für Identitätsprüfung bei Bank XYZ, 05.07.2026",
      "wm.charsRemaining": "Zeichen übrig",
      "wm.apply": "Wasserzeichen anwenden",
      "wm.pattern": "Muster",
      "wm.patternAria": "Wasserzeichenmuster",
      "wm.opacity": "Deckkraft",
      "wm.size": "Größe",
      "wm.angle": "Winkel",
      "wm.resetPosition": "Position zurücksetzen",
      "wm.manualItem": "Marke",
      "wm.manualAdd": "Wasserzeichen hinzufügen",
      "wm.manualText": "Text dieser Marke (optional)",
      "wm.manualTextPlaceholder": "Leer lassen, um den Haupttext zu verwenden",
      "wm.manualRemove": "Entfernen",
      "wm.manualRandom": "Andere Position auf jeder Seite",
      "wm.manualHint": "Ziehen Sie in der Vorschau, um die ausgewählte Marke zu platzieren.",
      "wm.color": "Farbe",
      "wm.custom": "Benutzerdefiniert",
      "wm.footer": "Fußzeile mit Schutzsignatur hinzufügen",
      "legal.title": "Rechtliche Angaben im Download",
      "legal.eu": "Europäische Datenschutz-Grundverordnung",
      "legal.national": "Nationale Datenschutzbehörde",
      "legal.nationalSelect": "Datenschutzbehörde auswählen",
      "legal.contactEmail": "Kontakt-E-Mail",
      "legal.phone": "Kontakttelefon",
      "legal.message": "Rechtlicher Hinweis",
      "legal.emailPlaceholder": "name@domain.de",
      "legal.phonePlaceholder": "+49 151 00000000",
      "legal.messagePlaceholder": "Hinweis im Download",
      "legal.defaultMessage": "Nur zur Identitätsprüfung im angegebenen Vorgang gültig. Stellt weder eine Unterschrift noch eine vertragliche Genehmigung oder Einwilligung für andere Zwecke dar.",
      "legal.outputContactEmail": "Kontakt-E-Mail",
      "legal.outputPhone": "Kontakttelefon",
      "wm.preview": "Live-Vorschau",
      "wm.generate": "Geschütztes Dokument erzeugen",
      "wm.continueNoWatermark": "Weiter ohne Wasserzeichen",
      "result.title": "Ihr geschütztes Dokument ist bereit",
      "result.lead": "Die finale Datei enthält die geschützten Seiten und, falls aktiviert, die eingegebenen Wasserzeichenangaben.",
      "result.format": "Downloadformat",
      "result.image": "Bild",
      "result.pdf": "PDF",
      "result.share": "Teilen",
      "result.download": "Herunterladen",
      "result.more": "Weitere Dokumente schützen",
      "format.multiImage": "Es wird eine .zip-Datei mit einem Bild pro Seite heruntergeladen.",
      "format.pdf": "Ein PDF mit allen Seiten.",
      "format.image": "Ein PNG-Bild.",
      "busy.processing": "Wird verarbeitet…",
      "busy.preparingMany": "Dokumente werden vorbereitet…",
      "busy.preparingOne": "Dokument wird vorbereitet…",
      "busy.generating": "Datei wird erzeugt…",
      "busy.sharing": "Teilen wird vorbereitet…",
      "alert.unsupported": "Nicht unterstütztes Format. Verwenden Sie Bilder (PNG, JPG…) oder PDF.",
      "alert.imageRead": "Das Bild konnte nicht gelesen werden",
      "alert.openFailed": "Das Dokument konnte nicht geöffnet werden: ",
      "alert.generateFailed": "Die Datei konnte nicht erzeugt werden: ",
      "alert.shareFailed": "Teilen war nicht möglich: ",
      "share.title": "Geschütztes Dokument",
      "footer.selfHosted": "selbst gehostet",
      "footer.privacy": "Nichts, was Sie hochladen, verlässt dieses Gerät.",
      "footer.policyTitle": "Datenschutzerklärung:",
      "footer.policyText": "IDprotector erhebt, speichert und übermittelt keine Daten. Die gesamte Verarbeitung erfolgt lokal in Ihrem Browser, und keine Datei verlässt Ihr Gerät. Es werden keine Tracking-Cookies und keine Analysedienste verwendet.",
      "pattern.dense": "Sicher",
      "pattern.topographic": "Topografisch",
      "pattern.diagonal": "Diagonal",
      "pattern.mesh": "Netz",
      "pattern.grid": "Raster",
      "pattern.single": "Zentral",
      "pattern.manual": "Manuell",
      "watermark.unauthorized": "NICHT AUTORISIERT",
      "watermark.protectedWith": "Geschützt mit",
      "file.protectedSuffix": "geschuetzt",
      "file.pagePrefix": "seite",
      "upload.verifyLink": "Rückverfolgbare Kopie erhalten? Hier prüfen",
      "trace.title": "Rückverfolgbare Kopie (unsichtbare Markierung)",
      "trace.enable": "Unsichtbare Kennung in diese Kopie einbetten",
      "trace.labelLabel": "Empfänger oder Zweck",
      "trace.labelPlaceholder": "z. B. Immobilien García — Miete",
      "trace.passLabel": "Geheimphrase (optional)",
      "trace.passPlaceholder": "Ohne Phrase kann jeder mit IDprotector die Markierung lesen",
      "trace.passHint": "Mit Phrase kann nur, wer sie kennt, die Markierung verifizieren. Vergessene Phrasen sind nicht wiederherstellbar.",
      "trace.note": "Die Markierung überlebt nur verlustfreie Dateien: Bilder werden als PNG exportiert, PDFs betten PNG ein (größere Datei). Screenshots und Neukompression zerstören sie.",
      "trace.unavailable": "Nicht verfügbar: Diese Funktion benötigt einen sicheren Kontext (HTTPS oder localhost).",
      "trace.issuedTitle": "Zuletzt erstellte Kopie",
      "trace.issuedCount": "{n} Kopie(n) in dieser Sitzung erstellt. Das Verzeichnis wird beim Neuladen gelöscht.",
      "trace.registryDownload": "Verzeichnis herunterladen (CSV)",
      "verify.title": "Eine Kopie prüfen",
      "verify.lead": "Prüfen Sie direkt im Browser, ob eine Datei eine unsichtbare IDprotector-Markierung trägt und welche Metadaten sie deklariert.",
      "verify.dropTitle": "Datei zum Prüfen hierher ziehen",
      "verify.dropText": "oder klicken, um ein Bild oder PDF zu wählen.",
      "verify.passLabel": "Geheimphrase (nur falls die Kopie eine hat)",
      "verify.passPlaceholder": "Für offene Markierungen leer lassen",
      "verify.retry": "Erneut versuchen",
      "verify.metaTitle": "Deklarierte Metadaten",
      "verify.metaNone": "Die Datei deklariert keine IDprotector-Metadaten. Das ist normal: Metadaten lassen sich leicht entfernen.",
      "verify.pixelTitle": "Unsichtbare Markierung in den Pixeln",
      "verify.statusVerified": "Markierung verifiziert",
      "verify.statusFoundUnverified": "Markierung gefunden, nicht verifiziert",
      "verify.statusNone": "Keine Markierung erkannt",
      "verify.noneExplain": "Keine Markierung gefunden. Achtung: Das heißt nicht, dass das Dokument ungeschützt war — Screenshots, Neukompression (JPEG, WhatsApp) oder Skalierung zerstören die Markierung.",
      "verify.copyId": "Kopie-Kennung",
      "verify.created": "Erstellt",
      "verify.keyLabel": "Schlüsseltyp",
      "verify.keyOpen": "Offene Markierung (ohne Geheimphrase)",
      "verify.keyPassphrase": "Mit Ihrer Geheimphrase verifiziert",
      "verify.agreement": "Konsistenz",
      "verify.registryMatch": "Stimmt mit dem Sitzungsverzeichnis überein",
      "verify.pageLabel": "Seite",
      "verify.pdfExtractFallback": "Die PDF-Pixel wurden über den Ersatzweg gelesen; erscheint keine Markierung, kann das an der Extraktion liegen, nicht an der Datei.",
      "busy.verifying": "Datei wird analysiert…",
      "alert.verifyFailed": "Die Datei konnte nicht analysiert werden: "
    },
    it: {
      "doc.title": "IDprotector · Proteggi i tuoi documenti",
      "doc.description": "Nascondi dati sensibili e aggiungi filigrane ai documenti. 100% nel browser: nulla viene caricato su server.",
      "language.label": "Lingua",
      "common.back": "← Indietro",
      "home.title": "Cosa vuoi fare?",
      "home.lead": "Scegli un'opzione per iniziare. Tutto avviene nel tuo browser: i tuoi file non lasciano mai il tuo dispositivo.",
      "home.protectTitle": "Proteggi documenti",
      "home.protectText": "Copri i dati sensibili, aggiungi filigrane e genera una copia pronta da inviare con più privacy.",
      "home.protectCta": "Proteggi documenti",
      "home.verifyTitle": "Verifica copia tracciabile",
      "home.verifyText": "Controlla se un file contiene un contrassegno invisibile di IDprotector e quali informazioni dichiara.",
      "home.verifyCta": "Verifica una copia",
      "upload.title": "Prepara i tuoi documenti<br />prima di inviarli",
      "upload.lead": "Copri i dati che vuoi mantenere riservati e aggiungi una filigrana personalizzata. Tutto avviene <strong>nel tuo browser</strong>: i file non vengono mai caricati su server.",
      "upload.dropTitle": "Trascina qui i documenti",
      "upload.dropText": "oppure clicca per scegliere immagini o PDF. Puoi caricare più file.",
      "privacy.local": "Elaborazione 100% locale",
      "privacy.noCloud": "Nessun upload nel cloud",
      "privacy.offline": "Funziona offline",
      "redact.title": "Copri le informazioni che vuoi mantenere private",
      "redact.lead": "Passa il dito o il cursore sulle parti da coprire e usa lo zoom per rifinire il tratto.",
      "redact.grayscale": "Converti il documento in scala di grigi",
      "redact.hint": "Suggerimento: il pennello disegna barre dritte; trascina da un'estremità all'altra. Usa lo zoom per nascondere con precisione i dati del documento.",
      "redact.continue": "Continua",
      "redact.continueNoRedaction": "Prosegui senza coprire informazioni",
      "tool.undo": "Annulla",
      "tool.pan": "Sposta / scorri",
      "tool.move": "Sposta",
      "tool.zoomOut": "Riduci",
      "tool.zoomIn": "Ingrandisci",
      "tool.fit": "Adatta",
      "tool.brush": "Pennello (barra nera)",
      "tool.blur": "Sfoca",
      "tool.select": "Seleziona / sposta",
      "tool.deleteRedaction": "Elimina selezione",
      "tool.copyRedaction": "Applica selezione a tutte le pagine",
      "blur.intensity": "Intensità",
      "blur.area": "Area",
      "select.hint": "Seleziona una barra o una sfocatura per spostarla o ridimensionarla.",
      "pageTools.group": "Regolazioni pagina",
      "pageTools.rotateLeft": "Ruota a sinistra",
      "pageTools.rotateRight": "Ruota a destra",
      "pageTools.crop": "Ritaglia",
      "pageTools.applyCrop": "Applica ritaglio",
      "pageTools.straighten": "Raddrizza",
      "pageTools.applyStraighten": "Applica raddrizzamento",
      "brush.group": "Dimensione pennello",
      "brush.veryThin": "Molto sottile",
      "brush.thin": "Sottile",
      "brush.medium": "Medio",
      "brush.thick": "Spesso",
      "brush.veryThick": "Molto spesso",
      "nav.prevPage": "Pagina precedente",
      "nav.nextPage": "Pagina successiva",
      "wm.title": "Aggiungi una filigrana personalizzata",
      "wm.lead": "Indica l'uso consentito e il destinatario autorizzato. Il testo verrà integrato nel documento come filigrana.",
      "wm.authorized": "Uso e destinatario autorizzati",
      "wm.placeholder": "Es.: Valido solo per verifica identità di Banca XYZ, 05/07/2026",
      "wm.charsRemaining": "caratteri rimanenti",
      "wm.apply": "Applica filigrana",
      "wm.pattern": "Motivo",
      "wm.patternAria": "Motivo della filigrana",
      "wm.opacity": "Opacità",
      "wm.size": "Dimensione",
      "wm.angle": "Angolo",
      "wm.resetPosition": "Ripristina posizione",
      "wm.manualItem": "Marca",
      "wm.manualAdd": "Aggiungi filigrana",
      "wm.manualText": "Testo di questa marca (facoltativo)",
      "wm.manualTextPlaceholder": "Lascia vuoto per usare il testo principale",
      "wm.manualRemove": "Rimuovi",
      "wm.manualRandom": "Posizione diversa su ogni pagina",
      "wm.manualHint": "Trascina sull'anteprima per posizionare la marca selezionata.",
      "wm.color": "Colore",
      "wm.custom": "Personalizzato",
      "wm.footer": "Aggiungi piè di pagina con firma di protezione",
      "legal.title": "Informazioni legali del download",
      "legal.eu": "Regolamento europeo sulla protezione dei dati",
      "legal.national": "Autorità nazionale per la protezione dei dati",
      "legal.nationalSelect": "Seleziona l'autorità per la protezione dei dati",
      "legal.contactEmail": "E-mail di contatto",
      "legal.phone": "Telefono di contatto",
      "legal.message": "Avviso legale",
      "legal.emailPlaceholder": "nome@dominio.it",
      "legal.phonePlaceholder": "+39 300 000 0000",
      "legal.messagePlaceholder": "Avviso integrato nel download",
      "legal.defaultMessage": "Valido esclusivamente per la verifica dell'identità nella procedura indicata. Non costituisce firma, autorizzazione contrattuale né consenso per usi diversi.",
      "legal.outputContactEmail": "E-mail di contatto",
      "legal.outputPhone": "Telefono di contatto",
      "wm.preview": "Anteprima live",
      "wm.generate": "Genera documento protetto",
      "wm.continueNoWatermark": "Continua senza filigrana",
      "result.title": "Il documento protetto è pronto",
      "result.lead": "Il file finale contiene le pagine protette e, se attiva, la filigrana con le informazioni inserite.",
      "result.format": "Formato di download",
      "result.image": "Immagine",
      "result.pdf": "PDF",
      "result.share": "Condividi",
      "result.download": "Scarica",
      "result.more": "Proteggi altri documenti",
      "format.multiImage": "Verrà scaricato un .zip con un'immagine per pagina.",
      "format.pdf": "Un PDF con tutte le pagine.",
      "format.image": "Un'immagine PNG.",
      "busy.processing": "Elaborazione…",
      "busy.preparingMany": "Preparazione dei documenti…",
      "busy.preparingOne": "Preparazione del documento…",
      "busy.generating": "Generazione file…",
      "busy.sharing": "Preparazione alla condivisione…",
      "alert.unsupported": "Formato non supportato. Usa immagini (PNG, JPG…) o PDF.",
      "alert.imageRead": "Impossibile leggere l'immagine",
      "alert.openFailed": "Impossibile aprire il documento: ",
      "alert.generateFailed": "Impossibile generare il file: ",
      "alert.shareFailed": "Impossibile condividere: ",
      "share.title": "Documento protetto",
      "footer.selfHosted": "self-hosted",
      "footer.privacy": "Nulla di ciò che carichi lascia questo dispositivo.",
      "footer.policyTitle": "Informativa sulla privacy:",
      "footer.policyText": "IDprotector non raccoglie, memorizza né trasmette alcun dato. Tutta l'elaborazione avviene localmente, nel tuo browser, e nessun file lascia il tuo dispositivo. Non vengono usati cookie di tracciamento né servizi di analisi.",
      "pattern.dense": "Sicuro",
      "pattern.topographic": "Topografico",
      "pattern.diagonal": "Diagonale",
      "pattern.mesh": "Maglia",
      "pattern.grid": "Griglia",
      "pattern.single": "Centrale",
      "pattern.manual": "Manuale",
      "watermark.unauthorized": "NON AUTORIZZATO",
      "watermark.protectedWith": "Protetto con",
      "file.protectedSuffix": "protetto",
      "file.pagePrefix": "pagina",
      "upload.verifyLink": "Hai ricevuto una copia tracciabile? Verificala qui",
      "trace.title": "Copia tracciabile (filigrana invisibile)",
      "trace.enable": "Incorpora un identificatore invisibile in questa copia",
      "trace.labelLabel": "Destinatario o finalità",
      "trace.labelPlaceholder": "es. Agenzia García — affitto",
      "trace.passLabel": "Frase segreta (facoltativa)",
      "trace.passPlaceholder": "Senza frase, chiunque con IDprotector può leggere il contrassegno",
      "trace.passHint": "Con la frase, solo chi la conosce può verificare il contrassegno. Se la dimentichi, non è recuperabile.",
      "trace.note": "Il contrassegno sopravvive solo in file senza perdita: l'immagine viene esportata in PNG e il PDF incorpora PNG (file più grande). Screenshot e ricompressione lo distruggono.",
      "trace.unavailable": "Non disponibile: questa funzione richiede un contesto sicuro (HTTPS o localhost).",
      "trace.issuedTitle": "Ultima copia emessa",
      "trace.issuedCount": "{n} copia/e emessa/e in questa sessione. Il registro si cancella al ricaricamento della pagina.",
      "trace.registryDownload": "Scarica registro (CSV)",
      "verify.title": "Verifica una copia",
      "verify.lead": "Controlla, senza uscire dal browser, se un file contiene un contrassegno invisibile di IDprotector e quali metadati dichiara.",
      "verify.dropTitle": "Trascina qui il file da controllare",
      "verify.dropText": "o premi per scegliere un'immagine o un PDF.",
      "verify.passLabel": "Frase segreta (solo se la copia ne ha una)",
      "verify.passPlaceholder": "Lascia vuoto per i contrassegni aperti",
      "verify.retry": "Riprova",
      "verify.metaTitle": "Metadati dichiarati",
      "verify.metaNone": "Il file non dichiara metadati IDprotector. È normale: i metadati si rimuovono facilmente.",
      "verify.pixelTitle": "Contrassegno invisibile nei pixel",
      "verify.statusVerified": "Contrassegno verificato",
      "verify.statusFoundUnverified": "Contrassegno trovato, non verificato",
      "verify.statusNone": "Nessun contrassegno rilevato",
      "verify.noneExplain": "Nessun contrassegno trovato. Attenzione: non significa che il documento non fosse protetto — screenshot, ricompressione (JPEG, WhatsApp) o ridimensionamento distruggono il contrassegno.",
      "verify.copyId": "Identificatore della copia",
      "verify.created": "Creata",
      "verify.keyLabel": "Tipo di chiave",
      "verify.keyOpen": "Contrassegno aperto (senza frase segreta)",
      "verify.keyPassphrase": "Verificato con la tua frase segreta",
      "verify.agreement": "Coerenza",
      "verify.registryMatch": "Corrisponde al registro di questa sessione",
      "verify.pageLabel": "Pagina",
      "verify.pdfExtractFallback": "I pixel del PDF sono stati letti con il percorso di riserva; se non compare un contrassegno, potrebbe dipendere dall'estrazione e non dal file.",
      "busy.verifying": "Analisi del file…",
      "alert.verifyFailed": "Impossibile analizzare il file: "
    }
  };

  function t(key, fallback) {
    var dict = I18N[currentLang] || I18N.es;
    return Object.prototype.hasOwnProperty.call(dict, key)
      ? dict[key]
      : (Object.prototype.hasOwnProperty.call(I18N.es, key) ? I18N.es[key] : (fallback || key));
  }
  SL.t = t;

  var EU_REGULATION_URLS = {
    es: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa",
    en: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng",
    fr: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/fra",
    pt: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/por",
    de: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/deu",
    it: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/ita"
  };

  // National data protection authorities (EU/EEA supervisory authorities per the
  // EDPB members list, plus the UK ICO and the Swiss FDPIC). Sorted by country.
  // The chosen authority's official name + site is embedded in the export footer.
  var DPA_AUTHORITIES = [
    { code: "AT", country: "Austria", name: "Österreichische Datenschutzbehörde (DSB)", url: "https://www.dsb.gv.at/" },
    { code: "BE", country: "Belgium", name: "Autorité de protection des données / Gegevensbeschermingsautoriteit (APD-GBA)", url: "https://www.autoriteprotectiondonnees.be/" },
    { code: "BG", country: "Bulgaria", name: "Commission for Personal Data Protection (CPDP)", url: "https://www.cpdp.bg/" },
    { code: "HR", country: "Croatia", name: "Agencija za zaštitu osobnih podataka (AZOP)", url: "https://azop.hr/" },
    { code: "CY", country: "Cyprus", name: "Office of the Commissioner for Personal Data Protection", url: "https://www.dataprotection.gov.cy/" },
    { code: "CZ", country: "Czech Republic", name: "Úřad pro ochranu osobních údajů (ÚOOÚ)", url: "https://uoou.gov.cz/" },
    { code: "DK", country: "Denmark", name: "Datatilsynet", url: "https://www.datatilsynet.dk/" },
    { code: "EE", country: "Estonia", name: "Andmekaitse Inspektsioon (AKI)", url: "https://www.aki.ee/" },
    { code: "FI", country: "Finland", name: "Tietosuojavaltuutetun toimisto", url: "https://tietosuoja.fi/" },
    { code: "FR", country: "France", name: "Commission Nationale de l'Informatique et des Libertés (CNIL)", url: "https://www.cnil.fr/" },
    { code: "DE", country: "Germany", name: "Die Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)", url: "https://www.bfdi.bund.de/" },
    { code: "GR", country: "Greece", name: "Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (HDPA)", url: "https://www.dpa.gr/" },
    { code: "HU", country: "Hungary", name: "Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)", url: "https://naih.hu/" },
    { code: "IS", country: "Iceland", name: "Persónuvernd", url: "https://www.personuvernd.is/" },
    { code: "IE", country: "Ireland", name: "Data Protection Commission (DPC)", url: "https://www.dataprotection.ie/" },
    { code: "IT", country: "Italy", name: "Garante per la protezione dei dati personali", url: "https://www.garanteprivacy.it/" },
    { code: "LV", country: "Latvia", name: "Datu valsts inspekcija (DVI)", url: "https://www.dvi.gov.lv/" },
    { code: "LI", country: "Liechtenstein", name: "Datenschutzstelle (DSS)", url: "https://www.datenschutzstelle.li/" },
    { code: "LT", country: "Lithuania", name: "Valstybinė duomenų apsaugos inspekcija (VDAI)", url: "https://vdai.lrv.lt/" },
    { code: "LU", country: "Luxembourg", name: "Commission nationale pour la protection des données (CNPD)", url: "https://cnpd.public.lu/" },
    { code: "MT", country: "Malta", name: "Information and Data Protection Commissioner (IDPC)", url: "https://idpc.org.mt/" },
    { code: "NL", country: "Netherlands", name: "Autoriteit Persoonsgegevens (AP)", url: "https://www.autoriteitpersoonsgegevens.nl/" },
    { code: "NO", country: "Norway", name: "Datatilsynet", url: "https://www.datatilsynet.no/" },
    { code: "PL", country: "Poland", name: "Urząd Ochrony Danych Osobowych (UODO)", url: "https://uodo.gov.pl/" },
    { code: "PT", country: "Portugal", name: "Comissão Nacional de Proteção de Dados (CNPD)", url: "https://www.cnpd.pt/" },
    { code: "RO", country: "Romania", name: "Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)", url: "https://www.dataprotection.ro/" },
    { code: "SK", country: "Slovakia", name: "Úrad na ochranu osobných údajov Slovenskej republiky", url: "https://dataprotection.gov.sk/" },
    { code: "SI", country: "Slovenia", name: "Informacijski pooblaščenec (IP-RS)", url: "https://www.ip-rs.si/" },
    { code: "ES", country: "Spain", name: "Agencia Española de Protección de Datos (AEPD)", url: "https://www.aepd.es/" },
    { code: "SE", country: "Sweden", name: "Integritetsskyddsmyndigheten (IMY)", url: "https://www.imy.se/" },
    { code: "CH", country: "Switzerland", name: "Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB)", url: "https://www.edoeb.admin.ch/" },
    { code: "GB", country: "United Kingdom", name: "Information Commissioner's Office (ICO)", url: "https://ico.org.uk/" }
  ];

  // Which authority is preselected for each interface language.
  var DEFAULT_NATIONAL_BY_LANG = { es: "ES", en: "IE", fr: "FR", pt: "PT", de: "DE", it: "IT" };

  function defaultNationalCountry(lang) {
    return DEFAULT_NATIONAL_BY_LANG[lang] || "ES";
  }

  function findAuthority(code) {
    for (var i = 0; i < DPA_AUTHORITIES.length; i++) {
      if (DPA_AUTHORITIES[i].code === code) return DPA_AUTHORITIES[i];
    }
    return null;
  }

  function defaultExportFooter() {
    return {
      euLink: true,
      nationalLink: true,
      nationalCountry: defaultNationalCountry(currentLang),
      contactEmailEnabled: false,
      contactEmail: "",
      phoneEnabled: false,
      phone: "",
      messageEnabled: true,
      message: t("legal.defaultMessage"),
      messageCustom: false
    };
  }

  function isDefaultLegalMessage(text) {
    var trimmed = (text || "").trim();
    return Object.keys(I18N).some(function (lang) {
      return I18N[lang]["legal.defaultMessage"] === trimmed;
    });
  }

  var state = {
    hasPdf: false,          // was any source a PDF (drives the default download format)
    fileName: "documento",
    pages: [],
    current: 0,
    wmPreviewPage: 0,
    resultPage: 0,
    grayscale: false,       // optional: desaturate the whole document
    format: "image",        // chosen download format: "image" | "pdf"
    wm: SL.defaultWatermark(),
    wmManualSelected: 0,    // index of the manual watermark being edited
    exportFooter: defaultExportFooter(),
    // Traceable copy: hides a per-export copyId in the pixels (see stego.js)
    // plus declarative file metadata. Off by default; never touches the
    // normal export path while disabled.
    traceable: { enabled: false, label: "", passphrase: "" }
  };

  // Session-only registry of issued traceable copies (copyId -> recipient).
  // Deliberately NOT persisted (the app promises no storage) and NOT part of
  // state/reset(): it survives "protect more documents" but dies on reload.
  var issuedCopies = [];

  var editor = null;
  var els = {};
  var wmDragging = false;

  function $(id) { return document.getElementById(id); }

  function setLanguage(lang) {
    var previousLang = currentLang;
    currentLang = I18N[lang] ? lang : "es";
    syncExportFooterLanguage(previousLang);
    applyTranslations();
  }

  function syncExportFooterLanguage(previousLang) {
    if (!state || !state.exportFooter) return;
    var footer = state.exportFooter;
    var previousDefault = I18N[previousLang] && I18N[previousLang]["legal.defaultMessage"];
    if (!footer.messageCustom || footer.message === previousDefault || isDefaultLegalMessage(footer.message)) {
      footer.message = t("legal.defaultMessage");
      footer.messageCustom = false;
    }
    // Follow the language's default authority only while the user hasn't
    // deliberately picked a different one.
    if (footer.nationalCountry === defaultNationalCountry(previousLang)) {
      footer.nationalCountry = defaultNationalCountry(currentLang);
    }
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.title = t("doc.title");
    var desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content", t("doc.description"));
    if ($("lang-select")) $("lang-select").value = currentLang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.dataset.i18n, el.textContent);
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.dataset.i18nHtml, el.innerHTML);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder, el.getAttribute("placeholder") || ""));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.dataset.i18nTitle, el.getAttribute("title") || ""));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.dataset.i18nAria, el.getAttribute("aria-label") || ""));
    });

    updatePatternLabels();
    updateRedactContinueSafe();
    updateWatermarkControlsSafe();
    syncExportFooterControlsSafe();
    if ($("screen-watermark") && $("screen-watermark").classList.contains("is-active")) schedulePreview();
    if ($("screen-result") && $("screen-result").classList.contains("is-active")) renderResult();
  }

  function updateRedactContinueSafe() {
    if ($("redact-continue")) updateRedactContinue();
  }

  function updateWatermarkControlsSafe() {
    if ($("wm-continue")) updateWmContinue();
    if ($("format-note")) syncFormatButtons();
    if ($("wm-manual-list")) syncManualControls();
  }

  function syncExportFooterControlsSafe() {
    if ($("legal-eu")) syncExportFooterControls();
  }

  function busy(on, text) {
    $("busy").hidden = !on;
    if (text) $("busy-text").textContent = text;
  }

  /* ------------------------------------------------------------------ *
   * Screen navigation
   * ------------------------------------------------------------------ */
  var SCREENS = ["home", "upload", "redact", "watermark", "result", "verify"];
  function show(name) {
    SCREENS.forEach(function (s) {
      $("screen-" + s).classList.toggle("is-active", s === name);
    });
    global.scrollTo({ top: 0, behavior: "instant" in global ? "instant" : "auto" });
    if (name === "redact") enterRedact();
    if (name === "watermark") enterWatermark();
    if (name === "result") enterResult();
    if (name === "verify") enterVerify();
  }

  function reset() {
    state.pages = [];
    state.hasPdf = false;
    state.current = 0;
    state.wmPreviewPage = 0;
    state.resultPage = 0;
    state.grayscale = false;
    state.format = "image";
    state.wm = SL.defaultWatermark();
    state.wmManualSelected = 0;
    state.exportFooter = defaultExportFooter();
    state.traceable = { enabled: false, label: "", passphrase: "" };
    syncTraceControls();
    if (els.fileInput) els.fileInput.value = "";
    if (editor) editor.setGrayscale(false);
    var g = $("gray-toggle"); if (g) g.checked = false;
    syncWatermarkControls();
    syncExportFooterControls();
    show("upload");
  }

  /* ------------------------------------------------------------------ *
   * File loading
   * ------------------------------------------------------------------ */
  function loadImageBitmap(file) {
    if (global.createImageBitmap) {
      return global.createImageBitmap(file, { imageOrientation: "from-image" })
        .catch(function () { return loadViaImg(file); });
    }
    return loadViaImg(file);
  }
  function loadViaImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error(t("alert.imageRead"))); };
      img.src = url;
    });
  }

  function bitmapToPage(bmp) {
    var w = bmp.width, h = bmp.height;
    var scale = Math.min(1, MAX_IMG_DIM / Math.max(w, h));
    var c = document.createElement("canvas");
    c.width = Math.round(w * scale);
    c.height = Math.round(h * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    return { base: c, rects: [], undo: [], straighten: 0 };
  }

  function readFileAsArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(fr.error); };
      fr.readAsArrayBuffer(file);
    });
  }

  function loadPdf(buffer) {
    var task = global.pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    return task.promise.then(function (pdf) {
      var pages = [];
      var chain = Promise.resolve();
      for (var i = 1; i <= pdf.numPages; i++) {
        (function (n) {
          chain = chain.then(function () {
            return pdf.getPage(n).then(function (page) {
              var vp1 = page.getViewport({ scale: 1 });
              var scale = Math.min(3, PDF_TARGET_W / vp1.width);
              var vp = page.getViewport({ scale: scale });
              var c = document.createElement("canvas");
              c.width = Math.round(vp.width);
              c.height = Math.round(vp.height);
              return page.render({ canvasContext: c.getContext("2d"), viewport: vp })
                .promise.then(function () {
                  pages.push({ base: c, rects: [], undo: [], straighten: 0 });
                });
            });
          });
        })(i);
      }
      return chain.then(function () { return pages; });
    });
  }

  function classify(file) {
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return "pdf";
    if (/^image\//.test(file.type) || /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(file.name)) return "img";
    return null;
  }

  // Turn one file into an array of page objects.
  function processFile(file) {
    if (classify(file) === "pdf") {
      return readFileAsArrayBuffer(file).then(loadPdf);
    }
    return loadImageBitmap(file).then(function (bmp) { return [bitmapToPage(bmp)]; });
  }

  // Accept several files at once (e.g. anverso + reverso). Pages are
  // concatenated in the order the files were given.
  function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;

    var accepted = [], hasPdf = false;
    files.forEach(function (f) {
      var kind = classify(f);
      if (kind) { accepted.push(f); if (kind === "pdf") hasPdf = true; }
    });
    if (!accepted.length) {
      alert(t("alert.unsupported"));
      return;
    }

    state.hasPdf = hasPdf;
    state.format = hasPdf ? "pdf" : "image";
    state.fileName = accepted.length === 1
      ? (accepted[0].name.replace(/\.[^.]+$/, "") || "documento")
      : "documentos";

    busy(true, accepted.length > 1 ? t("busy.preparingMany") : t("busy.preparingOne"));

    // Process sequentially so page order is deterministic.
    var pages = [];
    var chain = Promise.resolve();
    accepted.forEach(function (f) {
      chain = chain.then(function () {
        return processFile(f).then(function (p) { pages = pages.concat(p); });
      });
    });

    chain.then(function () {
      if (!pages.length) throw new Error("Documento vacío");
      state.pages = pages;
      state.current = 0;
      busy(false);
      show("redact");
    }).catch(function (err) {
      busy(false);
      console.error(err);
      alert(t("alert.openFailed") + (err && err.message ? err.message : err));
    });
  }

  /* ------------------------------------------------------------------ *
   * Redact screen
   * ------------------------------------------------------------------ */
  function enterRedact() {
    if (!editor) {
      editor = new SL.Editor($("editor-canvas-host"));
      editor.onChange = updateRedactState;
      editor.onSelectionChange = updateRedactionSelection;
      editor.onCropChange = updateCropControls;
      editor.onPageChange = updateRedactState;
      editor.onStraightenApplied = function () { setStraightenValue(0); };
      editor.setTool("brush");
    }
    editor.setGrayscale(state.grayscale);
    editor.setPage(state.pages[state.current]);
    updatePageNav();
    setStraightenValue(currentPageStraighten());
    syncEditorToolButtons();
    updateRedactState();
  }

  function updatePageNav() {
    var multi = state.pages.length > 1;
    $("page-nav").hidden = !multi;
    if (multi) {
      $("page-label").textContent = (state.current + 1) + " / " + state.pages.length;
    }
  }

  function updateRedactContinue() {
    var any = state.pages.some(function (p) { return p.rects.length > 0; });
    $("redact-continue").textContent = any ? t("redact.continue") : t("redact.continueNoRedaction");
  }

  function updateRedactState() {
    updateRedactContinue();
    updateRedactionSelection(editor ? editor.getSelectedRect() : null);
    updateCropControls(editor ? editor.getCropRect() : null);
  }

  function updateRedactionSelection(rect) {
    var has = !!rect;
    if ($("tool-delete-redaction")) $("tool-delete-redaction").disabled = !has;
    if ($("tool-copy-redaction")) $("tool-copy-redaction").disabled = !has || state.pages.length < 2;
  }

  function updateCropControls(crop) {
    if ($("page-crop-apply")) $("page-crop-apply").disabled = !crop;
  }

  function syncEditorToolButtons() {
    if (!editor) return;
    var tool = editor.tool;
    if ($("tool-brush")) $("tool-brush").classList.toggle("is-active", tool === "brush");
    if ($("tool-blur")) $("tool-blur").classList.toggle("is-active", tool === "blur");
    if ($("tool-select")) $("tool-select").classList.toggle("is-active", tool === "select");
    $("tool-pan").classList.toggle("is-active", tool === "pan");
    $("page-crop-mode").classList.toggle("is-active", tool === "crop");
    // Swap the contextual options row to match the active drawing tool.
    if ($("brush-options")) $("brush-options").hidden = tool !== "brush";
    if ($("blur-options")) $("blur-options").hidden = tool !== "blur";
    if ($("select-options")) $("select-options").hidden = tool !== "select";
  }

  function setEditorTool(tool) {
    if (!editor) return;
    editor.setTool(tool);
    syncEditorToolButtons();
  }

  function setStraightenValue(value) {
    var rounded = Math.round(parseFloat(value || 0) * 10) / 10;
    if ($("page-straighten")) $("page-straighten").value = rounded;
    if ($("page-straighten-val")) $("page-straighten-val").textContent = rounded + "°";
    if (editor) editor.setStraightenPreview(rounded);
  }

  function currentPageStraighten() {
    var page = state.pages[state.current];
    return page && typeof page.straighten === "number" ? page.straighten : 0;
  }

  function copySelectedRedactionToPages() {
    if (!editor) return;
    var rect = editor.getSelectedRect();
    if (!rect || state.pages.length < 2) return;
    var source = state.pages[state.current];
    state.pages.forEach(function (page, i) {
      if (i === state.current) return;
      var clone = SL.cloneRedactionForPage(rect, source, page);
      page.rects.push(clone);
      if (!page.undo) page.undo = [];
      page.undo.push({ type: "add", index: page.rects.length - 1 });
    });
    updateRedactContinue();
  }

  function gotoPage(delta) {
    var n = state.current + delta;
    if (n < 0 || n >= state.pages.length) return;
    state.current = n;
    editor.setPage(state.pages[n]);
    updatePageNav();
    setStraightenValue(currentPageStraighten());
    syncEditorToolButtons();
  }

  /* ------------------------------------------------------------------ *
   * Watermark screen
   * ------------------------------------------------------------------ */
  function ensureManualWatermark(wm) {
    var m = wm.manual;
    if (!m || typeof m !== "object") m = {};
    if (!Array.isArray(m.items)) {
      // Migrate the legacy single-stamp shape { x, y, angle } into a list.
      var items = [];
      if (typeof m.x === "number") {
        items.push({ text: "", x: m.x, y: m.y, angle: m.angle || 0 });
      }
      m = { items: items, randomizePerPage: !!m.randomizePerPage };
    }
    if (!m.items.length) m.items.push({ text: "", x: 0.5, y: 0.82, angle: 0 });
    m.items.forEach(function (it) {
      if (typeof it.text !== "string") it.text = "";
      if (typeof it.x !== "number") it.x = 0.5;
      if (typeof it.y !== "number") it.y = 0.82;
      if (typeof it.angle !== "number") it.angle = 0;
    });
    if (typeof m.randomizePerPage !== "boolean") m.randomizePerPage = false;
    wm.manual = m;
    if (state.wmManualSelected >= m.items.length) state.wmManualSelected = m.items.length - 1;
    if (state.wmManualSelected < 0) state.wmManualSelected = 0;
    return m;
  }

  function selectedManualItem() {
    var m = ensureManualWatermark(state.wm);
    return m.items[state.wmManualSelected];
  }

  function patternLabel(pattern) {
    return t("pattern." + pattern.id, pattern.label);
  }

  function updatePatternLabels() {
    var host = $("wm-patterns");
    if (!host) return;
    host.querySelectorAll(".pattern").forEach(function (btn) {
      var span = btn.querySelector("span");
      if (span) span.textContent = t("pattern." + btn.dataset.pattern, span.textContent);
    });
  }

  function buildManualList() {
    var host = $("wm-manual-list");
    if (!host) return;
    var manual = ensureManualWatermark(state.wm);
    host.innerHTML = "";
    manual.items.forEach(function (item, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wm-manual-chip" + (i === state.wmManualSelected ? " is-active" : "");
      btn.textContent = t("wm.manualItem", "Marca") + " " + (i + 1);
      btn.addEventListener("click", function () {
        state.wmManualSelected = i;
        syncManualControls();
        schedulePreview();
      });
      host.appendChild(btn);
    });
    var add = document.createElement("button");
    add.type = "button";
    add.className = "wm-manual-chip wm-manual-chip--add";
    add.setAttribute("aria-label", t("wm.manualAdd", "Añadir marca"));
    add.title = t("wm.manualAdd", "Añadir marca");
    add.textContent = "+";
    add.addEventListener("click", addManualWatermark);
    host.appendChild(add);
  }

  function addManualWatermark() {
    var manual = ensureManualWatermark(state.wm);
    // Offset each new stamp slightly so they don't stack invisibly.
    var n = manual.items.length;
    manual.items.push({
      text: "",
      x: Math.min(0.9, 0.4 + n * 0.08),
      y: Math.min(0.9, 0.5 + n * 0.08),
      angle: 0
    });
    state.wmManualSelected = manual.items.length - 1;
    syncManualControls();
    schedulePreview();
  }

  function removeManualWatermark() {
    var manual = ensureManualWatermark(state.wm);
    if (manual.items.length <= 1) return;
    manual.items.splice(state.wmManualSelected, 1);
    if (state.wmManualSelected >= manual.items.length) state.wmManualSelected = manual.items.length - 1;
    syncManualControls();
    schedulePreview();
  }

  function syncManualControls() {
    var manual = ensureManualWatermark(state.wm);
    var item = manual.items[state.wmManualSelected];
    buildManualList();
    if ($("wm-manual-text")) $("wm-manual-text").value = item.text || "";
    if ($("wm-angle")) $("wm-angle").value = Math.round(item.angle);
    if ($("wm-angle-val")) $("wm-angle-val").textContent = Math.round(item.angle) + "°";
    if ($("wm-manual-remove")) $("wm-manual-remove").disabled = manual.items.length <= 1;
    if ($("wm-manual-random")) $("wm-manual-random").checked = manual.randomizePerPage;
    if ($("wm-manual-random-row")) $("wm-manual-random-row").hidden = state.pages.length < 2;
    updateManualControls();
  }

  function updateManualControls() {
    var active = state.wm.enabled && state.wm.pattern === "manual";
    var controls = $("wm-manual-controls");
    var host = $("wm-preview-host");
    if (controls) controls.hidden = !active;
    if (host) host.classList.toggle("is-manual", active);
  }

  function buildPatternPicker() {
    var host = $("wm-patterns");
    host.innerHTML = "";
    SL.PATTERNS.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pattern" + (p.id === state.wm.pattern ? " is-active" : "");
      btn.dataset.pattern = p.id;
      var cv = document.createElement("canvas");
      cv.width = 168; cv.height = 104;
      var span = document.createElement("span");
      span.textContent = patternLabel(p);
      btn.appendChild(cv); btn.appendChild(span);
      host.appendChild(btn);
      SL.renderThumb(cv, p.id, state.wm.color);
      btn.addEventListener("click", function () {
        state.wm.pattern = p.id;
        host.querySelectorAll(".pattern").forEach(function (b) {
          b.classList.toggle("is-active", b.dataset.pattern === p.id);
        });
        syncManualControls();
        schedulePreview();
      });
    });
  }
  function refreshThumbs() {
    $("wm-patterns").querySelectorAll("canvas").forEach(function (cv, i) {
      SL.renderThumb(cv, SL.PATTERNS[i].id, state.wm.color);
    });
  }

  function buildSwatches() {
    var host = $("wm-swatches");
    host.innerHTML = "";
    SL.SWATCHES.forEach(function (hex) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (hex.toLowerCase() === state.wm.color.toLowerCase() ? " is-active" : "");
      b.style.background = hex;
      b.dataset.color = hex;
      b.addEventListener("click", function () { setColor(hex); });
      host.appendChild(b);
    });
  }
  function setColor(hex) {
    state.wm.color = hex;
    $("wm-color").value = hex;
    $("wm-swatches").querySelectorAll(".swatch").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.color.toLowerCase() === hex.toLowerCase());
    });
    refreshThumbs();
    schedulePreview();
  }

  function syncWatermarkControls() {
    var wm = state.wm;
    $("wm-text").value = wm.text;
    $("wm-count").textContent = 100 - wm.text.length;
    $("wm-enabled").checked = wm.enabled;
    $("wm-opacity").value = Math.round(wm.opacity * 100);
    $("wm-opacity-val").textContent = Math.round(wm.opacity * 100) + "%";
    $("wm-size").value = wm.size;
    $("wm-size-val").textContent = wm.size + " px";
    $("wm-color").value = wm.color;
    $("wm-footer").checked = wm.footer;
    $("wm-options").classList.toggle("is-off", !wm.enabled);
    $("wm-patterns").querySelectorAll(".pattern").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.pattern === wm.pattern);
    });
    syncManualControls();
    updateWmContinue();
  }

  function buildNationalSelect() {
    var sel = $("legal-national-country");
    if (!sel || sel.options.length) return;
    DPA_AUTHORITIES.forEach(function (a) {
      var opt = document.createElement("option");
      opt.value = a.code;
      opt.textContent = a.country + " — " + a.name;
      sel.appendChild(opt);
    });
  }

  function syncExportFooterControls() {
    var footer = state.exportFooter;
    buildNationalSelect();
    $("legal-eu").checked = footer.euLink;
    $("legal-national").checked = footer.nationalLink;
    if ($("legal-national-country")) $("legal-national-country").value = footer.nationalCountry;
    $("legal-contact-enabled").checked = footer.contactEmailEnabled;
    $("legal-contact-email").value = footer.contactEmail;
    $("legal-phone-enabled").checked = footer.phoneEnabled;
    $("legal-phone").value = footer.phone;
    $("legal-message-enabled").checked = footer.messageEnabled;
    $("legal-message").value = footer.message;
    updateExportFooterInputState();
    updateWmContinue();
  }

  function updateExportFooterInputState() {
    if ($("legal-national-country")) $("legal-national-country").disabled = !state.exportFooter.nationalLink;
    $("legal-contact-email").disabled = !state.exportFooter.contactEmailEnabled;
    $("legal-phone").disabled = !state.exportFooter.phoneEnabled;
    $("legal-message").disabled = !state.exportFooter.messageEnabled;
  }

  function hasExportFooterSelection() {
    var footer = state.exportFooter;
    return !!(
      footer.euLink ||
      footer.nationalLink ||
      (footer.contactEmailEnabled && footer.contactEmail.trim()) ||
      (footer.phoneEnabled && footer.phone.trim()) ||
      (footer.messageEnabled && footer.message.trim())
    );
  }

  function exportFooterChanged() {
    updateExportFooterInputState();
    updateWmContinue();
    schedulePreview();
    if ($("screen-result") && $("screen-result").classList.contains("is-active")) renderResult();
  }

  function updateWmContinue() {
    $("wm-continue").textContent = (state.wm.enabled || hasExportFooterSelection())
      ? t("wm.generate")
      : t("wm.continueNoWatermark");
  }

  function enterWatermark() {
    buildPatternPicker();
    buildSwatches();
    state.wmPreviewPage = Math.min(state.current, state.pages.length - 1);
    syncWatermarkControls();
    updateWmPreviewNav();
    schedulePreview();
  }

  function updateWmPreviewNav() {
    var multi = state.pages.length > 1;
    $("wm-preview-nav").hidden = !multi;
    if (!multi) return;
    $("wm-preview-page-label").textContent = (state.wmPreviewPage + 1) + " / " + state.pages.length;
    document.querySelectorAll("[data-wmpage]").forEach(function (b) {
      b.disabled = b.dataset.wmpage === "prev"
        ? state.wmPreviewPage <= 0
        : state.wmPreviewPage >= state.pages.length - 1;
    });
  }

  function gotoWmPreviewPage(delta) {
    var n = state.wmPreviewPage + delta;
    if (n < 0 || n >= state.pages.length) return;
    state.wmPreviewPage = n;
    updateWmPreviewNav();
    schedulePreview();
  }

  function canDragManualWatermark() {
    return state.wm.enabled && state.wm.pattern === "manual" &&
      $("screen-watermark").classList.contains("is-active");
  }

  function setManualPositionFromEvent(e) {
    var host = $("wm-preview-host");
    var cv = host ? host.querySelector("canvas") : null;
    if (!cv) return;
    var rect = cv.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var manual = ensureManualWatermark(state.wm);
    var item = manual.items[state.wmManualSelected];
    var nx = (e.clientX - rect.left) / rect.width;
    var ny = (e.clientY - rect.top) / rect.height;
    // When positions are scattered per page, subtract the current page's offset
    // so the stamp lands under the cursor on the page being edited.
    if (manual.randomizePerPage) {
      var off = SL.manualPageOffset(state.wmPreviewPage, state.wmManualSelected);
      nx -= off.x;
      ny -= off.y;
    }
    item.x = Math.min(0.97, Math.max(0.03, nx));
    item.y = Math.min(0.97, Math.max(0.03, ny));
    schedulePreview();
  }

  var previewRAF = null;
  function schedulePreview() {
    if (previewRAF) return;
    previewRAF = requestAnimationFrame(function () {
      previewRAF = null;
      renderWmPreview();
    });
  }
  function renderWmPreview() {
    var host = $("wm-preview-host");
    var page = state.pages[state.wmPreviewPage] || state.pages[state.current] || state.pages[0];
    if (!page) return;
    // Compose at a capped resolution so the dense pattern stays snappy while
    // dragging sliders; the exported file always uses full resolution.
    var composite = composeAt(page, state.wm, previewWidthFor(host), state.wmPreviewPage);
    drawScaledInto(host, composite);
  }

  function previewWidthFor(host) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    return Math.min(900, (host.clientWidth || 460) * dpr);
  }

  /* ------------------------------------------------------------------ *
   * Compose + result
   * ------------------------------------------------------------------ */
  // Full-resolution composite (used for export).
  function compose(page, wm, pageIndex) {
    var deg = page.straighten || 0;
    var targetW = deg ? SL.rotatedSize(page.base.width, page.base.height, deg).w : page.base.width;
    return composeAt(page, wm, targetW, pageIndex || 0);
  }

  function buildExportFooterContent() {
    var footer = state.exportFooter;
    var rows = [];
    var message = footer.message.trim();
    var contactEmail = footer.contactEmail.trim();
    var phone = footer.phone.trim();
    if (footer.messageEnabled && message) {
      rows.push({ kind: "message", text: message });
    }
    if (footer.euLink) {
      rows.push({
        kind: "link",
        text: t("legal.eu") + ": " + (EU_REGULATION_URLS[currentLang] || EU_REGULATION_URLS.es)
      });
    }
    if (footer.nationalLink) {
      var authority = findAuthority(footer.nationalCountry) || findAuthority("ES");
      if (authority) {
        rows.push({ kind: "link", text: authority.name + ": " + authority.url });
      }
    }
    if (footer.contactEmailEnabled && contactEmail) {
      rows.push({ kind: "contact", text: t("legal.outputContactEmail") + ": " + contactEmail });
    }
    if (footer.phoneEnabled && phone) {
      rows.push({ kind: "contact", text: t("legal.outputPhone") + ": " + phone });
    }
    return rows.length ? rows : null;
  }

  function wrapText(ctx, text, maxWidth) {
    var words = String(text || "").split(/\s+/).filter(Boolean);
    var lines = [];
    var line = "";
    words.forEach(function (word) {
      var test = line ? line + " " + word : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function layoutExportFooter(ctx, w, rows, scale) {
    var padX = Math.max(18, 24 * scale);
    var padY = Math.max(14, 18 * scale);
    var gap = Math.max(6, 8 * scale);
    var fontPx = Math.max(12, 13 * scale);
    var maxWidth = Math.max(1, w - padX * 2);
    var items = [];
    var total = padY * 2;
    rows.forEach(function (row, i) {
      var weight = row.kind === "message" ? "700" : "600";
      var font = weight + " " + fontPx + "px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
      ctx.font = font;
      var lines = wrapText(ctx, row.text, maxWidth);
      var lineH = fontPx * 1.38;
      items.push({
        lines: lines,
        font: font,
        lineH: lineH,
        color: row.kind === "link" ? "#145ca8" : "#1c1a17"
      });
      total += lines.length * lineH;
      if (i < rows.length - 1) total += gap;
    });
    return {
      height: Math.ceil(total),
      padX: padX,
      padY: padY,
      gap: gap,
      items: items
    };
  }

  function measureExportFooterHeight(w, rows, scale) {
    var scratch = document.createElement("canvas").getContext("2d");
    return layoutExportFooter(scratch, w, rows, scale).height;
  }

  function drawExportFooter(ctx, y, w, rows, scale) {
    var layout = layoutExportFooter(ctx, w, rows, scale);
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, y, w, layout.height);
    ctx.fillStyle = "#e2d8cd";
    ctx.fillRect(0, y, w, Math.max(1, Math.round(scale)));
    var cursor = y + layout.padY;
    layout.items.forEach(function (item, i) {
      ctx.font = item.font;
      ctx.fillStyle = item.color;
      ctx.textBaseline = "top";
      item.lines.forEach(function (line) {
        ctx.fillText(line, layout.padX, cursor);
        cursor += item.lineH;
      });
      if (i < layout.items.length - 1) cursor += layout.gap;
    });
    ctx.restore();
  }

  // Composite the page at a target width: base (optionally grayscale) +
  // redaction bars + watermark + optional legal export footer. Watermark size
  // stays visually identical at any resolution because it scales with the
  // canvas width.
  function composeAt(page, wm, targetW, pageIndex) {
    var deg = page.straighten || 0;
    var disp = deg
      ? SL.rotatedSize(page.base.width, page.base.height, deg)
      : { w: page.base.width, h: page.base.height, rad: 0 };
    var scale = Math.min(1, targetW / disp.w);
    var w = Math.max(1, Math.round(disp.w * scale));
    var docH = Math.max(1, Math.round(disp.h * scale));
    var exportFooterRows = buildExportFooterContent();
    var exportFooterScale = w / WM_REF_W;
    var exportFooterH = exportFooterRows ? measureExportFooterHeight(w, exportFooterRows, exportFooterScale) : 0;
    var c = document.createElement("canvas");
    c.width = w;
    c.height = docH + exportFooterH;
    var ctx = c.getContext("2d");
    ctx.save();
    ctx.scale(scale, scale);
    if (deg) {
      // Apply the non-destructive straighten as a render-time rotation so the
      // original base is preserved and re-editable.
      ctx.translate(disp.w / 2, disp.h / 2);
      ctx.rotate(disp.rad);
      ctx.translate(-page.base.width / 2, -page.base.height / 2);
    }
    SL.paintPage(ctx, page, state.grayscale);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, c.width, docH);
    ctx.clip();
    SL.renderWatermark(ctx, c.width, docH, wm, c.width / WM_REF_W, pageIndex || 0);
    ctx.restore();
    if (exportFooterRows) drawExportFooter(ctx, docH, c.width, exportFooterRows, exportFooterScale);
    return c;
  }

  function drawScaledInto(host, srcCanvas) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var cs = global.getComputedStyle ? global.getComputedStyle(host) : null;
    var padX = cs ? parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) : 0;
    var padY = cs ? parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : 0;
    var maxW = Math.max(1, (host.clientWidth || 460) - padX);
    var maxH = Math.max(1, Math.min(global.innerHeight * 0.58, 560) - padY);
    var scale = Math.min(maxW / srcCanvas.width, maxH / srcCanvas.height, 1);
    var cssW = srcCanvas.width * scale, cssH = srcCanvas.height * scale;
    var cv = host.querySelector("canvas");
    if (!cv) { cv = document.createElement("canvas"); host.appendChild(cv); }
    cv.style.width = cssW + "px";
    cv.style.height = cssH + "px";
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(cssH * dpr);
    var ctx = cv.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(srcCanvas, 0, 0, cv.width, cv.height);
  }

  function enterResult() {
    state.resultPage = Math.min(state.current, state.pages.length - 1);
    var multi = state.pages.length > 1;
    $("result-nav").hidden = !multi;
    syncFormatButtons();
    renderResult();
    $("btn-share").style.display = navigator.share ? "" : "none";
  }

  function syncFormatButtons() {
    document.querySelectorAll("[data-fmt]").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.fmt === state.format);
    });
    var multiImg = state.format === "image" && state.pages.length > 1;
    $("format-note").textContent = multiImg
      ? t("format.multiImage")
      : (state.format === "pdf" ? t("format.pdf") : t("format.image"));
  }
  function renderResult() {
    if (state.pages.length > 1) {
      $("result-page-label").textContent = (state.resultPage + 1) + " / " + state.pages.length;
    }
    var host = $("result-host");
    var composite = composeAt(state.pages[state.resultPage], state.wm, previewWidthFor(host), state.resultPage);
    drawScaledInto(host, composite);
  }
  function gotoResultPage(delta) {
    var n = state.resultPage + delta;
    if (n < 0 || n >= state.pages.length) return;
    state.resultPage = n;
    renderResult();
  }

  /* ------------------------------------------------------------------ *
   * Export
   * ------------------------------------------------------------------ */
  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) { resolve(b); }, type, quality);
    });
  }

  /* Traceable-copy helpers. prepareTrace() resolves to null when the option
   * is off, so the plain export path below stays byte-for-byte unchanged. */
  function prepareTrace() {
    if (!state.traceable.enabled || !SL.stego.available) return Promise.resolve(null);
    var copyId = SL.stego.randomCopyId();
    var hex = SL.stego.toHex(copyId);
    return SL.stego.buildPayload(copyId, state.traceable.passphrase).then(function (payload) {
      return {
        payload: payload,
        copyIdHex: hex,
        keyed: state.traceable.passphrase ? "passphrase" : "open",
        meta: {
          copyId: hex,
          purpose: state.traceable.label,
          created: new Date().toISOString(),
          version: "idps1"
        }
      };
    });
  }

  function stampCanvas(c, trace) {
    if (trace) SL.stego.embedIntoCanvas(c, trace.payload);
    return c;
  }

  function pngWithMeta(bytes, trace) {
    return SL.stego.pngInsertTextChunk(bytes, "idprotector", JSON.stringify(trace.meta));
  }

  // Build the download in the format the user picked (state.format).
  function buildOutput() {
    return prepareTrace().then(function (trace) {
      var build = state.format === "pdf" ? buildPdf(trace) : buildImage(trace);
      return build.then(function (out) {
        if (trace) registerIssuedCopy(trace, out);
        return out;
      });
    });
  }

  function buildImage(trace) {
    var suffix = t("file.protectedSuffix");
    if (state.pages.length === 1) {
      var c = stampCanvas(compose(state.pages[0], state.wm, 0), trace);
      return canvasToBlob(c, "image/png").then(function (blob) {
        if (!trace) return blob;
        return blob.arrayBuffer().then(function (buf) {
          return new Blob([pngWithMeta(new Uint8Array(buf), trace)], { type: "image/png" });
        });
      }).then(function (blob) {
        return { blob: blob, name: state.fileName + "-" + suffix + ".png", type: "image/png" };
      });
    }
    // Several pages -> a .zip with one PNG per page (same copyId on all).
    var files = [];
    var chain = Promise.resolve();
    state.pages.forEach(function (page, i) {
      chain = chain.then(function () {
        var c = stampCanvas(compose(page, state.wm, i), trace);
        return canvasToBlob(c, "image/png").then(function (blob) {
          return blob.arrayBuffer();
        }).then(function (buf) {
          var data = new Uint8Array(buf);
          if (trace) data = pngWithMeta(data, trace);
          files.push({ name: t("file.pagePrefix") + "-" + (i + 1) + ".png", data: data });
        });
      });
    });
    return chain.then(function () {
      return {
        blob: makeZip(files),
        name: state.fileName + "-" + suffix + ".zip",
        type: "application/zip"
      };
    });
  }

  function buildPdf(trace) {
    // Flatten every page into an image and rebuild the PDF (redaction destroyed).
    // Traceable copies embed lossless PNG (bigger file) so the pixel mark
    // survives; otherwise JPEG keeps the size sensible.
    var PDFLib = global.PDFLib;
    return PDFLib.PDFDocument.create().then(function (doc) {
      var chain = Promise.resolve();
      state.pages.forEach(function (page, i) {
        chain = chain.then(function () {
          var c = stampCanvas(compose(page, state.wm, i), trace);
          var toBlob = trace ? canvasToBlob(c, "image/png") : canvasToBlob(c, "image/jpeg", 0.92);
          return toBlob.then(function (blob) {
            return blob.arrayBuffer();
          }).then(function (buf) {
            var embed = trace ? doc.embedPng(buf) : doc.embedJpg(buf);
            return embed.then(function (img) {
              var p = doc.addPage([c.width, c.height]);
              p.drawImage(img, { x: 0, y: 0, width: c.width, height: c.height });
            });
          });
        });
      });
      return chain.then(function () {
        if (trace) {
          doc.setTitle(state.fileName);
          doc.setSubject(trace.meta.purpose || "");
          doc.setKeywords(["idprotector", "copyId:" + trace.copyIdHex, "idps1"]);
          doc.setProducer("IDprotector " + SL.VERSION);
          doc.setCreator("IDprotector");
          doc.setCreationDate(new Date());
          doc.setModificationDate(new Date());
        }
        return doc.save();
      }).then(function (bytes) {
        return {
          blob: new Blob([bytes], { type: "application/pdf" }),
          name: state.fileName + "-" + t("file.protectedSuffix") + ".pdf",
          type: "application/pdf"
        };
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Issued-copies registry (session memory only) + trace panel UI
   * ------------------------------------------------------------------ */
  function registerIssuedCopy(trace, out) {
    issuedCopies.push({
      copyId: trace.copyIdHex,
      label: trace.meta.purpose,
      keyed: trace.keyed,
      format: state.format,
      fileName: out.name,
      created: trace.meta.created
    });
    renderTraceInfo();
  }

  function renderTraceInfo() {
    var box = $("trace-issued");
    if (!box) return;
    var last = issuedCopies[issuedCopies.length - 1];
    box.hidden = !last;
    if (!last) return;
    $("trace-copyid").textContent = last.copyId;
    $("trace-copyid-label").textContent = last.label ? last.label : "";
    $("trace-count").textContent = t("trace.issuedCount").replace("{n}", String(issuedCopies.length));
  }

  function csvCell(v) {
    var s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function downloadRegistryCsv() {
    var rows = [["copyId", "label", "keyed", "format", "fileName", "created"]];
    issuedCopies.forEach(function (c) {
      rows.push([c.copyId, c.label, c.keyed, c.format, c.fileName, c.created]);
    });
    var csv = rows.map(function (r) { return r.map(csvCell).join(","); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "idprotector-registro.csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function syncTraceControls() {
    var toggle = $("trace-enabled");
    if (!toggle) return;
    toggle.checked = state.traceable.enabled;
    if (!SL.stego.available) {
      toggle.disabled = true;
      $("trace-unavailable").hidden = false;
    }
    $("trace-fields").hidden = !state.traceable.enabled;
    $("trace-label").value = state.traceable.label;
    $("trace-pass").value = state.traceable.passphrase;
    renderTraceInfo();
  }

  /* ------------------------------------------------------------------ *
   * Verify mode — reads the declared metadata and the invisible pixel
   * mark from a dropped file, fully offline.
   * ------------------------------------------------------------------ */
  var verifyCache = { imageDatas: [], meta: null, fallback: false };

  function enterVerify() {
    if ($("verify-input")) $("verify-input").value = "";
    verifyCache = { imageDatas: [], meta: null, fallback: false };
    $("verify-results").hidden = true;
  }

  function parsePngMeta(bytes) {
    var chunks = SL.stego.pngReadTextChunks(bytes);
    for (var i = 0; i < chunks.length; i++) {
      if (chunks[i].keyword === "idprotector") {
        try { return JSON.parse(chunks[i].text); } catch (e) { /* malformed */ }
      }
    }
    return null;
  }

  function pdfInfoMeta(info) {
    var kw = String((info && info.Keywords) || "");
    if (kw.indexOf("idprotector") === -1) return null;
    var m = kw.match(/copyId:([0-9a-f]+)/);
    return {
      copyId: m ? m[1] : null,
      purpose: (info && info.Subject) || "",
      created: (info && info.CreationDate) || ""
    };
  }

  /* Exact pixels of the image embedded in a PDF page. Preferred path reads
   * the decoded image object from pdf.js (Flate is lossless, so the samples
   * are exact); fallback renders at 1:1, which is an exact blit for our own
   * exports (page units == image pixels) but not guaranteed by spec. */
  function pdfPageImageData(page) {
    function fromBitmap(bmp, w, h) {
      var c = document.createElement("canvas");
      c.width = w; c.height = h;
      var ctx = c.getContext("2d");
      ctx.drawImage(bmp, 0, 0);
      return ctx.getImageData(0, 0, w, h);
    }
    return page.getOperatorList().then(function (ops) {
      var objId = null;
      for (var i = 0; i < ops.fnArray.length; i++) {
        if (ops.fnArray[i] === global.pdfjsLib.OPS.paintImageXObject) {
          objId = ops.argsArray[i][0];
          break;
        }
      }
      if (!objId) throw new Error("no image xobject");
      return new Promise(function (resolve, reject) {
        try {
          page.objs.get(objId, function (img) {
            if (img) resolve(img); else reject(new Error("empty image object"));
          });
        } catch (e) { reject(e); }
      });
    }).then(function (img) {
      if (img.bitmap) return fromBitmap(img.bitmap, img.width, img.height);
      if (typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap) {
        return fromBitmap(img, img.width, img.height);
      }
      if (img.data) {
        var out = new ImageData(img.width, img.height);
        var src = img.data, dst = out.data, n = img.width * img.height;
        if (src.length === n * 4) {
          dst.set(src);
        } else if (src.length === n * 3) {
          for (var p = 0; p < n; p++) {
            dst[p * 4] = src[p * 3];
            dst[p * 4 + 1] = src[p * 3 + 1];
            dst[p * 4 + 2] = src[p * 3 + 2];
            dst[p * 4 + 3] = 255;
          }
        } else {
          throw new Error("unsupported image kind");
        }
        return out;
      }
      throw new Error("unsupported image object");
    }).catch(function () {
      verifyCache.fallback = true;
      var vp = page.getViewport({ scale: 1 });
      var c = document.createElement("canvas");
      c.width = Math.round(vp.width);
      c.height = Math.round(vp.height);
      var ctx = c.getContext("2d");
      return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
        return ctx.getImageData(0, 0, c.width, c.height);
      });
    });
  }

  function handleVerifyFile(file) {
    var kind = classify(file);
    if (!kind) return;
    busy(true, t("busy.verifying"));
    verifyCache = { imageDatas: [], meta: null, fallback: false };
    var work;
    if (kind === "pdf") {
      work = readFileAsArrayBuffer(file).then(function (buf) {
        return global.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      }).then(function (pdf) {
        return pdf.getMetadata().catch(function () { return null; }).then(function (md) {
          if (md) verifyCache.meta = pdfInfoMeta(md.info);
          var chain = Promise.resolve();
          for (var i = 1; i <= pdf.numPages; i++) {
            (function (n) {
              chain = chain.then(function () {
                return pdf.getPage(n).then(pdfPageImageData).then(function (img) {
                  verifyCache.imageDatas.push(img);
                }).catch(function () { /* page without extractable pixels */ });
              });
            })(i);
          }
          return chain;
        });
      });
    } else {
      work = readFileAsArrayBuffer(file).then(function (buf) {
        var bytes = new Uint8Array(buf);
        if (SL.stego.isPng(bytes)) verifyCache.meta = parsePngMeta(bytes);
        return loadImageBitmap(file);
      }).then(function (bmp) {
        // Natural size — NEVER bitmapToPage here, its downscale kills LSBs.
        var w = bmp.naturalWidth || bmp.width;
        var h = bmp.naturalHeight || bmp.height;
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        var ctx = c.getContext("2d");
        ctx.drawImage(bmp, 0, 0);
        if (bmp.close) bmp.close();
        verifyCache.imageDatas.push(ctx.getImageData(0, 0, w, h));
      });
    }
    work.then(decodeVerifyPages).then(function (pixel) {
      busy(false);
      renderVerifyResults(pixel);
    }).catch(function (err) {
      busy(false); console.error(err);
      alert(t("alert.verifyFailed") + (err && err.message ? err.message : err));
    });
  }

  // Decode every cached page with the current passphrase; a verified mark on
  // any page wins, otherwise the first found (unverified) one is reported.
  function decodeVerifyPages() {
    // Pixel verification needs Web Crypto; on an insecure context (plain-http
    // LAN hosting) it is unavailable. Skip decoding rather than crashing, so
    // the metadata card still renders.
    if (!SL.stego.available) return Promise.resolve({ found: false, unavailable: true });
    var pass = $("verify-pass").value;
    var result = null;
    var chain = Promise.resolve();
    verifyCache.imageDatas.forEach(function (img, i) {
      chain = chain.then(function () {
        if (result && result.verified) return;
        return SL.stego.decode(img, pass).then(function (r) {
          if (r.found && (!result || (r.verified && !result.verified))) {
            result = r;
            result.page = i + 1;
          }
        });
      });
    });
    return chain.then(function () { return result || { found: false }; });
  }

  function retryVerifyDecode() {
    if (!verifyCache.imageDatas.length) return;
    busy(true, t("busy.verifying"));
    decodeVerifyPages().then(function (pixel) {
      busy(false);
      renderVerifyResults(pixel);
    });
  }

  function findIssuedCopy(hex) {
    for (var i = 0; i < issuedCopies.length; i++) {
      if (issuedCopies[i].copyId === hex) return issuedCopies[i];
    }
    return null;
  }

  function addVerifyRow(parent, label, value, mono) {
    var row = document.createElement("p");
    row.className = "verify-row";
    var l = document.createElement("span");
    l.className = "verify-row__label";
    l.textContent = label;
    var v = document.createElement(mono ? "code" : "span");
    v.textContent = value;
    row.appendChild(l);
    row.appendChild(v);
    parent.appendChild(row);
  }

  function addVerifyNote(parent, text) {
    var p = document.createElement("p");
    p.className = "verify-muted";
    p.textContent = text;
    parent.appendChild(p);
  }

  function renderVerifyResults(pixel) {
    var wrap = $("verify-results");
    wrap.hidden = false;

    // Card 1: declared file metadata (easy to read, easy to strip).
    var metaBody = $("verify-meta-body");
    metaBody.textContent = "";
    var meta = verifyCache.meta;
    if (meta) {
      if (meta.copyId) addVerifyRow(metaBody, t("verify.copyId"), meta.copyId, true);
      if (meta.purpose) addVerifyRow(metaBody, t("trace.labelLabel"), meta.purpose);
      if (meta.created) addVerifyRow(metaBody, t("verify.created"), meta.created);
    } else {
      addVerifyNote(metaBody, t("verify.metaNone"));
    }

    // Card 2: invisible pixel mark.
    var badge = $("verify-badge");
    var pixelBody = $("verify-pixel-body");
    pixelBody.textContent = "";
    badge.className = "verify-badge";
    if (pixel.unavailable) {
      // Insecure context: we could not check the pixels at all.
      badge.hidden = true;
      addVerifyNote(pixelBody, t("trace.unavailable"));
      $("verify-fallback").hidden = !verifyCache.fallback;
      return;
    }
    badge.hidden = false;
    if (pixel.found && pixel.verified) {
      badge.classList.add("verify-badge--ok");
      badge.textContent = t("verify.statusVerified");
    } else if (pixel.found) {
      badge.classList.add("verify-badge--warn");
      badge.textContent = t("verify.statusFoundUnverified");
    } else {
      badge.classList.add("verify-badge--none");
      badge.textContent = t("verify.statusNone");
    }
    if (pixel.found) {
      addVerifyRow(pixelBody, t("verify.copyId"), pixel.copyIdHex, true);
      if (pixel.verified) {
        addVerifyRow(pixelBody, t("verify.keyLabel"),
          t(pixel.keyed === "open" ? "verify.keyOpen" : "verify.keyPassphrase"));
      }
      addVerifyRow(pixelBody, t("verify.agreement"),
        Math.round(pixel.agreement * 100) + "% · " + pixel.count);
      if (pixel.page && verifyCache.imageDatas.length > 1) {
        addVerifyRow(pixelBody, t("verify.pageLabel"), String(pixel.page));
      }
      var known = findIssuedCopy(pixel.copyIdHex);
      if (known && known.label) addVerifyRow(pixelBody, t("verify.registryMatch"), known.label);
    } else {
      addVerifyNote(pixelBody, t("verify.noneExplain"));
    }
    $("verify-fallback").hidden = !verifyCache.fallback;
  }

  /* Minimal store-only ZIP writer (no compression, no dependency) so several
   * protected images can be downloaded as one file. CRC32 lives in stego.js
   * (shared with the PNG chunk writer). */
  function makeZip(files) {
    var enc = new TextEncoder();
    function u16(n) { return [n & 255, (n >> 8) & 255]; }
    function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }
    var parts = [], central = [], offset = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = SL.stego.crc32(data);
      var local = [].concat(
        u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      var header = new Uint8Array(local);
      parts.push(header, name, data);
      var cen = [].concat(
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length),
        u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset));
      central.push(new Uint8Array(cen), name);
      offset += header.length + name.length + data.length;
    });
    var centralSize = central.reduce(function (s, p) { return s + p.length; }, 0);
    var eocd = new Uint8Array([].concat(
      u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
      u32(centralSize), u32(offset), u16(0)));
    return new Blob(parts.concat(central, [eocd]), { type: "application/zip" });
  }

  function download() {
    busy(true, t("busy.generating"));
    buildOutput().then(function (out) {
      var url = URL.createObjectURL(out.blob);
      var a = document.createElement("a");
      a.href = url; a.download = out.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      busy(false);
    }).catch(function (err) {
      busy(false); console.error(err);
      alert(t("alert.generateFailed") + (err && err.message ? err.message : err));
    });
  }

  function share() {
    busy(true, t("busy.sharing"));
    buildOutput().then(function (out) {
      var file = new File([out.blob], out.name, { type: out.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        busy(false);
        return navigator.share({ files: [file], title: t("share.title") })
          .catch(function () { /* user cancelled */ });
      }
      busy(false);
      download();
    }).catch(function (err) {
      busy(false); console.error(err);
      alert(t("alert.shareFailed") + (err && err.message ? err.message : err));
    });
  }

  /* ------------------------------------------------------------------ *
   * Wiring
   * ------------------------------------------------------------------ */
  function wire() {
    els.fileInput = $("file-input");
    $("app-version").textContent = SL.VERSION;
    $("lang-select").addEventListener("change", function (e) {
      setLanguage(e.target.value);
    });

    // upload (shared dropzone wiring, reused by the verify screen)
    function wireDropzone(dz, input, cb) {
      input.addEventListener("change", function (e) {
        if (e.target.files && e.target.files.length) cb(e.target.files);
      });
      ["dragenter", "dragover"].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("is-drag"); });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("is-drag"); });
      });
      dz.addEventListener("drop", function (e) {
        if (e.dataTransfer.files && e.dataTransfer.files.length) cb(e.dataTransfer.files);
      });
    }
    wireDropzone($("dropzone"), els.fileInput, handleFiles);
    wireDropzone($("verify-dropzone"), $("verify-input"), function (files) {
      handleVerifyFile(files[0]);
    });

    // traceable copy panel (result screen)
    $("trace-enabled").addEventListener("change", function (e) {
      state.traceable.enabled = e.target.checked;
      $("trace-fields").hidden = !state.traceable.enabled;
    });
    $("trace-label").addEventListener("input", function (e) {
      state.traceable.label = e.target.value;
    });
    $("trace-pass").addEventListener("input", function (e) {
      state.traceable.passphrase = e.target.value;
    });
    $("trace-registry").addEventListener("click", downloadRegistryCsv);
    syncTraceControls();

    // verify screen
    $("verify-retry").addEventListener("click", retryVerifyDecode);

    // nav buttons (data-nav)
    document.querySelectorAll("[data-nav]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.dataset.nav;
        if (t === "reset") reset(); else show(t);
      });
    });

    // redact tools
    $("tool-undo").addEventListener("click", function () { editor.undo(); updateRedactState(); });
    $("tool-delete-redaction").addEventListener("click", function () { editor.deleteSelected(); updateRedactState(); });
    $("tool-copy-redaction").addEventListener("click", function () { copySelectedRedactionToPages(); updateRedactState(); });
    $("tool-zoom-in").addEventListener("click", function () { editor.zoomButton(1.2); });
    $("tool-zoom-out").addEventListener("click", function () { editor.zoomButton(1 / 1.2); });
    $("tool-zoom-reset").addEventListener("click", function () { editor.resetView(); });
    var panBtn = $("tool-pan");
    panBtn.addEventListener("click", function () {
      setEditorTool(editor.tool === "pan" ? "brush" : "pan");
    });
    // drawing / editing modes
    $("tool-brush").addEventListener("click", function () { setEditorTool("brush"); });
    $("tool-blur").addEventListener("click", function () { setEditorTool("blur"); });
    $("tool-select").addEventListener("click", function () { setEditorTool("select"); });
    document.querySelectorAll(".brush").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".brush").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        editor.setBrush(parseInt(b.dataset.size, 10));
        setEditorTool("brush");
      });
    });
    $("blur-intensity").addEventListener("input", function (e) {
      var v = parseInt(e.target.value, 10);
      editor.setBlurIntensity(v);
      $("blur-intensity-val").textContent = v + " px";
    });
    $("blur-area").addEventListener("input", function (e) {
      var v = parseInt(e.target.value, 10);
      editor.setBlurThickness(v);
      $("blur-area-val").textContent = v + " px";
    });
    $("page-rotate-left").addEventListener("click", function () { editor.rotatePage(-1); updateRedactState(); });
    $("page-rotate-right").addEventListener("click", function () { editor.rotatePage(1); updateRedactState(); });
    $("page-crop-mode").addEventListener("click", function () {
      setEditorTool(editor.tool === "crop" ? "brush" : "crop");
      // Entering crop mode bakes any pending straighten, so resync the slider.
      setStraightenValue(currentPageStraighten());
      updateRedactState();
    });
    $("page-crop-apply").addEventListener("click", function () {
      if (editor.applyCrop()) setEditorTool("brush");
      updateRedactState();
    });
    $("page-straighten").addEventListener("input", function (e) { setStraightenValue(e.target.value); });
    document.querySelectorAll("[data-page]").forEach(function (b) {
      b.addEventListener("click", function () { gotoPage(b.dataset.page === "next" ? 1 : -1); });
    });
    $("gray-toggle").addEventListener("change", function (e) {
      state.grayscale = e.target.checked;
      if (editor) editor.setGrayscale(state.grayscale);
    });

    // watermark controls
    $("wm-text").addEventListener("input", function (e) {
      state.wm.text = e.target.value;
      $("wm-count").textContent = 100 - e.target.value.length;
      schedulePreview();
    });
    $("wm-enabled").addEventListener("change", function (e) {
      state.wm.enabled = e.target.checked;
      $("wm-options").classList.toggle("is-off", !state.wm.enabled);
      updateWmContinue();
      schedulePreview();
    });
    $("wm-opacity").addEventListener("input", function (e) {
      state.wm.opacity = parseInt(e.target.value, 10) / 100;
      $("wm-opacity-val").textContent = e.target.value + "%";
      schedulePreview();
    });
    $("wm-size").addEventListener("input", function (e) {
      state.wm.size = parseInt(e.target.value, 10);
      $("wm-size-val").textContent = e.target.value + " px";
      schedulePreview();
    });
    $("wm-manual-text").addEventListener("input", function (e) {
      selectedManualItem().text = e.target.value;
      schedulePreview();
    });
    $("wm-angle").addEventListener("input", function (e) {
      selectedManualItem().angle = parseInt(e.target.value, 10);
      $("wm-angle-val").textContent = e.target.value + "°";
      schedulePreview();
    });
    $("wm-manual-reset").addEventListener("click", function () {
      var item = selectedManualItem();
      item.x = 0.5;
      item.y = 0.82;
      schedulePreview();
    });
    $("wm-manual-remove").addEventListener("click", removeManualWatermark);
    $("wm-manual-random").addEventListener("change", function (e) {
      ensureManualWatermark(state.wm).randomizePerPage = e.target.checked;
      schedulePreview();
    });
    $("wm-color").addEventListener("input", function (e) { setColor(e.target.value); });
    $("wm-footer").addEventListener("change", function (e) {
      state.wm.footer = e.target.checked;
      schedulePreview();
    });
    $("legal-eu").addEventListener("change", function (e) {
      state.exportFooter.euLink = e.target.checked;
      exportFooterChanged();
    });
    $("legal-national").addEventListener("change", function (e) {
      state.exportFooter.nationalLink = e.target.checked;
      exportFooterChanged();
    });
    $("legal-national-country").addEventListener("change", function (e) {
      state.exportFooter.nationalCountry = e.target.value;
      exportFooterChanged();
    });
    $("legal-contact-enabled").addEventListener("change", function (e) {
      state.exportFooter.contactEmailEnabled = e.target.checked;
      exportFooterChanged();
    });
    $("legal-contact-email").addEventListener("input", function (e) {
      state.exportFooter.contactEmail = e.target.value;
      exportFooterChanged();
    });
    $("legal-phone-enabled").addEventListener("change", function (e) {
      state.exportFooter.phoneEnabled = e.target.checked;
      exportFooterChanged();
    });
    $("legal-phone").addEventListener("input", function (e) {
      state.exportFooter.phone = e.target.value;
      exportFooterChanged();
    });
    $("legal-message-enabled").addEventListener("change", function (e) {
      state.exportFooter.messageEnabled = e.target.checked;
      exportFooterChanged();
    });
    $("legal-message").addEventListener("input", function (e) {
      state.exportFooter.message = e.target.value;
      state.exportFooter.messageCustom = !isDefaultLegalMessage(e.target.value);
      exportFooterChanged();
    });
    document.querySelectorAll("[data-wmpage]").forEach(function (b) {
      b.addEventListener("click", function () { gotoWmPreviewPage(b.dataset.wmpage === "next" ? 1 : -1); });
    });
    var wmHost = $("wm-preview-host");
    wmHost.addEventListener("pointerdown", function (e) {
      if (!canDragManualWatermark()) return;
      e.preventDefault();
      wmDragging = true;
      wmHost.classList.add("is-dragging");
      try { wmHost.setPointerCapture(e.pointerId); } catch (err) {}
      setManualPositionFromEvent(e);
    });
    wmHost.addEventListener("pointermove", function (e) {
      if (!wmDragging) return;
      e.preventDefault();
      setManualPositionFromEvent(e);
    });
    function endManualDrag(e) {
      if (!wmDragging) return;
      wmDragging = false;
      wmHost.classList.remove("is-dragging");
      try {
        if (wmHost.hasPointerCapture && wmHost.hasPointerCapture(e.pointerId)) wmHost.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    wmHost.addEventListener("pointerup", endManualDrag);
    wmHost.addEventListener("pointercancel", endManualDrag);

    // result actions
    $("btn-download").addEventListener("click", download);
    $("btn-share").addEventListener("click", share);
    document.querySelectorAll("[data-fmt]").forEach(function (b) {
      b.addEventListener("click", function () { state.format = b.dataset.fmt; syncFormatButtons(); });
    });
    document.querySelectorAll("[data-rpage]").forEach(function (b) {
      b.addEventListener("click", function () { gotoResultPage(b.dataset.rpage === "next" ? 1 : -1); });
    });

    global.addEventListener("resize", function () {
      if ($("screen-watermark").classList.contains("is-active")) schedulePreview();
      if ($("screen-result").classList.contains("is-active")) renderResult();
    });
    applyTranslations();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  // expose for debugging / verification
  SL._state = state;
  SL._compose = compose;
  SL._getEditor = function () { return editor; };
  SL._buildOutput = buildOutput;
})(window);
