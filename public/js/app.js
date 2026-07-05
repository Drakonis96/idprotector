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

  var state = {
    kind: null,
    fileName: "documento",
    pages: [],
    current: 0,
    resultPage: 0,
    wm: SL.defaultWatermark()
  };

  var editor = null;
  var els = {};

  function $(id) { return document.getElementById(id); }

  function busy(on, text) {
    $("busy").hidden = !on;
    if (text) $("busy-text").textContent = text;
  }

  /* ------------------------------------------------------------------ *
   * Screen navigation
   * ------------------------------------------------------------------ */
  var SCREENS = ["upload", "redact", "watermark", "result"];
  function show(name) {
    SCREENS.forEach(function (s) {
      $("screen-" + s).classList.toggle("is-active", s === name);
    });
    global.scrollTo({ top: 0, behavior: "instant" in global ? "instant" : "auto" });
    if (name === "redact") enterRedact();
    if (name === "watermark") enterWatermark();
    if (name === "result") enterResult();
  }

  function reset() {
    state.pages = [];
    state.kind = null;
    state.current = 0;
    state.resultPage = 0;
    state.wm = SL.defaultWatermark();
    if (els.fileInput) els.fileInput.value = "";
    syncWatermarkControls();
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
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen")); };
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
    return { base: c, rects: [], undo: [] };
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
                  pages.push({ base: c, rects: [], undo: [] });
                });
            });
          });
        })(i);
      }
      return chain.then(function () { return pages; });
    });
  }

  function handleFile(file) {
    if (!file) return;
    var isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    var isImg = /^image\//.test(file.type) || /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name);
    if (!isPdf && !isImg) {
      alert("Formato no compatible. Usa una imagen (PNG, JPG…) o un PDF.");
      return;
    }
    state.fileName = file.name.replace(/\.[^.]+$/, "") || "documento";
    busy(true, "Preparando tu documento…");

    var work;
    if (isPdf) {
      state.kind = "pdf";
      work = readFileAsArrayBuffer(file).then(loadPdf);
    } else {
      state.kind = "image";
      work = loadImageBitmap(file).then(function (bmp) { return [bitmapToPage(bmp)]; });
    }

    work.then(function (pages) {
      if (!pages.length) throw new Error("Documento vacío");
      state.pages = pages;
      state.current = 0;
      busy(false);
      show("redact");
    }).catch(function (err) {
      busy(false);
      console.error(err);
      alert("No se pudo abrir el documento: " + (err && err.message ? err.message : err));
    });
  }

  /* ------------------------------------------------------------------ *
   * Redact screen
   * ------------------------------------------------------------------ */
  function enterRedact() {
    if (!editor) {
      editor = new SL.Editor($("editor-canvas-host"));
      editor.onChange = updateRedactContinue;
      editor.setTool("brush");
    }
    editor.setPage(state.pages[state.current]);
    updatePageNav();
    updateRedactContinue();
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
    $("redact-continue").textContent = any ? "Continuar" : "Continuar sin ocultar datos";
  }

  function gotoPage(delta) {
    var n = state.current + delta;
    if (n < 0 || n >= state.pages.length) return;
    state.current = n;
    editor.setPage(state.pages[n]);
    updatePageNav();
  }

  /* ------------------------------------------------------------------ *
   * Watermark screen
   * ------------------------------------------------------------------ */
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
      span.textContent = p.label;
      btn.appendChild(cv); btn.appendChild(span);
      host.appendChild(btn);
      SL.renderThumb(cv, p.id, state.wm.color);
      btn.addEventListener("click", function () {
        state.wm.pattern = p.id;
        host.querySelectorAll(".pattern").forEach(function (b) {
          b.classList.toggle("is-active", b.dataset.pattern === p.id);
        });
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
    updateWmContinue();
  }

  function updateWmContinue() {
    $("wm-continue").textContent = state.wm.enabled
      ? "Generar documento protegido"
      : "Continuar sin marca de agua";
  }

  function enterWatermark() {
    buildPatternPicker();
    buildSwatches();
    syncWatermarkControls();
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
    var page = state.pages[state.current] || state.pages[0];
    if (!page) return;
    var composite = compose(page, state.wm);
    drawScaledInto(host, composite);
  }

  /* ------------------------------------------------------------------ *
   * Compose + result
   * ------------------------------------------------------------------ */
  function compose(page, wm) {
    var c = document.createElement("canvas");
    c.width = page.base.width;
    c.height = page.base.height;
    var ctx = c.getContext("2d");
    SL.paintPage(ctx, page);
    SL.renderWatermark(ctx, c.width, c.height, wm, c.width / WM_REF_W);
    return c;
  }

  function drawScaledInto(host, srcCanvas) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var maxW = host.clientWidth || 460;
    var maxH = Math.min(global.innerHeight * 0.6, 560);
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
    renderResult();
    $("btn-share").style.display = navigator.share ? "" : "none";
  }
  function renderResult() {
    if (state.pages.length > 1) {
      $("result-page-label").textContent = (state.resultPage + 1) + " / " + state.pages.length;
    }
    var composite = compose(state.pages[state.resultPage], state.wm);
    drawScaledInto($("result-host"), composite);
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

  function buildOutput() {
    if (state.kind === "image") {
      var c = compose(state.pages[0], state.wm);
      return canvasToBlob(c, "image/png").then(function (blob) {
        return { blob: blob, name: state.fileName + "-protegido.png", type: "image/png" };
      });
    }
    // PDF: flatten every page into an image and rebuild the PDF.
    var PDFLib = global.PDFLib;
    return PDFLib.PDFDocument.create().then(function (doc) {
      var chain = Promise.resolve();
      state.pages.forEach(function (page) {
        chain = chain.then(function () {
          var c = compose(page, state.wm);
          return canvasToBlob(c, "image/jpeg", 0.92).then(function (blob) {
            return blob.arrayBuffer();
          }).then(function (buf) {
            return doc.embedJpg(buf).then(function (img) {
              var p = doc.addPage([c.width, c.height]);
              p.drawImage(img, { x: 0, y: 0, width: c.width, height: c.height });
            });
          });
        });
      });
      return chain.then(function () { return doc.save(); }).then(function (bytes) {
        return {
          blob: new Blob([bytes], { type: "application/pdf" }),
          name: state.fileName + "-protegido.pdf",
          type: "application/pdf"
        };
      });
    });
  }

  function download() {
    busy(true, "Generando archivo…");
    buildOutput().then(function (out) {
      var url = URL.createObjectURL(out.blob);
      var a = document.createElement("a");
      a.href = url; a.download = out.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      busy(false);
    }).catch(function (err) {
      busy(false); console.error(err);
      alert("No se pudo generar el archivo: " + (err && err.message ? err.message : err));
    });
  }

  function share() {
    busy(true, "Preparando para compartir…");
    buildOutput().then(function (out) {
      var file = new File([out.blob], out.name, { type: out.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        busy(false);
        return navigator.share({ files: [file], title: "Documento protegido" })
          .catch(function () { /* user cancelled */ });
      }
      busy(false);
      download();
    }).catch(function (err) {
      busy(false); console.error(err);
      alert("No se pudo compartir: " + (err && err.message ? err.message : err));
    });
  }

  /* ------------------------------------------------------------------ *
   * Wiring
   * ------------------------------------------------------------------ */
  function wire() {
    els.fileInput = $("file-input");
    $("app-version").textContent = SL.VERSION;

    // upload
    var dz = $("dropzone");
    els.fileInput.addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    });
    ["dragenter", "dragover"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("is-drag"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("is-drag"); });
    });
    dz.addEventListener("drop", function (e) {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // nav buttons (data-nav)
    document.querySelectorAll("[data-nav]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.dataset.nav;
        if (t === "reset") reset(); else show(t);
      });
    });

    // redact tools
    $("tool-undo").addEventListener("click", function () { editor.undo(); updateRedactContinue(); });
    $("tool-zoom-in").addEventListener("click", function () { editor.zoomButton(1.2); });
    $("tool-zoom-out").addEventListener("click", function () { editor.zoomButton(1 / 1.2); });
    $("tool-zoom-reset").addEventListener("click", function () { editor.resetView(); });
    var panBtn = $("tool-pan");
    panBtn.addEventListener("click", function () {
      var pan = !panBtn.classList.contains("is-active");
      panBtn.classList.toggle("is-active", pan);
      editor.setTool(pan ? "pan" : "brush");
    });
    document.querySelectorAll(".brush").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".brush").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        editor.setBrush(parseInt(b.dataset.size, 10));
        if (panBtn.classList.contains("is-active")) { panBtn.classList.remove("is-active"); editor.setTool("brush"); }
      });
    });
    document.querySelectorAll("[data-page]").forEach(function (b) {
      b.addEventListener("click", function () { gotoPage(b.dataset.page === "next" ? 1 : -1); });
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
    $("wm-color").addEventListener("input", function (e) { setColor(e.target.value); });
    $("wm-footer").addEventListener("change", function (e) {
      state.wm.footer = e.target.checked;
      schedulePreview();
    });

    // result actions
    $("btn-download").addEventListener("click", download);
    $("btn-share").addEventListener("click", share);
    document.querySelectorAll("[data-rpage]").forEach(function (b) {
      b.addEventListener("click", function () { gotoResultPage(b.dataset.rpage === "next" ? 1 : -1); });
    });

    global.addEventListener("resize", function () {
      if ($("screen-watermark").classList.contains("is-active")) schedulePreview();
      if ($("screen-result").classList.contains("is-active")) renderResult();
    });
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
