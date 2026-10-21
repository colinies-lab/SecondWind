# Second Wind · Alpha 1.0

Breathwork, built on the neuroscience. This folder is the standalone web-app version of Second Wind, ready for GitHub Pages. Install it from Safari and it runs full-screen with its own icon, and works offline.

## What's in here

| File | What it does |
| --- | --- |
| `index.html` | The whole app |
| `config.js` | Your settings. The only file you edit |
| `standalone.js` | Replaces Claude's sync and AI with local saving and your Wren server |
| `sw.js` | Offline support |
| `manifest.webmanifest`, `icons/` | The home-screen name and icon |
| `voice.mp3`, `brand/` | Wren's recorded voice and the logo |
| `worker/wren-worker.js` | Wren's server. This goes on Cloudflare, not GitHub |

## 1. Put it on GitHub Pages (about 10 minutes, free)

1. Sign in at github.com and click **New repository**. Name it `second-wind`, set it to **Public** (free Pages needs a public repo), and create it.
2. On the empty repo page, click **uploading an existing file**. Drag in everything *inside* this folder (not the folder itself), then click **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment*, pick **Deploy from a branch**, choose `main` and `/ (root)`, and click **Save**.
4. Wait a minute or two. Your app is live at `https://YOUR-USERNAME.github.io/second-wind/`.

The repo is public, so anyone can read the code. There are no keys or personal data in it. Your stats live on your phone, and the API key lives on Cloudflare.

## 2. Install it on your iPhone

Open the link in **Safari**, tap **Share → Add to Home Screen**, then **Add**. Launch it from the icon from now on. The home-screen version keeps its own saved data, separate from Safari's.

Everything works at this point: the techniques, flows, tests, stats, profile, frequencies, Reflect, Library and Wren's voice. Without step 3, Wren can't chat live. She still greets you, suggests tools and gives built-in horoscope readings.

## 3. Turn on Wren's chat (optional, about 15 minutes)

Wren needs a tiny server that holds your Anthropic API key, so the key never sits in the public code.

**Get an API key**
1. Go to console.anthropic.com and create an account.
2. Add a small amount of credit (a few dollars lasts a long time for one person).
3. Set a **monthly spend limit** in the console. This is your real safety net.
4. Create an API key and copy it.

**Create the server on Cloudflare (free plan)**
1. Sign up at dash.cloudflare.com, then go to **Workers & Pages → Create → Create Worker**. Name it `wren` and click **Deploy**.
2. Click **Edit code**, delete the sample code, paste in all of `worker/wren-worker.js`, and click **Deploy**.
3. Go to the Worker's **Settings → Variables and Secrets** and add:
   - `ANTHROPIC_API_KEY`: type **Secret**, value is your key.
   - `ALLOWED_ORIGIN`: type **Text**, value is `https://YOUR-USERNAME.github.io`. Use exactly that: no trailing slash and no `/second-wind`.
4. Copy the Worker's URL. It looks like `https://wren.YOUR-NAME.workers.dev`. Open it in a browser: you should see `"wren":"awake"` and `"configured":true`.

**Point the app at it**
1. In your GitHub repo, open `config.js` and click the pencil icon.
2. Paste the Worker URL between the quotes on the `wrenEndpoint` line, then commit.
3. Close and reopen the app twice. The first launch downloads the update and the second one uses it.

**Cost**

Chat and horoscopes use Claude Haiku. The stats read uses Claude Sonnet. Normal personal use comes to well under a cent per message. To change models, set `MODEL_QUICK` or `MODEL_FULL` on the Worker.

## Updating the app later

When a new version of `index.html` (or any other file) comes along, upload it to the repo the same way. GitHub replaces files with the same name. Updates show up on the **second** launch after you upload, because the app serves its saved offline copy first and fetches the new one in the background.

## Good to know

- **Saved on the device.** Sessions, tests, journal and favorites stay on that device. Deleting the home-screen icon deletes them.
- **No carry-over from Claude.** History from the version inside Claude doesn't transfer automatically.
- **Haptics on iPhone.** These use the iOS 18 switch-tap trick, which works in Safari and home-screen apps. Android vibrates normally.
- **Audio.** Audio stops if you lock the screen mid-session. That's a web-app limit on iPhone. A native App Store build would fix it.

## Credits

- Wren's voice was generated with Kokoro-82M (Apache 2.0 license).
- Display font: Hanken Grotesk (SIL Open Font License), loaded from Google Fonts.
- See CHANGELOG.md for what's in each release.
