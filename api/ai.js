// Vercel serverless function: AI helpers for FG Campus (free Google Gemini tier).
//
// It does nothing unless the Vercel environment variable GEMINI_API_KEY is set.
// Optional: AI_MODEL (default "gemini-flash-latest"), AI_DAILY_LIMIT (requests per person per day, default 40).
// Needs the same SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as the other functions.
// The key stays on the server. Only signed-in, active users can call it, and each action is limited by role.

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const MODELS = process.env.AI_MODEL ? [process.env.AI_MODEL] : ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];
const LIMIT = Math.max(5, Number(process.env.AI_DAILY_LIMIT) || 40);

const used = new Map(); // best-effort daily counter per user (resets when the server instance restarts)

const ROLES = {
  notice: ['admin', 'principal'],
  translate: ['admin', 'principal', 'teacher', 'parent'],
  comments: ['teacher', 'admin', 'principal'],
  homework: ['teacher', 'admin', 'principal'],
  ask: ['admin', 'principal'],
};

const SYS = {
  notice: 'You write short, clear school notices for F.G Public School and College, Sakesar, Pakistan. Turn the rough note into a polite, professional notice of 2 to 4 sentences. Keep every fact, date and time from the note and never invent new ones. Output only the notice text, no title, no markdown.',
  translate: 'You translate school messages between English and Urdu for parents. Keep the meaning, names, dates and numbers exactly. Use simple, polite Urdu (Nastaliq script) or simple English. Output only the translation.',
  comments: 'You help teachers write report card comments. For each student write one kind, specific, professional sentence (max 25 words) based on the marks given. Be encouraging for low marks and never harsh. Output exactly one line per student in the form: number|comment. No other text.',
  homework: 'You help school teachers in Pakistan prepare homework. Follow the request and keep it practical, age appropriate and short. Plain text only, no markdown symbols.',
  ask: 'You are an assistant for a school principal. Answer the question using ONLY the school facts provided. If the facts do not contain the answer, say so. Be brief (max 4 sentences), use plain words and include the numbers.',
};

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

async function whoIs(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Please sign in again.');
  const who = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + token } });
  if (!who.ok) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  const user = await who.json();
  const p = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + encodeURIComponent(user.id) + '&select=id,role,active', {
    headers: { apikey: SERVICE_KEY, ...(SERVICE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SERVICE_KEY } : {}) },
  });
  const rows = p.ok ? await p.json() : [];
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || !row.active) throw new HttpError(403, 'This account cannot use AI.');
  return row;
}

const clip = (v, n) => String(v == null ? '' : v).slice(0, n);

function buildPrompt(action, b) {
  if (action === 'notice') return 'Language: ' + (b.lang === 'ur' ? 'Urdu' : 'English') + '\nRough note:\n' + clip(b.text, 1200);
  if (action === 'translate') return 'Translate into ' + (b.to === 'ur' ? 'Urdu' : 'English') + ':\n' + clip(b.text, 2000);
  if (action === 'homework') return clip(b.request, 800);
  if (action === 'ask') return 'School facts:\n' + clip(b.facts, 6000) + '\n\nQuestion: ' + clip(b.question, 300);
  if (action === 'comments') {
    const list = Array.isArray(b.students) ? b.students.slice(0, 60) : [];
    return 'Subject: ' + clip(b.subject, 60) + '. Exam: ' + clip(b.exam, 60) + '. Class average: ' + clip(b.avg, 10) + '.\nStudents (number, first name, marks out of 100):\n' +
      list.map((s, i) => (i + 1) + ', ' + clip(s.name, 30) + ', ' + clip(s.marks, 6)).join('\n');
  }
  throw new HttpError(400, 'Unknown action.');
}

export default async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, obj) => res.status(status).json(obj);
  try {
    if (req.method !== 'POST') return send(405, { ok: false, error: 'Use POST.' });
    if (!GEMINI_KEY || !SUPABASE_URL || !SERVICE_KEY) return send(200, { ok: true, enabled: false });
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};
    const action = String(b.action || '');
    if (!ROLES[action]) throw new HttpError(400, 'Unknown action.');
    const me = await whoIs(req);
    if (!ROLES[action].includes(me.role)) throw new HttpError(403, 'Your account cannot use this AI tool.');

    const day = new Date().toISOString().slice(0, 10), key = me.id + '|' + day, n = used.get(key) || 0;
    if (n >= LIMIT) throw new HttpError(429, 'Daily AI limit reached. Try again tomorrow.');
    used.set(key, n + 1);
    if (used.size > 2000) for (const k of used.keys()) if (!k.endsWith(day)) used.delete(k);

    const mkBody = (think) => JSON.stringify({
      systemInstruction: { parts: [{ text: SYS[action] }] },
      contents: [{ role: 'user', parts: [{ text: buildPrompt(action, b) }] }],
      generationConfig: {
        temperature: action === 'ask' ? 0.2 : 0.6,
        maxOutputTokens: action === 'comments' ? 2200 : action === 'notice' ? 500 : 900,
        ...(think ? { thinkingConfig: { thinkingBudget: 0 } } : {}), // no "thinking" pause: much faster for short tasks
      },
    });
    const call = (m, think) => fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(m) + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY }, body: mkBody(think),
    });
    let r = null, j = null;
    for (const m of MODELS) {
      r = await call(m, true); j = await r.json().catch(() => null);
      if (r.status === 400 && j && j.error && /think/i.test(j.error.message || '')) { r = await call(m, false); j = await r.json().catch(() => null); }
      if (r.ok || (r.status !== 404 && r.status !== 429 && r.status !== 503)) break; // try the next model only if this one is missing or busy
    }
    if (!r.ok) {
      used.set(key, n);
      const why = j && j.error && j.error.message ? ' (' + clip(j.error.message, 140) + ')' : '';
      if (r.status === 429) throw new HttpError(429, 'The free AI service is busy or its free limit is used up. Try again in a minute.' + why);
      throw new HttpError(502, 'The AI service refused the request, status ' + r.status + '.' + why);
    }
    const text = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts
      ? j.candidates[0].content.parts.map((p) => p.text || '').join('').trim() : '';
    if (!text) throw new HttpError(502, 'The AI returned nothing. Please try again.');
    return send(200, { ok: true, enabled: true, text, left: Math.max(0, LIMIT - n - 1) });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return send(status, { ok: false, error: e instanceof HttpError ? e.message : 'Something went wrong. Please try again.' });
  }
};
