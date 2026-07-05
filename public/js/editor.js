/* IDprotector — redaction editor.
 * The brush stamps fully-opaque rectangles along the drag path, oriented to the
 * movement direction (any angle) and sized by the selected brush. Nothing behind
 * a rectangle survives export because pages are rasterised on the way out. */
(function (global) {
  "use strict";
  var SL = global.SL || (global.SL = {});

  var REDACT_COLOR = "#000000";

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
  SL.paintPage = function (ctx, page) {
    ctx.drawImage(page.base, 0, 0);
    for (var i = 0; i < page.rects.length; i++) fillRotatedRect(ctx, page.rects[i]);
  };

  function Editor(host) {
    this.host = host;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    host.appendChild(this.canvas);

    this.page = null;
    this.tool = "brush";        // "brush" | "pan"
    this.brush = 34;            // rectangle thickness in image px
    this.scale = 1;             // view scale (image px -> css px = scale * fit)
    this.fit = 1;               // base fit scale (image -> canvas backing px)
    this.tx = 0; this.ty = 0;   // pan offset in canvas backing px
    this.dpr = Math.min(global.devicePixelRatio || 1, 2);

    this.drawing = false;
    this.last = null;
    this.stroke = null;         // rects added during the current stroke
    this.pointers = new Map();
    this.pinch = null;

    this._bind();
    var self = this;
    this._ro = new ResizeObserver(function () { self.relayout(); });
    this._ro.observe(host);
  }

  Editor.prototype.setPage = function (page) {
    this.page = page;
    this.relayout(true);
  };

  Editor.prototype.setTool = function (tool) {
    this.tool = tool;
    this.host.classList.toggle("is-brush", tool === "brush");
    this.host.classList.toggle("is-pan", tool === "pan");
  };

  Editor.prototype.setBrush = function (px) { this.brush = px; };

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
    SL.paintPage(ctx, this.page);
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

  // Stamp a rectangle covering the segment from a to b (image space).
  Editor.prototype.stampSegment = function (a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    var thick = this.brush;
    var rect;
    if (len < 0.6) {
      // a tap: a small square oriented naturally
      rect = { cx: b.x, cy: b.y, w: thick, h: thick, angle: 0 };
    } else {
      rect = {
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
        w: len + thick,          // overlap so consecutive stamps leave no gaps
        h: thick,
        angle: Math.atan2(dy, dx)
      };
    }
    this.page.rects.push(rect);
    this.stroke.push(rect);
  };

  Editor.prototype.undo = function () {
    if (!this.page || !this.page.undo.length) return;
    var count = this.page.undo.pop();
    this.page.rects.splice(this.page.rects.length - count, count);
    this.render();
  };

  Editor.prototype._bind = function () {
    var self = this;
    var c = this.canvas;

    c.addEventListener("pointerdown", function (e) {
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* synthetic / unsupported */ }
      self.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (self.pointers.size === 2) {
        self.drawing = false;
        self.startPinch();
        return;
      }
      if (self.tool === "pan") {
        self.panStart = { x: e.clientX, y: e.clientY, tx: self.tx, ty: self.ty };
        return;
      }
      // brush
      self.drawing = true;
      self.stroke = [];
      self.last = self.toImage(e.clientX, e.clientY);
      self.stampSegment(self.last, self.last);
      self.render();
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
      if (!self.drawing) return;
      var p = self.toImage(e.clientX, e.clientY);
      self.stampSegment(self.last, p);
      self.last = p;
      self.render();
    });

    function endPointer(e) {
      try { if (c.hasPointerCapture && c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId); } catch (err) {}
      self.pointers.delete(e.pointerId);
      if (self.pointers.size < 2) self.pinch = null;
      if (self.drawing) {
        self.drawing = false;
        if (self.stroke && self.stroke.length) self.page.undo.push(self.stroke.length);
        self.stroke = null;
        if (self.onChange) self.onChange();
      }
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
