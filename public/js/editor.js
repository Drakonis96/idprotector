/* IDprotector — redaction editor.
 * Each brush stroke draws ONE straight, fully-opaque rectangle from the point
 * where you pressed to the point where you release: any angle you like, but it
 * never bends along the path of your finger. Nothing behind a rectangle
 * survives export because pages are rasterised on the way out. */
(function (global) {
  "use strict";
  var SL = global.SL || (global.SL = {});

  var REDACT_COLOR = "#000000";
  var DEG = Math.PI / 180;
  var MIN_CROP = 24;

  function cloneRect(r) {
    return { cx: r.cx, cy: r.cy, w: r.w, h: r.h, angle: r.angle };
  }

  function ensureUndo(page) {
    if (!page.undo) page.undo = [];
    return page.undo;
  }

  function fillRotatedRect(ctx, r) {
    ctx.save();
    ctx.translate(r.cx, r.cy);
    ctx.rotate(r.angle);
    ctx.fillStyle = REDACT_COLOR;
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
    ctx.restore();
  }
  SL.fillRotatedRect = fillRotatedRect;

  // Draw base image + all redaction rectangles for a page onto ctx (image space).
  // When grayscale is true the underlying document is desaturated (the black
  // redaction bars and any watermark added later keep their own colour).
  SL.paintPage = function (ctx, page, grayscale) {
    if (grayscale) ctx.filter = "grayscale(1)";
    ctx.drawImage(page.base, 0, 0);
    if (grayscale) ctx.filter = "none";
    for (var i = 0; i < page.rects.length; i++) fillRotatedRect(ctx, page.rects[i]);
  };

  // Build one straight rectangle spanning a -> b (image space).
  function rectFromTo(a, b, thick) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.6) {
      return { cx: b.x, cy: b.y, w: thick, h: thick, angle: 0 };
    }
    return {
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
      w: len + thick,          // extend by half the thickness at each end
      h: thick,
      angle: Math.atan2(dy, dx)
    };
  }
  SL.rectFromTo = rectFromTo;

  function rectEndpoints(r) {
    var dx = Math.cos(r.angle) * r.w / 2;
    var dy = Math.sin(r.angle) * r.w / 2;
    return {
      a: { x: r.cx - dx, y: r.cy - dy },
      b: { x: r.cx + dx, y: r.cy + dy }
    };
  }

  function localPoint(r, p) {
    var dx = p.x - r.cx, dy = p.y - r.cy;
    var c = Math.cos(r.angle), s = Math.sin(r.angle);
    return {
      x: dx * c + dy * s,
      y: -dx * s + dy * c
    };
  }

  function rectBounds(r) {
    var c = Math.cos(r.angle), s = Math.sin(r.angle);
    var hw = r.w / 2, hh = r.h / 2;
    var pts = [
      { x: -hw, y: -hh }, { x: hw, y: -hh },
      { x: hw, y: hh }, { x: -hw, y: hh }
    ].map(function (p) {
      return { x: r.cx + p.x * c - p.y * s, y: r.cy + p.x * s + p.y * c };
    });
    return pts.reduce(function (b, p) {
      return {
        minX: Math.min(b.minX, p.x),
        minY: Math.min(b.minY, p.y),
        maxX: Math.max(b.maxX, p.x),
        maxY: Math.max(b.maxY, p.y)
      };
    }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  }

  function intersectsCrop(r, crop) {
    var b = rectBounds(r);
    return !(b.maxX < crop.x || b.minX > crop.x + crop.w || b.maxY < crop.y || b.minY > crop.y + crop.h);
  }

  function normalizeCrop(a, b, page) {
    var x1 = Math.max(0, Math.min(page.base.width, a.x));
    var y1 = Math.max(0, Math.min(page.base.height, a.y));
    var x2 = Math.max(0, Math.min(page.base.width, b.x));
    var y2 = Math.max(0, Math.min(page.base.height, b.y));
    var x = Math.min(x1, x2), y = Math.min(y1, y2);
    var w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
    return { x: x, y: y, w: w, h: h };
  }

  function drawIntoCanvas(source, w, h, draw) {
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    draw(c.getContext("2d"), source, c);
    return c;
  }

  function transformRect(r, fn, angleAdd) {
    var center = fn({ x: r.cx, y: r.cy });
    return {
      cx: center.x,
      cy: center.y,
      w: r.w,
      h: r.h,
      angle: r.angle + angleAdd
    };
  }

  SL.rotatePage = function (page, direction) {
    if (!page || !page.base) return false;
    var src = page.base, oldW = src.width, oldH = src.height;
    var cw = direction >= 0;
    var dst = drawIntoCanvas(src, oldH, oldW, function (ctx, image, canvas) {
      if (cw) {
        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
      } else {
        ctx.translate(0, canvas.height);
        ctx.rotate(-Math.PI / 2);
      }
      ctx.drawImage(image, 0, 0);
    });
    page.base = dst;
    page.rects = page.rects.map(function (r) {
      return transformRect(r, function (p) {
        return cw ? { x: oldH - p.y, y: p.x } : { x: p.y, y: oldW - p.x };
      }, cw ? Math.PI / 2 : -Math.PI / 2);
    });
    page.undo = [];
    return true;
  };

  SL.straightenPage = function (page, degrees) {
    if (!page || !page.base || Math.abs(degrees) < 0.05) return false;
    var src = page.base, oldW = src.width, oldH = src.height;
    var rad = degrees * DEG;
    var cos = Math.cos(rad), sin = Math.sin(rad);
    var newW = Math.ceil(Math.abs(oldW * cos) + Math.abs(oldH * sin));
    var newH = Math.ceil(Math.abs(oldW * sin) + Math.abs(oldH * cos));
    var dst = drawIntoCanvas(src, newW, newH, function (ctx, image, canvas) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(image, -oldW / 2, -oldH / 2);
    });
    page.base = dst;
    page.rects = page.rects.map(function (r) {
      return transformRect(r, function (p) {
        var dx = p.x - oldW / 2, dy = p.y - oldH / 2;
        return {
          x: newW / 2 + dx * cos - dy * sin,
          y: newH / 2 + dx * sin + dy * cos
        };
      }, rad);
    });
    page.undo = [];
    return true;
  };

  SL.cropPage = function (page, crop) {
    if (!page || !page.base || !crop) return false;
    var x = Math.max(0, Math.min(page.base.width - 1, Math.round(crop.x)));
    var y = Math.max(0, Math.min(page.base.height - 1, Math.round(crop.y)));
    var w = Math.max(1, Math.min(page.base.width - x, Math.round(crop.w)));
    var h = Math.max(1, Math.min(page.base.height - y, Math.round(crop.h)));
    if (w < MIN_CROP || h < MIN_CROP) return false;
    var src = page.base;
    var dst = drawIntoCanvas(src, w, h, function (ctx, image) {
      ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
    });
    page.base = dst;
    page.rects = page.rects.filter(function (r) {
      return intersectsCrop(r, { x: x, y: y, w: w, h: h });
    }).map(function (r) {
      var next = cloneRect(r);
      next.cx -= x;
      next.cy -= y;
      return next;
    });
    page.undo = [];
    return true;
  };

  SL.cloneRedactionForPage = function (rect, fromPage, toPage) {
    var sx = toPage.base.width / fromPage.base.width;
    var sy = toPage.base.height / fromPage.base.height;
    var ends = rectEndpoints(rect);
    return rectFromTo(
      { x: ends.a.x * sx, y: ends.a.y * sy },
      { x: ends.b.x * sx, y: ends.b.y * sy },
      rect.h * ((sx + sy) / 2)
    );
  };

  function Editor(host) {
    this.host = host;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    host.appendChild(this.canvas);

    this.page = null;
    this.tool = "brush";        // "brush" | "pan" | "crop"
    this.brush = 34;            // rectangle thickness in image px
    this.scale = 1;             // view scale (image px -> css px = scale * fit)
    this.fit = 1;               // base fit scale (image -> canvas backing px)
    this.tx = 0; this.ty = 0;   // pan offset in canvas backing px
    this.dpr = Math.min(global.devicePixelRatio || 1, 2);

    this.grayscale = false;
    this.drawing = false;
    this.anchor = null;         // where the current straight stroke started
    this.pending = null;        // live rectangle being dragged (not committed yet)
    this.selectedIndex = -1;
    this.editing = null;
    this.cropRect = null;
    this.cropDraft = null;
    this.pointers = new Map();
    this.pinch = null;

    this._bind();
    var self = this;
    this._ro = new ResizeObserver(function () { self.relayout(); });
    this._ro.observe(host);
  }

  Editor.prototype.setPage = function (page) {
    this.page = page;
    this.selectedIndex = -1;
    this.editing = null;
    this.cropRect = null;
    this.cropDraft = null;
    this.notifySelection();
    this.notifyCrop();
    this.relayout(true);
  };

  Editor.prototype.setTool = function (tool) {
    this.tool = tool;
    this.host.classList.toggle("is-brush", tool === "brush");
    this.host.classList.toggle("is-pan", tool === "pan");
    this.host.classList.toggle("is-crop", tool === "crop");
    this.render();
  };

  Editor.prototype.setBrush = function (px) { this.brush = px; };

  Editor.prototype.setGrayscale = function (on) { this.grayscale = !!on; this.render(); };

  Editor.prototype.notifySelection = function () {
    if (this.onSelectionChange) this.onSelectionChange(this.getSelectedRect());
  };

  Editor.prototype.notifyCrop = function () {
    if (this.onCropChange) this.onCropChange(this.getCropRect());
  };

  Editor.prototype.getSelectedRect = function () {
    if (!this.page || this.selectedIndex < 0 || this.selectedIndex >= this.page.rects.length) return null;
    return this.page.rects[this.selectedIndex];
  };

  Editor.prototype.getCropRect = function () {
    return this.cropRect && this.cropRect.w >= MIN_CROP && this.cropRect.h >= MIN_CROP
      ? this.cropRect
      : null;
  };

  // Compute canvas backing size and the fit scale so the page fits the host width.
  Editor.prototype.relayout = function (reset) {
    if (!this.page) return;
    var hostW = this.host.clientWidth || 600;
    var maxH = Math.min(global.innerHeight * 0.62, 620);
    var pageW = this.page.base.width, pageH = this.page.base.height;

    var fitW = hostW / pageW;
    var fitH = maxH / pageH;
    this.fit = Math.min(fitW, fitH);

    var cssW = pageW * this.fit;
    var cssH = pageH * this.fit;
    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);

    if (reset) { this.scale = 1; this.tx = 0; this.ty = 0; }
    this.clampPan();
    this.render();
  };

  Editor.prototype.viewMatrix = function () {
    // image px -> backing px
    var s = this.fit * this.scale * this.dpr;
    return { s: s, tx: this.tx, ty: this.ty };
  };

  Editor.prototype.toImage = function (clientX, clientY) {
    var rect = this.canvas.getBoundingClientRect();
    var bx = (clientX - rect.left) * (this.canvas.width / rect.width);
    var by = (clientY - rect.top) * (this.canvas.height / rect.height);
    var m = this.viewMatrix();
    return { x: (bx - m.tx) / m.s, y: (by - m.ty) / m.s };
  };

  Editor.prototype.hitTolerance = function () {
    return Math.max(5, 12 / Math.max(this.fit * this.scale, 0.01));
  };

  Editor.prototype.hitTestRedaction = function (p) {
    if (!this.page) return null;
    var tol = this.hitTolerance();
    for (var i = this.page.rects.length - 1; i >= 0; i--) {
      var r = this.page.rects[i];
      var lp = localPoint(r, p);
      var onLeft = Math.abs(lp.x + r.w / 2) <= tol * 1.8 && Math.abs(lp.y) <= r.h / 2 + tol;
      var onRight = Math.abs(lp.x - r.w / 2) <= tol * 1.8 && Math.abs(lp.y) <= r.h / 2 + tol;
      if (onLeft) return { index: i, part: "start" };
      if (onRight) return { index: i, part: "end" };
      if (Math.abs(lp.x) <= r.w / 2 + tol && Math.abs(lp.y) <= r.h / 2 + tol) {
        return { index: i, part: "move" };
      }
    }
    return null;
  };

  Editor.prototype.clampPan = function () {
    var m = this.fit * this.scale * this.dpr;
    var contentW = this.page.base.width * m;
    var contentH = this.page.base.height * m;
    var cw = this.canvas.width, ch = this.canvas.height;
    if (contentW <= cw) this.tx = (cw - contentW) / 2;
    else this.tx = Math.min(0, Math.max(cw - contentW, this.tx));
    if (contentH <= ch) this.ty = (ch - contentH) / 2;
    else this.ty = Math.min(0, Math.max(ch - contentH, this.ty));
  };

  Editor.prototype.render = function () {
    if (!this.page) return;
    var ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    var m = this.viewMatrix();
    ctx.setTransform(m.s, 0, 0, m.s, m.tx, m.ty);
    SL.paintPage(ctx, this.page, this.grayscale);
    if (this.pending) fillRotatedRect(ctx, this.pending);
    this.drawSelection(ctx, m);
    this.drawCrop(ctx, m);
  };

  Editor.prototype.drawSelection = function (ctx, matrix) {
    var r = this.getSelectedRect();
    if (!r) return;
    var line = Math.max(1, 2 / matrix.s);
    var handle = Math.max(4, 7 / matrix.s);
    var ends = rectEndpoints(r);
    ctx.save();
    ctx.translate(r.cx, r.cy);
    ctx.rotate(r.angle);
    ctx.lineWidth = line;
    ctx.strokeStyle = "#17c3d6";
    ctx.setLineDash([Math.max(4, 8 / matrix.s), Math.max(3, 5 / matrix.s)]);
    ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
    ctx.restore();

    ctx.save();
    ctx.lineWidth = line;
    ctx.strokeStyle = "#171512";
    ctx.fillStyle = "#ffffff";
    [ends.a, ends.b].forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, handle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  };

  Editor.prototype.drawCrop = function (ctx, matrix) {
    var r = this.cropDraft || this.cropRect;
    if (!r || !r.w || !r.h) return;
    var w = this.page.base.width, h = this.page.base.height;
    var line = Math.max(1, 2 / matrix.s);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(0, 0, w, r.y);
    ctx.fillRect(0, r.y + r.h, w, h - (r.y + r.h));
    ctx.fillRect(0, r.y, r.x, r.h);
    ctx.fillRect(r.x + r.w, r.y, w - (r.x + r.w), r.h);
    ctx.lineWidth = line;
    ctx.strokeStyle = "#ffffff";
    ctx.setLineDash([Math.max(6, 10 / matrix.s), Math.max(4, 6 / matrix.s)]);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = "#17c3d6";
    ctx.setLineDash([]);
    ctx.strokeRect(r.x + line, r.y + line, Math.max(0, r.w - line * 2), Math.max(0, r.h - line * 2));
    ctx.restore();
  };

  Editor.prototype.zoomAt = function (factor, bx, by) {
    var oldS = this.fit * this.scale * this.dpr;
    var ix = (bx - this.tx) / oldS;
    var iy = (by - this.ty) / oldS;
    this.scale = Math.min(8, Math.max(1, this.scale * factor));
    var newS = this.fit * this.scale * this.dpr;
    this.tx = bx - ix * newS;
    this.ty = by - iy * newS;
    this.clampPan();
    this.render();
  };

  Editor.prototype.zoomButton = function (factor) {
    this.zoomAt(factor, this.canvas.width / 2, this.canvas.height / 2);
  };

  Editor.prototype.resetView = function () {
    this.scale = 1; this.tx = 0; this.ty = 0; this.clampPan(); this.render();
  };

  // Begin a straight stroke at image point a.
  Editor.prototype.beginStroke = function (a) {
    this.drawing = true;
    this.anchor = a;
    this.pending = rectFromTo(a, a, this.brush);
    this.render();
  };

  // Update the live straight rectangle as the pointer moves.
  Editor.prototype.updateStroke = function (b) {
    if (!this.drawing) return;
    this.pending = rectFromTo(this.anchor, b, this.brush);
    this.render();
  };

  // Commit the straight rectangle as a single undoable step.
  Editor.prototype.commitStroke = function () {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.pending) {
      var index = this.page.rects.length;
      this.page.rects.push(this.pending);
      ensureUndo(this.page).push({ type: "add", index: index });
      this.selectedIndex = index;
      this.notifySelection();
    }
    this.pending = null;
    this.anchor = null;
    this.render();
    if (this.onChange) this.onChange();
  };

  Editor.prototype.beginEdit = function (hit, p) {
    this.selectedIndex = hit.index;
    var r = this.page.rects[hit.index];
    var ends = rectEndpoints(r);
    this.editing = {
      mode: hit.part,
      start: p,
      before: cloneRect(r),
      anchor: hit.part === "start" ? ends.b : ends.a,
      thick: r.h,
      changed: false
    };
    this.notifySelection();
    this.render();
  };

  Editor.prototype.updateEdit = function (p) {
    if (!this.editing || this.selectedIndex < 0) return;
    var r = this.page.rects[this.selectedIndex];
    var e = this.editing;
    if (e.mode === "move") {
      r.cx = e.before.cx + (p.x - e.start.x);
      r.cy = e.before.cy + (p.y - e.start.y);
      r.w = e.before.w;
      r.h = e.before.h;
      r.angle = e.before.angle;
    } else {
      var next = rectFromTo(e.anchor, p, e.thick);
      r.cx = next.cx;
      r.cy = next.cy;
      r.w = Math.max(e.thick, next.w);
      r.h = e.thick;
      r.angle = next.angle;
    }
    e.changed = true;
    this.render();
  };

  Editor.prototype.commitEdit = function () {
    if (!this.editing) return;
    var e = this.editing;
    this.editing = null;
    if (e.changed && this.selectedIndex >= 0) {
      ensureUndo(this.page).push({
        type: "update",
        index: this.selectedIndex,
        before: e.before,
        after: cloneRect(this.page.rects[this.selectedIndex])
      });
      if (this.onChange) this.onChange();
    }
  };

  Editor.prototype.deleteSelected = function () {
    if (!this.page || this.selectedIndex < 0 || this.selectedIndex >= this.page.rects.length) return false;
    var index = this.selectedIndex;
    var rect = this.page.rects.splice(index, 1)[0];
    ensureUndo(this.page).push({ type: "delete", index: index, rect: cloneRect(rect) });
    this.selectedIndex = -1;
    this.notifySelection();
    this.render();
    if (this.onChange) this.onChange();
    return true;
  };

  Editor.prototype.undo = function () {
    if (!this.page || !this.page.undo || !this.page.undo.length) return;
    var op = this.page.undo.pop();
    if (typeof op === "number") {
      this.page.rects.splice(this.page.rects.length - op, op);
    } else if (op.type === "add") {
      this.page.rects.splice(op.index, 1);
    } else if (op.type === "delete") {
      this.page.rects.splice(op.index, 0, cloneRect(op.rect));
    } else if (op.type === "update") {
      this.page.rects[op.index] = cloneRect(op.before);
    }
    this.selectedIndex = -1;
    this.notifySelection();
    this.render();
    if (this.onChange) this.onChange();
  };

  Editor.prototype.beginCrop = function (a) {
    this.cropAnchor = a;
    this.cropDraft = { x: a.x, y: a.y, w: 0, h: 0 };
    this.render();
  };

  Editor.prototype.updateCrop = function (b) {
    if (!this.cropAnchor || !this.page) return;
    this.cropDraft = normalizeCrop(this.cropAnchor, b, this.page);
    this.render();
  };

  Editor.prototype.commitCrop = function () {
    if (!this.cropDraft) return;
    if (this.cropDraft.w >= MIN_CROP && this.cropDraft.h >= MIN_CROP) {
      this.cropRect = this.cropDraft;
      this.notifyCrop();
    }
    this.cropDraft = null;
    this.cropAnchor = null;
    this.render();
  };

  Editor.prototype.applyCrop = function () {
    var crop = this.getCropRect();
    if (!crop || !this.page) return false;
    var ok = SL.cropPage(this.page, crop);
    if (!ok) return false;
    this.selectedIndex = -1;
    this.cropRect = null;
    this.cropDraft = null;
    this.notifySelection();
    this.notifyCrop();
    this.relayout(true);
    if (this.onChange) this.onChange();
    if (this.onPageChange) this.onPageChange();
    return true;
  };

  Editor.prototype.rotatePage = function (direction) {
    if (!this.page || !SL.rotatePage(this.page, direction)) return false;
    this.selectedIndex = -1;
    this.cropRect = null;
    this.cropDraft = null;
    this.notifySelection();
    this.notifyCrop();
    this.relayout(true);
    if (this.onChange) this.onChange();
    if (this.onPageChange) this.onPageChange();
    return true;
  };

  Editor.prototype.straightenPage = function (degrees) {
    if (!this.page || !SL.straightenPage(this.page, degrees)) return false;
    this.selectedIndex = -1;
    this.cropRect = null;
    this.cropDraft = null;
    this.notifySelection();
    this.notifyCrop();
    this.relayout(true);
    if (this.onChange) this.onChange();
    if (this.onPageChange) this.onPageChange();
    return true;
  };

  Editor.prototype._bind = function () {
    var self = this;
    var c = this.canvas;

    c.addEventListener("pointerdown", function (e) {
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* synthetic / unsupported */ }
      self.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (self.pointers.size === 2) {
        // second finger down: abandon any in-progress action and start pinch-zoom
        self.drawing = false;
        self.pending = null;
        self.editing = null;
        self.cropDraft = null;
        self.render();
        self.startPinch();
        return;
      }
      if (self.tool === "pan") {
        self.panStart = { x: e.clientX, y: e.clientY, tx: self.tx, ty: self.ty };
        return;
      }
      var p = self.toImage(e.clientX, e.clientY);
      if (self.tool === "crop") {
        self.beginCrop(p);
        return;
      }
      var hit = self.hitTestRedaction(p);
      if (hit) {
        self.beginEdit(hit, p);
        return;
      }
      self.selectedIndex = -1;
      self.notifySelection();
      self.beginStroke(p);
    });

    c.addEventListener("pointermove", function (e) {
      if (self.pointers.has(e.pointerId)) self.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (self.pointers.size === 2) { self.movePinch(); return; }

      if (self.tool === "pan" && self.panStart) {
        var rect = c.getBoundingClientRect();
        var k = c.width / rect.width;
        self.tx = self.panStart.tx + (e.clientX - self.panStart.x) * k;
        self.ty = self.panStart.ty + (e.clientY - self.panStart.y) * k;
        self.clampPan(); self.render();
        return;
      }
      var p = self.toImage(e.clientX, e.clientY);
      if (self.tool === "crop" && self.cropDraft) { self.updateCrop(p); return; }
      if (self.editing) { self.updateEdit(p); return; }
      if (!self.drawing) return;
      self.updateStroke(p);
    });

    function endPointer(e) {
      try { if (c.hasPointerCapture && c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId); } catch (err) {}
      self.pointers.delete(e.pointerId);
      if (self.pointers.size < 2) self.pinch = null;
      if (self.tool === "crop" && self.cropDraft) self.commitCrop();
      if (self.editing) self.commitEdit();
      if (self.drawing) self.commitStroke();
      self.panStart = null;
    }
    c.addEventListener("pointerup", endPointer);
    c.addEventListener("pointercancel", endPointer);

    c.addEventListener("wheel", function (e) {
      e.preventDefault();
      var rect = c.getBoundingClientRect();
      var bx = (e.clientX - rect.left) * (c.width / rect.width);
      var by = (e.clientY - rect.top) * (c.height / rect.height);
      self.zoomAt(e.deltaY < 0 ? 1.12 : 0.89, bx, by);
    }, { passive: false });

    global.addEventListener("keydown", function (e) {
      var tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if ((e.key === "Delete" || e.key === "Backspace") && self.getSelectedRect()) {
        e.preventDefault();
        self.deleteSelected();
      }
    });
  };

  Editor.prototype.startPinch = function () {
    var pts = Array.from(this.pointers.values());
    var dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
    this.pinch = {
      dist: Math.hypot(dx, dy),
      cx: (pts[0].x + pts[1].x) / 2,
      cy: (pts[0].y + pts[1].y) / 2
    };
  };

  Editor.prototype.movePinch = function () {
    if (!this.pinch) { this.startPinch(); return; }
    var pts = Array.from(this.pointers.values());
    var dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
    var dist = Math.hypot(dx, dy);
    var rect = this.canvas.getBoundingClientRect();
    var k = this.canvas.width / rect.width;
    var midX = (pts[0].x + pts[1].x) / 2, midY = (pts[0].y + pts[1].y) / 2;
    var bx = (midX - rect.left) * k, by = (midY - rect.top) * k;
    var factor = dist / (this.pinch.dist || dist);
    this.zoomAt(factor, bx, by);
    this.pinch = { dist: dist, cx: midX, cy: midY };
  };

  SL.Editor = Editor;
})(window);
