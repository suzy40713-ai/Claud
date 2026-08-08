const demoForm = document.getElementById('demoForm');
const promptEl = document.getElementById('prompt');
const styleEl = document.getElementById('style');
const generateBtn = document.getElementById('generateBtn');
const demoStatus = document.getElementById('demoStatus');
const errorBox = document.getElementById('errorBox');
const resultImage = document.getElementById('resultImage');
const resultVideo = document.getElementById('resultVideo');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const downloadBtn = document.getElementById('downloadBtn');
const explainRevealImg = document.getElementById('explainRevealImg');

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
  generateBtn.textContent = isLoading ? 'Génération…' : 'Générer';
}

function showResult(url) {
  resultImage.dataset.sample = 'false';
  resultVideo.hidden = true;
  resultVideo.removeAttribute('src');
  resultImage.src = url;
  resultImage.hidden = false;
  resultImage.alt = 'Image générée à partir de ton prompt';
  downloadBtn.href = url;
  downloadBtn.hidden = false;
  demoStatus.innerHTML = 'C’est ton résultat. Modifie le prompt et relance quand tu veux.';
  explainRevealImg.src = url;
}

async function generate(event) {
  event.preventDefault();
  clearError();

  const prompt = promptEl.value.trim();
  if (!prompt) {
    showError('Écris un prompt avant de générer.');
    return;
  }

  setLoading(true, 'Génération de l’image…');
  demoStatus.textContent = 'Ta phrase part vers l’IA…';

  try {
    const res = await fetch('/api/generate/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style: styleEl.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
    showResult(data.url);
  } catch (err) {
    showError(err.message);
    demoStatus.textContent = 'Exemple prêt ci-contre — appuie sur Générer pour créer le tien.';
  } finally {
    setLoading(false);
  }
}

demoForm.addEventListener('submit', generate);

/* Scroll-linked clip-path reveal: the demo's output image "wipes"
   into view as chapter 1 scrolls into the viewport. */
const revealTarget = document.getElementById('explainReveal');
const explainSection = document.getElementById('explain');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let ticking = false;

function updateReveal() {
  ticking = false;
  if (prefersReducedMotion || !explainSection || !revealTarget) return;

  const rect = explainSection.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;

  // Progress: 0 when the section top is at the bottom of the viewport,
  // 1 once the section top has scrolled to the vertical center.
  const start = vh;
  const end = vh * 0.4;
  let progress = (start - rect.top) / (start - end);
  progress = Math.min(1, Math.max(0, progress));

  const hiddenPercent = 100 - progress * 100;
  revealTarget.style.clipPath = `inset(0 0 ${hiddenPercent}% 0)`;
}

function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(updateReveal);
  }
}

if (!prefersReducedMotion) {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateReveal();
}
