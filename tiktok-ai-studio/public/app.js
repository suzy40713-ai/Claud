const promptEl = document.getElementById('prompt');
const promptField = document.getElementById('promptField');
const charCountEl = document.getElementById('charCount');
const modeSwitch = document.getElementById('modeSwitch');
const styleEl = document.getElementById('style');
const genreEl = document.getElementById('genre');
const sceneCountEl = document.getElementById('sceneCount');
const sceneCountValueEl = document.getElementById('sceneCountValue');
const durationValueEl = document.getElementById('durationValue');
const withCaptionsEl = document.getElementById('withCaptions');
const withMusicEl = document.getElementById('withMusic');
const generateBtn = document.getElementById('generateBtn');
const errorBox = document.getElementById('errorBox');
const placeholder = document.getElementById('placeholder');
const resultImage = document.getElementById('resultImage');
const resultVideo = document.getElementById('resultVideo');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const downloadBtn = document.getElementById('downloadBtn');
const downloadCaptionBtn = document.getElementById('downloadCaptionBtn');
const historySection = document.getElementById('historySection');
const historyGrid = document.getElementById('historyGrid');
const videoOnlyEls = document.querySelectorAll('.video-only');
const storyOnlyEls = document.querySelectorAll('.story-only');

const SCENE_DURATION_SEC = 3.5;
let mode = 'image';

promptEl.addEventListener('input', () => {
  charCountEl.textContent = String(promptEl.value.length);
});

function applyModeVisibility() {
  for (const el of videoOnlyEls) {
    el.style.display = mode === 'video' ? '' : 'none';
  }
  for (const el of storyOnlyEls) {
    el.style.display = mode === 'story' ? '' : 'none';
  }
  promptField.style.display = mode === 'story' ? 'none' : '';
  generateBtn.textContent = mode === 'story' ? 'Generer une histoire' : 'Generer';
}

modeSwitch.addEventListener('click', (event) => {
  const btn = event.target.closest('.segment');
  if (!btn) return;
  mode = btn.dataset.mode;
  for (const el of modeSwitch.querySelectorAll('.segment')) {
    el.classList.toggle('active', el === btn);
  }
  applyModeVisibility();
});
applyModeVisibility();

function updateSceneDuration() {
  const scenes = Number(sceneCountEl.value);
  sceneCountValueEl.textContent = String(scenes);
  durationValueEl.textContent = String(Math.round(scenes * SCENE_DURATION_SEC));
}
sceneCountEl.addEventListener('input', updateSceneDuration);
updateSceneDuration();

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function setLoading(isLoading, text) {
  loading.hidden = !isLoading;
  if (text) loadingText.textContent = text;
  generateBtn.disabled = isLoading;
  generateBtn.textContent = isLoading ? 'Generation…' : 'Generer';
}

function showResult(type, url, captionUrl) {
  placeholder.hidden = true;
  if (type === 'image') {
    resultVideo.hidden = true;
    resultVideo.removeAttribute('src');
    resultImage.src = url;
    resultImage.hidden = false;
  } else {
    resultImage.hidden = true;
    resultImage.removeAttribute('src');
    resultVideo.src = url;
    resultVideo.hidden = false;
    resultVideo.play().catch(() => {});
  }
  downloadBtn.href = url;
  downloadBtn.hidden = false;
  if (captionUrl) {
    downloadCaptionBtn.href = captionUrl;
    downloadCaptionBtn.hidden = false;
  } else {
    downloadCaptionBtn.hidden = true;
  }
  addToHistory(type, url);
}

function addToHistory(type, url) {
  historySection.hidden = false;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  if (type === 'image') {
    const img = document.createElement('img');
    img.src = url;
    link.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.addEventListener('mouseenter', () => video.play());
    video.addEventListener('mouseleave', () => video.pause());
    link.appendChild(video);
  }
  historyGrid.prepend(link);
}

async function generate() {
  clearError();

  if (mode === 'story') {
    const style = styleEl.value;
    const genre = genreEl.value;
    setLoading(true, 'Invention de l\'histoire, generation des images et montage video…');
    try {
      const res = await fetch('/api/generate/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, style: style === 'none' ? undefined : style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      showResult('video', data.url, data.captionUrl);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
    return;
  }

  const prompt = promptEl.value.trim();
  if (!prompt) {
    showError('Ecris un prompt avant de generer.');
    return;
  }

  const style = styleEl.value;

  if (mode === 'image') {
    setLoading(true, 'Generation de l\'image…');
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      showResult('image', data.url);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  } else {
    const sceneCount = Number(sceneCountEl.value);
    setLoading(true, `Generation de ${sceneCount} scenes puis montage video…`);
    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          sceneCount,
          withCaptions: withCaptionsEl.checked,
          withMusic: withMusicEl.checked,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      showResult('video', data.url);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }
}

generateBtn.addEventListener('click', generate);
