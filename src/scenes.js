const {
  GIRL_PALETTE,
  BOY_PALETTE,
  CAT_PALETTE,
  PAPER_PLANE,
  PLANE_PALETTE,
  getGirlSprite,
  getBoySprite,
  getCatSprite,
  drawEmoteBubble,
  drawPixelUmbrella,
} = require('./sprites');
const { getProgression, getSceneAt, getLyricAt, getToastAt } = require('./lyrics');
const { BAYER_4X4 } = require('./pixelCanvas');

// Deterministic pseudo-random [0, 1)
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpColorHex(c1, c2, t) {
  const p1 = [
    parseInt(c1.slice(1, 3), 16),
    parseInt(c1.slice(3, 5), 16),
    parseInt(c1.slice(5, 7), 16),
  ];
  const p2 = [
    parseInt(c2.slice(1, 3), 16),
    parseInt(c2.slice(3, 5), 16),
    parseInt(c2.slice(5, 7), 16),
  ];
  const u = Math.max(0, Math.min(1, t));
  const r = Math.round(p1[0] + (p2[0] - p1[0]) * u).toString(16).padStart(2, '0');
  const g = Math.round(p1[1] + (p2[1] - p1[1]) * u).toString(16).padStart(2, '0');
  const b = Math.round(p1[2] + (p2[2] - p1[2]) * u).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// Helper: blink eye cycle
function getBlinkState(t, offset = 0) {
  const cycle = (t + offset) % 3.6;
  return cycle > 3.42 ? 'blink' : 'open';
}

// Helper: draw colorful pixel bookshelf
function drawBookshelf(canvas, x, y, w, h, seedBase = 1) {
  canvas.fillRect(x, y, w, h, '#4a2c22');
  canvas.strokeRect(x, y, w, h, '#2e1a14');
  canvas.fillRect(x + 1, y + 1, w - 2, 1, '#7a4d3b');
  const bookColors = ['#c95b50', '#5b8c6a', '#d99b43', '#4f6d96', '#e8d5b5', '#9c5f7e', '#789c54'];
  const shelves = 4;
  const shelfH = Math.floor((h - 4) / shelves);
  for (let s = 0; s < shelves; s++) {
    const sy = y + 3 + s * shelfH;
    canvas.fillRect(x + 2, sy, w - 4, shelfH - 2, '#2d1914');
    let bx = x + 3;
    let bIdx = 0;
    while (bx < x + w - 5) {
      const r = hash(seedBase * 100 + s * 31 + bIdx);
      const bw = 2 + Math.floor(r * 2.4);
      const bh = shelfH - 4 - Math.floor(hash(seedBase * 77 + s * 19 + bIdx) * 3);
      const col = bookColors[(s * 5 + bIdx + seedBase) % bookColors.length];
      canvas.fillRect(bx, sy + (shelfH - 2 - bh), bw, bh, col);
      canvas.fillRect(bx, sy + (shelfH - 2 - bh), 1, bh, '#ffffff', 0.16);
      bx += bw + (r > 0.82 ? 2 : 1);
      bIdx++;
    }
    canvas.fillRect(x + 1, sy + shelfH - 2, w - 2, 2, '#694131');
    canvas.fillRect(x + 1, sy + shelfH - 2, w - 2, 1, '#875742');
  }
}

// ============================================================================
// SCENE 0: INTRO - 2000s Handheld Dating-Sim Title & Campus Balconies (0-17s)
// ============================================================================
function renderIntroScene(canvas, fonts, t, audio) {
  // Warm golden-apricot Y2K afternoon sky across entire height
  canvas.fillDitherGradient(0, 0, 320, 180, ['#de7e49', '#f2ad63', '#fbd992', '#fff4cc']);

  // Distant sunlit campus skyline
  for (let i = 0; i < 14; i++) {
    const bx = i * 24 - 4;
    const bh = 24 + Math.floor(hash(i * 7) * 24);
    canvas.fillRect(bx, 152 - bh, 22, bh, '#e3aa74');
    canvas.fillRect(bx + 2, 152 - bh, 18, 1, '#f7cea0');
  }
  // Courtyard warm brick wall & foliage at bottom center
  canvas.fillRect(80, 146, 160, 34, '#c78b5e');
  const sway = Math.round(Math.sin(t * 2.2));
  canvas.drawPixelTree(96, 184, 46, { sway });
  canvas.drawPixelTree(160, 186, 48, { sway: -sway });
  canvas.drawPixelTree(224, 184, 46, { sway });

  // Scrolling warm pixel clouds
  canvas.drawPixelCloud(((t * 6) % 360) - 40, 22, 0, '#fff7e6', '#f2c898');
  canvas.drawPixelCloud(((t * 4.5 + 190) % 360) - 40, 36, 1, '#fff7e6', '#f2c898');

  // Swaying camphor foliage framing left & right
  canvas.drawPixelTree(18, 165, 58, { sway });
  canvas.drawPixelTree(302, 165, 58, { sway: -sway });

  // Left Balcony (Her City) & Right Balcony (His City)
  // Left rooftop terrace
  canvas.fillRect(0, 132, 86, 48, '#6e473b');
  canvas.fillRect(0, 130, 88, 4, '#9c6852');
  for (let rx = 6; rx < 84; rx += 8) {
    canvas.fillRect(rx, 118, 2, 12, '#4a2e26');
  }
  canvas.fillRect(0, 117, 86, 2, '#5e3b31');

  // Right rooftop terrace
  canvas.fillRect(234, 132, 86, 48, '#4b526e');
  canvas.fillRect(232, 130, 88, 4, '#6d789c');
  for (let rx = 238; rx < 316; rx += 8) {
    canvas.fillRect(rx, 118, 2, 12, '#32384d');
  }
  canvas.fillRect(234, 117, 86, 2, '#424963');

  // Girl on left balcony, Boy on right balcony
  const girlSprite = getGirlSprite({ pose: 'stand', eye: getBlinkState(t, 0.3) });
  const boySprite = getBoySprite({ pose: 'stand', eye: getBlinkState(t, 1.4) });
  canvas.drawSprite(42, 107, girlSprite, GIRL_PALETTE, { groundShadow: true });
  canvas.drawSprite(260, 107, boySprite, BOY_PALETTE, { flipX: true, groundShadow: true });

  const bob = Math.round(Math.sin(t * 4) * 1);
  if (t > 2.0) {
    drawEmoteBubble(canvas, 51, 105, 'music', bob);
    drawEmoteBubble(canvas, 269, 105, 'mail', -bob);
  }

  // Dotted flight arc connecting them + paper plane
  for (let i = 0; i <= 26; i++) {
    const u = i / 26;
    const ax = Math.round(64 + u * 192);
    const ay = Math.round(98 - Math.sin(u * Math.PI) * 76);
    if ((i + Math.floor(t * 6)) % 2 === 0) {
      canvas.pset(ax, ay, '#fff8e3', 0.8);
    }
  }
  const planeU = (t * 0.14) % 1;
  const px = Math.round(64 + planeU * 192) - 5;
  const py = Math.round(98 - Math.sin(planeU * Math.PI) * 76) - 3;
  canvas.drawSprite(px, py, PAPER_PLANE, PLANE_PALETTE);

  // Floating leaves/petals
  for (let i = 0; i < 14; i++) {
    const lx = ((hash(i * 13) * 320 + t * (10 + (i % 5) * 3)) % 330) - 5;
    const ly = ((hash(i * 29) * 170 + t * (8 + (i % 4) * 2)) % 180);
    canvas.fillRect(lx, ly, 2, 1, i % 2 === 0 ? '#a8d472' : '#ffe399', 0.85);
  }

  // Ornate RPG Title Plaque (fades in smoothly over first 1.5s)
  const titleAlpha = Math.min(1, t / 1.2);
  canvas.drawRpgWindow(72, 26, 176, 68, {
    alpha: titleAlpha * 0.96,
    frameColor: '#d9984a',
    bgTop: '#fff9eb',
    bgBot: '#f5e0b5',
  });
  fonts.f8.drawText(canvas, '★ MILLENNIUM LOVE RPG · 2000 ★', 160, 32, '#9e6030', {
    align: 'center',
    alpha: titleAlpha,
  });
  // 2x scaled chunky 24px pixel title!
  fonts.f12.drawText(canvas, '爱情证书', 160, 44, '#d96b38', {
    scale: 2,
    letterSpacing: 4,
    align: 'center',
    outlineColor: '#3b1e1a',
    alpha: titleAlpha,
  });
  fonts.f10.drawText(canvas, '孙燕姿 · Stefanie Sun', 160, 75, '#59362b', {
    align: 'center',
    alpha: titleAlpha,
  });

  // Handheld RPG Start Menu box
  if (t > 1.5) {
    const isPressed = t > 15.2;
    const blinkShow = !isPressed || Math.floor(t * 14) % 2 === 0;
    canvas.drawRpgWindow(96, 102, 128, 36, {
      alpha: 0.94,
      bgTop: '#382321',
      bgBot: '#291817',
      frameColor: '#e0a253',
      outerColor: '#1a0e0e',
    });
    if (blinkShow) {
      fonts.f10.drawText(canvas, '▶ 开始修学分 START', 106, 108, '#ffe494', {
        shadowColor: '#1a0e0e',
      });
    }
    fonts.f8.drawText(canvas, '   异地距离：1,420 km', 106, 122, '#d4b89e');
  }

  // Gentle fade-in from black at t=0..1.0
  if (t < 1.0) {
    canvas.fillRect(0, 0, 320, 180, '#171014', 1 - t);
  }
}

// ============================================================================
// SCENE 1: HER GOLDEN SUNSET LIBRARY (17-33s) - "寂寞当然有一点 / 总是特别想念你的脸"
// ============================================================================
function renderLibraryScene(canvas, fonts, t, localT, audio) {
  // Warm mahogany wood library back wall
  canvas.fillRect(0, 0, 320, 118, '#543528');
  canvas.fillRect(0, 0, 320, 20, '#3d251c');
  // Wainscoting & floor
  canvas.fillRect(0, 102, 320, 16, '#42281e');
  canvas.fillDitherGradient(0, 118, 320, 62, ['#784c36', '#613b29', '#4a2c1f']);
  for (let fy = 122; fy < 180; fy += 8) {
    canvas.fillRect(0, fy, 320, 1, '#3b2218', 0.45);
  }

  // 3 Detailed Pixel Bookshelves on left & mid
  drawBookshelf(canvas, 10, 24, 48, 84, 1);
  drawBookshelf(canvas, 64, 24, 48, 84, 2);
  drawBookshelf(canvas, 118, 24, 48, 84, 3);

  // 2 Tall Sunset Windows on right (x=182..240, x=248..306)
  const winBoxes = [[182, 22, 58, 76], [248, 22, 58, 76]];
  for (const [wx, wy, ww, wh] of winBoxes) {
    canvas.fillRect(wx - 3, wy - 3, ww + 6, wh + 6, '#382018');
    canvas.setClip(wx, wy, ww, wh);
    canvas.fillDitherGradient(wx, wy, ww, wh, ['#d96e48', '#f5aa5b', '#ffe299']);
    // Sunset campus silhouettes & swaying trees outside window
    canvas.fillRect(wx + 8, wy + 48, 16, 30, '#9e533e');
    // Clocktower spire in second window
    if (wx > 200) {
      canvas.fillRect(wx + 28, wy + 32, 10, 44, '#8c4738');
      canvas.fillRect(wx + 31, wy + 26, 4, 6, '#8c4738');
      canvas.fillRect(wx + 31, wy + 36, 4, 4, '#fff1bd');
    }
    canvas.drawPixelCloud(wx + ((t * 2) % 60) - 20, wy + 12, 1, '#fff5de', '#f2ba85');
    canvas.drawPixelTree(wx + 14, wy + 84, 34, {
      sway: Math.round(Math.sin(t * 2)),
      cDark: '#6e4230',
      cMid: '#a6633c',
      cLight: '#e09b53',
    });
    canvas.drawPixelTree(wx + 46, wy + 86, 30, {
      sway: -Math.round(Math.sin(t * 2)),
      cDark: '#6e4230',
      cMid: '#a6633c',
      cLight: '#e09b53',
    });
    canvas.resetClip();

    // Window wooden mullions & sill
    canvas.strokeRect(wx, wy, ww, wh, '#4a2b20');
    canvas.fillRect(wx + Math.floor(ww / 2) - 1, wy, 2, wh, '#4a2b20');
    canvas.fillRect(wx, wy + Math.floor(wh * 0.48), ww, 2, '#4a2b20');
    canvas.fillRect(wx - 4, wy + wh, ww + 8, 4, '#6e4331');
    canvas.fillRect(wx - 4, wy + wh, ww + 8, 1, '#9c6549');
  }

  // Diagonal warm golden sunbeams pulsing gently with acoustic guitar!
  const beamGlow = 0.17 + audio.rms * 0.08;
  canvas.drawSunbeam(186, 48, 26, 110, 74, 136, '#ffd27d', beamGlow);
  canvas.drawSunbeam(252, 48, 26, 178, 76, 136, '#ffd27d', beamGlow);

  // Sunlit rug & sleeping orange cat 小橘!
  canvas.fillRect(236, 122, 52, 12, '#b8644f');
  canvas.strokeRect(237, 123, 50, 10, '#e6a97e');
  canvas.drawSprite(254, 117, getCatSprite(true, 0), CAT_PALETTE);
  if (Math.floor(t * 1.5) % 2 === 0) {
    fonts.f8.drawText(canvas, 'z', 268, 111 - Math.round((t * 4) % 5), '#ffe6b3', { alpha: 0.75 });
  }

  // Empty wooden chair on left (symbolizing "你不在我身边")
  canvas.fillRect(92, 103, 14, 18, '#593425');
  canvas.strokeRect(92, 103, 14, 12, '#381f16');
  canvas.fillRect(93, 120, 3, 10, '#42251a');
  canvas.fillRect(103, 120, 3, 10, '#42251a');

  // Girl's wooden chair & Girl Chibi Sprite sitting wistfully
  canvas.fillRect(145, 103, 15, 18, '#593425');
  const girlPose = localT > 8.0 ? 'sit_write' : 'sit_chin';
  const girlSprite = getGirlSprite({ pose: girlPose, eye: getBlinkState(t, 0.5) });
  canvas.drawSprite(142, 95, girlSprite, GIRL_PALETTE);

  // Study Table in front/beside
  canvas.fillRect(84, 114, 112, 6, '#8f5a3c');
  canvas.fillRect(84, 114, 112, 1, '#bd8258');
  canvas.fillRect(88, 120, 5, 16, '#5c3726');
  canvas.fillRect(187, 120, 5, 16, '#5c3726');

  // Open notebook, tiny photo sticker & silver flip phone on table
  canvas.fillRect(126, 110, 16, 4, '#fff9eb');
  canvas.fillRect(133, 110, 1, 4, '#ccb99e');
  canvas.pset(129, 111, '#e85d6b'); // little heart sticker in notebook!
  // Silver flip phone
  canvas.fillRect(114, 111, 6, 3, '#c5d0db');
  if (Math.floor(t * 2) % 3 === 0) {
    canvas.pset(116, 111, '#9be7ff');
  }

  // Emote bubble above Girl
  const bob = Math.round(Math.sin(t * 3.5));
  drawEmoteBubble(canvas, 151, 93, localT < 6.0 ? 'ellipsis' : 'heart', bob);

  // Floating golden dust motes in sunbeams
  for (let i = 0; i < 18; i++) {
    const mx = 115 + ((hash(i * 17) * 185 + Math.sin(t + i) * 6) % 185);
    const my = 28 + ((hash(i * 31) * 100 - t * 3.5 + 200) % 100);
    const twinkle = 0.35 + 0.55 * Math.abs(Math.sin(t * 2.5 + i));
    canvas.pset(mx, my, '#fff4bd', twinkle);
  }
}

// ============================================================================
// SCENE 2: HIS RAINY NIGHT 24H MART & PHONE BOOTH (33-48s) - "距离是一份考卷"
// ============================================================================
function renderRainyBoyScene(canvas, fonts, t, localT, audio) {
  // Cozy indigo night sky
  canvas.fillDitherGradient(0, 0, 320, 116, ['#161c30', '#232e4d', '#314066']);

  // Background apartment silhouettes with warm lit pixel windows
  const bldgs = [[4, 28, 38, 88], [46, 38, 36, 78], [292, 24, 30, 92]];
  for (const [bx, by, bw, bh] of bldgs) {
    canvas.fillRect(bx, by, bw, bh, '#1c243b');
    for (let wy = by + 6; wy < by + bh - 16; wy += 10) {
      for (let wx = bx + 5; wx < bx + bw - 6; wx += 9) {
        if (hash(wx * 13 + wy * 7) > 0.42) {
          canvas.fillRect(wx, wy, 4, 5, '#f2c16b', 0.72);
        } else {
          canvas.fillRect(wx, wy, 4, 5, '#283352');
        }
      }
    }
  }

  // Sidewalk curb
  canvas.fillRect(0, 114, 320, 6, '#48526b');
  canvas.fillRect(0, 114, 320, 1, '#687594');

  // Wet asphalt street (y=120..180)
  canvas.fillDitherGradient(0, 120, 320, 60, ['#1e253b', '#171d2e', '#121624']);

  // Vintage Green Public Phone Booth (x=28..64, y=56..115)
  canvas.fillRect(28, 56, 34, 59, '#2c5e4f');
  canvas.fillRect(26, 53, 38, 4, '#3e826d');
  canvas.fillRect(32, 62, 26, 48, '#f5c76e', 0.82); // warm lit glass interior
  // Payphone box inside
  canvas.fillRect(40, 76, 10, 14, '#3a8c5c');
  canvas.fillRect(42, 78, 6, 4, '#b8ebd0');
  // Mullions
  canvas.strokeRect(31, 61, 28, 50, '#22473c');
  canvas.fillRect(31, 78, 28, 1, '#22473c');
  canvas.fillRect(31, 95, 28, 1, '#22473c');
  canvas.addGlowCircle(45, 82, 28, '#ffcf70', 0.22);

  // 24H Convenience Store (x=88..266, y=44..115)
  canvas.fillRect(88, 44, 178, 71, '#4a3d42');
  // Iconic Y2K warm striped convenience store fascia!
  canvas.fillRect(84, 42, 186, 13, '#fff7e6');
  canvas.fillRect(84, 44, 186, 3, '#eb7b3b');
  canvas.fillRect(84, 48, 186, 3, '#3b9c6e');
  canvas.fillRect(84, 52, 186, 2, '#d94848');
  fonts.f8.drawText(canvas, '24H MART', 155, 44, '#2d1e1b');

  // Warm glowing convenience store windows & shelves inside
  const storeWins = [[96, 60, 52, 50], [154, 60, 50, 50], [210, 60, 48, 50]];
  for (const [swx, swy, sww, swh] of storeWins) {
    canvas.fillRect(swx, swy, sww, swh, '#ffe39e');
    canvas.fillRect(swx, swy, sww, 8, '#f5c469');
    // Colorful snack shelves inside store
    for (let sy = swy + 16; sy < swy + swh - 6; sy += 9) {
      canvas.fillRect(swx + 4, sy, sww - 8, 2, '#b88449');
      for (let sx = swx + 5; sx < swx + sww - 7; sx += 5) {
        const c = ['#e35b5b', '#4fa3d9', '#6bbf6b', '#f29f3d'][(sx + sy) % 4];
        canvas.fillRect(sx, sy - 4, 3, 4, c);
      }
    }
    canvas.strokeRect(swx, swy, sww, swh, '#3b2e33');
  }
  canvas.addGlowCircle(177, 88, 75, '#ffc966', 0.16 + audio.rms * 0.06);

  // Glowing Beverage Vending Machine on right (x=272..296)
  canvas.fillRect(272, 66, 24, 49, '#3d6ea8');
  canvas.fillRect(275, 70, 18, 24, '#c7f0ff');
  for (let vx = 277; vx < 291; vx += 4) {
    canvas.fillRect(vx, 73, 2, 7, '#e85d5d');
    canvas.fillRect(vx, 83, 2, 7, '#5bbf7a');
  }
  canvas.fillRect(276, 100, 16, 8, '#233c5c');
  canvas.addGlowCircle(284, 84, 20, '#8ce0ff', 0.2);

  // Shimmering Wet Pavement Reflections!
  for (let py = 121; py < 145; py++) {
    const wave = Math.round(Math.sin(py * 0.8 + t * 6) * 1.5);
    const alpha = (1 - (py - 120) / 28) * 0.34;
    canvas.fillRect(32 + wave, py, 26, 1, '#f5c76e', alpha);
    canvas.fillRect(96 + wave, py, 162, 1, '#ffd478', alpha);
    canvas.fillRect(274 + wave, py, 20, 1, '#8ce0ff', alpha);
  }

  // Boy standing under pixel umbrella looking fondly at glowing flip phone!
  const boyX = 136;
  const boyY = 93;
  const boySprite = getBoySprite({ pose: 'umbrella_phone', eye: getBlinkState(t, 0.9) });
  canvas.drawSprite(boyX, boyY, boySprite, BOY_PALETTE, { groundShadow: true });
  drawPixelUmbrella(canvas, boyX + 8, boyY - 6);
  // Flip phone cyan glow on face
  canvas.addGlowCircle(boyX + 16, boyY + 14, 14, '#8ce6ff', 0.28 + Math.sin(t * 5) * 0.06);

  // Emote bubble above umbrella
  drawEmoteBubble(canvas, boyX + 9, boyY - 7, 'mail', Math.round(Math.sin(t * 3.5)));

  // Puddle ripples on wet street
  for (let i = 0; i < 9; i++) {
    const rx = 20 + Math.floor(hash(i * 41) * 280);
    const ry = 123 + Math.floor(hash(i * 19) * 14);
    const phase = (t * 2.2 + i * 0.37) % 1;
    const rad = Math.floor(phase * 6);
    if (rad > 0) {
      canvas.fillRect(rx - rad, ry, rad * 2, 1, '#9eb8e8', (1 - phase) * 0.55);
    }
  }

  // Slanting pixel raindrops
  for (let i = 0; i < 65; i++) {
    const rx = ((hash(i * 23) * 340 - t * 55 + 1000) % 340) - 10;
    const ry = ((hash(i * 37) * 150 + t * 145) % 142);
    // Stop raindrops hitting inside the umbrella dome!
    if (rx > boyX - 8 && rx < boyX + 22 && ry > boyY - 4 && ry < boyY + 24) continue;
    canvas.drawLine(rx, ry, rx - 1, ry + 4, '#a8c6eb', 0.52);
  }
}

// ============================================================================
// SCENE 3: SPLIT-SCREEN DORM DESKS -> STARRY PAPER PLANE FLIGHT (48-79s)
// ============================================================================
function renderSplitDormScene(canvas, fonts, t, localT, audio) {
  const flyPhase = Math.max(0, Math.min(1, (localT - 17.0) / 3.0)); // after 65s ("等到我们学会飞")

  // LEFT HALF (x=0..158): Her Warm Peach-Amber Bedroom
  canvas.setClip(0, 0, 159, 180);
  canvas.fillDitherGradient(0, 0, 159, 114, ['#613b3a', '#7d4d47', '#965f52']);
  canvas.fillRect(0, 114, 159, 66, '#5c392c'); // wood floor

  // Fairy lights along wall
  for (let fx = 8; fx < 154; fx += 12) {
    const fy = 22 + Math.round(Math.sin(fx * 0.08) * 3);
    canvas.pset(fx, fy, '#fff4b8');
    canvas.addGlowCircle(fx, fy, 6, '#ffcf70', 0.2 + 0.1 * Math.sin(t * 4 + fx));
  }

  // Her window (opens wider to starry night during flyPhase)
  canvas.fillRect(20, 32, 48, 52, '#222947');
  for (let s = 0; s < 8; s++) {
    canvas.pset(24 + ((s * 17) % 40), 36 + ((s * 11) % 42), '#fff6cc', 0.8);
  }
  canvas.strokeRect(20, 32, 48, 52, '#cfa07a');
  canvas.fillRect(43, 32, 2, 52, '#cfa07a');

  // Cozy bed & white pixel bunny plushie on far left
  canvas.fillRect(6, 98, 52, 22, '#e8998d');
  canvas.fillRect(6, 95, 16, 6, '#fff7eb'); // pillow
  canvas.fillRect(8, 89, 6, 6, '#ffffff'); // bunny plushie!
  canvas.fillRect(9, 86, 1, 3, '#ffffff');
  canvas.fillRect(12, 86, 1, 3, '#ffffff');

  // Her Desk & Warm Desk Lamp (x=96..148)
  canvas.fillRect(98, 108, 48, 5, '#9e6847');
  canvas.fillRect(102, 113, 4, 16, '#6e452f');
  canvas.fillRect(140, 113, 4, 16, '#6e452f');
  // Desk lamp
  canvas.fillRect(136, 96, 2, 12, '#d9b466');
  canvas.fillRect(132, 94, 8, 4, '#f5d27a');
  canvas.addGlowCircle(128, 102, 36, '#ffc86b', 0.28 + audio.rms * 0.08);
  // Paper letter on desk
  canvas.fillRect(114, 105, 10, 3, '#fffdf5');

  // Girl writing at desk
  canvas.drawSprite(96, 89, getGirlSprite({ pose: 'sit_write', eye: getBlinkState(t, 0.2) }), GIRL_PALETTE);
  canvas.resetClip();

  // RIGHT HALF (x=161..320): His Cozy Starry Night Room
  canvas.setClip(161, 0, 159, 180);
  canvas.fillDitherGradient(161, 0, 159, 114, ['#26314a', '#344466', '#455980']);
  canvas.fillRect(161, 114, 159, 66, '#3d2f2b');

  // His starry window
  canvas.fillRect(246, 32, 52, 52, '#182038');
  for (let s = 0; s < 10; s++) {
    canvas.pset(250 + ((s * 19) % 44), 36 + ((s * 13) % 42), '#fff6cc', 0.85);
  }
  // Crescent pixel moon
  canvas.fillCircle(284, 45, 5, '#ffe89e');
  canvas.fillCircle(282, 44, 4, '#182038');
  canvas.strokeRect(246, 32, 52, 52, '#6d7ea3');

  // Acoustic guitar leaning against right wall (homage to intro guitar!)
  canvas.fillCircle(298, 108, 6, '#b8733e');
  canvas.fillCircle(298, 102, 4, '#c98249');
  canvas.fillRect(297, 88, 2, 12, '#4a2b1d');

  // His Desk, Lamp & Steaming Mug (x=172..224)
  canvas.fillRect(172, 108, 48, 5, '#7d563f');
  canvas.fillRect(176, 113, 4, 16, '#4f3526');
  canvas.fillRect(214, 113, 4, 16, '#4f3526');
  // Lamp
  canvas.fillRect(178, 96, 2, 12, '#8fb8cc');
  canvas.fillRect(176, 94, 8, 4, '#b8e2f2');
  canvas.addGlowCircle(190, 102, 34, '#ffd485', 0.25 + audio.rms * 0.08);
  // Steaming mug
  canvas.fillRect(190, 103, 4, 5, '#f2ead9');
  const steamY = Math.round((t * 6) % 6);
  canvas.pset(191 + (steamY % 2), 101 - steamY, '#ffffff', 0.55);

  // Boy sitting facing left toward her side!
  canvas.drawSprite(204, 89, getBoySprite({ pose: 'sit_desk', eye: getBlinkState(t, 1.1) }), BOY_PALETTE, { flipX: true });
  canvas.resetClip();

  // Center Wooden Split Divider (dissolves partially at top during flyPhase!)
  const divTop = Math.round(lerp(0, 74, flyPhase));
  canvas.fillRect(158, divTop, 4, 180 - divTop, '#3b231e');
  canvas.fillRect(159, divTop, 2, 180 - divTop, '#d99b52');

  // Phase A (48-65s): Glowing envelopes flying across the split-screen border!
  if (flyPhase < 0.8) {
    const msgCycle = (localT * 0.45) % 1;
    const mx = Math.round(lerp(116, 200, msgCycle));
    const my = Math.round(100 - Math.sin(msgCycle * Math.PI) * 34);
    canvas.fillRect(mx - 4, my - 3, 8, 6, '#fff8e3');
    canvas.strokeRect(mx - 4, my - 3, 8, 6, '#d9823b');
    canvas.pset(mx, my, '#e84a5f');
    canvas.addGlowCircle(mx, my, 10, '#ffe082', 0.35);
  }

  // Phase B (65-79s): Panoramic Starry Night Banner opens across top ("等到我们学会飞")!
  if (flyPhase > 0.02) {
    const bandH = Math.round(74 * flyPhase);
    canvas.setClip(0, 0, 320, bandH);
    canvas.fillDitherGradient(0, 0, 320, 74, ['#171f3d', '#2a3766', '#4c5285', '#8f6b82']);
    for (let i = 0; i < 42; i++) {
      const sx = Math.floor(hash(i * 19) * 318);
      const sy = Math.floor(hash(i * 31) * 66);
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i));
      canvas.pset(sx, sy, '#fff8d6', tw);
    }
    // Soaring 2x Pixel Paper Airplane + golden stardust trail!
    const flightU = ((localT - 17.0) / 14.0) % 1;
    const px = Math.round(lerp(24, 286, flightU));
    const py = Math.round(44 - Math.sin(flightU * Math.PI * 2) * 10);
    for (let tr = 1; tr <= 12; tr++) {
      const tx = px - tr * 5;
      const ty = py + 6 + Math.round(Math.sin(t * 6 + tr) * 1.5);
      canvas.pset(tx, ty, '#ffe38a', (1 - tr / 13) * 0.85);
    }
    canvas.addGlowCircle(px + 8, py + 6, 16, '#ffe596', 0.32);
    canvas.drawSprite(px, py, PAPER_PLANE, PLANE_PALETTE, { scale: 2 });
    canvas.resetClip();
    canvas.fillRect(0, bandH - 1, 320, 1, '#f2c879', flyPhase * 0.8);
  }
}

// ============================================================================
// SCENE 4: APRICOT SUNSET COASTAL TRAIN (79-111s) - Chorus 1!
// ============================================================================
function renderSunsetTrainScene(canvas, fonts, t, localT, audio) {
  // Train carriage warm wood & cream upper interior
  canvas.fillRect(0, 0, 320, 26, '#59372a');
  canvas.fillRect(0, 22, 320, 4, '#8a5942');
  canvas.fillRect(0, 26, 320, 76, '#472b21'); // window wall frame
  canvas.fillRect(0, 102, 320, 38, '#734532'); // wood wainscot
  canvas.fillRect(0, 102, 320, 2, '#ad7252');

  // 3 Wide Panoramic Train Windows
  const windows = [[14, 28, 92, 70], [114, 28, 92, 70], [214, 28, 92, 70]];
  canvas.setClip(14, 28, 292, 70);

  // Layer 1: Breathtaking Apricot-Coral Sunset Sky
  canvas.fillDitherGradient(14, 28, 292, 52, ['#c95953', '#eb8b4e', '#f7be6d', '#fff0ad']);
  // Setting Pixel Sun
  canvas.fillCircle(248, 62, 13, '#fff6c4');
  canvas.addGlowCircle(248, 62, 28, '#ffd275', 0.32);

  // Scrolling golden clouds
  for (let c = 0; c < 4; c++) {
    const cx = 310 - (((t * 12 + c * 95) % 380));
    canvas.drawPixelCloud(cx, 34 + (c % 2) * 10, c % 2, '#ffe9b8', '#eb9c67');
  }

  // Layer 2: Distant undulating coastal mountain ridges (slow parallax)
  for (let px = 14; px < 306; px++) {
    const wx = px + t * 8;
    const h1 = Math.round(8 + Math.sin(wx * 0.032) * 5 + Math.cos(wx * 0.071) * 3);
    const h2 = Math.round(4 + Math.sin(wx * 0.055 + 1.7) * 3);
    canvas.fillRect(px, 76 - h1, 1, h1, '#9e5359');
    canvas.fillRect(px, 76 - h2, 1, h2, '#7d3f4d');
  }

  // Layer 3: Sparkling Sunset Ocean (y=76..98)
  canvas.fillDitherGradient(14, 76, 292, 22, ['#d96e52', '#ad4e59', '#733954']);
  for (let w = 0; w < 38; w++) {
    const wx = 16 + ((hash(w * 17) * 288 - t * 28 + 2000) % 288);
    const wy = 77 + (w % 18);
    const nearSun = Math.max(0.2, 1 - Math.abs(wx - 248) / 90);
    canvas.fillRect(wx, wy, 3 + (w % 4), 1, '#fff3b0', nearSun * 0.85);
  }

  // Layer 4: Fast-scrolling coastal guardrail & utility poles!
  const poleX = 330 - ((t * 115) % 150);
  canvas.fillRect(poleX, 32, 3, 66, '#382024');
  canvas.fillRect(poleX - 4, 38, 11, 2, '#382024');
  canvas.fillRect(14, 92, 292, 2, '#382024');
  canvas.resetClip();

  // Re-draw carriage pillars between the 3 windows
  canvas.fillRect(106, 26, 8, 76, '#59372a');
  canvas.fillRect(206, 26, 8, 76, '#59372a');
  for (const [wx, wy, ww, wh] of windows) {
    canvas.strokeRect(wx, wy, ww, wh, '#331d16');
  }

  // Swaying commuter hand straps from ceiling rail
  canvas.fillRect(0, 21, 320, 1, '#c9b194');
  const strapSway = Math.round(Math.sin(t * 3.8) * 2);
  for (const sx of [46, 86, 236, 276]) {
    canvas.drawLine(sx, 22, sx + strapSway, 31, '#8c694f');
    canvas.strokeRect(sx + strapSway - 2, 31, 5, 4, '#d9b477');
  }

  // Plush crimson-terracotta train bench seats
  canvas.fillRect(16, 110, 88, 18, '#a84642');
  canvas.fillRect(16, 110, 88, 3, '#cc625c');
  canvas.fillRect(116, 110, 88, 18, '#a84642');
  canvas.fillRect(116, 110, 88, 3, '#cc625c');
  canvas.fillRect(216, 110, 88, 18, '#a84642');
  canvas.fillRect(216, 110, 88, 3, '#cc625c');
  // Carriage wooden floor
  canvas.fillRect(0, 128, 320, 52, '#4d2f23');

  // Girl sitting peacefully by middle window + cute vintage suitcase!
  const bobHead = Math.floor(t * 2) % 2;
  canvas.drawSprite(146, 99 + bobHead, getGirlSprite({ pose: 'sit_train', eye: getBlinkState(t, 0.4) }), GIRL_PALETTE);
  // Vintage tan travel suitcase beside her
  canvas.fillRect(170, 114, 15, 12, '#c98b52');
  canvas.strokeRect(170, 114, 15, 12, '#5c3822');
  canvas.fillRect(175, 112, 5, 2, '#5c3822');
  drawEmoteBubble(canvas, 155, 97, 'music', Math.round(Math.sin(t * 4)));

  // Rhythmic sweeping golden sunbeam across carriage as poles pass
  const sweepX = 320 - ((t * 95) % 240);
  canvas.drawSunbeam(sweepX, 42, 28, sweepX - 36, 58, 138, '#ffd984', 0.16 + audio.rms * 0.08);
}

// ============================================================================
// SCENE 5: WINTER SNOW SPLIT-TOWN -> ROSY DAWN (111-140.2s) - Pre-Chorus 2
// ============================================================================
function renderWinterDawnScene(canvas, fonts, t, localT, audio) {
  // Smooth dawn transition starting around "等到我们学会飞" (localT 16s -> 28s)
  const dawn = Math.max(0, Math.min(1, (localT - 14.0) / 13.0));
  const skyTop = lerpColorHex('#172038', '#5e4368', dawn);
  const skyMid = lerpColorHex('#28385c', '#cc7670', dawn);
  const skyBot = lerpColorHex('#3d5480', '#fce09c', dawn);

  // LEFT HALF (x=0..158): Her Snowy Bus Stop
  canvas.setClip(0, 0, 159, 180);
  canvas.fillDitherGradient(0, 0, 159, 118, [skyTop, skyMid, skyBot]);
  // Snow ground
  canvas.fillDitherGradient(0, 118, 159, 62, ['#e8f0fa', '#c9d8eb', '#9fb4d1']);
  // Snowy pine trees
  canvas.drawPixelTree(26, 120, 46, {
    cDark: '#2d4d4a',
    cMid: '#46736c',
    cLight: '#dcebf7',
  });
  // Bus stop shelter & warm vintage streetlamp
  canvas.fillRect(54, 78, 46, 40, '#42526e', 0.65);
  canvas.fillRect(50, 75, 54, 4, '#5c7296');
  canvas.strokeRect(54, 78, 46, 40, '#2e3a52');
  // Streetlamp
  canvas.fillRect(126, 62, 3, 56, '#2b3240');
  canvas.fillCircle(127, 60, 4, '#ffe699');
  canvas.addGlowCircle(127, 64, 28, '#ffd075', 0.3 * (1 - dawn * 0.4));

  // Girl in cozy winter red scarf holding phone!
  canvas.drawSprite(84, 96, getGirlSprite({
    pose: 'hold_phone',
    scarf: true,
    eye: dawn > 0.6 ? 'happy' : getBlinkState(t, 0.2),
  }), GIRL_PALETTE, { groundShadow: true });
  // Cute white winter breath puff
  if (dawn < 0.75) {
    const puff = (t * 0.8) % 1;
    canvas.fillCircle(103 + puff * 4, 103 - puff * 5, 2, '#ffffff', (1 - puff) * 0.55);
  }
  canvas.resetClip();

  // RIGHT HALF (x=161..320): His Snowy Train Platform & Clocktower
  canvas.setClip(161, 0, 159, 180);
  canvas.fillDitherGradient(161, 0, 159, 118, [skyTop, skyMid, skyBot]);
  canvas.fillDitherGradient(161, 118, 159, 62, ['#e8f0fa', '#c9d8eb', '#9fb4d1']);
  // Brick station clocktower
  canvas.fillRect(262, 42, 32, 76, '#6e4744');
  canvas.fillRect(258, 38, 40, 5, '#dbe8f5'); // snow cap!
  canvas.fillCircle(278, 56, 7, '#fff8e3');
  canvas.strokeRect(274, 52, 9, 9, '#3b2422');
  canvas.drawLine(278, 56, 278, 52, '#3b2422');
  canvas.drawLine(278, 56, 282, 56, '#3b2422');
  // Platform roof canopy
  canvas.fillRect(166, 76, 78, 4, '#4e617d');
  canvas.fillRect(166, 74, 78, 2, '#e6f0fa');
  canvas.fillRect(182, 80, 3, 38, '#344259');

  // Boy in cozy winter scarf looking toward her half
  canvas.drawSprite(212, 96, getBoySprite({
    pose: 'stand',
    scarf: true,
    eye: dawn > 0.6 ? 'happy' : getBlinkState(t, 1.3),
  }), BOY_PALETTE, { flipX: true, groundShadow: true });
  canvas.resetClip();

  // Center Divider (fades slightly with golden dawn glow!)
  canvas.fillRect(159, 0, 2, 180, lerpColorHex('#4e6385', '#f5c478', dawn));

  // Falling pixel snowflakes -> turning into golden morning sparkles at dawn!
  for (let i = 0; i < 52; i++) {
    const sx = ((hash(i * 29) * 320 + Math.sin(t * 1.4 + i) * 8) + 320) % 320;
    const sy = (hash(i * 43) * 145 + t * (14 + (i % 5) * 3)) % 140;
    const col = dawn > 0.65 && i % 2 === 0 ? '#ffe89c' : '#ffffff';
    canvas.fillRect(sx, sy, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1, col, 0.8);
  }

  // Morning sunbeam breaking across both halves at "日子就要从孤单里毕业"!
  if (dawn > 0.35) {
    canvas.addGlowCircle(160, 108, Math.round(95 * dawn), '#ffd480', dawn * 0.24);
  }
}

// ============================================================================
// SCENE 6: TWILIGHT VIADUCT & STARRY PROMENADE WALK (140.2-171s) - Chorus 2!
// ============================================================================
function renderViaductWalkScene(canvas, fonts, t, localT, audio) {
  // Rich Makoto-Shinkai-meets-GBA twilight sky
  canvas.fillDitherGradient(0, 0, 320, 106, ['#221c3d', '#4d325e', '#9e4f63', '#eb8d58', '#fad282']);

  // Twinkling pixel stars in upper sky
  for (let i = 0; i < 36; i++) {
    const sx = Math.floor(hash(i * 23) * 316);
    const sy = Math.floor(hash(i * 17) * 52);
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 3.2 + i));
    canvas.pset(sx, sy, '#fff8db', tw);
  }

  // Shooting star streaking across twilight sky every 5 seconds!
  const starCycle = (localT % 5.0) / 1.4;
  if (starCycle < 1.0) {
    const shX = Math.round(270 - starCycle * 150);
    const shY = Math.round(14 + starCycle * 36);
    canvas.drawLine(shX, shY, shX + 18, shY - 5, '#fff4b8', 1 - starCycle * 0.6);
    canvas.pset(shX, shY, '#ffffff');
  }

  // Distant town silhouette
  for (let i = 0; i < 20; i++) {
    const bx = i * 16;
    const bh = 10 + Math.floor(hash(i * 11) * 14);
    canvas.fillRect(bx, 98 - bh, 15, bh, '#3b263d');
  }

  // Elevated Brick/Stone Arched Railway Viaduct (y=72..106)
  canvas.fillRect(0, 72, 320, 6, '#4a3245');
  canvas.fillRect(0, 72, 320, 1, '#7d5268');
  for (let ax = 0; ax < 320; ax += 32) {
    canvas.fillRect(ax, 78, 8, 28, '#3d283a');
    // Arch top corners
    canvas.fillRect(ax + 8, 78, 16, 4, '#3d283a');
    canvas.fillRect(ax + 8, 82, 3, 3, '#3d283a');
    canvas.fillRect(ax + 21, 82, 3, 3, '#3d283a');
  }
  // Catenary poles along viaduct
  for (let px = 16; px < 320; px += 64) {
    canvas.fillRect(px, 56, 2, 16, '#362336');
    if (px + 64 < 330) {
      canvas.drawCatenary(px + 1, 58, px + 65, 58, 3, '#4a3048', 0.75);
    }
  }

  // Lit Pixel Commuter Train gliding across viaduct!
  const trainX = Math.round(((localT * 36) % 460) - 130);
  for (let car = 0; car < 3; car++) {
    const cx = trainX + car * 38;
    canvas.fillRect(cx, 62, 35, 10, '#362942');
    canvas.fillRect(cx, 62, 35, 2, '#d98c5f');
    for (let w = 0; w < 4; w++) {
      canvas.fillRect(cx + 3 + w * 8, 65, 5, 4, '#ffe896');
    }
  }

  // Shimmering twilight river band (y=104..116)
  canvas.fillDitherGradient(0, 104, 320, 12, ['#5c3859', '#9c565e', '#d9885b']);
  for (let r = 0; r < 24; r++) {
    const rx = (r * 17 + Math.round(t * 6)) % 316;
    canvas.fillRect(rx, 106 + (r % 8), 5, 1, '#ffd98e', 0.55);
  }

  // Foreground Cobblestone Promenade & Warm Lanterns (y=116..180)
  canvas.fillRect(0, 116, 320, 4, '#6e5259');
  canvas.fillDitherGradient(0, 120, 320, 60, ['#4d3942', '#382930', '#291e24']);
  for (let lx = 28; lx < 300; lx += 66) {
    canvas.fillRect(lx, 96, 2, 22, '#291c24');
    canvas.fillRect(lx - 2, 92, 6, 5, '#ffe28a');
    canvas.addGlowCircle(lx + 1, 95, 18, '#ffbe63', 0.24 + audio.rms * 0.08);
  }

  // Both 像素小人 walking steadily toward each other!
  const prog = localT / 30.8;
  const girlX = Math.round(lerp(24, 124, prog));
  const boyX = Math.round(lerp(278, 178, prog));
  const stepFrame = Math.floor(t * 6.5) & 3;

  canvas.drawSprite(girlX, 99, getGirlSprite({ pose: 'walk', step: stepFrame, eye: getBlinkState(t, 0.3) }), GIRL_PALETTE, { groundShadow: true });
  canvas.drawSprite(boyX, 99, getBoySprite({ pose: 'walk', step: (stepFrame + 2) & 3, eye: getBlinkState(t, 1.2) }), BOY_PALETTE, { flipX: true, groundShadow: true });

  const bob = Math.round(Math.sin(t * 4.5));
  drawEmoteBubble(canvas, girlX + 9, 97, 'heart', bob);
  drawEmoteBubble(canvas, boyX + 9, 97, 'heart', -bob);
}

// ============================================================================
// SCENE 7: SUNSET ROOFTOP HARMONICA SOLO & CREDIT STAMP CARDS (171-203s)
// ============================================================================
function renderRooftopSoloScene(canvas, fonts, t, localT, audio) {
  // Dramatic burning golden-amber bridge sunset!
  canvas.fillDitherGradient(0, 0, 320, 112, ['#6e3559', '#b8524f', '#eb8e4b', '#fad075', '#fff5ba']);

  // Glowing low sun
  canvas.fillCircle(244, 86, 18, '#fff7c7');
  canvas.addGlowCircle(244, 86, 42, '#ffd269', 0.32 + audio.rms * 0.12);

  // Scrolling sunset clouds
  canvas.drawPixelCloud(290 - ((t * 7) % 340), 26, 2, '#ffdca6', '#d97a5b');
  canvas.drawPixelCloud(140 - ((t * 5) % 340) + 180, 44, 0, '#ffe6b8', '#e0885e');

  // Distant golden city skyline
  for (let i = 0; i < 18; i++) {
    const bx = i * 18;
    const bh = 14 + Math.floor(hash(i * 19 + 3) * 26);
    canvas.fillRect(bx, 108 - bh, 16, bh, '#593042');
    if (i % 3 === 0) {
      canvas.fillRect(bx + 4, 108 - bh + 4, 3, 3, '#ffe38c', 0.8);
    }
  }

  // Rooftop Chain-Link Fence (y=84..108)
  canvas.fillRect(0, 84, 320, 2, '#422630');
  for (let fx = 0; fx < 320; fx += 32) {
    canvas.fillRect(fx, 84, 2, 24, '#422630');
  }
  // Subtle diamond fence mesh
  for (let fy = 86; fy < 108; fy += 4) {
    for (let fx = (fy % 8 === 0 ? 0 : 2); fx < 320; fx += 4) {
      canvas.pset(fx, fy, '#5c3642', 0.65);
    }
  }

  // Rooftop Floor & Props (y=108..180)
  canvas.fillRect(0, 108, 320, 4, '#8a564a');
  canvas.fillDitherGradient(0, 112, 320, 68, ['#6b4540', '#523432', '#3b2424']);

  // Potted sunflowers on right
  for (const px of [276, 292]) {
    canvas.fillRect(px, 104, 8, 7, '#b86242');
    canvas.fillRect(px + 3, 96, 2, 8, '#4e8c4a');
    canvas.fillCircle(px + 4, 95, 3, '#ffd24c');
    canvas.pset(px + 4, 95, '#6e3d24');
  }

  // Boy playing silver harmonica on rooftop + Orange Cat wagging tail!
  const swayX = Math.round(Math.sin(t * 2.6) * 1);
  const boyX = 212 + swayX;
  const boyY = 92;
  canvas.drawSprite(boyX, boyY, getBoySprite({ pose: 'harmonica', eye: 'blink' }), BOY_PALETTE, { flipX: true, groundShadow: true });
  // Harmonica metallic glint
  canvas.pset(boyX + 6, boyY + 10, '#ffffff', 0.9);
  // Orange cat listening beside him!
  canvas.drawSprite(192, 107, getCatSprite(false, Math.floor(t * 3)), CAT_PALETTE);

  // Audio-reactive Pixel Musical Notes floating into the sunset sky!
  const notes = ['♪', '♫', '♪', '♬', '♫', '♪'];
  for (let n = 0; n < 6; n++) {
    const life = ((t * 0.42 + n * 0.17) % 1);
    const nx = Math.round(boyX + 2 - life * 48 + Math.sin(t * 3 + n) * 5);
    const ny = Math.round(boyY + 4 - life * 58);
    const alpha = Math.sin(life * Math.PI) * (0.65 + audio.high * 0.35);
    fonts.f10.drawText(canvas, notes[n], nx, ny, n % 2 === 0 ? '#fff6bd' : '#ffcf70', {
      shadowColor: '#4a2328',
      alpha,
    });
  }

  // 4 RPG Course Credit Stamp Cards on the left!
  const courses = [
    { appear: 1.0,  title: '必修01 · 寂寞自习室' },
    { appear: 7.5,  title: '必修02 · 距离的考卷' },
    { appear: 14.0, title: '必修03 · 沟通与谅解' },
    { appear: 20.5, title: '必修04 · 忍耐与付出' },
  ];
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    if (localT < c.appear) continue;
    const age = localT - c.appear;
    const slideX = Math.round(lerp(-140, 14, Math.min(1, age * 4)));
    const cy = 24 + i * 24;
    canvas.drawRpgWindow(slideX, cy, 152, 21, {
      bgTop: '#fff9eb',
      bgBot: '#f5dfb8',
      frameColor: '#d99848',
    });
    fonts.f10.drawText(canvas, c.title, slideX + 6, cy + 4, '#3d241e');
    if (age > 0.55) {
      // Red PASS stamp!
      canvas.fillRect(slideX + 114, cy + 4, 32, 12, '#d94848');
      canvas.strokeRect(slideX + 114, cy + 4, 32, 12, '#8f2424');
      fonts.f8.drawText(canvas, 'PASS★', slideX + 117, cy + 6, '#fff8eb');
    }
  }
}

// ============================================================================
// SCENE 8: SPRING BLOSSOM REUNION, GOLDEN LOVE CERTIFICATE & OUTRO (203-255.8s)
// ============================================================================
function renderReunionCertScene(canvas, fonts, t, localT, audio) {
  const isOutro = t >= 236.0;
  const outroBlend = Math.max(0, Math.min(1, (t - 235.0) / 5.0));

  // Sky shifts from bright sunlit spring azure-gold to warm romantic sunset in outro!
  const sTop = lerpColorHex('#59a5d8', '#c96b59', outroBlend);
  const sMid = lerpColorHex('#9bd5eb', '#f2ad68', outroBlend);
  const sBot = lerpColorHex('#fff4c7', '#fff0ba', outroBlend);
  canvas.fillDitherGradient(0, 0, 320, 114, [sTop, sMid, sBot]);

  // Fluffy clouds
  canvas.drawPixelCloud(((t * 5) % 360) - 30, 22, 0, '#fffaf0', lerpColorHex('#d5ebf7', '#f2ba88', outroBlend));
  canvas.drawPixelCloud(((t * 3.5 + 180) % 360) - 30, 34, 2, '#fffaf0', lerpColorHex('#d5ebf7', '#f2ba88', outroBlend));

  // Charming Station Pavilion / Campus Arch in center background
  canvas.fillRect(114, 62, 92, 52, '#f5ead6');
  canvas.fillRect(108, 56, 104, 8, '#c96a5b'); // warm terracotta roof
  canvas.fillRect(112, 52, 96, 4, '#de8271');
  canvas.strokeRect(114, 62, 92, 52, '#7a5648');
  // Arch doorway
  canvas.fillRect(148, 84, 24, 30, '#593d36');
  fonts.f10.drawText(canvas, '幸福终点站', 160, 67, '#5c392e', { align: 'center' });

  // Green lawn & sunlit brick promenade
  canvas.fillRect(0, 110, 320, 6, lerpColorHex('#78b865', '#9e8c52', outroBlend));
  canvas.fillDitherGradient(0, 116, 320, 64, ['#cfa27e', '#b58462', '#94674b']);

  // 4 Lush Blooming Sakura/Apricot Blossom Pixel Trees!
  const sway = Math.round(Math.sin(t * 2));
  const sakuraOpts = {
    sway,
    trunkColor: '#5e3c33',
    trunkShade: '#3d241f',
    cDark: '#c4627e',
    cMid: '#f29bb2',
    cLight: '#ffe0ea',
  };
  canvas.drawPixelTree(24, 116, 56, sakuraOpts);
  canvas.drawPixelTree(78, 114, 46, { ...sakuraOpts, sway: -sway });
  canvas.drawPixelTree(242, 114, 46, sakuraOpts);
  canvas.drawPixelTree(296, 116, 56, { ...sakuraOpts, sway: -sway });

  if (!isOutro) {
    // SUB-PHASE A & B (203 - 236s): Walking together into center & Golden Love Certificate!
    const meetU = Math.min(1, localT / 4.2); // meet face-to-face by 207.2s!
    const girlX = Math.round(lerp(36, 136, meetU));
    const boyX = Math.round(lerp(266, 166, meetU));
    const step = Math.floor(t * 7) & 3;
    const met = meetU >= 0.99;

    canvas.drawSprite(
      girlX,
      97,
      getGirlSprite({
        pose: met ? 'stand' : 'walk',
        step,
        eye: met ? 'happy' : getBlinkState(t, 0.2),
      }),
      GIRL_PALETTE,
      { groundShadow: true }
    );
    canvas.drawSprite(
      boyX,
      97,
      getBoySprite({
        pose: met ? 'stand' : 'walk',
        step: (step + 2) & 3,
        eye: met ? 'happy' : getBlinkState(t, 1.0),
      }),
      BOY_PALETTE,
      { flipX: true, groundShadow: true }
    );

    if (met && t < 222.5) {
      const bob = Math.round(Math.sin(t * 5));
      drawEmoteBubble(canvas, 160, 93, localT < 5.5 ? 'exclaim' : 'heart', bob);
      canvas.addGlowCircle(160, 106, 26, '#ffe08c', 0.22);
    }

    // SUB-PHASE B (t >= 222.5s): "这爱情一定会有张证书 / 证明 从此 不孤独" -> ORNATE LOVE CERTIFICATE!
    if (t >= 222.5) {
      const certAge = t - 222.5;
      const unfold = Math.min(1, certAge * 2.8);
      const cw = Math.round(244 * unfold);
      const ch = 74;
      const cx = Math.round(160 - cw / 2);
      const cy = 21;

      // Golden aura behind certificate
      canvas.addGlowCircle(160, 58, 76, '#ffd86b', 0.32 * unfold);

      canvas.drawRpgWindow(cx, cy, Math.max(16, cw), ch, {
        outerColor: '#42201b',
        frameColor: '#ebaa3b',
        highlightColor: '#fff2a6',
        bgTop: '#fffdf2',
        bgBot: '#faecc8',
      });

      if (unfold >= 0.95) {
        // Crimson ribbon banner & gold filigree border
        canvas.fillRect(cx + 5, cy + 5, 234, 2, '#d9534f');
        canvas.strokeRect(cx + 5, cy + 5, 234, ch - 10, '#d99e43');

        fonts.f12.drawText(canvas, '★ 爱 情 证 书 ★', 160, cy + 8, '#b83737', {
          align: 'center',
          shadowColor: '#f5d996',
        });
        fonts.f10.drawText(canvas, 'LOVE CERTIFICATE · 学分 100/100', 160, cy + 23, '#8c5830', {
          align: 'center',
        });
        // Body lines positioned cleanly on left/center so right side has dedicated space for red seal!
        fonts.f10.drawText(canvas, '兹证明：跨越距离考卷，学会忍耐付出', cx + 11, cy + 38, '#3d241e');
        fonts.f10.drawText(canvas, '特颁此证 · 证明从此不孤独', cx + 11, cy + 52, '#a63333');

        // Animated Crimson Wax Seal Stamp at t >= 227.0s ("证明 / 从此不孤独")!
        if (t >= 227.0) {
          const stampAge = t - 227.0;
          const stampX = cx + 193;
          const stampY = cy + 38;
          if (stampAge < 0.5) {
            const ringR = Math.round(6 + stampAge * 24);
            canvas.strokeRect(stampX - ringR + 20, stampY - ringR + 13, ringR * 2, ringR * 2, '#ffdf78', 1 - stampAge * 2);
          }
          canvas.fillRect(stampX, stampY, 40, 26, '#cc3333', 0.94);
          canvas.strokeRect(stampX + 1, stampY + 1, 38, 24, '#ffd984');
          fonts.f10.drawText(canvas, '合格♥', stampX + 5, stampY + 2, '#fff9eb');
          fonts.f10.drawText(canvas, '毕业章', stampX + 5, stampY + 13, '#fff9eb');
        }
      }

      // Golden pixel confetti & sparkles!
      for (let k = 0; k < 28; k++) {
        const kx = (hash(k * 37) * 308 + Math.sin(t * 3 + k) * 8 + 6) % 316;
        const ky = (hash(k * 53) * 125 + certAge * (16 + (k % 5) * 4)) % 134;
        const kCol = ['#ffd859', '#ff8598', '#fff7cc', '#7ce0b8'][k % 4];
        canvas.fillRect(kx, ky, 2, 2, kCol, 0.9);
      }
    }
  } else {
    // SUB-PHASE C (236 - 255.8s): Tender Acoustic Guitar & Harmonica Outro - Park Bench Together!
    // Wooden park bench in center
    canvas.fillRect(128, 110, 64, 10, '#7a4934');
    canvas.strokeRect(128, 110, 64, 6, '#4f2d1f');
    canvas.fillRect(126, 120, 68, 4, '#945b42');
    canvas.fillRect(132, 124, 4, 8, '#3d2218');
    canvas.fillRect(184, 124, 4, 8, '#3d2218');

    // Girl & Boy sitting shoulder-to-shoulder on the bench!
    canvas.drawSprite(139, 98, getGirlSprite({ pose: 'sit_train', eye: 'happy' }), GIRL_PALETTE);
    canvas.drawSprite(159, 98, getBoySprite({ pose: 'sit_desk', eye: 'happy' }), BOY_PALETTE, { flipX: true });
    // Sleeping orange cat curled up peacefully beside the bench!
    canvas.drawSprite(196, 122, getCatSprite(true, 0), CAT_PALETTE);

    // Floating pixel hearts & gentle harmonica notes into sunset (without blocking station sign!)
    const heartBob = Math.round(Math.sin(t * 3) * 2);
    fonts.f10.drawText(canvas, '♥', 155, 86 + heartBob, '#ff6b8b', { shadowColor: '#4a2028' });
    for (let n = 0; n < 3; n++) {
      const life = ((t * 0.25 + n * 0.33) % 1);
      fonts.f10.drawText(
        canvas,
        n % 2 === 0 ? '♪' : '♫',
        172 + Math.sin(t * 2 + n) * 10 + n * 10,
        84 - life * 38,
        '#fff4b8',
        { shadowColor: '#59302a', alpha: Math.sin(life * Math.PI) * 0.85 }
      );
    }
  }

  // Drifting Sakura/Apricot Petals throughout Scene 8
  for (let p = 0; p < 38; p++) {
    const px = ((hash(p * 19) * 330 - t * (12 + (p % 4) * 3) + Math.sin(t * 2 + p) * 6) + 3300) % 330 - 5;
    const py = (hash(p * 31) * 145 + t * (10 + (p % 3) * 3)) % 142;
    canvas.fillRect(px, py, 2, 1, p % 3 === 0 ? '#fff5f8' : '#ff9eb5', 0.88);
  }

  // Final End Credits Card & Fade-Out (248.0 -> 255.73s)
  if (t > 248.0) {
    const endU = Math.min(1, (t - 248.0) / 3.2);
    canvas.fillRect(0, 0, 320, 180, '#1e1316', endU * 0.92);
    if (endU > 0.35) {
      const txtAlpha = Math.min(1, (endU - 0.35) / 0.5) * Math.max(0, Math.min(1, (255.5 - t) / 1.4));
      fonts.f8.drawText(canvas, '★ LOVE CERTIFICATE · 100 / 100 CREDITS ★', 160, 56, '#e0a958', {
        align: 'center',
        alpha: txtAlpha,
      });
      fonts.f12.drawText(canvas, '《 爱 情 证 书 》', 160, 72, '#fff3d1', {
        align: 'center',
        shadowColor: '#3b1d1a',
        alpha: txtAlpha,
      });
      fonts.f10.drawText(canvas, '演唱：孙燕姿 Stefanie Sun', 160, 92, '#dcb99c', {
        align: 'center',
        alpha: txtAlpha,
      });
      fonts.f10.drawText(canvas, '— 孤单毕业 · 从此不孤独 —', 160, 112, '#f29ca3', {
        align: 'center',
        alpha: txtAlpha,
      });
    }
    if (t > 254.2) {
      canvas.fillRect(0, 0, 320, 180, '#0d080a', Math.min(1, (t - 254.2) / 1.4));
    }
  }
}

// ============================================================================
// RPG TOP HUD & BOTTOM DIALOGUE LYRIC BOX + PIXEL PORTRAITS
// ============================================================================
function drawDialogueAvatar(canvas, x, y, speaker, t) {
  canvas.fillRect(x, y, 26, 26, '#e8cfa6');
  canvas.strokeRect(x, y, 26, 26, '#593628');

  canvas.setClip(x + 1, y + 1, 24, 24);
  const eye = t >= 203 ? 'happy' : getBlinkState(t, 0.6);
  if (speaker === 'girl') {
    canvas.fillRect(x + 1, y + 1, 24, 24, '#f7d9a8');
    canvas.drawSprite(x + 4, y + 3, getGirlSprite({ pose: 'stand', eye }), GIRL_PALETTE);
  } else if (speaker === 'boy') {
    canvas.fillRect(x + 1, y + 1, 24, 24, '#cbdcf0');
    canvas.drawSprite(x + 4, y + 3, getBoySprite({ pose: 'stand', eye }), BOY_PALETTE);
  } else {
    // Duo split mini-avatar!
    canvas.fillRect(x + 1, y + 1, 12, 24, '#f7d9a8');
    canvas.fillRect(x + 13, y + 1, 12, 24, '#cbdcf0');
    canvas.setClip(x + 1, y + 1, 12, 24);
    canvas.drawSprite(x - 2, y + 3, getGirlSprite({ pose: 'stand', eye }), GIRL_PALETTE);
    canvas.setClip(x + 13, y + 1, 12, 24);
    canvas.drawSprite(x + 10, y + 3, getBoySprite({ pose: 'stand', eye }), BOY_PALETTE, { flipX: true });
    canvas.setClip(x + 1, y + 1, 24, 24);
    canvas.fillRect(x + 12, y + 1, 1, 24, '#593628');
  }
  canvas.resetClip();
}

function renderHudAndDialogue(canvas, fonts, t, sceneInfo, audio) {
  // Hide HUD only during final end-credits fade
  if (t > 248.2) return;

  const prog = getProgression(t);
  const hudAlpha = t < 2.0 ? Math.min(1, t / 1.5) : 1;

  // Top-Left Pill: Course Credits Progress Bar (15px tall for crisp 10px Chinese!)
  canvas.fillRect(5, 3, 142, 15, '#291817', 0.85 * hudAlpha);
  canvas.strokeRect(5, 3, 142, 15, '#d99b4e', 0.92 * hudAlpha);
  fonts.f10.drawText(canvas, '必修学分', 9, 4, '#ffe5a3', { alpha: hudAlpha });
  // Bar background (x=53..107)
  canvas.fillRect(53, 7, 54, 7, '#140b0b', hudAlpha);
  canvas.strokeRect(53, 7, 54, 7, '#6e4733', hudAlpha);
  const fillW = Math.round((prog.credits / 100) * 52);
  if (fillW > 0) {
    const barCol = prog.credits >= 100 ? '#ff6b8b' : '#f5b342';
    const barHi = prog.credits >= 100 ? '#ffb3c4' : '#ffe38c';
    canvas.fillRect(54, 8, fillW, 5, barCol, hudAlpha);
    canvas.fillRect(54, 8, fillW, 1, barHi, hudAlpha);
  }
  fonts.f10.drawText(canvas, `${prog.credits}%`, 110, 4, prog.credits >= 100 ? '#ffadbe' : '#fff5db', {
    alpha: hudAlpha,
  });

  // Top-Right Pill: Date, Distance & Live 5-Bar Pixel Audio Equalizer!
  canvas.fillRect(158, 3, 157, 15, '#291817', 0.85 * hudAlpha);
  canvas.strokeRect(158, 3, 157, 15, '#d99b4e', 0.92 * hudAlpha);
  const distText = prog.dist === 0 ? '同框 0km♥' : `相距${prog.dist}km`;
  fonts.f10.drawText(canvas, `${sceneInfo.scene.date}·${distText}`, 162, 4, prog.dist === 0 ? '#ffadbe' : '#f5dfc4', {
    alpha: hudAlpha,
  });

  // 5-bar live audio spectrum in HUD (x=297..311)
  for (let b = 0; b < 5; b++) {
    const wave = 0.4 + 0.6 * Math.abs(Math.sin(t * (7 + b * 2.3) + b));
    const energy = b < 2 ? audio.rms : (audio.rms * 0.6 + audio.high * 0.5);
    const bh = Math.max(1, Math.min(9, Math.round(energy * wave * 11)));
    const bx = 297 + b * 3;
    canvas.fillRect(bx, 15 - bh, 2, bh, b >= 3 ? '#ff9eb5' : '#ffd86b', hudAlpha);
  }

  // Optional RPG Event Toast Notification (hidden when full Love Certificate modal is open!)
  const toast = t >= 222.0 && t <= 236.0 ? null : getToastAt(t);
  if (toast) {
    const age = Math.min(toast.end - t, t - toast.start);
    const slide = Math.min(1, age * 4);
    const tw = fonts.f10.measureText(toast.text) + 16;
    const tx = Math.round(160 - tw / 2);
    const ty = Math.round(lerp(8, 21, slide));
    canvas.fillRect(tx, ty, tw, 16, '#38201d', 0.9 * slide);
    canvas.strokeRect(tx, ty, tw, 16, '#f2ba5c', 0.96 * slide);
    fonts.f10.drawText(canvas, toast.text, 160, ty + 2, '#ffe89e', {
      align: 'center',
      alpha: slide,
    });
  }

  // Bottom RPG Dialogue Lyric Box!
  const lyric = getLyricAt(t);
  if (lyric) {
    const boxX = 12, boxY = 136, boxW = 296, boxH = 40;
    canvas.drawRpgWindow(boxX, boxY, boxW, boxH, {
      alpha: 0.96,
      outerColor: '#361f1b',
      frameColor: '#cc8b47',
      highlightColor: '#fae0a5',
      bgTop: '#fff9eb',
      bgBot: '#f5e2bd',
    });

    // Chibi Avatar Frame
    drawDialogueAvatar(canvas, boxX + 6, boxY + 7, lyric.speaker, t);

    // Speaker tag + RPG note in crisp 10px Fusion Pixel font!
    const speakerLabel = lyric.speaker === 'girl' ? '[小姿]' : lyric.speaker === 'boy' ? '[阿远]' : '[小姿 & 阿远]';
    fonts.f10.drawText(canvas, `${speakerLabel} ${lyric.note}`, boxX + 38, boxY + 5, '#9c5f32');

    // Typewriter reveal for main 12px Chinese lyric!
    const chars = Array.from(lyric.text);
    const elapsed = t - lyric.start;
    const typeDuration = Math.min(0.85, (lyric.end - lyric.start) * 0.38);
    const visibleCount = Math.min(chars.length, Math.max(1, Math.ceil((elapsed / Math.max(0.12, typeDuration)) * chars.length)));
    const shownText = chars.slice(0, visibleCount).join('');

    fonts.f12.drawText(canvas, shownText, boxX + 38, boxY + 19, '#2b1816', {
      shadowColor: '#fffdf7',
      letterSpacing: 1,
    });

    // Classic bouncing RPG '▼' cursor on beat!
    const cursorBob = Math.floor(t * 3.5) % 2;
    const cx = boxX + boxW - 11;
    const cy = boxY + boxH - 9 + cursorBob;
    canvas.fillRect(cx, cy, 5, 1, '#c96a38');
    canvas.fillRect(cx + 1, cy + 1, 3, 1, '#c96a38');
    canvas.pset(cx + 2, cy + 2, '#c96a38');
  }
}

// ============================================================================
// MASTER FRAME COMPOSITOR WITH 16-BIT DIAMOND DITHER SCENE TRANSITIONS
// ============================================================================
function renderSceneById(id, canvas, fonts, t, localT, audio) {
  switch (id) {
    case 'intro':        return renderIntroScene(canvas, fonts, t, audio);
    case 'library_girl': return renderLibraryScene(canvas, fonts, t, localT, audio);
    case 'rainy_boy':    return renderRainyBoyScene(canvas, fonts, t, localT, audio);
    case 'split_dorm':   return renderSplitDormScene(canvas, fonts, t, localT, audio);
    case 'sunset_train': return renderSunsetTrainScene(canvas, fonts, t, localT, audio);
    case 'winter_dawn':  return renderWinterDawnScene(canvas, fonts, t, localT, audio);
    case 'viaduct_walk': return renderViaductWalkScene(canvas, fonts, t, localT, audio);
    case 'rooftop_solo': return renderRooftopSoloScene(canvas, fonts, t, localT, audio);
    case 'reunion_cert': return renderReunionCertScene(canvas, fonts, t, localT, audio);
  }
}

function renderFrame(canvas, fonts, t, audio) {
  const info = getSceneAt(t);
  renderSceneById(info.scene.id, canvas, fonts, t, info.localT, audio);

  // Authentic 16-bit handheld Bayer dither fade across scene cuts (0.35s out / 0.35s in)
  const transDur = 0.32;
  let fadeAmount = 0;
  if (info.index > 0 && info.localT < transDur) {
    fadeAmount = 1 - info.localT / transDur;
  } else if (info.index < 8 && (info.duration - info.localT) < transDur) {
    fadeAmount = 1 - (info.duration - info.localT) / transDur;
  }
  if (fadeAmount > 0.01) {
    for (let py = 0; py < canvas.height; py++) {
      const bRow = BAYER_4X4[py & 3];
      for (let px = 0; px < canvas.width; px++) {
        if (fadeAmount > (bRow[px & 3] + 0.5) / 16) {
          canvas.setPixelRGB(px, py, 36, 22, 24);
        }
      }
    }
  }

  renderHudAndDialogue(canvas, fonts, t, info, audio);
}

module.exports = { renderFrame };
