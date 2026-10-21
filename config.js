/* Second Wind settings. This is the only file you need to edit.

   wrenEndpoint: the URL of your Wren server (your Cloudflare Worker), for example
     'https://wren.your-name.workers.dev'
   Leave it empty and the app still works fully, minus Wren's live chat, stats reads
   and AI horoscopes (she falls back to her built-in suggestions and readings).

   wrenToken: optional. If you set an APP_TOKEN secret on the Worker, put the same
   value here. It is visible to anyone who views the page source, so it only keeps
   out casual bots. Your real protection is the spending limit on your Anthropic account. */
window.SW_CONFIG = {
  wrenEndpoint: '',
  wrenToken: ''
};
