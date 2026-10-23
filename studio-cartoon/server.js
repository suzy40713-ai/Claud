const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const env = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  priceCents: parseInt(process.env.PRICE_CENTS || '2900', 10),
  currency: (process.env.CURRENCY || 'eur').toLowerCase(),
  publicOrigin: (process.env.PUBLIC_ORIGIN || `http://localhost:${PORT}`).replace(/\/$/, ''),
  accessSecret: process.env.ACCESS_SECRET || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  senderEmail: process.env.SENDER_EMAIL || 'Studio Cartoon <onboarding@resend.dev>',
  leadNotifyEmail: process.env.LEAD_NOTIFY_EMAIL || '',
};

const PRODUCT_NAME = 'Formation Studio Cartoon';
const PRODUCT_DESCRIPTION =
  '13 modules, 59 leçons, 55 exercices, 20 scripts complets et le cahier PDF pour créer des sketchs animés.';
const PDF_PATH = path.join(__dirname, 'assets', 'studio-cartoon-formation.pdf');
const PDF_FILENAME = 'Studio-Cartoon-Formation.pdf';
const COURSE_FULL = fs.readFileSync(path.join(__dirname, 'data', 'course-full.html'), 'utf8');
const COURSE_PREVIEW = fs.readFileSync(path.join(__dirname, 'data', 'course-preview.html'), 'utf8');

if (!env.accessSecret && process.env.NODE_ENV === 'production') {
  console.warn('ACCESS_SECRET manquant : les liens d\'accès ne seront pas valides entre deux redémarrages.');
}
const ACCESS_SECRET = env.accessSecret || crypto.randomBytes(32).toString('hex');

let stripeClient = null;
function getStripe() {
  if (!env.stripeSecretKey) return null;
  if (!stripeClient) stripeClient = require('stripe')(env.stripeSecretKey);
  return stripeClient;
}

let resendClient = null;
function getResend() {
  if (!env.resendApiKey) return null;
  if (!resendClient) {
    const { Resend } = require('resend');
    resendClient = new Resend(env.resendApiKey);
  }
  return resendClient;
}

// ------------------------------------------------------------------ accès
// Le lien d'accès est l'identifiant de la session Stripe signé (HMAC) : pas de base de données.
function signAccess(sessionId) {
  const sig = crypto.createHmac('sha256', ACCESS_SECRET).update(sessionId).digest('base64url');
  return `${sessionId}.${sig}`;
}

function verifyAccess(token) {
  if (typeof token !== 'string') return false;
  const i = token.lastIndexOf('.');
  if (i <= 0) return false;
  const expected = signAccess(token.slice(0, i));
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function accessUrl(token) {
  return `${env.publicOrigin}/formation?acces=${encodeURIComponent(token)}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isEmail(s) {
  return typeof s === 'string' && s.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// ------------------------------------------------------------------ emails
const emailedSessions = new Set();

async function sendPurchaseEmail(toEmail, token) {
  const resend = getResend();
  if (!resend) return false;
  const { error } = await resend.emails.send({
    from: env.senderEmail,
    to: toEmail,
    subject: 'Ton accès à la formation Studio Cartoon',
    html: `
      <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1d2027">
        <p style="font-size:22px;margin-bottom:4px"><strong>Studio Cartoon</strong></p>
        <h1 style="font-size:20px">Merci pour ton achat !</h1>
        <p>Voici ton lien d'accès personnel à la formation. Garde cet email : le lien te permet d'y revenir quand tu veux.</p>
        <p><a href="${accessUrl(token)}" style="display:inline-block;background:#e0194a;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Ouvrir la formation</a></p>
        <p>Le cahier d'exercices PDF est aussi en pièce jointe.</p>
        <p>Conseil pour démarrer : bloque une heure par jour pendant 30 jours et suis le planning du module 0.</p>
      </div>`,
    attachments: [{ filename: PDF_FILENAME, content: fs.readFileSync(PDF_PATH) }],
  });
  if (error) throw new Error(`Envoi Resend impossible : ${error.message}`);
  return true;
}

async function sendLeadEmail(toEmail) {
  const resend = getResend();
  if (!resend) return false;
  const { error } = await resend.emails.send({
    from: env.senderEmail,
    to: toEmail,
    subject: 'Ton aperçu gratuit de Studio Cartoon',
    html: `
      <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1d2027">
        <p style="font-size:22px;margin-bottom:4px"><strong>Studio Cartoon</strong></p>
        <p>Voici ton accès aux deux premiers modules de la formation : le format qui fonctionne et le personnage récurrent qui fait s'abonner.</p>
        <p><a href="${env.publicOrigin}/apercu" style="display:inline-block;background:#e0194a;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Voir l'aperçu gratuit</a></p>
      </div>`,
  });
  if (error) throw new Error(`Envoi Resend impossible : ${error.message}`);
  if (env.leadNotifyEmail) {
    await resend.emails.send({
      from: env.senderEmail,
      to: env.leadNotifyEmail,
      subject: 'Nouveau contact Studio Cartoon',
      html: `<p>Nouvelle adresse inscrite à l'aperçu gratuit : ${escapeHtml(toEmail)}</p>`,
    });
  }
  return true;
}

// ------------------------------------------------------------------ routes
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.get('/api/status', (req, res) => {
  res.json({ configured: Boolean(getStripe()), priceCents: env.priceCents, currency: env.currency });
});

app.post('/api/checkout', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "Le paiement n'est pas encore configuré sur ce site." });
  if (req.body?.waiver !== true) {
    return res.status(400).json({ error: "Coche la case d'accès immédiat pour continuer." });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: env.currency,
          unit_amount: env.priceCents,
          product_data: { name: PRODUCT_NAME, description: PRODUCT_DESCRIPTION },
        },
      }],
      customer_creation: 'always',
      metadata: { product: 'studio-cartoon', waiver_immediate_access: 'accepted' },
      success_url: `${env.publicOrigin}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.publicOrigin}/#acheter`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('checkout', err.message);
    res.status(500).json({ error: 'Impossible de démarrer le paiement. Réessaie dans un instant.' });
  }
});

app.post('/api/lead', async (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ error: 'Adresse email invalide.' });
  try {
    const sent = await sendLeadEmail(email);
    console.log('lead', email, sent ? '(email envoyé)' : '(email non configuré)');
    res.json({ ok: true, previewUrl: '/apercu', emailed: sent });
  } catch (err) {
    console.error('lead', err.message);
    res.json({ ok: true, previewUrl: '/apercu', emailed: false });
  }
});

app.get('/merci', async (req, res) => {
  const stripe = getStripe();
  const sessionId = String(req.query.session_id || '');
  if (!stripe || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return res.redirect('/');
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(402).send(page('Paiement en attente',
        '<p>Ton paiement n\'est pas encore confirmé. Recharge cette page dans quelques instants.</p>'));
    }
    const token = signAccess(session.id);
    const email = session.customer_details?.email;
    let emailed = false;
    if (email && !emailedSessions.has(session.id)) {
      try {
        emailed = await sendPurchaseEmail(email, token);
        emailedSessions.add(session.id);
      } catch (err) {
        console.error('email achat', err.message);
      }
    }
    res.send(page('Merci pour ton achat !', `
      <p>Ton paiement est confirmé. Ton accès personnel à la formation :</p>
      <p><a class="btn" href="${accessUrl(token)}">Ouvrir la formation</a></p>
      <p><a href="/telecharger?acces=${encodeURIComponent(token)}">Télécharger le cahier PDF</a></p>
      <p class="small">${emailed || emailedSessions.has(session.id)
        ? `Le lien et le PDF ont été envoyés à ${escapeHtml(email)}.`
        : 'Ajoute cette page à tes favoris : le lien ci-dessus est ton accès personnel.'}</p>`));
  } catch (err) {
    console.error('merci', err.message);
    res.status(500).send(page('Un souci', '<p>Impossible de vérifier ton paiement. Réessaie dans un instant ou contacte-nous.</p>'));
  }
});

app.get('/formation', (req, res) => {
  const token = req.query.acces;
  if (!verifyAccess(token)) {
    return res.status(403).send(page('Accès réservé',
      '<p>Ce lien n\'est pas valide. Utilise le lien reçu par email après ton achat.</p><p><a class="btn" href="/">Découvrir la formation</a></p>'));
  }
  res.set('Cache-Control', 'private, no-store');
  res.send(COURSE_FULL.replace('__PDF_URL__', `/telecharger?acces=${encodeURIComponent(token)}`));
});

app.get('/telecharger', (req, res) => {
  if (!verifyAccess(req.query.acces)) return res.status(403).send(page('Accès réservé', '<p>Lien non valide.</p>'));
  res.download(PDF_PATH, PDF_FILENAME);
});

app.get('/apercu', (req, res) => res.send(COURSE_PREVIEW));

function page(title, body) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(title)} · Studio Cartoon</title><link rel="stylesheet" href="/style.css"></head>
<body><main class="wrap msg"><p class="tag">STUDIO CARTOON</p><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`;
}

app.listen(PORT, () => {
  console.log(`Studio Cartoon sur ${env.publicOrigin} (port ${PORT}) — paiement ${getStripe() ? 'actif' : 'non configuré'}, email ${getResend() ? 'actif' : 'non configuré'}`);
});
