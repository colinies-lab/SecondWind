/* Wren's server: a Cloudflare Worker that passes Second Wind's chat to Claude.
   Your Anthropic API key lives here as a secret and never reaches the app.

   Settings (Worker → Settings → Variables and Secrets):
     ANTHROPIC_API_KEY  secret, required. From console.anthropic.com.
     ALLOWED_ORIGIN     text, required. Your site's origin, e.g. https://yourname.github.io
                        (no trailing slash, no repo path). Comma-separate several.
     APP_TOKEN          secret, optional. Must match wrenToken in the app's config.js.
     MODEL_QUICK        text, optional. Model for chat and horoscopes.
     MODEL_FULL         text, optional. Model for the longer stats read. */

const DEFAULT_QUICK = 'claude-haiku-4-5-20251001';
const DEFAULT_FULL = 'claude-sonnet-5-5';
const SYSTEM = 'You are the AI inside Second Wind, a breathwork app. Follow the instructions in the conversation exactly. Reply with only the JSON object they ask for: no prose, no code fences.';
const LIMIT = { max: 40, windowMs: 10 * 60 * 1000 }; // per visitor, best effort
const hits = new Map();

function cors(origin) {
  return { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400', vary: 'origin' };
}
function reply(status, body, origin) {
  return new Response(JSON.stringify(body), { status, headers: Object.assign({ 'content-type': 'application/json' }, origin ? cors(origin) : {}) });
}
function limited(ip) {
  const now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < LIMIT.windowMs);
  h.push(now); hits.set(ip, h);
  if (hits.size > 5000) hits.clear();
  return h.length > LIMIT.max;
}
function cleanMessages(list) {
  if (!Array.isArray(list) || !list.length || list.length > 40) return null;
  const out = [];
  let chars = 0;
  for (const m of list) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return null;
    const text = m.content.slice(0, 12000);
    chars += text.length;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += '\n\n' + text; // the API wants turns to alternate
    else out.push({ role: m.role, content: text });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  if (!out.length || out[out.length - 1].role !== 'user' || chars > 60000) return null;
  return out;
}

export default {
  async fetch(request, env) {
    const allowed = String(env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
    const origin = request.headers.get('origin') || '';
    const ok = allowed.includes(origin) ? origin : '';
    if (request.method === 'OPTIONS') return new Response(null, { status: ok ? 204 : 403, headers: ok ? cors(ok) : {} });
    if (request.method === 'GET') return reply(200, { wren: 'awake', configured: !!(env.ANTHROPIC_API_KEY && allowed.length) }, ok);
    if (request.method !== 'POST') return reply(405, { error: 'method' }, ok);
    if (!allowed.length || !env.ANTHROPIC_API_KEY) return reply(500, { error: 'Worker is missing ANTHROPIC_API_KEY or ALLOWED_ORIGIN' }, ok);
    if (!ok) return reply(403, { error: 'origin not allowed' });

    let body;
    try { body = await request.json(); } catch (e) { return reply(400, { error: 'bad json' }, ok); }
    if (env.APP_TOKEN && body.token !== env.APP_TOKEN) return reply(401, { error: 'token' }, ok);
    if (limited(request.headers.get('cf-connecting-ip') || 'anon')) return reply(429, { error: 'slow down' }, ok);
    const messages = cleanMessages(body.messages);
    if (!messages) return reply(400, { error: 'bad messages' }, ok);
    const quick = body.tier === 'quick';

    let r;
    try {
      r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: quick ? (env.MODEL_QUICK || DEFAULT_QUICK) : (env.MODEL_FULL || DEFAULT_FULL), max_tokens: quick ? 700 : 900, system: SYSTEM, messages })
      });
    } catch (e) { return reply(502, { error: 'upstream unreachable' }, ok); }
    if (r.status === 429) return reply(429, { error: 'rate limited' }, ok);
    if (!r.ok) { const detail = await r.text().catch(() => ''); return reply(502, { error: 'upstream ' + r.status, detail: detail.slice(0, 300) }, ok); }
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return reply(200, { text }, ok);
  }
};
