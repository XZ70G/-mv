const fs = require('fs');

class BdfFont {
  constructor(bdfPath) {
    this.glyphs = new Map();
    this.ascent = 10;
    this.descent = 2;
    this.pixelSize = 12;
    this._parse(bdfPath);
  }

  _parse(bdfPath) {
    const content = fs.readFileSync(bdfPath, 'utf8');
    const lines = content.split(/\r?\n/);

    let inChar = false;
    let inBitmap = false;
    let encoding = -1;
    let dwidth = 8;
    let bbxW = 0, bbxH = 0, bbxX = 0, bbxY = 0;
    let bitmapRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!inChar) {
        if (line.startsWith('STARTCHAR')) {
          inChar = true;
          inBitmap = false;
          encoding = -1;
          bitmapRows = [];
        } else if (line.startsWith('FONT_ASCENT ')) {
          this.ascent = parseInt(line.slice(12), 10);
        } else if (line.startsWith('FONT_DESCENT ')) {
          this.descent = parseInt(line.slice(13), 10);
        } else if (line.startsWith('PIXEL_SIZE ')) {
          this.pixelSize = parseInt(line.slice(11), 10);
        }
      } else {
        if (line === 'ENDCHAR') {
          if (encoding >= 0) {
            this.glyphs.set(encoding, {
              dwidth,
              w: bbxW,
              h: bbxH,
              xoff: bbxX,
              yoff: bbxY,
              rows: bitmapRows,
            });
          }
          inChar = false;
          inBitmap = false;
        } else if (inBitmap) {
          const hexBits = line.length * 4;
          const val = parseInt(line, 16) || 0;
          // Store packed bitmask from MSB
          bitmapRows.push({ val, hexBits });
        } else if (line === 'BITMAP') {
          inBitmap = true;
        } else if (line.startsWith('ENCODING ')) {
          encoding = parseInt(line.slice(9), 10);
        } else if (line.startsWith('DWIDTH ')) {
          dwidth = parseInt(line.slice(7).split(' ')[0], 10);
        } else if (line.startsWith('BBX ')) {
          const parts = line.slice(4).split(' ');
          bbxW = parseInt(parts[0], 10);
          bbxH = parseInt(parts[1], 10);
          bbxX = parseInt(parts[2], 10);
          bbxY = parseInt(parts[3], 10);
        }
      }
    }
  }

  measureText(text, scale = 1, letterSpacing = 0) {
    let width = 0;
    const chars = Array.from(text);
    for (let i = 0; i < chars.length; i++) {
      const code = chars[i].codePointAt(0);
      const g = this.glyphs.get(code) || this.glyphs.get(32);
      width += (g ? g.dwidth : this.pixelSize) * scale;
      if (i < chars.length - 1) width += letterSpacing;
    }
    return width;
  }

  drawText(canvas, text, x, y, color, opts = {}) {
    const scale = opts.scale || 1;
    const letterSpacing = opts.letterSpacing || 0;
    const align = opts.align || 'left';
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;
    if (alpha <= 0.01 || !text) return 0;

    const totalWidth = this.measureText(text, scale, letterSpacing);
    let startX = Math.round(x);
    if (align === 'center') startX = Math.round(x - totalWidth / 2);
    else if (align === 'right') startX = Math.round(x - totalWidth);
    const startY = Math.round(y);

    if (opts.outlineColor) {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]];
      for (const [dx, dy] of dirs) {
        this._renderGlyphs(canvas, text, startX + dx, startY + dy, opts.outlineColor, scale, letterSpacing, alpha * 0.95);
      }
    } else if (opts.shadowColor) {
      const sx = opts.shadowDx !== undefined ? opts.shadowDx : 1;
      const sy = opts.shadowDy !== undefined ? opts.shadowDy : 1;
      this._renderGlyphs(canvas, text, startX + sx, startY + sy, opts.shadowColor, scale, letterSpacing, alpha * 0.9);
    }

    this._renderGlyphs(canvas, text, startX, startY, color, scale, letterSpacing, alpha);
    return totalWidth;
  }

  _renderGlyphs(canvas, text, startX, startY, color, scale, letterSpacing, alpha) {
    let cursorX = startX;
    const chars = Array.from(text);
    const rgba = canvas.parseColor(color);

    for (let i = 0; i < chars.length; i++) {
      const code = chars[i].codePointAt(0);
      const g = this.glyphs.get(code);
      if (!g) {
        cursorX += Math.round(this.pixelSize * 0.5) * scale + letterSpacing;
        continue;
      }

      const gx = cursorX + g.xoff * scale;
      const gy = startY + (this.ascent - g.yoff - g.h) * scale;

      for (let r = 0; r < g.h; r++) {
        const { val, hexBits } = g.rows[r];
        if (val === 0) continue;
        for (let c = 0; c < g.w; c++) {
          if ((val >>> (hexBits - 1 - c)) & 1) {
            if (scale === 1) {
              canvas.blendPixelRGB(gx + c, gy + r, rgba[0], rgba[1], rgba[2], alpha);
            } else {
              for (let sy = 0; sy < scale; sy++) {
                for (let sx = 0; sx < scale; sx++) {
                  canvas.blendPixelRGB(gx + c * scale + sx, gy + r * scale + sy, rgba[0], rgba[1], rgba[2], alpha);
                }
              }
            }
          }
        }
      }

      cursorX += g.dwidth * scale + letterSpacing;
    }
  }
}

module.exports = { BdfFont };
