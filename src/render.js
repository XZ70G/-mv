const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { PixelCanvas } = require('./pixelCanvas');
const { BdfFont } = require('./bdfFont');
const { renderFrame } = require('./scenes');
const { TOTAL_DURATION } = require('./lyrics');

const ROOT = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'assets', 'fonts');

function loadFonts() {
  console.log('Loading Fusion Pixel bitmap fonts (8px, 10px, 12px)...');
  return {
    f8: new BdfFont(path.join(FONTS_DIR, 'fusion-pixel-8px-proportional-zh_hans.bdf')),
    f10: new BdfFont(path.join(FONTS_DIR, 'fusion-pixel-10px-proportional-zh_hans.bdf')),
    f12: new BdfFont(path.join(FONTS_DIR, 'fusion-pixel-12px-proportional-zh_hans.bdf')),
  };
}

function findAudioFile(customArg) {
  if (customArg && fs.existsSync(customArg)) return customArg;
  const audioDir = path.join(ROOT, 'assets', 'audio');
  if (fs.existsSync(audioDir)) {
    const files = fs.readdirSync(audioDir);
    for (const ext of ['.flac', '.wav', '.mp3', '.m4a']) {
      const match = files.find((f) => f.toLowerCase().endsWith(ext));
      if (match) return path.join(audioDir, match);
    }
  }
  return null;
}

function loadAudioAnalysis() {
  const analysisPath = path.join(ROOT, 'assets', 'audio_analysis.json');
  if (fs.existsSync(analysisPath)) {
    return JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
  }
  return null;
}

function getAudioAtFrame(analysis, frameIdx) {
  if (!analysis || !analysis.rms) {
    return { rms: 0.35, high: 0.25 };
  }
  const idx = Math.min(analysis.rms.length - 1, Math.max(0, frameIdx));
  return {
    rms: analysis.rms[idx] || 0.2,
    high: analysis.high[idx] || 0.15,
  };
}

function savePngViaFfmpeg(canvas, outPath) {
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-f', 'rawvideo',
      '-pix_fmt', 'rgba',
      '-s', `${canvas.width}x${canvas.height}`,
      '-i', 'pipe:0',
      '-vf', 'scale=1920:1080:flags=neighbor',
      '-frames:v', '1',
      outPath,
    ],
    { input: Buffer.from(canvas.data.buffer), stdio: ['pipe', 'ignore', 'ignore'] }
  );
}

async function renderPreviews() {
  const fonts = loadFonts();
  const analysis = loadAudioAnalysis();
  const canvas = new PixelCanvas(320, 180);
  const outDir = path.join(ROOT, 'preview_frames');
  fs.mkdirSync(outDir, { recursive: true });

  const sampleTimes = [
    { name: '00_intro',        t: 6.5 },
    { name: '01_library_girl', t: 21.0 },
    { name: '02_rainy_boy',    t: 36.5 },
    { name: '03_split_dorm',   t: 56.5 },
    { name: '03b_star_flight', t: 72.0 },
    { name: '04_sunset_train', t: 85.0 },
    { name: '05_winter_dawn',  t: 134.5 },
    { name: '06_viaduct_walk', t: 146.5 },
    { name: '07_rooftop_solo', t: 195.0 },
    { name: '08_reunion_cert', t: 229.8 },
    { name: '09_outro_bench',  t: 241.0 },
  ];

  for (const s of sampleTimes) {
    const fIdx = Math.round(s.t * 30);
    renderFrame(canvas, fonts, s.t, getAudioAtFrame(analysis, fIdx));
    const outPath = path.join(outDir, `${s.name}.png`);
    savePngViaFfmpeg(canvas, outPath);
    console.log(`Saved preview -> ${outPath}`);
  }
}

async function renderFullVideo(customAudio, customOut) {
  const fonts = loadFonts();
  const analysis = loadAudioAnalysis();
  const audioFile = findAudioFile(customAudio);
  if (!audioFile) {
    console.error('Error: Audio file not found in assets/audio/. Pass --audio <path_to_audio>.');
    process.exit(1);
  }

  const outDir = path.join(ROOT, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = customOut || path.join(outDir, '爱情证书_像素MV_1080p.mp4');

  const fps = 30;
  const duration = analysis ? analysis.duration : TOTAL_DURATION;
  const totalFrames = Math.ceil(duration * fps);
  const canvas = new PixelCanvas(320, 180);

  console.log(`Rendering ${totalFrames} frames (${duration.toFixed(2)}s @ ${fps}fps) -> 1920x1080 MP4...`);
  console.log(`Audio source: ${audioFile}`);

  const ffArgs = [
    '-y',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgba',
    '-s', '320x180',
    '-r', String(fps),
    '-i', 'pipe:0',
    '-i', audioFile,
    '-vf', 'scale=1920:1080:flags=neighbor',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '15',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '320k',
    '-movflags', '+faststart',
    '-shortest',
    outPath,
  ];

  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
  let stderrLog = '';
  ff.stderr.on('data', (chunk) => {
    stderrLog = (stderrLog + chunk.toString()).slice(-2000);
  });

  const startTime = Date.now();
  for (let f = 0; f < totalFrames; f++) {
    const t = f / fps;
    renderFrame(canvas, fonts, t, getAudioAtFrame(analysis, f));
    const buf = Buffer.from(canvas.data.buffer.slice(0));
    if (!ff.stdin.write(buf)) {
      await new Promise((resolve) => ff.stdin.once('drain', resolve));
    }
    if (f > 0 && f % 900 === 0) {
      const pct = ((f / totalFrames) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  Progress: ${pct}% (${f}/${totalFrames} frames, ${elapsed}s)`);
    }
  }
  ff.stdin.end();

  const code = await new Promise((resolve) => ff.on('close', resolve));
  if (code !== 0) {
    console.error('FFmpeg exited with error:', stderrLog);
    process.exit(code);
  }
  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Done in ${totalSec}s! Output saved to: ${outPath}`);
}

const args = process.argv.slice(2);
if (args.includes('--preview')) {
  renderPreviews();
} else {
  const audioIdx = args.indexOf('--audio');
  const outIdx = args.indexOf('--out');
  renderFullVideo(
    audioIdx !== -1 ? args[audioIdx + 1] : null,
    outIdx !== -1 ? args[outIdx + 1] : null
  );
}
