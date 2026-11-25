const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

class PixelCanvas {
  constructor(width = 320, height = 180) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 4);
    this._colorCache = new Map();
    this.resetClip();
  }

  setClip(x, y, w, h) {
    this.clipX0 = Math.max(0, Math.floor(x));
    this.clipY0 = Math.max(0, Math.floor(y));
    this.clipX1 = Math.min(this.width, Math.floor(x + w));
    this.clipY1 = Math.min(this.height, Math.floor(y + h));
  }

  resetClip() {
    this.clipX0 = 0;
    this.clipY0 = 0;
    this.clipX1 = this.width;
    this.clipY1 = this.height;
  }

  parseColor(hex) {
    if (Array.isArray(hex)) return hex;
    let cached = this._colorCache.get(hex);
    if (cached) return cached;
    let s = hex.startsWith('#') ? hex.slice(1) : hex;
    if (s.length === 3) {
      s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    }
    const r = parseInt(s.slice(0, 2), 16) || 0;
    const g = parseInt(s.slice(2, 4), 16) || 0;
    const b = parseInt(s.slice(4, 6), 16) || 0;
    const a = s.length === 8 ? (parseInt(s.slice(6, 8), 16) / 255) : 1;
    cached = [r, g, b, a];
    this._colorCache.set(hex, cached);
    return cached;
  }

  clear(color = '#1a141b') {
    const [r, g, b] = this.parseColor(color);
    const d = this.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }

  setPixelRGB(x, y, r, g, b) {
    const ix = x | 0;
    const iy = y | 0;
    if (ix < this.clipX0 || ix >= this.clipX1 || iy < this.clipY0 || iy >= this.clipY1) return;
    const idx = (iy * this.width + ix) << 2;
    this.data[idx] = r;
    this.data[idx + 1] = g;
    this.data[idx + 2] = b;
    this.data[idx + 3] = 255;
  }

  blendPixelRGB(x, y, r, g, b, alpha = 1) {
    if (alpha <= 0) return;
    if (alpha >= 0.999) {
      this.setPixelRGB(x, y, r, g, b);
      return;
    }
    const ix = x | 0;
    const iy = y | 0;
    if (ix < this.clipX0 || ix >= this.clipX1 || iy < this.clipY0 || iy >= this.clipY1) return;
    const idx = (iy * this.width + ix) << 2;
    const inv = 1 - alpha;
    this.data[idx] = (this.data[idx] * inv + r * alpha) | 0;
    this.data[idx + 1] = (this.data[idx + 1] * inv + g * alpha) | 0;
    this.data[idx + 2] = (this.data[idx + 2] * inv + b * alpha) | 0;
    this.data[idx + 3] = 255;
  }

  addPixelRGB(x, y, r, g, b, intensity = 1) {
    if (intensity <= 0) return;
    const ix = x | 0;
    const iy = y | 0;
    if (ix < this.clipX0 || ix >= this.clipX1 || iy < this.clipY0 || iy >= this.clipY1) return;
    const idx = (iy * this.width + ix) << 2;
    this.data[idx] = Math.min(255, (this.data[idx] + r * intensity) | 0);
    this.data[idx + 1] = Math.min(255, (this.data[idx + 1] + g * intensity) | 0);
    this.data[idx + 2] = Math.min(255, (this.data[idx + 2] + b * intensity) | 0);
  }

  pset(x, y, color, alpha = 1) {
    const [r, g, b, a] = this.parseColor(color);
    this.blendPixelRGB(Math.round(x), Math.round(y), r, g, b, a * alpha);
  }

  fillRect(x, y, w, h, color, alpha = 1) {
    const [r, g, b, a] = this.parseColor(color);
    const fa = a * alpha;
    if (fa <= 0) return;
    const x0 = Math.max(this.clipX0, Math.round(x));
    const y0 = Math.max(this.clipY0, Math.round(y));
    const x1 = Math.min(this.clipX1, Math.round(x + w));
    const y1 = Math.min(this.clipY1, Math.round(y + h));
    if (fa >= 0.999) {
      for (let py = y0; py < y1; py++) {
        let idx = (py * this.width + x0) << 2;
        for (let px = x0; px < x1; px++) {
          this.data[idx] = r;
          this.data[idx + 1] = g;
          this.data[idx + 2] = b;
          this.data[idx + 3] = 255;
          idx += 4;
        }
      }
    } else {
      for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
          this.blendPixelRGB(px, py, r, g, b, fa);
        }
      }
    }
  }

  strokeRect(x, y, w, h, color, alpha = 1) {
    const rx = Math.round(x), ry = Math.round(y), rw = Math.round(w), rh = Math.round(h);
    this.fillRect(rx, ry, rw, 1, color, alpha);
    this.fillRect(rx, ry + rh - 1, rw, 1, color, alpha);
    this.fillRect(rx, ry, 1, rh, color, alpha);
    this.fillRect(rx + rw - 1, ry, 1, rh, color, alpha);
  }

  // Authentic 16-bit Bayer 4x4 ordered dithering vertical multi-stop gradient
  fillDitherGradient(x, y, w, h, stops) {
    const parsed = stops.map((s) => this.parseColor(s));
    const nSeg = parsed.length - 1;
    const x0 = Math.max(this.clipX0, Math.round(x));
    const y0 = Math.max(this.clipY0, Math.round(y));
    const x1 = Math.min(this.clipX1, Math.round(x + w));
    const y1 = Math.min(this.clipY1, Math.round(y + h));
    const rh = Math.max(1, h - 1);

    for (let py = y0; py < y1; py++) {
      const tGlobal = Math.max(0, Math.min(1, (py - y) / rh)) * nSeg;
      const seg = Math.min(nSeg - 1, Math.floor(tGlobal));
      const tLocal = tGlobal - seg;
      const cA = parsed[seg];
      const cB = parsed[seg + 1];
      const bayerRow = BAYER_4X4[py & 3];

      for (let px = x0; px < x1; px++) {
        const threshold = (bayerRow[px & 3] + 0.5) / 16;
        // Quantize into discrete dithered steps for authentic 16-bit band feel
        const c = tLocal > threshold ? cB : cA;
        this.setPixelRGB(px, py, c[0], c[1], c[2]);
      }
    }
  }

  drawLine(x0, y0, x1, y1, color, alpha = 1) {
    let ix0 = Math.round(x0), iy0 = Math.round(y0);
    const ix1 = Math.round(x1), iy1 = Math.round(y1);
    const dx = Math.abs(ix1 - ix0);
    const dy = Math.abs(iy1 - iy0);
    const sx = ix0 < ix1 ? 1 : -1;
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx - dy;
    const [r, g, b, a] = this.parseColor(color);
    const fa = a * alpha;
    while (true) {
      this.blendPixelRGB(ix0, iy0, r, g, b, fa);
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = err * 2;
      if (e2 > -dy) { err -= dy; ix0 += sx; }
      if (e2 < dx) { err += dx; iy0 += sy; }
    }
  }

  fillCircle(cx, cy, radius, color, alpha = 1) {
    const icx = Math.round(cx), icy = Math.round(cy);
    const r = Math.round(radius);
    const r2 = r * r;
    const [cr, cg, cb, ca] = this.parseColor(color);
    const fa = ca * alpha;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r2) {
          this.blendPixelRGB(icx + dx, icy + dy, cr, cg, cb, fa);
        }
      }
    }
  }

  // Ordered-dithered warm radial light halo (pixel-art authentic!)
  addGlowCircle(cx, cy, radius, color, maxIntensity = 0.35) {
    const icx = Math.round(cx), icy = Math.round(cy);
    const r = Math.round(radius);
    const r2 = r * r;
    const [cr, cg, cb] = this.parseColor(color);
    for (let dy = -r; dy <= r; dy++) {
      const py = icy + dy;
      if (py < this.clipY0 || py >= this.clipY1) continue;
      const bayerRow = BAYER_4X4[py & 3];
      for (let dx = -r; dx <= r; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const px = icx + dx;
        if (px < this.clipX0 || px >= this.clipX1) continue;
        const falloff = 1 - Math.sqrt(d2) / r;
        const thresh = (bayerRow[px & 3] + 0.5) / 16;
        const step = falloff > thresh * 0.65 ? falloff : falloff * 0.5;
        this.addPixelRGB(px, py, cr, cg, cb, step * maxIntensity);
      }
    }
  }

  // Diagonal warm sunbeam shaft
  drawSunbeam(xTop, widthTop, yTop, xBot, widthBot, yBot, color, intensity = 0.2) {
    const [cr, cg, cb] = this.parseColor(color);
    const h = Math.max(1, yBot - yTop);
    for (let py = Math.max(this.clipY0, yTop | 0); py < Math.min(this.clipY1, yBot | 0); py++) {
      const t = (py - yTop) / h;
      const lx = Math.round(xTop + (xBot - xTop) * t);
      const rw = Math.round(widthTop + (widthBot - widthTop) * t);
      const fade = (1 - t * 0.55) * intensity;
      const bayerRow = BAYER_4X4[py & 3];
      for (let px = lx; px < lx + rw; px++) {
        const edgeDist = Math.min(px - lx, lx + rw - 1 - px);
        if (edgeDist < 2 && bayerRow[px & 3] > 8) continue;
        this.addPixelRGB(px, py, cr, cg, cb, fade);
      }
    }
  }

  // Render character-matrix pixel sprite
  drawSprite(x, y, rows, palette, opts = {}) {
    const flipX = !!opts.flipX;
    const scale = opts.scale || 1;
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;
    const ox = Math.round(x);
    const oy = Math.round(y);
    const h = rows.length;
    const w = rows[0] ? rows[0].length : 0;

    if (opts.groundShadow) {
      const sw = Math.round(w * scale * 0.68);
      const sx = ox + Math.round((w * scale - sw) / 2);
      const sy = oy + h * scale - 1;
      this.fillRect(sx, sy, sw, 2 * scale, '#1c1216', 0.35 * alpha);
    }

    for (let r = 0; r < h; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.' || ch === ' ') continue;
        const hex = palette[ch];
        if (!hex) continue;
        const [cr, cg, cb, ca] = this.parseColor(hex);
        const col = flipX ? (w - 1 - c) : c;
        if (scale === 1) {
          this.blendPixelRGB(ox + col, oy + r, cr, cg, cb, ca * alpha);
        } else {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              this.blendPixelRGB(ox + col * scale + sx, oy + r * scale + sy, cr, cg, cb, ca * alpha);
            }
          }
        }
      }
    }
  }

  // Classic warm 16-bit handheld Dating-Sim / RPG Window (Tokimeki / Harvest Moon style)
  drawRpgWindow(x, y, w, h, opts = {}) {
    const rx = Math.round(x), ry = Math.round(y), rw = Math.round(w), rh = Math.round(h);
    const alpha = opts.alpha !== undefined ? opts.alpha : 0.95;
    const outer = opts.outerColor || '#3b231e';
    const frame = opts.frameColor || '#c98a4b';
    const highlight = opts.highlightColor || '#f7d89c';
    const bgTop = opts.bgTop || '#fff7e4';
    const bgBot = opts.bgBot || '#f5e2be';

    // Drop shadow
    this.fillRect(rx + 2, ry + 2, rw, rh, '#180e12', 0.42 * alpha);

    // Rounded pixel silhouette (cut 1px corners)
    this.fillRect(rx + 1, ry, rw - 2, rh, outer, alpha);
    this.fillRect(rx, ry + 1, rw, rh - 2, outer, alpha);

    // Warm wood/gold frame
    this.fillRect(rx + 1, ry + 1, rw - 2, rh - 2, frame, alpha);
    this.fillRect(rx + 2, ry + 1, rw - 4, 1, highlight, alpha);
    this.fillRect(rx + 1, ry + 2, 1, rh - 4, highlight, alpha);

    // Inner dark line
    this.fillRect(rx + 2, ry + 2, rw - 4, rh - 4, outer, alpha);

    // Warm cream interior fill
    this.fillRect(rx + 3, ry + 3, rw - 6, rh - 6, bgTop, alpha);
    this.fillRect(rx + 3, ry + Math.floor(rh * 0.55), rw - 6, rh - 6 - Math.floor(rh * 0.55) + 3, bgBot, alpha);

    // Cute pixel corner rivets
    const stud = opts.studColor || '#fae3ac';
    this.pset(rx + 2, ry + 2, stud, alpha);
    this.pset(rx + rw - 3, ry + 2, stud, alpha);
    this.pset(rx + 2, ry + rh - 3, stud, alpha);
    this.pset(rx + rw - 3, ry + rh - 3, stud, alpha);
  }

  // Fluffy flat-bottomed 16-bit pixel cloud
  drawPixelCloud(x, y, variant = 0, mainColor = '#fff4dc', shadeColor = '#f2cba0', alpha = 1) {
    const puffs = variant === 0
      ? [[8, 4, 6], [16, 2, 8], [26, 4, 6], [33, 6, 4]]
      : variant === 1
      ? [[6, 5, 5], [13, 3, 6], [21, 5, 5]]
      : [[10, 5, 7], [20, 1, 9], [31, 3, 7], [40, 6, 5]];
    const maxX = puffs[puffs.length - 1][0] + puffs[puffs.length - 1][2];
    // Shade base
    for (const [px, py, pr] of puffs) {
      this.fillCircle(x + px, y + py + 1, pr, shadeColor, alpha);
    }
    for (const [px, py, pr] of puffs) {
      this.fillCircle(x + px, y + py, pr, mainColor, alpha);
    }
    // Clean flat pixel bottom
    this.fillRect(x + 3, y + 6, maxX - 4, 3, shadeColor, alpha);
    this.fillRect(x + 4, y + 5, maxX - 6, 2, mainColor, alpha);
  }

  // Layered swaying 16-bit foliage tree
  drawPixelTree(x, yBottom, height = 46, opts = {}) {
    const sway = opts.sway || 0;
    const trunkColor = opts.trunkColor || '#5e3b2c';
    const trunkShade = opts.trunkShade || '#3d241b';
    const cDark = opts.cDark || '#3c6e47';
    const cMid = opts.cMid || '#5c9c57';
    const cLight = opts.cLight || '#94c969';

    const trunkW = Math.max(4, Math.round(height * 0.14));
    const trunkH = Math.round(height * 0.42);
    this.fillRect(x - (trunkW >> 1), yBottom - trunkH, trunkW, trunkH, trunkColor);
    this.fillRect(x - (trunkW >> 1), yBottom - trunkH, Math.max(1, trunkW >> 1), trunkH, trunkShade);

    const cy = yBottom - trunkH - Math.round(height * 0.25);
    const r = Math.round(height * 0.34);
    const blobs = [
      [-r * 0.65, r * 0.2, r * 0.68],
      [r * 0.65, r * 0.22, r * 0.65],
      [0, -r * 0.35, r * 0.8],
      [-r * 0.35, -r * 0.1, r * 0.65],
      [r * 0.35, -r * 0.08, r * 0.65],
    ];
    for (const [bx, by, br] of blobs) {
      this.fillCircle(x + bx + sway, cy + by + 2, br, cDark);
    }
    for (const [bx, by, br] of blobs) {
      this.fillCircle(x + bx + sway, cy + by, br * 0.9, cMid);
    }
    for (const [bx, by, br] of blobs) {
      this.fillCircle(x + bx + sway - 1, cy + by - 2, br * 0.58, cLight);
    }
  }

  // Sagging pixel power line / catenary wire
  drawCatenary(x0, y0, x1, y1, sag, color, alpha = 0.8) {
    const steps = Math.max(1, Math.abs(x1 - x0));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = Math.round(x0 + (x1 - x0) * t);
      const py = Math.round(y0 + (y1 - y0) * t + sag * 4 * t * (1 - t));
      this.pset(px, py, color, alpha);
    }
  }
}

module.exports = { PixelCanvas, BAYER_4X4 };
