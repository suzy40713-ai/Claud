const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 25;
const FONT_PATH = path.join(__dirname, '..', 'assets', 'fonts', 'DejaVuSans-Bold.ttf');

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args]);
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => {
      reject(new Error(`Impossible de lancer ffmpeg (est-il installe ?) : ${err.message}`));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg a echoue (code ${code}): ${stderr.slice(-2000)}`));
      }
    });
  });
}

function wrapCaption(text, maxCharsPerLine = 28) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4).join('\n');
}

async function writeCaptionFile(dir, index, caption) {
  const filePath = path.join(dir, `caption_${index}.txt`);
  const safeText = wrapCaption(caption).replace(/%/g, '%%');
  await fs.writeFile(filePath, safeText, 'utf8');
  return filePath;
}

async function buildSceneClip({ imagePath, captionFile, outPath, durationSec, hasCaption }) {
  const totalFrames = Math.round(durationSec * FPS);
  const zoomFilter = `zoompan=z='min(zoom+0.0018,1.25)':d=${totalFrames}:s=${WIDTH}x${HEIGHT}:fps=${FPS}`;
  const baseFilters = [
    `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase`,
    `crop=${WIDTH}:${HEIGHT}`,
    zoomFilter,
  ];

  if (hasCaption) {
    baseFilters.push(
      [
        'drawtext=',
        `fontfile='${FONT_PATH}':`,
        `textfile='${captionFile}':`,
        'fontcolor=white:fontsize=56:line_spacing=14:',
        'borderw=4:bordercolor=black@0.85:',
        'x=(w-text_w)/2:y=h-th-170',
      ].join('')
    );
  }

  const filterGraph = baseFilters.join(',');

  await runFfmpeg([
    '-loop', '1',
    '-i', imagePath,
    '-t', String(durationSec),
    '-vf', filterGraph,
    '-r', String(FPS),
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    outPath,
  ]);
}

async function concatClips(clipPaths, listFile, outPath) {
  const listContent = clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  await fs.writeFile(listFile, listContent, 'utf8');
  await runFfmpeg(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outPath]);
}

async function muxAmbientAudio(videoPath, outPath, totalDurationSec) {
  const fadeStart = Math.max(totalDurationSec - 2, 0);
  await runFfmpeg([
    '-i', videoPath,
    '-f', 'lavfi',
    '-i', `sine=frequency=196:duration=${totalDurationSec}`,
    '-f', 'lavfi',
    '-i', `sine=frequency=246.94:duration=${totalDurationSec}`,
    '-filter_complex',
    `[1:a]volume=0.05[a1];[2:a]volume=0.04[a2];[a1][a2]amix=inputs=2:duration=first[amixed];[amixed]afade=t=in:st=0:d=2,afade=t=out:st=${fadeStart}:d=2[aout]`,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    outPath,
  ]);
}

/**
 * Builds a vertical (9:16) TikTok-ready slideshow video from a list of
 * scenes ({ imagePath, caption }), applying a Ken Burns zoom on each image,
 * burning in the caption, concatenating the scenes and optionally muxing a
 * softly synthesized (royalty-free, generated on the fly) ambient audio bed.
 */
async function buildSlideshow({ scenes, outPath, sceneDurationSec = 3.5, withMusic = true, withCaptions = true }) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tiktok-ai-studio-'));
  try {
    const clipPaths = [];
    for (let i = 0; i < scenes.length; i += 1) {
      const scene = scenes[i];
      const clipPath = path.join(workDir, `clip_${i}.mp4`);
      const captionFile = withCaptions ? await writeCaptionFile(workDir, i, scene.caption) : null;
      await buildSceneClip({
        imagePath: scene.imagePath,
        captionFile,
        outPath: clipPath,
        durationSec: sceneDurationSec,
        hasCaption: withCaptions,
      });
      clipPaths.push(clipPath);
    }

    const listFile = path.join(workDir, 'list.txt');
    const concatenatedPath = path.join(workDir, 'concatenated.mp4');
    await concatClips(clipPaths, listFile, concatenatedPath);

    if (withMusic) {
      const totalDuration = scenes.length * sceneDurationSec;
      await muxAmbientAudio(concatenatedPath, outPath, totalDuration);
    } else {
      await fs.copyFile(concatenatedPath, outPath);
    }
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = { buildSlideshow, WIDTH, HEIGHT };
