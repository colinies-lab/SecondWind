/* Second Wind, standalone runtime.
   Inside Claude, the app gets cloud sync, sign-in and Wren's brain from Claude itself.
   Here, everything saves on this device, and Wren talks through your own small server
   (see worker/wren-worker.js and the README). */
(function () {
  var cfg = window.SW_CONFIG || {};
  var endpoint = String(cfg.wrenEndpoint || '').trim();

  function fail(code, text) { var e = new Error(code); e.code = code; if (text) e.text = text; return e; }

  function parseJSON(text) {
    var t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try { return JSON.parse(t); } catch (e) {}
    var a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
    throw fail('invalid_json', text);
  }

  var sample = endpoint ? {
    json: async function (input, opts) {
      var messages = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
      var res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: messages, tier: opts && opts.modelTier === 'quick' ? 'quick' : 'full', token: cfg.wrenToken || '' })
        });
      } catch (e) { throw fail('network'); }
      if (res.status === 429) throw fail('rate_limited');
      if (!res.ok) throw fail('server_' + res.status);
      var body = await res.json().catch(function () { return null; });
      if (!body || typeof body.text !== 'string') throw fail('bad_response');
      return parseJSON(body.text);
    }
  } : null;

  window.claude = {
    use: function (name) { return Promise.resolve(name === 'sample' ? sample : null); }
  };

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
